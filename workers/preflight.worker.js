// The pdf.min.js script is now prepended by the main thread, so importScripts is no longer needed.
// 'pdfjsLib' is available globally.

// This is required for pdf.js to work in a classic worker.
// We are not creating nested workers, so we can set it to blank.
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

let isCancelled = false;

const MM_TO_PT = 2.83465;

function createIssue(ruleId, pageNum, severity, message, details = '', bbox = null) {
    return {
        id: `${ruleId}-${pageNum}-${Math.random().toString(36).substring(2, 9)}`,
        ruleId,
        page: pageNum,
        severity,
        message,
        details,
        bbox,
        confidence: 0.95,
    };
}

// --- Analysis Functions ---

async function checkStructure(doc, pageNum, page, profile, firstPageSize) {
    const issues = [];
    const { trimBox, bleedBox } = page;

    // PAGE_SIZE_MIXED check
    if (trimBox) {
        const width = (trimBox[2] - trimBox[0]).toFixed(1);
        const height = (trimBox[3] - trimBox[1]).toFixed(1);
        const currentPageSize = `${width}x${height}`;
        if (pageNum === 1) {
            firstPageSize.value = currentPageSize;
        } else if (firstPageSize.value && firstPageSize.value !== currentPageSize) {
            issues.push(createIssue('PAGE_SIZE_MIXED', pageNum, 'Major', `Page size (${currentPageSize}pt) differs from first page (${firstPageSize.value}pt).`));
        }
    } else {
        issues.push(createIssue('BOX_INCONSISTENT', pageNum, 'Blocker', 'Page is missing a TrimBox, cannot verify page size.'));
    }

    // BLEED_MISSING check
    if (profile.bleed > 0) {
        const requiredBleedPt = profile.bleed * MM_TO_PT;
        if (!bleedBox) {
            issues.push(createIssue('BLEED_MISSING', pageNum, 'Blocker', `Page is missing a BleedBox, but profile requires ${profile.bleed}mm bleed.`));
        } else if (trimBox) {
            const requiredWidth = (trimBox[2] - trimBox[0]) + (2 * requiredBleedPt);
            const requiredHeight = (trimBox[3] - trimBox[1]) + (2 * requiredBleedPt);
            const actualWidth = bleedBox[2] - bleedBox[0];
            const actualHeight = bleedBox[3] - bleedBox[1];

            if (actualWidth < requiredWidth - 0.1 || actualHeight < requiredHeight - 0.1) {
                issues.push(createIssue('BLEED_MISSING', pageNum, 'Blocker', `Bleed area is smaller than the required ${profile.bleed}mm.`));
            }
        }
    }

    return issues;
}

async function checkImages(page, pageNum, profile) {
    const issues = [];
    const viewport = page.getViewport({ scale: 1 });
    const operatorList = await page.getOperatorList();
    const fns = operatorList.fnArray;
    const args = operatorList.argsArray;

    for (let i = 0; i < fns.length; i++) {
        if (fns[i] === pdfjsLib.OPS.paintImageXObject) {
            const [imgRef] = args[i];
            const img = await page.objs.get(imgRef);

            if (!img || !img.width || !img.height) continue;
            
            // Calculate effective PPI
            const transform = page.commonObjs.get(img.transform);
            const scaleX = Math.hypot(transform[0], transform[1]);
            const scaleY = Math.hypot(transform[2], transform[3]);
            const displayWidthInches = (img.width * scaleX) / 72;
            const displayHeightInches = (img.height * scaleY) / 72;
            const ppiX = img.width / displayWidthInches;
            const ppiY = img.height / displayHeightInches;
            const effectivePpi = Math.min(ppiX, ppiY);

            const colorSpace = img.colorSpace?.name || 'Unknown';
            
            // LOW_PPI checks
            if (colorSpace === 'DeviceRGB' || colorSpace === 'DeviceCMYK') {
                if (effectivePpi < profile.minPpiColor) {
                    issues.push(createIssue('LOW_PPI_COLOR', pageNum, 'Major', `Color image resolution is ${Math.round(effectivePpi)} PPI, below the required ${profile.minPpiColor} PPI.`));
                }
            } else if (colorSpace === 'DeviceGray') {
                if (effectivePpi < profile.minPpiGrayscale) {
                    issues.push(createIssue('LOW_PPI_GRAYSCALE', pageNum, 'Major', `Grayscale image resolution is ${Math.round(effectivePpi)} PPI, below the required ${profile.minPpiGrayscale} PPI.`));
                }
            }

            // RGB_OBJECTS check for images
            if (!profile.allowRgb && colorSpace === 'DeviceRGB') {
                 issues.push(createIssue('RGB_OBJECTS', pageNum, 'Major', `Image uses the RGB color space.`));
            }
        }
    }
    return issues;
}

