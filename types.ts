import { translations } from './i18n/translations';

export enum Severity {
    Blocker = 'Blocker',
    Major = 'Major',
    Minor = 'Minor',
    Nit = 'Nit',
    Info = 'Info',
}

export type RuleID =
    | 'FILE_ENCRYPTED'
    | 'BLEED_MISSING'
    | 'BOX_INCONSISTENT'
    | 'SAFE_MARGIN_VIOLATION'
    | 'LOW_PPI_COLOR'
    | 'LOW_PPI_GRAYSCALE'
    | 'LOW_PPI_LINEART'
    | 'RGB_OBJECTS'
    | 'SPOT_COLORS_PRESENT'
    | 'TAC_EXCEEDED'
    | 'RICH_BLACK_TEXT'
    | 'REGISTRATION_COLOR_USED'
    | 'BLACK_OVERPRINT_MISSING'
    | 'WHITE_OVERPRINT'
    | 'TRANSPARENCY_DETECTED'
    | 'FONT_MISSING'
    | 'FONT_TYPE3'
    | 'FONT_FAUX_STYLE'
    | 'HAIRLINE_STROKE'
    | 'ANNOTATIONS_PRESENT'
    | 'PAGE_COUNT_INVALID'
    | 'PAGE_SIZE_MIXED'
    | 'UNKNOWN';

export interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface FixSteps {
    inDesign: string[];
    illustrator: string[];
    word: string[];
    suggestions?: string[];
}

export interface Issue {
    id: string;
    ruleId: RuleID;
    page: number;
    bbox?: BBox;
    severity: Severity;
    confidence: number;
    message: string;
    details?: string;
}

export interface SummaryCard {
    id: 'bleed' | 'color' | 'resolution' | 'typography' | 'ink' | 'transparency' | 'content' | 'structure';
    title: string;
    status: 'ok' | 'warning' | 'error';
    issueCount: number;
}

export interface PreflightResult {
    issues: Issue[];
    summary: SummaryCard[];
    score: number;
    pageCount: number;
}

export interface PreflightProfile {
    id: string;
    name: string;
    bleed: number; // in mm
    safeMargin: number; // in mm
    minPpiColor: number;
    minPpiGrayscale: number;
    minPpiLineart: number;
    allowRgb: boolean;
    allowSpot: boolean;
    maxTac: number;
    minHairline: number; // in pt
    requireBlackOverprint: boolean;
    disallowWhiteOverprint: boolean;
    allowTransparency: boolean; // if false, recommends PDF/X-1a
    allowAnnotations: boolean;
    requireEvenPages: boolean;
}

export interface AIAuditIssue {
    issueSummary: string;
    impact: string;
    recommendation: string;
}

export interface AIAuditReportData {
    overallAssessment: string;
    printReadinessScore: {
        score: number;
        rationale: string;
    };
    criticalIssues: AIAuditIssue[];
    minorIssues: AIAuditIssue[];
    proactiveSuggestions: string[];
}

export type Translations = typeof translations;
