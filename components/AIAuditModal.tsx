
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    report: string;
    // Fix: Loosen type to allow nested objects in translations
    t: Record<string, any>;
}

export const AIAuditModal: React.FC<AIAuditModalProps> = ({ isOpen, onClose, isLoading, report, t }) => {

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold">{t.aiAuditReport}</h2>
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
                        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
                        </div>
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