async function checkVectorsAndText(page, pageNum, profile) {
    const issues = [];
    const operatorList = await page.getOperatorList();
    
    // Check for RGB color setting operators
    if (!profile.allowRgb) {
        const hasRgbOp = operatorList.fnArray.some(fn => 
            fn === pdfjsLib.OPS.setFillRGBColor || 
            fn === pdfjsLib.OPS.setStrokeRGBColor
        );
        if (hasRgbOp) {
             issues.push(createIssue('RGB_OBJECTS', pageNum, 'Major', `Page contains vector objects or text using the RGB color space.`));
        }
    }

    // Check fonts
    const fonts = await page.getOperatorList({
        // Extract all font names used on the page.
        // This is a simplified approach; a full implementation would parse text operators.
    });
    // This part is complex. For now, we rely on a simplified check for font objects.
    const pageFonts = await page.getFont();
    for (const fontId in pageFonts) {
        const font = pageFonts[fontId];
        if (!font.isEmbedded) {
            issues.push(createIssue('FONT_MISSING', pageNum, 'Blocker', `Font '${font.name}' is not embedded in the PDF.`));
        }
        if (font.type === 'Type3') {
            issues.push(createIssue('FONT_TYPE3', pageNum, 'Major', `Font '${font.name}' is a Type3 font, which may not print correctly.`));
        }
    }

    // Check for transparency
    if (!profile.allowTransparency) {
        const opList = await page.getOperatorList();
        for (const fn of opList.fnArray) {
            if (fn === pdfjsLib.OPS.setExtGState) {
                // A simplified check. A full check would inspect the ExtGState dictionary for transparency keys.
                issues.push(createIssue('TRANSPARENCY_DETECTED', pageNum, 'Warning', 'Page may contain transparency, which is disallowed by the current profile.'));
                break; // Only one warning per page is needed.
            }
        }
    }

    return issues;
}

async function checkContent(page, pageNum, profile) {
    const issues = [];
     if (!profile.allowAnnotations) {
        const annotations = await page.getAnnotations();
        if (annotations.length > 0) {
            issues.push(createIssue('ANNOTATIONS_PRESENT', pageNum, 'Minor', `Page contains ${annotations.length} form fields or annotations.`));
        }
    }
    return issues;
}


// --- Main Analysis Engine ---

async function analyze(buffer, profile) {
    isCancelled = false;
    let doc;

    try {
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            useWorkerFetch: false,
            isEvalSupported: false,
            disableFontFace: true,
        });

        doc = await loadingTask.promise;
        if (isCancelled) return;

        const pageCount = doc.numPages;
        const allIssues = [];
        let firstPageSize = { value: null };

        for (let i = 1; i <= pageCount; i++) {
            if (isCancelled) {
                postMessage({ type: 'CANCELLED' });
                return;
            }
            self.postMessage({ type: 'PROGRESS', payload: { percent: Math.round((i / pageCount) * 100) } });

            const page = await doc.getPage(i);
            const structureIssues = await checkStructure(doc, i, page, profile, firstPageSize);
            const imageIssues = await checkImages(page, i, profile);
            const vectorIssues = await checkVectorsAndText(page, i, profile);
            const contentIssues = await checkContent(page, i, profile);

            allIssues.push(...structureIssues, ...imageIssues, ...vectorIssues, ...contentIssues);
        }

        // Final document-wide checks
        if (profile.requireEvenPages && pageCount % 2 !== 0) {
            allIssues.push(createIssue('PAGE_COUNT_INVALID', pageCount, 'Major', `Document has an odd number of pages (${pageCount}), but profile requires an even number.`));
        }

        // --- Summarize and Score ---
        const summaryMap = {
            bleed: { id: 'bleed', issueCount: 0, status: 'ok' },
            color: { id: 'color', issueCount: 0, status: 'ok' },
            resolution: { id: 'resolution', issueCount: 0, status: 'ok' },
            typography: { id: 'typography', issueCount: 0, status: 'ok' },
            ink: { id: 'ink', issueCount: 0, status: 'ok' },
            transparency: { id: 'transparency', issueCount: 0, status: 'ok' },
            content: { id: 'content', issueCount: 0, status: 'ok' },
            structure: { id: 'structure', issueCount: 0, status: 'ok' },
        };
        const ruleToCategory = {
            BLEED_MISSING: 'bleed',
            BOX_INCONSISTENT: 'structure',
            PAGE_SIZE_MIXED: 'structure',
            PAGE_COUNT_INVALID: 'structure',
            LOW_PPI_COLOR: 'resolution',
            LOW_PPI_GRAYSCALE: 'resolution',
            RGB_OBJECTS: 'color',
            SPOT_COLORS_PRESENT: 'color',
            REGISTRATION_COLOR_USED: 'ink',
            BLACK_OVERPRINT_MISSING: 'ink',
            WHITE_OVERPRINT: 'ink',
            FONT_MISSING: 'typography',
            FONT_TYPE3: 'typography',
            TRANSPARENCY_DETECTED: 'transparency',
            ANNOTATIONS_PRESENT: 'content',
        };
        let score = 100;
        allIssues.forEach(issue => {
            switch (issue.severity) {
                case 'Blocker': score -= 25; break;
                case 'Major': score -= 10; break;
                case 'Minor': score -= 2; break;
            }
            const category = ruleToCategory[issue.ruleId];
            if (category && summaryMap[category]) {
                const card = summaryMap[category];
                card.issueCount++;
                if (card.status !== 'error') {
                     card.status = (issue.severity === 'Blocker' || issue.severity === 'Major') ? 'error' : 'warning';
                }
            }
        });
        
        const preflightResult = {
            issues: allIssues,
            summary: Object.values(summaryMap),
            score: Math.max(0, score),
            pageCount,
        };

        if (!isCancelled) {
            postMessage({ type: 'RESULT', payload: preflightResult });
        }

    } catch (err) {
        let message = String(err?.message || err);
        if (err.name === 'PasswordException') {
            message = 'The PDF is encrypted and cannot be analyzed. Please provide an unlocked version.';
        }
        postMessage({ type: 'ERROR', payload: message });
    } finally {
        if (doc) {
            doc.destroy();
        }
    }
}

self.onmessage = (event) => {
    const messageData = event.data;
    if (messageData && typeof messageData === 'object') {
        const { type, payload } = messageData;
        switch (type) {
            case 'ANALYZE':
                analyze(payload.buffer, payload.profile);
                break;
            case 'CANCEL':
                isCancelled = true;
                break;
            default:
                console.error(`Worker received unknown message type: ${type}`);
                break;
        }
    }
};