
/**
 * Severity levels for preflight issues.
 * 'info': Minor suggestion, good practice.
 * 'warning': Potential problem, might need attention.
 * 'error': Critical issue, must be fixed before printing.
 */
export enum Severity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Categories for preflight issues.
 */
export enum IssueCategory {
  IMAGES = 'images',
  COLOR = 'color',
  FONTS = 'fonts',
  METADATA = 'metadata',
  TRANSPARENCY = 'transparency',
  BLEED_MARGINS = 'bleed_margins',
  RESOLUTION = 'resolution',
  COMPLIANCE = 'compliance',
}

/**
 * Bounding box coordinates and dimensions.
 * Values are normalized (0 to 1) relative to the page dimensions.
 */
export interface Bbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Represents a single preflight issue found in the PDF.
 */
export interface Issue {
  id: string;
  page: number; // 1-based page number
  bbox?: Bbox; // Optional bounding box for visual indication
  severity: Severity;
  category: IssueCategory;
  message: string;
  details?: string; // More detailed explanation of the issue
}

/**
 * Summary of a preflight check for a specific category.
 */
export interface CategorySummary {
  category: IssueCategory;
  count: number;
  severityCounts: {
    [Severity.INFO]?: number;
    [Severity.WARNING]?: number;
    [Severity.ERROR]?: number;
  };
}

/**
 * The overall result of a PDF preflight analysis.
 */
export interface PreflightResult {
  score: number; // Overall score (0-100), higher is better
  summary: string; // A brief overall summary of the findings
  issues: Issue[];
  categorySummaries: CategorySummary[];
}

/**
 * Metadata about the analyzed file.
 */
export interface FileMeta {
  name: string;
  size: number;
  type: string;
}

/**
 * Messages sent from the main thread to the worker.
 */
export type PreflightWorkerCommand =
  | { type: 'analyze'; fileMeta: FileMeta; samplePageCount: number; };

/**
 * Messages sent from the worker to the main thread.
 */
export type PreflightWorkerMessage =
  | { type: 'analysisResult'; result: PreflightResult; }
  | { type: 'analysisError'; message: string; };

/**
 * Props for a modal component.
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}
