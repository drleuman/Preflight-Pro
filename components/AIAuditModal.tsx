import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';
import type { Translations, AIAuditReportData, AIAuditIssue } from '../types';

interface AIAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    reportData: AIAuditReportData | string | null;
    t: Translations;
}

const IssueCard: React.FC<{ issue: AIAuditIssue, t: Translations }> = ({ issue, t }) => (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{issue.issueSummary}</h4>
        <div className="mt-2 pl-3 text-sm text-gray-600 dark:text-gray-300">
            <p><strong className="font-medium text-gray-800 dark:text-gray-200">{t.aiImpact}:</strong> {issue.impact}</p>
            <p className="mt-1"><strong className="font-medium text-gray-800 dark:text-gray-200">{t.aiRecommendation}:</strong> {issue.recommendation}</p>
        </div>
    </div>
);

export const AIAuditModal: React.FC<AIAuditModalProps> = ({ isOpen, onClose, isLoading, reportData, t }) => {

    if (!isOpen) {
        return null;
    }

    const renderReport = () => {
        if (!reportData) return null;
        if (typeof reportData === 'string') {
            return <p className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md">{reportData}</p>;
        }
        
        const report = reportData as AIAuditReportData;
        const score = report.printReadinessScore.score;
        const scoreColor = score > 80 ? 'border-green-500 text-green-500' : score > 50 ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500';
        
        return (
            <div className="space-y-6">
                {/* Score and Summary */}
                <div className="flex flex-col sm:flex-row gap-6 items-start p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className={`w-32 h-32 flex-shrink-0 flex flex-col items-center justify-center rounded-full border-8 ${scoreColor}`}>
                        <span className="text-4xl font-bold">{score}</span>
                        <span className="text-xs font-semibold tracking-wider uppercase">{t.preflightScore}</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.aiOverallAssessment}</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{report.overallAssessment}</p>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">{report.printReadinessScore.rationale}</p>
                    </div>
                </div>
                
                {/* Critical Issues */}
                {report.criticalIssues && report.criticalIssues.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-lg">
                            <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                            {t.aiCriticalIssues}
                        </h3>
                        <div className="mt-2 space-y-3">
                            {report.criticalIssues.map((issue, index) => <IssueCard key={index} issue={issue} t={t} />)}
                        </div>
                    </div>
                )}
                
                {/* Minor Issues */}
                {report.minorIssues && report.minorIssues.length > 0 && (
                     <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-lg">
                            <InformationCircleIcon className="w-6 h-6 text-blue-500" />
                            {t.aiMinorIssues}
                        </h3>
                         <div className="mt-2 space-y-3">
                            {report.minorIssues.map((issue, index) => <IssueCard key={index} issue={issue} t={t} />)}
                        </div>
                    </div>
                )}
                
                {/* Proactive Suggestions */}
                {report.proactiveSuggestions && report.proactiveSuggestions.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-lg">
                            <WrenchScrewdriverIcon className="w-6 h-6 text-indigo-500" />
                            {t.aiProactiveSuggestions}
                        </h3>
                        <ul className="mt-2 list-disc list-inside text-sm space-y-1 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                           {report.proactiveSuggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Dr. Print: {t.aiAuditReport}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        <XMarkIcon className="w-6 h-6" />
                        <span className="sr-only">{t.close}</span>
                    </button>
                </header>
                
                <main className="p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center text-center h-64 space-y-6">
                            <div className="relative inline-flex">
                                <div className="w-24 h-24 bg-indigo-200 dark:bg-indigo-500 rounded-full"></div>
                                <div className="w-24 h-24 bg-indigo-300 dark:bg-indigo-600 rounded-full absolute top-0 left-0 animate-ping opacity-75"></div>
                                <div className="w-24 h-24 bg-indigo-300 dark:bg-indigo-600 rounded-full absolute top-0 left-0 animate-pulse"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <SparklesIcon className="w-12 h-12 text-indigo-600 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t.auditing}</p>
                                <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">{t.aiAnalyzing}</p>
                            </div>
                        </div>
                    ) : (
                        renderReport()
                    )}
                </main>

                <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                     <button
                        onClick={onClose}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {t.close}
                    </button>
                </footer>
            </div>
        </div>
    );
};
