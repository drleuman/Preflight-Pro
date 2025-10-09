
import React from 'react';
import type { Issue } from '../types';
import { LightBulbIcon } from '@heroicons/react/24/outline';

interface FixDrawerProps {
    issue: Issue | null;
    t: Record<string, any>;
}

export const FixDrawer: React.FC<FixDrawerProps> = ({ issue, t }) => {
    
    const fix = issue ? t.fixSteps?.[issue.ruleId] : null;

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-lg font-bold mb-4">{t.howToFix}</h2>
            {issue && fix ? (
                <div className="overflow-y-auto">
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