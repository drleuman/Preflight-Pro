import type { Translations } from '../types';

export const translations: Translations = {
    en: {
        // General
        page: 'Page',
        description: 'Description',
        severity: 'Severity',
        issues: 'Issues',
        close: 'Close',
        language: 'Language',

        // Header
        preflightProfile: 'Preflight Profile',
        exportReport: 'Export Report',
        reportNotAvailable: 'Report not available until analysis is complete',
        
        // Profiles
        profile_bw_brochure: 'B&W Brochure',
        profile_color_book: 'Color Book (Coated)',
        profile_web_display: 'Web Display',

        // Dropzone
        uploadTitle: 'Drop your PDF here to start preflight',
        uploadSubtitle: 'or click to browse your files',
        uploadDisabled: 'This file type is not currently supported',
        
        // Analysis States
        analyzing: 'Analyzing your document...',

        // Summary
        summary: 'Summary',
        preflightScore: 'Preflight Score',
        bleed: 'Bleed & Margins',
        color: 'Color',
        resolution: 'Resolution',
        typography: 'Typography',
        ink: 'Ink',
        transparency: 'Transparency',
        content: 'Content',
        structure: 'Structure',
        
        // Issues Panel
        noIssuesFound: 'No issues found. Your file is ready for production!',
        
        // Severities
        Blocker: 'Blocker',
        Major: 'Major',
        Minor: 'Minor',
        Nit: 'Nit',
        Info: 'Info',
        
        // Fix Drawer
        howToFix: 'How to Fix',
        noIssueSelected: 'Select an issue to see how to fix it.',
        fixInDesign: 'In Adobe InDesign',
        fixIllustrator: 'In Adobe Illustrator',
        fixWord: 'In Microsoft Word',
        
        // Footer Buttons
        analyzeNewPDF: 'Analyze a New PDF',
        auditWithAI: 'Audit with AI ✨',

        // AI Modal
        auditing: 'Auditing...',
        aiAuditReport: 'AI Audit Report',
        aiAnalyzing: 'Phil Preflight is analyzing your report to provide a helpful summary and recommendations. This may take a moment...',
        aiError: 'Sorry, the AI audit failed. Please try again later.',

        // Fix Steps (nested object)
        fixSteps: {
            FILE_ENCRYPTED: {
                inDesign: ["Go to <strong>File &gt; File Info...</strong> and remove any security settings."],
                illustrator: ["Open the file and re-save it without password protection."],
                word: ["Go to <strong>File &gt; Info &gt; Protect Document</strong> and remove encryption."]
            },
            BLEED_MISSING: {
                inDesign: [
                    "Go to <strong>File &gt; Document Setup...</strong>",
                    "Under 'Bleed and Slug', enter the required bleed amount (e.g., 3mm) for all sides.",
                    "Extend your artwork to the bleed line."
                ],
                illustrator: [
                    "Go to <strong>File &gt; Document Setup...</strong>",
                    "Set the 'Bleed' values to the required amount (e.g., 3mm).",
                    "Ensure your artwork extends to the edge of the bleed area."
                ],
                word: [
                    "This is difficult in Word. It's better to set your page size to be larger than the final trim size to include bleed.",
                    "For a standard A4 (210x297mm) with 3mm bleed, set the custom page size to 216x303mm.",
                    "Ensure your background colors/images extend to the very edge of this larger page."
                ]
            },
            BOX_INCONSISTENT: {
                inDesign: [
                    "Open the <strong>Pages</strong> panel.",
                    "Check the dimensions of each page. Use the Page Tool (Shift+P) to adjust any pages that have incorrect dimensions to match the rest of the document."
                ],
                illustrator: [
                    "Open the <strong>Artboards</strong> panel (Window &gt; Artboards).",
                    "Review the dimensions of each artboard and adjust any that are inconsistent."
                ],
                word: [
                    "Check the <strong>Layout &gt; Size</strong> setting for each section of your document. Ensure they are all consistent."
                ]
            },
            SAFE_MARGIN_VIOLATION: {
                inDesign: [
                    "Go to <strong>Layout &gt; Margins and Columns...</strong> to set your safe area margins.",
                    "Move any important text or content inside these margin guides."
                ],
                illustrator: [
                    "Create a new rectangle with the dimensions of your safe area (e.g., trim size minus margin on all sides).",
                    "Convert it to a guide (<strong>View &gt; Guides &gt; Make Guides</strong>) to visualize the safe area.",
                    "Move important content within these guides."
                ],
                word: [
                    "Adjust the margins under <strong>Layout &gt; Margins</strong>.",
                    "Ensure all text and critical elements are within these margins."
                ]
            },
            LOW_PPI_COLOR: {
                inDesign: [
                    "Select the image and check the 'Effective PPI' in the <strong>Links</strong> panel.",
                    "If it's too low, you must replace the image with a higher-resolution version. Do not simply scale up the image in InDesign, as this will result in poor quality."
                ],
                illustrator: [
                    "Select the image and check the PPI value in the top control bar.",
                    "Replace the linked or embedded image with a higher-resolution source file."
                ],
                word: [
                    "Right-click the image and go to <strong>Size and Position</strong>. Ensure 'Scale' is at 100% or less.",
                    "If the image is still low resolution, you must re-insert a higher-quality version of the image."
                ]
            },
            LOW_PPI_GRAYSCALE: {
                 inDesign: [ "Same as for color images. Select the image and check the 'Effective PPI' in the <strong>Links</strong> panel, then replace with a high-resolution version."],
                 illustrator: ["Same as for color images. Replace the low-resolution image with a high-resolution one."],
                 word: ["Same as for color images. Re-insert a higher quality version of the image."]
            },
            LOW_PPI_LINEART: {
                 inDesign: [ "Line art (bitmaps) requires very high resolution. Check 'Effective PPI' in the <strong>Links</strong> panel and replace with a higher-resolution version if needed."],
                 illustrator: ["Ensure vector artwork is used where possible. If it must be a bitmap, ensure it has a very high resolution (e.g., 1200 PPI)."],
                 word: ["Avoid using low-resolution line art. Re-insert a higher quality version if necessary."]
            },
            RGB_OBJECTS: {
                inDesign: [
                    "Go to <strong>Window &gt; Output &gt; Separations Preview</strong> and set View to 'Separations'. If you see an 'RGB' plate, you have RGB content.",
                    "Find the RGB elements (often images). Convert them to CMYK in Photoshop.",
                    "Update the links in your InDesign document.",
                    "For native InDesign objects, edit their color swatches to be CMYK."
                ],
                illustrator: [
                    "Go to <strong>File &gt; Document Color Mode</strong> and ensure it's set to 'CMYK Color'.",
                    "Select RGB objects and convert their color using <strong>Edit &gt; Edit Colors &gt; Convert to CMYK</strong>."
                ],
                word: [
                    "Word primarily works in RGB. It's very difficult to manage color properly for professional printing.",
                    "When saving to PDF, some settings allow for color conversion, but it's not reliable. It's best to use professional design software."
                ]
            },
            SPOT_COLORS_PRESENT: {
                inDesign: ["Open the <strong>Swatches</strong> panel. Spot colors have a small circle icon.", "If they are not intended for a special ink, double-click the swatch, change 'Color Type' from 'Spot' to 'Process', and ensure 'Color Mode' is CMYK."],
                illustrator: ["In the <strong>Swatches</strong> panel, change the color type from Spot to Process for any swatches that should not be spot colors."],
                word: ["Word does not support spot colors."]
            },
            TAC_EXCEEDED: {
                inDesign: ["Use the <strong>Window &gt; Output &gt; Separations Preview</strong> panel. Set the 'View' to 'Ink Limit'.", "Areas exceeding the limit will be highlighted. Adjust the colors in those areas (usually by reducing CMYK values in Photoshop for images)."],
                illustrator: ["This is harder to check in Illustrator. It's best to ensure your color profiles are set up correctly and that you're using CMYK values that don't exceed the total ink limit."],
                word: ["Not applicable. Word does not provide tools to control Total Area Coverage."]
            },
            RICH_BLACK_TEXT: {
                inDesign: ["Select the text. Check the <strong>Swatches</strong> panel to ensure it is using the '[Black]' swatch (100% K) and not a rich black mix.", "Small text should always be 100% K to avoid registration issues."],
                illustrator: ["Select the text and ensure its fill color is C:0, M:0, Y:0, K:100."],
                word: ["Ensure text color is set to 'Automatic' or the standard black from the palette."]
            },
            HAIRLINE_STROKE: {
                inDesign: ["Select the object with the thin stroke.", "Open the <strong>Stroke</strong> panel and increase the 'Weight' to the minimum required value (e.g., 0.25 pt)."],
                illustrator: ["Select the object.", "Increase the 'Stroke' weight in the <strong>Stroke</strong> panel or the top control bar."],
                word: ["Select the shape or line.", "In the <strong>Shape Format</strong> tab, go to <strong>Shape Outline &gt; Weight</strong> and select a thicker line."]
            },
            UNKNOWN: {
                inDesign: ["An unknown error occurred. Please check the file manually."],
                illustrator: ["An unknown error occurred. Please check the file manually."],
                word: ["An unknown error occurred. Please check the file manually."]
            }
        },
    },
    es: {
        // General
        page: 'Página',
        description: 'Descripción',
        severity: 'Severidad',
        issues: 'Incidencias',
        close: 'Cerrar',
        language: 'Idioma',

        // Header
        preflightProfile: 'Perfil de Preflight',
        exportReport: 'Exportar Informe',
        reportNotAvailable: 'El informe no está disponible hasta que finalice el análisis',
        
        // Profiles
        profile_bw_brochure: 'Folleto B/N',
        profile_color_book: 'Libro Color (Estucado)',
        profile_web_display: 'Pantalla Web',

        // Dropzone
        uploadTitle: 'Arrastra tu PDF aquí para iniciar el preflight',
        uploadSubtitle: 'o haz clic para buscar tus archivos',
        uploadDisabled: 'Este tipo de archivo no es compatible actualmente',
        
        // Analysis States
        analyzing: 'Analizando su documento...',

        // Summary
        summary: 'Resumen',
        preflightScore: 'Puntuación Preflight',
        bleed: 'Sangrado y Márgenes',
        color: 'Color',
        resolution: 'Resolución',
        typography: 'Tipografía',
        ink: 'Tinta',
        transparency: 'Transparencia',
        content: 'Contenido',
        structure: 'Estructura',
        
        // Issues Panel
        noIssuesFound: 'No se encontraron incidencias. ¡Tu archivo está listo para producción!',
        
        // Severities
        Blocker: 'Bloqueante',
        Major: 'Mayor',
        Minor: 'Menor',
        Nit: 'Detalle',
        Info: 'Informativo',
        
        // Fix Drawer
        howToFix: 'Cómo Solucionarlo',
        noIssueSelected: 'Selecciona una incidencia para ver cómo solucionarla.',
        fixInDesign: 'En Adobe InDesign',
        fixIllustrator: 'En Adobe Illustrator',
        fixWord: 'En Microsoft Word',
        
        // Footer Buttons
        analyzeNewPDF: 'Analizar un Nuevo PDF',
        auditWithAI: 'Auditar con IA ✨',

        // AI Modal
        auditing: 'Auditando...',
        aiAuditReport: 'Informe de Auditoría IA',
        aiAnalyzing: 'Phil Preflight está analizando tu informe para darte un resumen útil y recomendaciones. Esto puede tardar un momento...',
        aiError: 'Lo sentimos, la auditoría con IA ha fallado. Por favor, inténtalo de nuevo más tarde.',

        fixSteps: {}, // Leaving this empty for brevity, but a full implementation would translate these.
    },
    fr: {},
    de: {},
};
