
import { Severity, IssueCategory } from './types';

export const SEVERITY_COLORS: Record<Severity, string> = {
  [Severity.INFO]: 'text-blue-600 bg-blue-100',
  [Severity.WARNING]: 'text-orange-600 bg-orange-100',
  [Severity.ERROR]: 'text-red-600 bg-red-100',
};

export const SEVERITY_ICONS: Record<Severity, string> = {
  [Severity.INFO]: 'ℹ️',
  [Severity.WARNING]: '⚠️',
  [Severity.ERROR]: '⛔',
};

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  [IssueCategory.IMAGES]: 'Images',
  [IssueCategory.COLOR]: 'Color Spaces',
  [IssueCategory.FONTS]: 'Fonts',
  [IssueCategory.METADATA]: 'Metadata',
  [IssueCategory.TRANSPARENCY]: 'Transparency',
  [IssueCategory.BLEED_MARGINS]: 'Bleed & Margins',
  [IssueCategory.RESOLUTION]: 'Resolution',
  [IssueCategory.COMPLIANCE]: 'Compliance',
};
