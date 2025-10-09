// This is a mock web worker to simulate PDF preflight analysis.
// In a real application, this would contain complex logic to inspect the PDF file.

self.onmessage = (event) => {
    // The event.data contains the file and profile sent from the main thread.
    // We are not using them here, but they would be used in a real implementation.
    const { file, profile } = event.data;

    // Simulate analysis time
    setTimeout(() => {
        const mockResult = {
            issues: [
                {
                    id: '1',
                    ruleId: 'BLEED_MISSING',
                    page: 1,
                    severity: 'Blocker',
                    confidence: 0.99,
                    message: 'Document is missing the required 3mm bleed.',
                    bbox: { "x": 0, "y": 0, "width": 623.62, "height": 8.5 },
                },
                {
                    id: '2',
                    ruleId: 'LOW_PPI_COLOR',
                    page: 2,
                    severity: 'Major',
                    confidence: 0.95,
                    message: 'Image has low resolution (150 PPI), recommended is 300 PPI.',
                    bbox: { x: 141.73, y: 141.73, width: 283.46, height: 226.77 },
                },
                 {
                    id: '3',
                    ruleId: 'BOX_INCONSISTENT',
                    page: 3,
                    severity: 'Major',
                    confidence: 1.0,
                    message: 'Page 3 has a different size than the rest of the document.',
                },
                {
                    id: '4',
                    ruleId: 'RGB_OBJECTS',
                    page: 4,
                    severity: 'Minor',
                    confidence: 0.8,
                    message: 'Document contains RGB objects, expected CMYK for printing.',
                },
                {
                    id: '5',
                    ruleId: 'HAIRLINE_STROKE',
                    page: 5,
                    severity: 'Minor',
                    confidence: 0.9,
                    message: 'A line has a stroke width below the minimum of 0.1pt.',
                     bbox: { x: 50, y: 700, width: 200, height: 1 }
                }
            ],
            summary: [
                { id: 'bleed', status: 'error', issueCount: 1 },
                { id: 'color', status: 'warning', issueCount: 1 },
                { id: 'resolution', status: 'error', issueCount: 1 },
                { id: 'typography', status: 'ok', issueCount: 0 },
                { id: 'ink', status: 'warning', issueCount: 1 },
                { id: 'transparency', status: 'ok', issueCount: 0 },
                { id: 'content', status: 'ok', issueCount: 0 },
                { id: 'structure', status: 'error', issueCount: 1 },
            ],
            score: 45,
            pageCount: 5,
        };

        // Send the result back to the main thread
        self.postMessage({ type: 'result', payload: mockResult });

    }, 2000); // Simulate a 2-second analysis time
};
