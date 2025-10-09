import type { Translations } from '../types';

export const translations: Translations = {
  en: {
    // Severities
    Blocker: 'Blocker',
    Major: 'Major',
    Minor: 'Minor',
    Nit: 'Nit',
    Info: 'Info',

    // Header
    preflightProfile: 'Preflight Profile',
    language: 'Language',
    exportReport: 'Export Report',
    reportNotAvailable: 'Report not available until analysis is complete.',
    profile_bw_brochure: 'B&W Brochure',
    profile_color_book: 'Color Book (Coated)',
    profile_web_display: 'Web Display',

    // Dropzone
    uploadTitle: 'Drag & Drop PDF File Here',
    uploadSubtitle: 'or click to select a file to analyze',
    uploadDisabled: 'This file type is not currently supported.',

    // Analysis
    analyzing: 'Analyzing PDF...',

    // Summary
    summary: 'Summary',
    preflightScore: 'Preflight Score',
    issues: 'issues',
    bleed: 'Bleed',
    color: 'Color',
    resolution: 'Resolution',
    typography: 'Typography',
    ink: 'Ink',
    transparency: 'Transparency',
    content: 'Content',
    structure: 'Structure',

    // Issues Panel
    noIssuesFound: 'No issues found. The document is ready for production.',
    page: 'Page',
    description: 'Description',
    severity: 'Severity',
    
    // Main Controls
    analyzeNewPDF: 'Analyze New PDF',
    auditWithAI: 'Audit with AI',
    auditing: 'Auditing...',

    // Fix Drawer
    howToFix: 'How to Fix',
    noIssueSelected: 'Select an issue from the list to see how to fix it.',
    fixInDesign: 'InDesign',
    fixIllustrator: 'Illustrator',
    fixWord: 'Microsoft Word',

    // AI Modal
    aiAuditReport: 'AI Audit Report',
    aiAnalyzing: 'Phil is analyzing your report. This may take a moment...',
    aiError: 'Sorry, the AI audit failed. Please try again later.',
    close: 'Close',

    // Fix Steps
    fixSteps: {
      BLEED_MISSING: {
        inDesign: [
          'Go to <code>File &gt; Document Setup...</code>',
          'Under "Bleed and Slug", enter the required bleed amount (e.g., 3mm) in all fields.',
          'Ensure that all artwork intended to reach the edge of the page extends to the bleed line.'
        ],
        illustrator: [
          'Go to <code>File &gt; Document Setup...</code>',
          'Set the "Bleed" values to the required amount.',
          'Extend your artwork to cover the bleed area.'
        ],
        word: [
          'Microsoft Word does not have professional bleed support. It is recommended to set a larger page size (e.g., A4 page size for an A4 document + 6mm width/height) and manually place content.',
          'Alternatively, export to PDF and use a tool like Adobe Acrobat Pro to add bleed.'
        ]
      },
      BOX_INCONSISTENT: {
        inDesign: [
          'Open the <strong>Pages</strong> panel (<code>Window &gt; Pages</code>).',
          'Use the <strong>Page Tool</strong> (Shift+P) to select the page with the incorrect size.',
          'In the top Control panel, adjust the page dimensions to match the rest of the document.',
          'Review the layout on the adjusted page, as elements may have shifted.'
        ],
        illustrator: [
            'Use the <strong>Artboard Tool</strong> (Shift+O).',
            'Select the artboard with the incorrect size and adjust its dimensions in the Properties or Control panel.'
        ],
        word: [
            'Word does not allow mixed page sizes within the same section.',
            'You must create section breaks and apply different page sizes to each section, which is highly error-prone.'
        ]
      }
    }
  },
  es: {
    // Severities
    Blocker: 'Bloqueador',
    Major: 'Mayor',
    Minor: 'Menor',
    Nit: 'Detalle',
    Info: 'Info',

    // Header
    preflightProfile: 'Perfil de Verificación previa',
    language: 'Idioma',
    exportReport: 'Exportar Informe',
    reportNotAvailable: 'El informe no está disponible hasta que se complete el análisis.',
    profile_bw_brochure: 'Folleto B/N',
    profile_color_book: 'Libro Color (Estucado)',
    profile_web_display: 'Visualización Web',

    // Dropzone
    uploadTitle: 'Arrastra y Suelta el Archivo PDF Aquí',
    uploadSubtitle: 'o haz clic para seleccionar un archivo para analizar',
    uploadDisabled: 'Este tipo de archivo no es compatible actualmente.',

    // Analysis
    analyzing: 'Analizando PDF...',

    // Summary
    summary: 'Resumen',
    preflightScore: 'Puntuación de Verificación previa',
    issues: 'problemas',
    bleed: 'Sangrado',
    color: 'Color',
    resolution: 'Resolución',
    typography: 'Tipografía',
    ink: 'Tinta',
    transparency: 'Transparencia',
    content: 'Contenido',
    structure: 'Estructura',

    // Issues Panel
    noIssuesFound: 'No se encontraron problemas. El documento está listo para producción.',
    page: 'Página',
    description: 'Descripción',
    severity: 'Gravedad',
    
    // Main Controls
    analyzeNewPDF: 'Analizar Nuevo PDF',
    auditWithAI: 'Auditar con IA',
    auditing: 'Auditando...',

    // Fix Drawer
    howToFix: 'Cómo Solucionar',
    noIssueSelected: 'Selecciona un problema de la lista para ver cómo solucionarlo.',
    fixInDesign: 'InDesign',
    fixIllustrator: 'Illustrator',
    fixWord: 'Microsoft Word',

    // AI Modal
    aiAuditReport: 'Informe de Auditoría IA',
    aiAnalyzing: 'Phil está analizando tu informe. Esto puede tomar un momento...',
    aiError: 'Lo sentimos, la auditoría de IA falló. Por favor, inténtalo de nuevo más tarde.',
    close: 'Cerrar',

    // Fix Steps
    fixSteps: {
      BLEED_MISSING: {
        inDesign: [
          'Ve a <code>Archivo &gt; Configuración de Documento...</code>',
          'Bajo "Sangrado y Anotaciones", introduce la cantidad de sangrado requerida (ej. 3mm) en todos los campos.',
          'Asegúrate de que todo el arte que deba llegar al borde de la página se extienda hasta la línea de sangrado.'
        ],
        illustrator: [
          'Ve a <code>Archivo &gt; Configuración de Documento...</code>',
          'Establece los valores de "Sangrado" a la cantidad requerida.',
          'Extiende tu arte para cubrir el área de sangrado.'
        ],
        word: [
          'Microsoft Word no tiene soporte profesional para sangrado. Se recomienda establecer un tamaño de página más grande y colocar el contenido manualmente.',
          'Alternativamente, exporta a PDF y usa una herramienta como Adobe Acrobat Pro para añadir sangrado.'
        ]
      },
      BOX_INCONSISTENT: {
        inDesign: [
            'Abre el panel <strong>Páginas</strong> (<code>Ventana &gt; Páginas</code>).',
            'Usa la herramienta <strong>Página</strong> (Mayús+P) para seleccionar la página con el tamaño incorrecto.',
            'En el panel de Control en la parte superior, ajusta las dimensiones de la página para que coincidan con el resto del documento.',
            'Revisa el diseño en la página ajustada, ya que los elementos pueden haberse desplazado.'
        ],
        illustrator: [
            'Usa la herramienta <strong>Mesa de trabajo</strong> (Mayús+O).',
            'Selecciona la mesa de trabajo con el tamaño incorrecto y ajusta sus dimensiones en el panel de Propiedades o de Control.'
        ],
        word: [
            'Word no permite tamaños de página mixtos dentro de la misma sección.',
            'Tendrás que crear saltos de sección y aplicar diferentes tamaños de página a cada sección, lo cual es muy propenso a errores.'
        ]
      }
    }
  },
  fr: {
    // Severities
    Blocker: 'Bloquant',
    Major: 'Majeur',
    Minor: 'Mineur',
    Nit: 'Détail',
    Info: 'Info',

    // Header
    preflightProfile: 'Profil de Contrôle en Amont',
    language: 'Langue',
    exportReport: 'Exporter le Rapport',
    reportNotAvailable: "Le rapport n'est disponible qu'une fois l'analyse terminée.",
    profile_bw_brochure: 'Brochure N&B',
    profile_color_book: 'Livre Couleur (Couché)',
    profile_web_display: 'Affichage Web',

    // Dropzone
    uploadTitle: 'Glissez-Déposez le Fichier PDF Ici',
    uploadSubtitle: 'ou cliquez pour sélectionner un fichier à analyser',
    uploadDisabled: "Ce type de fichier n'est pas pris en charge actuellement.",

    // Analysis
    analyzing: 'Analyse du PDF en cours...',

    // Summary
    summary: 'Résumé',
    preflightScore: 'Score de Contrôle',
    issues: 'problèmes',
    bleed: 'Fond Perdu',
    color: 'Couleur',
    resolution: 'Résolution',
    typography: 'Typographie',
    ink: 'Encre',
    transparency: 'Transparence',
    content: 'Contenu',
    structure: 'Structure',

    // Issues Panel
    noIssuesFound: 'Aucun problème trouvé. Le document est prêt pour la production.',
    page: 'Page',
    description: 'Description',
    severity: 'Sévérité',
    
    // Main Controls
    analyzeNewPDF: 'Analyser un Nouveau PDF',
    auditWithAI: 'Auditer avec l\'IA',
    auditing: 'Audit en cours...',

    // Fix Drawer
    howToFix: 'Comment Corriger',
    noIssueSelected: 'Sélectionnez un problème dans la liste pour voir comment le corriger.',
    fixInDesign: 'InDesign',
    fixIllustrator: 'Illustrator',
    fixWord: 'Microsoft Word',

    // AI Modal
    aiAuditReport: "Rapport d'Audit IA",
    aiAnalyzing: 'Phil analyse votre rapport. Cela peut prendre un moment...',
    aiError: "Désolé, l'audit par l'IA a échoué. Veuillez réessayer plus tard.",
    close: 'Fermer',

    // Fix Steps
    fixSteps: {
      BLEED_MISSING: {
        inDesign: [
          'Allez à <code>Fichier &gt; Format de document...</code>',
          'Sous "Fond perdu et ligne-bloc", entrez la valeur de fond perdu requise (par ex. 3mm).',
          "Assurez-vous que les illustrations s'étendent jusqu'à la ligne de fond perdu."
        ],
        illustrator: [
          'Allez à <code>Fichier &gt; Format de document...</code>',
          'Définissez les valeurs de "Fond perdu" requises.',
          'Étendez vos illustrations pour couvrir la zone de fond perdu.'
        ],
        word: [
          "Microsoft Word ne gère pas le fond perdu de manière professionnelle. Il est recommandé de définir un format de page plus grand.",
          'Sinon, exportez en PDF et utilisez un outil comme Adobe Acrobat Pro pour ajouter le fond perdu.'
        ]
      },
      BOX_INCONSISTENT: {
        inDesign: [
          'Ouvrez le panneau <strong>Pages</strong> (<code>Fenêtre &gt; Pages</code>).',
          'Utilisez l\'<strong>Outil Page</strong> (Maj+P) pour sélectionner la page de taille incorrecte.',
          'Dans le panneau de contrôle supérieur, ajustez les dimensions de la page pour qu\'elles correspondent au reste du document.',
          'Vérifiez la mise en page sur la page ajustée, car des éléments ont pu se déplacer.'
        ],
        illustrator: [
            'Utilisez l\'<strong>Outil Plan de travail</strong> (Maj+O).',
            'Sélectionnez le plan de travail de taille incorrecte et ajustez ses dimensions dans le panneau Propriétés ou Contrôle.'
        ],
        word: [
            'Word ne permet pas des tailles de page mixtes dans la même section.',
            'Vous devez créer des sauts de section et appliquer différentes tailles de page à chaque section, ce qui est très sujet aux erreurs.'
        ]
      }
    }
  },
  de: {
    // Severities
    Blocker: 'Blocker',
    Major: 'Schwerwiegend',
    Minor: 'Geringfügig',
    Nit: 'Detail',
    Info: 'Info',

    // Header
    preflightProfile: 'Preflight-Profil',
    language: 'Sprache',
    exportReport: 'Bericht exportieren',
    reportNotAvailable: 'Bericht erst nach Abschluss der Analyse verfügbar.',
    profile_bw_brochure: 'S/W-Broschüre',
    profile_color_book: 'Farbbuch (Gestrichen)',
    profile_web_display: 'Web-Anzeige',

    // Dropzone
    uploadTitle: 'PDF-Datei hierher ziehen',
    uploadSubtitle: 'oder klicken Sie, um eine Datei zur Analyse auszuwählen',
    uploadDisabled: 'Dieser Dateityp wird derzeit nicht unterstützt.',

    // Analysis
    analyzing: 'PDF wird analysiert...',

    // Summary
    summary: 'Zusammenfassung',
    preflightScore: 'Preflight-Ergebnis',
    issues: 'probleme',
    bleed: 'Beschnitt',
    color: 'Farbe',
    resolution: 'Auflösung',
    typography: 'Typografie',
    ink: 'Druckfarbe',
    transparency: 'Transparenz',
    content: 'Inhalt',
    structure: 'Struktur',

    // Issues Panel
    noIssuesFound: 'Keine Probleme gefunden. Das Dokument ist produktionsbereit.',
    page: 'Seite',
    description: 'Beschreibung',
    severity: 'Schweregrad',
    
    // Main Controls
    analyzeNewPDF: 'Neues PDF analysieren',
    auditWithAI: 'Mit KI prüfen',
    auditing: 'Prüfung läuft...',

    // Fix Drawer
    howToFix: 'Wie beheben',
    noIssueSelected: 'Wählen Sie ein Problem aus der Liste aus, um eine Lösung zu sehen.',
    fixInDesign: 'InDesign',
    fixIllustrator: 'Illustrator',

    fixWord: 'Microsoft Word',

    // AI Modal
    aiAuditReport: 'KI-Prüfbericht',
    aiAnalyzing: 'Phil analysiert Ihren Bericht. Dies kann einen Moment dauern...',
    aiError: 'Leider ist die KI-Prüfung fehlgeschlagen. Bitte versuchen Sie es später erneut.',
    close: 'Schließen',

    // Fix Steps
    fixSteps: {
      BLEED_MISSING: {
        inDesign: [
          'Gehen Sie zu <code>Datei &gt; Dokument einrichten...</code>',
          'Geben Sie unter "Anschnitt und Infobereich" den erforderlichen Beschnitt ein (z.B. 3mm).',
          'Stellen Sie sicher, dass alle Grafiken, die bis zum Rand reichen sollen, bis zur Beschnittlinie reichen.'
        ],
        illustrator: [
          'Gehen Sie zu <code>Datei &gt; Dokument einrichten...</code>',
          'Stellen Sie die "Anschnitt"-Werte auf den erforderlichen Betrag ein.',
          'Erweitern Sie Ihre Grafik, um den Beschnittbereich abzudecken.'
        ],
        word: [
          'Microsoft Word bietet keine professionelle Unterstützung für den Beschnitt. Es wird empfohlen, eine größere Seitengröße festzulegen.',
          'Alternativ können Sie als PDF exportieren und ein Werkzeug wie Adobe Acrobat Pro verwenden, um den Beschnitt hinzuzufügen.'
        ]
      },
      BOX_INCONSISTENT: {
        inDesign: [
          'Öffnen Sie das <strong>Seiten</strong>-Bedienfeld (<code>Fenster &gt; Seiten</code>).',
          'Verwenden Sie das <strong>Seiten-Werkzeug</strong> (Umschalttaste+P), um die Seite mit der falschen Größe auszuwählen.',
          'Passen Sie im oberen Steuerungsbedienfeld die Seitenabmessungen an, damit sie mit dem Rest des Dokuments übereinstimmen.',
          'Überprüfen Sie das Layout auf der angepassten Seite, da sich Elemente verschoben haben könnten.'
        ],
        illustrator: [
            'Verwenden Sie das <strong>Zeichenflächen-Werkzeug</strong> (Umschalttaste+O).',
            'Wählen Sie die Zeichenfläche mit der falschen Größe aus und passen Sie ihre Abmessungen im Eigenschaften- oder Steuerungsbedienfeld an.'
        ],
        word: [
            'Word erlaubt keine gemischten Seitengrößen innerhalb desselben Abschnitts.',
            'Sie müssen Abschnittsumbrüche erstellen und auf jeden Abschnitt unterschiedliche Seitengrößen anwenden, was sehr fehleranfällig ist.'
        ]
      }
    }
  }
};