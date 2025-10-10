
export const translations = {
    // General
    issues: 'Issues',
    page: 'Page',
    description: 'Description',
    severity: 'Severity',
    close: 'Close',

    // Severities
    Blocker: 'Blocker',
    Major: 'Major',
    Minor: 'Minor',
    Nit: 'Nit',
    Info: 'Info',

    // Statuses
    ok: 'OK',
    warning: 'Warning',
    error: 'Error',

    // Profile Names
    profile_bw_brochure: 'B&W Brochure',
    profile_color_book: 'Color Book (Coated)',
    profile_web_display: 'Web/Digital Display',

    // Summary Card IDs
    bleed: 'Bleed',
    color: 'Color',
    resolution: 'Resolution',
    typography: 'Typography',
    ink: 'Ink',
    transparency: 'Transparency',
    content: 'Content',
    structure: 'Structure',

    // Header
    preflightProfile: 'Preflight Profile',
    exportReport: 'Export Report',
    reportNotAvailable: 'Report not available until analysis is complete.',

    // Dropzone
    uploadTitle: 'Drop a PDF file here or click to upload',
    uploadSubtitle: 'Analyze your document for print readiness and other common issues.',
    uploadIdmlTitle: 'Upload an Adobe InDesign IDML file',
    uploadZipTitle: 'Upload a packaged ZIP file',

    // App states
    analyzing: 'Analyzing your document, please wait...',
    unsupportedFileTitle: 'Unsupported File Type',
    unsupportedFileMessage: 'Preflight analysis is currently only available for PDF files. The {fileType} file type is not supported yet.',
    analysisFailedTitle: 'Analysis Failed',
    analyzeDifferentFile: 'Analyze a Different File',
    noIssuesFound: 'Congratulations! No issues were found based on the selected profile.',
    allClearTitle: 'All Clear!',

    // Results view
    summary: 'Summary',
    preflightScore: 'Preflight Score',
    howToFix: 'How to Fix',
    noIssueSelected: 'Select an issue from the list to see how to fix it.',
    analyzeNewPDF: 'Analyze New PDF',
    auditWithAI: 'Audit with AI',

    // AI Modal
    aiAuditReport: 'AI Audit Report',
    auditing: 'Auditing your report...',
    aiAnalyzing: 'Phil Preflight is analyzing your document and preparing a detailed report with recommendations. This might take a moment.',
    aiError: 'Sorry, the AI audit could not be completed. Please check your connection or API key and try again.',

    // PDF Report
    pdfReportTitle: 'Preflight Report',
    pdfFileName: 'File Name',
    pdfProfileUsed: 'Profile Used',
    pdfAnalysisDate: 'Analysis Date',
    pdfOverallScore: 'Overall Score',
    pdfSummaryTitle: 'Summary of Checks',
    pdfCategory: 'Category',
    pdfStatus: 'Status',
    pdfIssuesTitle: 'Detailed Issues',
    pdfPage: 'Page',
    pdfSeverity: 'Severity',
    pdfDescription: 'Description',
    pdfFixDetailsTitle: 'Fix Instructions',
    pdfTransparencyWarningTitle: 'Note on Transparency',
    pdfTransparencyWarningBody: 'This report detected transparency. The selected profile "{profileName}" recommends flattening transparency for maximum compatibility with older printing presses (as required by standards like PDF/X-1a). Please ensure your final PDF is flattened if required by your print provider.',

    // Fix Drawer specific
    fixInDesign: 'Adobe InDesign',
    fixIllustrator: 'Adobe Illustrator',
    fixWord: 'Microsoft Word',
    fontFallbackSuggestions: 'Font Fallback Suggestions',
    
    // Fix Steps
    fixSteps: {
        FILE_ENCRYPTED: {
            inDesign: ['In Acrobat Pro, go to File > Properties > Security. Change "Security Method" to "No Security" and save the file.', 'Alternatively, re-export the PDF from InDesign, ensuring no password or security options are enabled in the export dialog.'],
            illustrator: ['Re-export the PDF from Illustrator. In the "Save Adobe PDF" dialog, go to the "Security" tab and make sure no security options are checked.'],
            word: ['When exporting to PDF (Save As > PDF), click "Options" and ensure "Encrypt the document with a password" is unchecked.'],
        },
        BLEED_MISSING: {
            inDesign: ['Go to `File > Document Setup`.', 'Under "Bleed and Slug", ensure the Bleed values are set to at least the required amount (e.g., 3mm or 0.125in) on all sides.', 'Extend any artwork that should reach the edge of the page to the red bleed guide.'],
            illustrator: ['Go to `File > Document Setup`.', 'Set the Bleed values to the required amount.', 'Extend artwork to the red bleed guide.'],
            word: ['Microsoft Word does not have a native concept of bleed. The page size must be manually increased to include the bleed area (e.g., A4 page with 3mm bleed becomes 216mm x 303mm).', 'Extend background colors and images to the new edge of the larger page.'],
        },
        BOX_INCONSISTENT: {
            inDesign: ['This usually indicates a corrupt PDF. Re-export from your source document.', 'In the InDesign export settings, under "Marks and Bleeds", ensure "Use Document Bleed Settings" is checked.'],
            illustrator: ['Re-export from Illustrator. In the "Save Adobe PDF" dialog under "Marks and Bleeds", check "Use Document Bleed Settings".'],
            word: ['This is rare from Word. Try re-saving the PDF. If it persists, the document structure may be complex or corrupt.'],
        },
        SAFE_MARGIN_VIOLATION: {
            inDesign: ['Go to `Layout > Margins and Columns`. Ensure the margins are set to the required safe area (e.g., 5mm).', 'Move any critical text or elements inside the purple/pink margin guides.'],
            illustrator: ['Create guides or a rectangle on a non-printing layer to represent your safe area.', 'Ensure all important content is within these guides.'],
            word: ['Go to the "Layout" tab and click `Margins`. Set custom margins to the required safe distance (e.g., 0.25 inches).', 'Move text and images away from the page edge to respect these margins.'],
        },
        LOW_PPI_COLOR: {
            inDesign: ['Find the image in the `Links` panel. The "Effective PPI" should be above the required minimum (e.g., 300 PPI).', 'Replace the low-resolution image with a high-resolution version.', 'Avoid scaling images up excessively in InDesign, as this lowers the effective PPI.'],
            illustrator: ['Select the image and check the "PPI" value in the control bar at the top.', 'Replace the image with a higher-resolution version.'],
            word: ['There is no direct PPI check. You must ensure the source image is high resolution before inserting it.', 'In Word options, go to `Advanced > Image Size and Quality` and check "Do not compress images in file" and set the default resolution to "High fidelity".'],
        },
        LOW_PPI_GRAYSCALE: {
            inDesign: ['Find the image in the `Links` panel. The "Effective PPI" should be above the required minimum (e.g., 240 PPI).', 'Replace the low-resolution image with a high-resolution version.'],
            illustrator: ['Select the image and check the "PPI" value in the control bar at the top.', 'Replace the image with a higher-resolution version.'],
            word: ['Ensure the source image is high resolution before inserting it.', 'In Word options, go to `Advanced > Image Size and Quality` and check "Do not compress images in file" and set the default resolution to "High fidelity".'],
        },
        LOW_PPI_LINEART: {
            inDesign: ['For bitmap line art (1-bit TIFFs), the "Effective PPI" in the `Links` panel should be very high (e.g., 800-1200 PPI).', 'It is highly recommended to use vector graphics (AI, EPS, PDF) for logos and line art instead of bitmap images.'],
            illustrator: ['Use vector graphics for all line art. If you must use a bitmap, ensure its resolution is very high (1200 PPI is standard).'],
            word: ['Use vector formats like SVG or EMF where possible. For bitmap images, ensure they are very high resolution before inserting.'],
        },
        RGB_OBJECTS: {
            inDesign: ['Go to `Window > Output > Separations Preview` and set View to "Separations". If you see an "RGB" plate, objects on that page are RGB.', 'Go to `Edit > Transparency Blend Space` and ensure it is set to CMYK.', 'Convert colors in the `Swatches` panel to CMYK.', 'For images, convert them to CMYK in Photoshop before placing them.'],
            illustrator: ['Go to `File > Document Color Mode` and ensure it is set to `CMYK Color`.', 'Open the `Swatches` panel and convert any RGB swatches to CMYK.', 'Convert placed images to CMYK in Photoshop.'],
            word: ['Word works natively in RGB. Color conversion happens during PDF export.', 'When exporting, choose "PDF/A compliant" or "ISO 19005-1 compliant" if available, as this can help with color management. For professional results, it is better to use design software.'],
        },
        SPOT_COLORS_PRESENT: {
            inDesign: ['Open the `Swatches` panel. Spot colors are indicated by a circle icon.', 'Double-click the spot swatch, change its "Color Type" from "Spot" to "Process", and check "Name with Color Value".'],
            illustrator: ['Open the `Swatches` panel. Spot colors have a small dot in the corner of the swatch.', 'Select the spot color, go to the panel menu, and choose "Swatch Options". Change "Color Type" to "Process".'],
            word: ['Word does not support spot colors. Any spot colors detected likely came from an imported graphic (like an EPS or PDF).', 'Edit the source graphic in Illustrator or similar software to convert its spot colors to CMYK.'],
        },
        TAC_EXCEEDED: {
            inDesign: ['Go to `Window > Output > Separations Preview` and set View to "Ink Limit". Enter the required TAC limit (e.g., 320%) in the box.', 'Areas exceeding the limit will be highlighted (usually in red).', 'Adjust the colors or image curves (in Photoshop) for the highlighted areas to reduce the total ink coverage.'],
            illustrator: ['Use the `Separations Preview` panel similar to InDesign to identify problem areas.', 'Adjust CMYK values for fills and strokes, or edit placed images in Photoshop.'],
            word: ['This cannot be controlled directly in Word. It is a result of how RGB colors are converted to CMYK.', 'Use CMYK-native design software for projects requiring strict ink limit control.'],
        },
        RICH_BLACK_TEXT: {
            inDesign: ['Select the text. Open the `Swatches` panel and ensure it is set to the standard `[Black]` swatch (which should be 100% K).', 'Avoid creating a custom "rich black" swatch for small text.'],
            illustrator: ['Select the text and ensure its fill color is C:0 M:0 Y:0 K:100.'],
            word: ['Ensure text color is set to "Automatic" or the standard black from the palette, which is typically RGB(0,0,0). This usually converts to 100% K.', 'Avoid custom black colors.'],
        },
        REGISTRATION_COLOR_USED: {
            inDesign: ['The `[Registration]` swatch prints on all color plates and should only be used for printers marks.', 'Find the object using this color (you can use `Edit > Find/Change`) and change its swatch to `[Black]`.'],
            illustrator: ['Find any objects using the `Registration` swatch and change their color to a standard 100% K black.'],
            word: ['Word does not have a Registration color. This issue would originate from an imported graphic. Edit the source file.'],
        },
        BLACK_OVERPRINT_MISSING: {
            inDesign: ['Go to `Edit > Preferences > Appearance of Black`. Set "Overprinting of [Black]" to "[Black] 100%".', 'When exporting, in the `Output` tab, ensure that "Simulate Overprint" is checked if you want to preview the effect.'],
            illustrator: ['Select the black text/object. Go to `Window > Attributes` and check "Overprint Fill".', 'This can be tedious. A better approach is to use a preflight profile in Acrobat Pro to fix this after PDF creation.'],
            word: ['This cannot be controlled in Word.'],
        },
        WHITE_OVERPRINT: {
            inDesign: ['Find the white object. Go to `Window > Output > Attributes` and ensure that "Overprint Fill" (or "Overprint Stroke") is unchecked.', 'This is a serious error that can cause white objects to disappear when printed.'],
            illustrator: ['Select the white object, open the `Attributes` panel, and uncheck "Overprint Fill".'],
            word: ['This is not possible in Word.'],
        },
        TRANSPARENCY_DETECTED: {
            inDesign: ['This is a warning. If your print provider requires a flattened PDF (like PDF/X-1a), you must set this during export.', 'Go to `File > Export`, choose "Adobe PDF (Print)". Select the `PDF/X-1a:2001` standard.', 'In the `Advanced` tab, choose a "Transparency Flattener" preset (e.g., [High Resolution]).'],
            illustrator: ['When saving as PDF, choose the `PDF/X-1a:2001` preset, which will automatically handle flattening.'],
            word: ['Transparency from Word (e.g., picture effects, shadows) can be problematic. There is no manual flattener.', 'For best results, avoid complex transparency effects or use design software.'],
        },
        FONT_MISSING: {
            inDesign: ['Go to `Type > Find/Replace Font`. The missing font will be listed with a warning icon.', 'Either install the missing font on your system, or use the "Find/Replace" feature to change it to an available font.'],
            illustrator: ['Go to `Type > Find Font`. Replace the missing font with one that is installed.'],
            word: ['Word will typically substitute a missing font automatically, which may cause reflows. The document will have a warning banner.', 'Install the correct font or manually reformat the document with an available one.'],
            suggestions: [
                'Ensure the font `{fontName}` is installed and activated on your system.',
                'If the font is from a client, request they package the file (`File > Package` in InDesign) to include the fonts.',
                'If the font is not available, replace it with a licensed and approved alternative.'
            ],
        },
        FONT_TYPE3: {
            inDesign: ['Type 3 fonts are not recommended for professional printing. They are often bitmap or PostScript-based and do not embed well.', 'Replace the font with a modern OpenType or TrueType font.'],
            illustrator: ['Replace any Type 3 fonts with OpenType or TrueType equivalents.'],
            word: ['This is very rare in Word. It would likely come from an old, embedded graphic. Recreate or replace the graphic.'],
        },
        FONT_FAUX_STYLE: {
            inDesign: ['Avoid using the "Bold" or "Italic" buttons in the Character panel if the font family does not have a true bold or italic weight.', 'Instead, select the font and choose the correct weight from the font style dropdown (e.g., "Myriad Pro" -> "Bold").'],
            illustrator: ['Similar to InDesign, select the actual bold or italic font from the family list instead of using style buttons.'],
            word: ['Word heavily relies on faux styles. While common, for professional design it is better to use a font family with distinct, designed weights.'],
        },
        HAIRLINE_STROKE: {
            inDesign: ['Find lines or strokes with a weight below the minimum (e.g., 0.25 pt).', 'Increase the stroke weight in the `Stroke` panel.'],
            illustrator: ['Select objects with thin strokes and increase their weight in the `Stroke` panel.'],
            word: ['In the "Format Shape" options, under "Line", set the "Width" to a value greater than the minimum requirement.'],
        },
        ANNOTATIONS_PRESENT: {
            inDesign: ['Comments or notes from InDesign can be exported as annotations.', 'Before exporting, either resolve/delete the comments, or in the PDF export dialog, under `General`, set "Include" to not include "Visible Guides and Grids" or other non-printing items. In newer versions, there is a specific checkbox for annotations.'],
            illustrator: ['This is less common from Illustrator. Ensure no comments or notes are present.'],
            word: ['Tracked changes and comments can be exported as PDF annotations.', 'In the "Review" tab, accept all changes and delete all comments before saving as a PDF.'],
        },
        PAGE_COUNT_INVALID: {
            inDesign: ['If an even number of pages is required (e.g., for a saddle-stitched booklet), you may need to add blank pages.', 'Open the `Pages` panel and add pages as needed to make the total count even.'],
            illustrator: ['If using multiple artboards, add or remove artboards to meet the page count requirement.'],
            word: ['Insert page breaks to add blank pages at the end of the document if needed.'],
        },
        PAGE_SIZE_MIXED: {
            inDesign: ['Use the "Page Tool" (Shift+P) to select pages with incorrect sizes in the `Pages` panel.', 'In the control bar at the top, adjust the page dimensions to match the primary size.'],
            illustrator: ['Open the "Artboards" panel (`Window > Artboards`).', 'Double-click each artboard to view its dimensions and adjust them to be consistent.'],
            word: ['It is difficult to have mixed page sizes in one Word document section. This might indicate an issue during PDF creation.', 'Check your section breaks and page setup for each section.'],
        }
    }
};
