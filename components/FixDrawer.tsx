import React from 'react';
import type { Issue } from '../types';
import { LightBulbIcon, UsersIcon } from '@heroicons/react/24/outline';

interface FixDrawerProps {
    issue: Issue | null;
    t: Record<string, any>;
}

export const FixDrawer: React.FC<FixDrawerProps> = ({ issue, t }) => {
    
    const fix = issue ? t.fixSteps?.[issue.ruleId] : null;

    // Logic to extract font name for FONT_MISSING rule
    let missingFontName: string | null = null;
    if (issue && issue.ruleId === 'FONT_MISSING') {
        const match = issue.message.match(/Font '([^']+)'/);
        if (match && match[1]) {
            missingFontName = match[1];
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-lg font-bold mb-4">{t.howToFix}</h2>
            {issue && fix ? (
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
                    {missingFontName && fix.suggestions && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <UsersIcon className="w-5 h-5 text-indigo-500" />
                                {t.fontFallbackSuggestions || 'Font Fallback Suggestions'}
                            </h3>
                             <ul className="list-disc list-inside mt-2 text-sm space-y-2 text-gray-600 dark:text-gray-300">
                                {fix.suggestions.map((suggestion: string, index: number) => {
                                    const formattedSuggestion = suggestion.replace('{fontName}', `<strong>${missingFontName}</strong>`);
                                    return <li key={index} dangerouslySetInnerHTML={{ __html: formattedSuggestion }}></li>;
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <LightBulbIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    <p className="mt-4 text-gray-500 dark:text-gray-400">{t.noIssueSelected}</p>
                </div>
            )}
        </div>
    );
};