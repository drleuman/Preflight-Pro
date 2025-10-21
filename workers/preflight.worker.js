// The pdf.js library is now prepended to this script by the main app.
// The `pdfjsLib` global is therefore available without needing to import it.

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

async function checkImagesAndVectors(page, pageNum, profile) {
    const issues = [];
    const operatorList = await page.getOperatorList();
    const { fnArray, argsArray } = operatorList;

    let hasRgbVector = false;
    let hasTransparency = false;

    for (let i = 0; i < fnArray.length; i++) {
        const op = fnArray[i];
        const args = argsArray[i];

        // Check for RGB color setting operators
        if (!profile.allowRgb && !hasRgbVector) {
            if (op === pdfjsLib.OPS.setFillRGBColor || op === pdfjsLib.OPS.setStrokeRGBColor) {
                hasRgbVector = true;
            }
        }

        // Check for transparency
        if (!profile.allowTransparency && !hasTransparency) {
            if (op === pdfjsLib.OPS.setExtGState) {
                // This is a simplified check. A full check would inspect the ExtGState dictionary for transparency keys.
                hasTransparency = true;
            }
        }

        // Check for images using RGB color space
        if (!profile.allowRgb && op === pdfjsLib.OPS.paintImageXObject) {
            try {
                const imgRef = args[0];
                const img = await page.objs.get(imgRef);
                if (img && img.colorSpace && img.colorSpace.name === 'DeviceRGB') {
                    issues.push(createIssue('RGB_OBJECTS', pageNum, 'Major', 'Image uses the RGB color space.'));
                }
            } catch (e) {
                console.warn(`Could not analyze image properties on page ${pageNum}.`, e);
            }
        }
    }

    if (hasRgbVector) {
        issues.push(createIssue('RGB_OBJECTS', pageNum, 'Major', 'Page contains vector objects or text using the RGB color space.'));
    }
    if (hasTransparency) {
        issues.push(createIssue('TRANSPARENCY_DETECTED', pageNum, 'Minor', 'Page may contain transparency, which is disallowed by the current profile.'));
    }

    return issues;
}


