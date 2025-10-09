
import * as pdfjsLib from 'pdfjs-dist';

// This is required for pdf.js to work in a worker. The robust setup handles
// cases where the CDN might be blocked by network policies.
const setupPromise = (async () => {
    const PDFJS_WORKER_URL = `https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.worker.min.js`;
    try {
        // A simple HEAD request can fail due to CORS policies inside a worker. A full fetch is more reliable.
        const response = await fetch(PDFJS_WORKER_URL);
        if (!response.ok) {
            throw new Error(`CDN request failed with status ${response.status}`);
        }
        // If fetch is successful, use the direct URL.
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    } catch (e) {
        console.warn(`PDF.js worker CDN (${PDFJS_WORKER_URL}) could not be configured directly, creating a fallback from a blob. Error: ${e.message}`);
        try {
            // As a fallback, fetch the script content and create a local blob URL.
            const response = await fetch(PDFJS_WORKER_URL);
            if (!response.ok) {
                 // If fallback also fails, throw an error to be caught by the onmessage handler
                throw new Error('Failed to fetch worker script for blob fallback');
            }
            const scriptText = await response.text();
            const blob = new Blob([scriptText], { type: 'application/javascript' });
            pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
        } catch (error) {
             console.error("Fatal: Could not create blob fallback for PDF.js worker. Analysis will likely fail.", error);
             // Re-throw the error to ensure setupPromise rejects, preventing a hang.
             throw new Error(`Failed to set up PDF.js worker: ${error.message}`);
        }
    }
})();


const MM_TO_PT = 2.83465;

// A helper to create a consistent issue object
function createIssue(ruleId, pageNum, severity, message, details = '', bbox = undefined) {
    return {
        id: `${ruleId}-${pageNum}-${Math.random().toString(36).substring(2, 9)}`,
        ruleId,
        page: pageNum,
        severity,
        message,
        details,
        bbox,
        confidence: 0.95, // Default confidence
    };
}

// --- Analysis Functions ---

async function checkBleed(page, pageNum, profile) {
    if (profile.bleed <= 0) return null;

    const bleedAmountPt = profile.bleed * MM_TO_PT;
    const { mediaBox, bleedBox, trimBox } = page;
    const boxToCheck = trimBox || mediaBox;

    if (!bleedBox) {
        return createIssue('BLEED_MISSING', pageNum, 'Blocker', `Page is missing a BleedBox, but profile requires ${profile.bleed}mm bleed.`);
    }

    const requiredWidth = (boxToCheck[2] - boxToCheck[0]) + (2 * bleedAmountPt);
    const requiredHeight = (boxToCheck[3] - boxToCheck[1]) + (2 * bleedAmountPt);

    const actualWidth = bleedBox[2] - bleedBox[0];
    const actualHeight = bleedBox[3] - bleedBox[1];

    // Use a small tolerance for floating point inaccuracies
    if (actualWidth < requiredWidth - 0.1 || actualHeight < requiredHeight - 0.1) {
        return createIssue('BLEED_MISSING', pageNum, 'Blocker', `Bleed area is smaller than the required ${profile.bleed}mm.`);
    }
    return null;
}

async function checkPageSizes(page, pageNum, firstPageSize) {
    const mediaBox = page.mediaBox;
    if (!mediaBox) {
        return createIssue('BOX_INCONSISTENT', pageNum, 'Blocker', 'Page dimensions are missing (no MediaBox).');
    }

    const width = mediaBox[2] - mediaBox[0];
    const height = mediaBox[3] - mediaBox[1];
    const currentPageSize = `${width.toFixed(1)}x${height.toFixed(1)}`;

    if (pageNum > 1 && firstPageSize && firstPageSize !== currentPageSize) {
        return createIssue('PAGE_SIZE_MIXED', pageNum, 'Major', `Page size (${currentPageSize}pt) differs from first page (${firstPageSize}pt).`);
    }
    // Return size for the first page, otherwise null
    return pageNum === 1 ? currentPageSize : null;
}


// --- Main Handler ---

self.onmessage = async (event) => {
    const { buffer, profile } = event.data;

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

    try {
        // Ensure the PDF.js worker is configured before we proceed. This will now
        // throw an error if the setup fails, which will be caught below.
        await setupPromise;

        const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
        const issues = [];
        let firstPageSize = null;

        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);

            // Run checks
            const bleedIssue = await checkBleed(page, i, profile);
            if (bleedIssue) issues.push(bleedIssue);
            
            const sizeCheckResult = await checkPageSizes(page, i, firstPageSize);
            if (typeof sizeCheckResult === 'string' && i === 1) {
                firstPageSize = sizeCheckResult;
            } else if (sizeCheckResult) { // It's an issue object
                issues.push(sizeCheckResult);
            }
        }
        
        // --- Summarize and Score ---
        const ruleToCategory = {
            BLEED_MISSING: 'bleed',
            SAFE_MARGIN_VIOLATION: 'bleed',
            BOX_INCONSISTENT: 'structure',
            PAGE_SIZE_MIXED: 'structure',
            RGB_OBJECTS: 'color',
            SPOT_COLORS_PRESENT: 'color',
            LOW_PPI_COLOR: 'resolution',
            LOW_PPI_GRAYSCALE: 'resolution',
            LOW_PPI_LINEART: 'resolution',
        };

        let score = 100;

        issues.forEach(issue => {
            // Update score based on severity
            switch (issue.severity) {
                case 'Blocker': score -= 25; break;
                case 'Major': score -= 10; break;
                case 'Minor': score -= 2; break;
                default: break;
            }

            // Update summary card
            const category = ruleToCategory[issue.ruleId];
            if (category && summaryMap[category]) {
                const card = summaryMap[category];
                card.issueCount++;
                const currentStatus = card.status;
                if (currentStatus !== 'error') {
                     card.status = (issue.severity === 'Blocker' || issue.severity === 'Major') ? 'error' : 'warning';
                }
            }
        });

        const result = {
            issues,
            summary: Object.values(summaryMap),
            score: Math.max(0, score),
            pageCount: doc.numPages,
        };

        self.postMessage(result);

    } catch (e) {
        console.error("Error in preflight worker:", e);
        // Post an error result back to the main thread so the UI can update
        const errorResult = {
            issues: [createIssue('UNKNOWN', 1, 'Blocker', `Analysis failed: ${e.message}`)],
            summary: Object.values(summaryMap).map(s => ({ ...s, status: 'error', issueCount: 0 })),
            score: 0,
            pageCount: 0,
        };
        self.postMessage(errorResult);
    }
};
