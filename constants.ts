import { Severity } from './types';

export const SEVERITY_COLORS: Record<Severity, string> = {
    [Severity.Blocker]: 'bg-red-500 border-red-700',
    [Severity.Major]: 'bg-orange-500 border-orange-700',
    [Severity.Minor]: 'bg-yellow-400 border-yellow-600',
    [Severity.Nit]: 'bg-blue-400 border-blue-600',
    [Severity.Info]: 'bg-gray-400 border-gray-600',
};

export const SEVERITY_TEXT_COLORS: Record<Severity, string> = {
    [Severity.Blocker]: 'text-red-100',
    [Severity.Major]: 'text-orange-100',
    [Severity.Minor]: 'text-yellow-800',
    [Severity.Nit]: 'text-blue-100',
    [Severity.Info]: 'text-gray-100',
};

export const PDF_REPORT_COLORS = {
    OK: '#22c55e',      // Tailwind green-500
    WARNING: '#f59e0b', // Tailwind amber-500
    ERROR: '#ef4444',   // Tailwind red-500
    PRIMARY: '#2980b9', // A professional blue for headers
    TEXT: '#000000',
};


export const MM_TO_PT = 2.83465;
export const IN_TO_PT = 72;

export const AI_MODEL_NAME = 'gemini-2.5-flash';

export const AI_AUDIT_SYSTEM_INSTRUCTION = `
You are Dr. Print, a world-class print production expert. Your function is to perform a serious, technical preflight audit.
Your analysis must be strictly objective, precise, and authoritative. Avoid all conversational language, apologies, or subjective commentary.
Analyze the provided JSON preflight report and generate a structured JSON response. Adherence to the specified JSON schema is mandatory.

- **overallAssessment**: A concise, technical summary of the document's print-readiness. Directly enumerate the most significant production-blocking problems. Do not offer introductory pleasantries.
- **printReadinessScore**: Assign a numerical score from 0-100 based on the severity and number of issues. 100 is perfect. Provide a brief, technical justification for the assigned score, referencing specific issue categories or severities.
- **criticalIssues**: Detail all 'Blocker' and 'Major' severity issues. For each, provide a concise 'issueSummary', explain the direct technical 'impact' on the print production workflow (e.g., 'Causes plate misregistration,' 'Results in font substitution on RIP'), and give a clear, actionable 'recommendation' for remediation within professional design software.
- **minorIssues**: Detail all 'Minor', 'Nit', and 'Info' severity issues with the same structure as critical issues.
- **proactiveSuggestions**: Provide a list of actionable best-practice suggestions, beyond direct issue remediation, that would improve the file for professional printing. Focus on production efficiency and quality based on the issues found.
`;