async function checkFonts(page, pageNum) {
    const issues = [];
    const dependencies = await page.getDependencies();
    for (const dep of dependencies) {
        if (!dep.startsWith('font_')) continue;
        try {
            const font = await page.commonObjs.get(dep);
            if (!font) continue;

            // A font is considered embedded if it has its data property.
            if (!font.data) {
                issues.push(createIssue('FONT_MISSING', pageNum, 'Blocker', `Font '${font.name}' is not embedded in the PDF.`));
            }
            if (font.subtype === 'Type3') {
                issues.push(createIssue('FONT_TYPE3', pageNum, 'Major', `Font '${font.name}' is a Type3 font, which may not print correctly.`));
            }
        } catch (e) {
            console.warn(`Could not analyze font dependency on page ${pageNum}: ${dep}`, e);
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

async function checkPrintAttributes(page, pageNum, profile) {
    if (!profile.requireBlackOverprint && !profile.disallowWhiteOverprint) {
        return [];
    }

    const issues = [];
    const resources = await page.getResources();
    const gStates = resources.gStates || {};
    const operatorList = await page.getOperatorList();
    const { fnArray, argsArray } = operatorList;

    let currentFillColor = null;
    let currentStrokeColor = null;
    let currentFillOverprint = false;
    let currentStrokeOverprint = false;

    const is100KBlack = (color) => {
        if (!color) return false;
        // CMYK: C=0, M=0, Y=0, K=1
        if (color.k === 1 && color.c === 0 && color.m === 0 && color.y === 0) return true;
        // Grayscale: G=0
        if (color.g === 0 && color.r === undefined) return true; // 'r' check distinguishes from RGB
        return false;
    };

    const isWhite = (color) => {
        if (!color) return false;
        // CMYK: C=0, M=0, Y=0, K=0
        if (color.k === 0 && color.c === 0 && color.m === 0 && color.y === 0) return true;
        // Grayscale: G=1
        if (color.g === 1) return true;
        // RGB: R=1, G=1, B=1
        if (color.r === 1 && color.g === 1 && color.b === 1) return true;
        return false;
    };

    for (let i = 0; i < fnArray.length; i++) {
        const op = fnArray[i];
        const args = argsArray[i];

        // 1. Update color and graphics state from operators
        switch (op) {
            case pdfjsLib.OPS.setFillCMYKColor: currentFillColor = { c: args[0], m: args[1], y: args[2], k: args[3] }; break;
            case pdfjsLib.OPS.setStrokeCMYKColor: currentStrokeColor = { c: args[0], m: args[1], y: args[2], k: args[3] }; break;
            case pdfjsLib.OPS.setFillGray: currentFillColor = { g: args[0] }; break;
            case pdfjsLib.OPS.setStrokeGray: currentStrokeColor = { g: args[0] }; break;
            case pdfjsLib.OPS.setFillRGBColor: currentFillColor = { r: args[0], g: args[1], b: args[2] }; break;
            case pdfjsLib.OPS.setStrokeRGBColor: currentStrokeColor = { r: args[0], g: args[1], b: args[2] }; break;
            case pdfjsLib.OPS.setExtGState: {
                const gStateName = args[0];
                const gState = gStates[gStateName];
                if (gState) {
                    if (gState.OPM === 1) { // Overprint Mode 1 forces overprint
                        currentFillOverprint = true;
                        currentStrokeOverprint = true;
                    } else if (gState.OPM === 0) { // Overprint Mode 0 forces knockout
                        currentFillOverprint = false;
                        currentStrokeOverprint = false;
                    } else { // OPM not set, check individual flags
                        if (gState.OP !== undefined) {
                            currentFillOverprint = gState.OP;
                            currentStrokeOverprint = gState.OP;
                        }
                        if (gState.op !== undefined) {
                            currentFillOverprint = gState.op;
                        }
                    }
                }
                break;
            }
        }

        // 2. Check for issues on paint operations
        const checkFill = () => {
            if (profile.requireBlackOverprint && is100KBlack(currentFillColor) && !currentFillOverprint) {
                issues.push(createIssue('BLACK_OVERPRINT_MISSING', pageNum, 'Minor', '100% black object is not set to overprint.'));
            }
            if (profile.disallowWhiteOverprint && isWhite(currentFillColor) && currentFillOverprint) {
                issues.push(createIssue('WHITE_OVERPRINT', pageNum, 'Blocker', 'White object is set to overprint, which will make it invisible.'));
            }
        };

        const checkStroke = () => {
             if (profile.requireBlackOverprint && is100KBlack(currentStrokeColor) && !currentStrokeOverprint) {
                issues.push(createIssue('BLACK_OVERPRINT_MISSING', pageNum, 'Minor', '100% black stroke is not set to overprint.'));
            }
            if (profile.disallowWhiteOverprint && isWhite(currentStrokeColor) && currentStrokeOverprint) {
                issues.push(createIssue('WHITE_OVERPRINT', pageNum, 'Blocker', 'White stroke is set to overprint, which will make it invisible.'));
            }
        };
        
        switch (op) {
            case pdfjsLib.OPS.fill:
            case pdfjsLib.OPS.eoFill:
                checkFill();
                break;
            
            case pdfjsLib.OPS.stroke:
            case pdfjsLib.OPS.closePathStroke:
                checkStroke();
                break;

            case pdfjsLib.OPS.fillStroke:
            case pdfjsLib.OPS.eoFillStroke:
                checkFill();
                checkStroke();
                break;
        }
    }
    
    // Return unique issues per page, as a single state can apply to many objects
    const uniqueMessages = new Set();
    return issues.filter(issue => {
        if (uniqueMessages.has(issue.message)) {
            return false;
        }
        uniqueMessages.add(issue.message);
        return true;
    });
}


// --- Main Analysis Engine ---

async function analyze(buffer, profile) {
    isCancelled = false;
    let doc;

    try {
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            // When running inside a worker, prevent pdf.js from trying to spawn its own worker.
            disableWorker: true,
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
            const imageVectorIssues = await checkImagesAndVectors(page, i, profile);
            const fontIssues = await checkFonts(page, i);
            const contentIssues = await checkContent(page, i, profile);
            const printAttrIssues = await checkPrintAttributes(page, i, profile);

            allIssues.push(...structureIssues, ...imageVectorIssues, ...fontIssues, ...contentIssues, ...printAttrIssues);
        }

        // Final document-wide checks
        if (profile.requireEvenPages && pageCount % 2 !== 0) {
            allIssues.push(createIssue('PAGE_COUNT_INVALID', pageCount, 'Major', `Document has an odd number of pages (${pageCount}), but profile requires an even number.`));
        }

        // --- Summarize and Score ---
        const summaryMap = {
            bleed: { id: 'bleed', title: 'Bleed', issueCount: 0, status: 'ok' },
            color: { id: 'color', title: 'Color', issueCount: 0, status: 'ok' },
            resolution: { id: 'resolution', title: 'Resolution', issueCount: 0, status: 'ok' },
            typography: { id: 'typography', title: 'Typography', issueCount: 0, status: 'ok' },
            ink: { id: 'ink', title: 'Ink', issueCount: 0, status: 'ok' },
            transparency: { id: 'transparency', title: 'Transparency', issueCount: 0, status: 'ok' },
            content: { id: 'content', title: 'Content', issueCount: 0, status: 'ok' },
            structure: { id: 'structure', title: 'Structure', issueCount: 0, status: 'ok' },
        };
        
        const ruleToCategory = {
            FILE_ENCRYPTED: 'structure',
            BLEED_MISSING: 'bleed',
            BOX_INCONSISTENT: 'structure',
            SAFE_MARGIN_VIOLATION: 'structure',
            LOW_PPI_COLOR: 'resolution',
            LOW_PPI_GRAYSCALE: 'resolution',
            LOW_PPI_LINEART: 'resolution',
            RGB_OBJECTS: 'color',
            SPOT_COLORS_PRESENT: 'color',
            TAC_EXCEEDED: 'ink',
            RICH_BLACK_TEXT: 'ink',
            REGISTRATION_COLOR_USED: 'ink',
            BLACK_OVERPRINT_MISSING: 'ink',
            WHITE_OVERPRINT: 'ink',
            TRANSPARENCY_DETECTED: 'transparency',
            FONT_MISSING: 'typography',
            FONT_TYPE3: 'typography',
            FONT_FAUX_STYLE: 'typography',
            HAIRLINE_STROKE: 'ink',
            ANNOTATIONS_PRESENT: 'content',
            PAGE_COUNT_INVALID: 'structure',
            PAGE_SIZE_MIXED: 'structure',
        };

        let score = 100;
        allIssues.forEach(issue => {
            switch (issue.severity) {
                case 'Blocker': score -= 25; break;
                case 'Major': score -= 10; break;
                case 'Minor': score -= 2; break;
            }
            const categoryKey = ruleToCategory[issue.ruleId];
            if (categoryKey && summaryMap[categoryKey]) {
                const card = summaryMap[categoryKey];
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