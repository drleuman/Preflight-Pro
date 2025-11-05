
import { PreflightResult, Issue, Severity, IssueCategory, Bbox, FileMeta, CategorySummary } from '../types';

interface PreflightProfile {
  name: string;
  description: string;
  analyze: (fileMeta: FileMeta, pageCount: number) => PreflightResult;
}

export const defaultProfile: PreflightProfile = {
  name: 'Standard Print Preflight',
  description: 'Checks common issues for standard print production.',
  analyze: (fileMeta: FileMeta, pageCount: number): PreflightResult => {
    const issues: Issue[] = [
      {
        id: 'img-res-low-1',
        page: 1,
        bbox: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 },
        severity: Severity.WARNING,
        category: IssueCategory.IMAGES,
        message: 'Low resolution image detected (72 DPI). May appear pixelated in print.',
        details: 'Image "header_logo.png" on page 1 has a resolution of 72 DPI, which is below the recommended 300 DPI for print. Consider replacing with a higher resolution version.',
      },
      {
        id: 'color-rgb-2',
        page: 2,
        bbox: { x: 0.5, y: 0.4, width: 0.2, height: 0.1 },
        severity: Severity.ERROR,
        category: IssueCategory.COLOR,
        message: 'RGB color space found. Convert to CMYK for print.',
        details: 'An object on page 2 uses RGB color (e.g., text block or graphic), which is not suitable for CMYK printing and may result in unexpected color shifts. Convert all colors to CMYK.',
      },
      {
        id: 'font-missing-3',
        page: 3,
        severity: Severity.ERROR,
        category: IssueCategory.FONTS,
        message: 'Font "HelveticaNeue-Bold" missing/not embedded.',
        details: 'The font "HelveticaNeue-Bold" used on page 3 is not embedded in the PDF. This can lead to font substitution and text reflow on different systems. Embed all fonts or convert text to outlines.',
      },
      {
        id: 'bleed-missing-4',
        page: 4,
        bbox: { x: 0.0, y: 0.0, width: 1.0, height: 1.0 },
        severity: Severity.WARNING,
        category: IssueCategory.BLEED_MARGINS,
        message: 'Insufficient bleed for full-page background image.',
        details: 'The background image on page 4 extends to the edge of the page but does not have the required 3mm bleed. This increases the risk of white edges after trimming. Extend the image to include bleed.',
      },
      {
        id: 'meta-title-5',
        page: 1,
        severity: Severity.INFO,
        category: IssueCategory.METADATA,
        message: 'Document title not set.',
        details: 'The PDF metadata does not include a document title. While not critical for print, it can improve document management and accessibility.',
      },
      {
        id: 'img-trans-5',
        page: 5,
        bbox: { x: 0.6, y: 0.7, width: 0.3, height: 0.2 },
        severity: Severity.WARNING,
        category: IssueCategory.TRANSPARENCY,
        message: 'Complex transparency effect found. May cause flattening issues.',
        details: 'A drop shadow on page 5 involves complex transparency that could cause flattening artifacts on older RIPs. Consider simplifying or rasterizing the effect.',
      },
      {
        id: 'color-spot-2',
        page: 2,
        bbox: { x: 0.2, y: 0.6, width: 0.15, height: 0.1 },
        severity: Severity.INFO,
        category: IssueCategory.COLOR,
        message: 'Spot color "Pantone 286 C" detected.',
        details: 'The document contains a spot color (Pantone 286 C). Confirm with the printer if spot colors are part of the print job and if the specific Pantone ink is available.',
      },
      {
        id: 'res-text-6',
        page: 1,
        bbox: { x: 0.7, y: 0.05, width: 0.2, height: 0.05 },
        severity: Severity.ERROR,
        category: IssueCategory.RESOLUTION,
        message: 'Small text size. May be unreadable.',
        details: 'Text in the footer on page 1 is set at 6pt. This is generally too small for legibility in print. Increase font size to at least 8pt.',
      },
      {
        id: 'img-res-low-7',
        page: 3,
        bbox: { x: 0.1, y: 0.7, width: 0.4, height: 0.25 },
        severity: Severity.ERROR,
        category: IssueCategory.IMAGES,
        message: 'Image resolution critically low (50 DPI). Will be very pixelated.',
        details: 'Image "product_shot.jpg" on page 3 has a resolution of 50 DPI, which is critically low for print and will result in significant pixelation. It MUST be replaced with a 300+ DPI image.',
      },
      {
        id: 'compliance-8',
        page: 2,
        severity: Severity.INFO,
        category: IssueCategory.COMPLIANCE,
        message: 'PDF/X-1a compliance recommended for print.',
        details: 'The document is not in PDF/X-1a format, which is a common standard for reliable print exchange. While not always mandatory, converting to PDF/X-1a ensures consistent output.',
      },
    ];

    // Filter issues to only include those on existing pages (mock `pageCount`)
    const filteredIssues = issues.filter(issue => issue.page <= pageCount);

    const score = Math.max(0, 100 - filteredIssues.filter(i => i.severity === Severity.ERROR).length * 20 - filteredIssues.filter(i => i.severity === Severity.WARNING).length * 5);
    const summary = filteredIssues.length === 0
      ? `Your PDF "${fileMeta.name}" passed all preflight checks with a perfect score. Ready for print!`
      : `Preflight check for "${fileMeta.name}" identified ${filteredIssues.length} potential issues. Review them carefully.`;

    const categorySummaries: CategorySummary[] = Object.values(IssueCategory).map(category => {
      const categoryIssues = filteredIssues.filter(issue => issue.category === category);
      const severityCounts: { [S in Severity]?: number } = {};
      categoryIssues.forEach(issue => {
        severityCounts[issue.severity] = (severityCounts[issue.severity] || 0) + 1;
      });
      return {
        category,
        count: categoryIssues.length,
        severityCounts,
      };
    }).filter(s => s.count > 0); // Only include categories with issues

    return {
      score,
      summary,
      issues: filteredIssues,
      categorySummaries,
    };
  },
};
