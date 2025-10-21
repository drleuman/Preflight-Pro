import React from 'react';
import type { Issue, Translations } from '../types';
import { LightBulbIcon, UsersIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface FixDrawerProps {
    issue: Issue | null;
    t: Translations;
    resolvedIssueIds: Set<string>;
    onToggleIssueResolved: (issueId: string) => void;
}

export const FixDrawer: React.FC<FixDrawerProps> = ({ issue, t, resolvedIssueIds, onToggleIssueResolved }) => {

    if (!issue) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-full flex flex-col">
                <h2 className="text-lg font-bold mb-4">{t.howToFix}</h2>
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <LightBulbIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    <p className="mt-4 text-gray-500 dark:text-gray-400">{t.noIssueSelected}</p>
                </div>
            </div>
        );
    }

    const isResolved = resolvedIssueIds.has(issue.id);

    // Safely check if the ruleId exists as a key in fixSteps before accessing it.
    // This prevents runtime errors for issues that may not have defined fix instructions (e.g., 'UNKNOWN').
    const fix = issue.ruleId in t.fixSteps ? t.fixSteps[issue.ruleId as keyof typeof t.fixSteps] : null;
    
    if (!fix) {
        return (
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-full flex flex-col">
                <h2 className="text-lg font-bold mb-4">{t.howToFix}</h2>
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <LightBulbIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    <p className="mt-4 text-gray-500 dark:text-gray-400">No specific fix instructions are available for this issue.</p>
                </div>
            </div>
        );
    }
    
    // Logic to extract font name and suggestions for FONT_MISSING rule
    let missingFontName: string | null = null;
    const suggestions = 'suggestions' in fix && Array.isArray(fix.suggestions) ? fix.suggestions : null;

    if (issue.ruleId === 'FONT_MISSING' && suggestions) {
        const match = issue.message.match(/Font '([^']+)'/);
        if (match && match[1]) {
            missingFontName = match[1];
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold">{t.howToFix}</h2>
                <button
                    onClick={() => onToggleIssueResolved(issue.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors ${isResolved ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-200 dark:hover:bg-green-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                >
                    {isResolved ? <CheckCircleSolidIcon className="w-4 h-4 text-green-600 dark:text-green-400" /> : <CheckCircleIcon className="w-4 h-4" />}
                    {isResolved ? t.markAsUnresolved : t.markAsResolved}
                </button>
            </div>
            <div className="overflow-y-auto">
                {/* Standard fix steps */}
                <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t.fixInDesign}</h3>
                    <ul className="list-decimal list-inside mt-2 text-sm space-y-2 text-gray-600 dark:text-gray-300">
                        {fix.inDesign.map((step: string, index: number) => <li key={index} dangerouslySetInnerHTML={{ __html: step }}></li>)}
                    </ul>
                </div>
                <div className="my-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t.fixIllustrator}</h3>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-2 text-gray-600 dark:text-gray-300">
                        {fix.illustrator.map((step: string, index: number) => <li key={index} dangerouslySetInnerHTML={{ __html: step }}></li>)}
                    </ul>
                </div>
                <div className="my-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t.fixWord}</h3>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-2 text-gray-600 dark:text-gray-300">
                        {fix.word.map((step: string, index: number) => <li key={index} dangerouslySetInnerHTML={{ __html: step }}></li>)}
                    </ul>
                </div>
                
                {/* Font fallback suggestions */}
                {suggestions && (
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <UsersIcon className="w-5 h-5 text-indigo-500" />
                            {t.fontFallbackSuggestions || 'Font Fallback Suggestions'}
                        </h3>
                        <ul className="list-disc list-inside mt-2 text-sm space-y-2 text-gray-600 dark:text-gray-300">
                            {suggestions.map((suggestion: string, index: number) => {
                                const formattedSuggestion = missingFontName 
                                    ? suggestion.replace('{fontName}', `<strong>${missingFontName}</strong>`)
                                    : suggestion;
                                return <li key={index} dangerouslySetInnerHTML={{ __html: formattedSuggestion }}></li>;
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};