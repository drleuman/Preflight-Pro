

import React from 'react';
import type { SummaryCard, Translations } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface PreflightSummaryProps {
    summary: SummaryCard[];
    score: number;
    t: Translations;
    totalIssues: number;
    resolvedIssuesCount: number;
}

const statusIcons: Record<SummaryCard['status'], React.ElementType> = {
    ok: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    error: XCircleIcon,
};

const statusColors: Record<SummaryCard['status'], string> = {
    ok: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
};

export const PreflightSummary: React.FC<PreflightSummaryProps> = ({ summary, score, t, totalIssues, resolvedIssuesCount }) => {
    const scoreColor = score > 80 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-4">{t.summary}</h2>
            <div className="text-center mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.preflightScore}</p>
                <p className={`text-6xl font-bold ${scoreColor}`}>{score.toFixed(0)}</p>
                {totalIssues > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        {t.issuesResolved
                            .replace('{resolvedCount}', String(resolvedIssuesCount))
                            .replace('{totalCount}', String(totalIssues))
                        }
                    </p>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2">
                {summary.map(card => {
                    const Icon = statusIcons[card.status];
                    return (
                        <div key={card.id} className={`p-2 rounded-md flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border-l-4 ${card.status === 'ok' ? 'border-green-500' : card.status === 'warning' ? 'border-yellow-500' : 'border-red-500'}`}>
                            <Icon className={`w-6 h-6 ${statusColors[card.status]}`} />
                            <div>
                                <p className="text-sm font-semibold">{t[card.id]}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{card.issueCount} {t.issues}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};