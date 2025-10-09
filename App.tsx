
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

import { Header } from './components/Header';
import { PreflightDropzone } from './components/PreflightDropzone';
import { PreflightSummary } from './components/PreflightSummary';
import { IssuesPanel } from './components/IssuesPanel';
import { PageViewer } from './components/PageViewer';
import { FixDrawer } from './components/FixDrawer';
import { AIAuditModal } from './components/AIAuditModal';

import type { PreflightProfile, PreflightResult, Issue, Language } from './types';
import { DEFAULT_PROFILES } from './profiles/defaults';
import { translations } from './i18n/translations';


type AppState = 'idle' | 'analyzing' | 'results';

export const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('idle');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [activeProfile, setActiveProfile] = useState<PreflightProfile>(DEFAULT_PROFILES[0]);
    const [preflightResult, setPreflightResult] = useState<PreflightResult | null>(null);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [language, setLanguage] = useState<Language>('en');
    
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiReport, setAiReport] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    
    const workerRef = useRef<Worker | null>(null);
    const workerObjectURLRef = useRef<string | null>(null);


    const t = useMemo(() => {
        const langData = translations[language] || translations.en;
        const enData = translations.en;
        // Fallback for missing translations
        return new Proxy(langData, {
            get(target, prop, receiver) {
                return Reflect.get(target, prop, receiver) || Reflect.get(enData, prop, receiver);
            }
        });
    }, [language]);

    useEffect(() => {
        const setupWorker = async () => {
            try {
                const response = await fetch('./workers/preflight.worker.js');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const scriptText = await response.text();
                const blob = new Blob([scriptText], { type: 'application/javascript' });
                const objectURL = URL.createObjectURL(blob);
                workerObjectURLRef.current = objectURL;

                const worker = new Worker(objectURL, { type: 'module' });
                workerRef.current = worker;

                worker.onmessage = (event: MessageEvent<PreflightResult>) => {
                    setPreflightResult(event.data);
                    setAppState('results');
                };
            } catch (error) {
                console.error("Worker setup failed:", error);
            }
        };

        setupWorker();

        return () => {
            workerRef.current?.terminate();
            if (workerObjectURLRef.current) {
                URL.revokeObjectURL(workerObjectURLRef.current);
            }
        };
    }, []);

    const handleFileSelect = (file: File) => {
        setPdfFile(file);
        setAppState('analyzing');
        setSelectedIssue(null);
        setPreflightResult(null);

        file.arrayBuffer().then(buffer => {
            workerRef.current?.postMessage({ buffer, profile: activeProfile }, [buffer]);
        });
    };

    const handleProfileChange = (profile: PreflightProfile) => {
        setActiveProfile(profile);
        if (pdfFile) {
            // Re-run analysis with the new profile
            handleFileSelect(pdfFile);
        }
    };
    
    const handleAnalyzeNew = () => {
        setAppState('idle');
        setPdfFile(null);
        setPreflightResult(null);
        setSelectedIssue(null);
    };

    const handleAiAudit = async () => {
        if (!preflightResult) return;

        setIsAiModalOpen(true);
        setIsAiLoading(true);
        setAiReport('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                You are an expert print production specialist named "Phil Preflight".
                Analyze the following JSON preflight report for a PDF document.
                Provide a helpful summary for a designer, explaining the key issues and their potential impact on printing.
                Then, give a prioritized list of actionable recommendations to fix the most critical problems.
                Format your response in Markdown. Be friendly and encouraging.

                Preflight Report:
                ${JSON.stringify(preflightResult, null, 2)}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                  // The AI response should not be overly creative.
                  temperature: 0.2,
                }
            });

            setAiReport(response.text);

        } catch (error) {
            console.error('AI Audit failed:', error);
            setAiReport(t.aiError);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleExportReport = () => {
        if (!preflightResult || !pdfFile) return;
        const reportData = {
            fileName: pdfFile.name,
            profileUsed: activeProfile.name,
            score: preflightResult.score,
            summary: preflightResult.summary,
            issues: preflightResult.issues,
        };
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pdfFile.name.replace('.pdf', '')}-preflight-report.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <Header 
                activeProfile={activeProfile}
                onProfileChange={handleProfileChange}
                language={language}
                onLanguageChange={setLanguage}
                t={t}
                onExportReport={handleExportReport}
                isReportAvailable={appState === 'results'}
            />

            <main className="flex-grow p-4 overflow-hidden">
                {appState === 'idle' && <PreflightDropzone onFileSelect={handleFileSelect} t={t} />}

                {appState === 'analyzing' && (
                    <div className="flex items-center justify-center h-full text-lg">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.analyzing}
                    </div>
                )}
                
                {appState === 'results' && pdfFile && preflightResult && (
                    <div className="grid grid-cols-12 gap-4 h-full">
                        <div className="col-span-12 xl:col-span-3 flex flex-col gap-4 overflow-y-auto">
                           <PreflightSummary summary={preflightResult.summary} score={preflightResult.score} t={t} />
                            <div className="flex-grow h-0 min-h-[200px]">
                                <IssuesPanel 
                                    issues={preflightResult.issues}
                                    onIssueSelect={setSelectedIssue}
                                    selectedIssue={selectedIssue}
                                    t={t}
                                />
                            </div>
                        </div>
                        <div className="col-span-12 xl:col-span-6 flex flex-col h-full">
                            <PageViewer pdfFile={pdfFile} issue={selectedIssue} />
                        </div>
                        <div className="col-span-12 xl:col-span-3 flex flex-col h-full">
                            <FixDrawer issue={selectedIssue} t={t} />
                        </div>
                    </div>
                )}
            </main>

            {appState === 'results' && (
                <footer className="bg-white dark:bg-gray-800 shadow-inner p-4 flex justify-center gap-4 flex-shrink-0">
                    <button 
                        onClick={handleAnalyzeNew}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        {t.analyzeNewPDF}
                    </button>
                    <button 
                        onClick={handleAiAudit}
                        className="flex items-center gap-2 px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        {t.auditWithAI}
                    </button>
                </footer>
            )}

            <AIAuditModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                isLoading={isAiLoading}
                report={aiReport}
                t={t}
            />
        </div>
    );
};
