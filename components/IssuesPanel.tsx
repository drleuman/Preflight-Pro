



import React from 'react';
import type { Issue, Translations } from '../types';
import { SEVERITY_COLORS, SEVERITY_TEXT_COLORS } from '../constants';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface IssuesPanelProps {
    issues: Issue[];
    onIssueSelect: (issue: Issue) => void;
    selectedIssue: Issue | null;
    t: Translations;
    resolvedIssueIds: Set<string>;
    onToggleIssueResolved: (issueId: string) => void;
}

export const IssuesPanel: React.FC<IssuesPanelProps> = ({ issues, onIssueSelect, selectedIssue, t, resolvedIssueIds, onToggleIssueResolved }) => {
    if (issues.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-full flex flex-col items-center justify-center text-center">
                <CheckBadgeIcon className="w-24 h-24 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t.allClearTitle}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t.noIssuesFound}</p>
            </div>
        );
    }

    const handleCheckboxClick = (e: React.MouseEvent, issueId: string) => {
        e.stopPropagation();
        onToggleIssueResolved(issueId);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex-grow flex flex-col overflow-hidden">
            <h2 className="text-lg font-bold mb-4 flex-shrink-0">{t.issues} ({resolvedIssueIds.size} / {issues.length})</h2>
            <div className="overflow-y-auto -mr-4 pr-4">
                <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-white dark:bg-gray-800">
                        <tr>
                            <th className="py-2 w-10" title={t.resolved}>
                                <span className="sr-only">{t.resolved}</span>
                            </th>
                            <th className="py-2">{t.page}</th>
                            <th className="py-2">{t.description}</th>
                            <th className="py-2">{t.severity}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issues.map(issue => {
                            const isResolved = resolvedIssueIds.has(issue.id);
                            return (
                                <tr
                                    key={issue.id}
                                    onClick={() => onIssueSelect(issue)}
                                    className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150 ${selectedIssue?.id === issue.id ? 'bg-indigo-100 dark:bg-indigo-900/80 text-gray-900 dark:text-gray-100' : ''} ${isResolved ? 'opacity-50' : ''}`}
                                >
                                    <td className="py-2 px-1 text-center" onClick={(e) => handleCheckboxClick(e, issue.id)}>
                                        <input
                                            type="checkbox"
                                            checked={isResolved}
                                            onChange={() => {}} // The onClick on the parent td handles the logic
                                            className="form-checkbox h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            aria-label={`Mark issue as ${isResolved ? 'unresolved' : 'resolved'}`}
                                        />
                                    </td>
                                    <td className={`py-2 px-1 text-center font-mono ${isResolved ? 'line-through' : ''}`}>{issue.page}</td>
                                    <td className={`py-2 px-1 ${isResolved ? 'line-through' : ''}`}>{issue.message}</td>
                                    <td className="py-2 px-1">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${SEVERITY_COLORS[issue.severity]} ${SEVERITY_TEXT_COLORS[issue.severity]}`}>
                                            {t[issue.severity]}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};