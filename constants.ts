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

export const MM_TO_PT = 2.83465;
export const IN_TO_PT = 72;