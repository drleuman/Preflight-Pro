import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

// Types
import type { PreflightProfile, Language, PreflightResult, Issue } from './types';
import { DEFAULT_PROFILES } from './profiles/defaults';
import { translations } from './i18n/translations';

// Components
import { Header } from './components/Header';
import { PreflightDropzone } from './components/PreflightDropzone';
import { PreflightSummary } from './components/PreflightSummary';
import { IssuesPanel } from './components/IssuesPanel';
import { PageViewer } from './components/PageViewer';
import { FixDrawer } from './components/FixDrawer';
import { AIAuditModal } from './components/AIAuditModal';

type AnalysisState = 'idle' | 'analyzing' | 'done' | 'error';

export const App: React.FC = () => {
    // State management
    const [language, setLanguage] = useState<Language>('en');
    const [activeProfile, setActiveProfile] = useState<PreflightProfile>(DEFAULT_PROFILES[0]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [preflightResult, setPreflightResult] = useState<PreflightResult | null>(null);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiAuditReport, setAiAuditReport] = useState('');
    const [isAuditing, setIsAuditing] = useState(false);
    
    // Translations
    const t = useMemo(() => translations[language], [language]);

    // Worker logic
    useEffect(() => {
        if (analysisState !== 'analyzing' || !pdfFile) {
            return;
        }

        const worker = new Worker(new URL('./workers/preflight.worker.js', import.meta.url));

        worker.onmessage = (event) => {
            const { type, payload } = event.data;
            if (type === 'result') {
                setPreflightResult(payload);
                setAnalysisState('done');
                if (payload.issues && payload.issues.length > 0) {
                    setSelectedIssue(payload.issues[0]);
                }
            } else if (type === 'error') {
                console.error('Analysis failed:', payload);
                setAnalysisState('error');
            }
        };

        worker.postMessage({ file: pdfFile, profile: activeProfile });

        return () => {
            worker.terminate();
        };
    }, [analysisState, pdfFile, activeProfile]);

    // Handlers
    const handleFileSelect = useCallback((file: File) => {
        setPdfFile(file);
        setAnalysisState('analyzing');
        setPreflightResult(null);
        setSelectedIssue(null);
    }, []);

    const handleAnalyzeNew = () => {
        setPdfFile(null);
        setAnalysisState('idle');
        setPreflightResult(null);
        setSelectedIssue(null);
    };

    const handleAuditWithAI = async () => {
        if (!preflightResult) return;

        setIsAiModalOpen(true);
        setIsAuditing(true);
        setAiAuditReport('');

        try {
            if (!process.env.API_KEY) {
                console.error("API_KEY environment variable not set.");
                setAiAuditReport('Error: API key is not configured. Please contact support.');
                setIsAuditing(false);
                return;
            }
            // Fix: Initialize the Gemini API client according to the coding guidelines.
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            
            const prompt = `
                You are "Phil Preflight", an expert print production specialist.
                Analyze the following PDF preflight report and provide a comprehensive summary for the user.
                Explain the key issues, their potential impact on print quality, and prioritize them by severity.
                Keep the tone helpful, professional, and encouraging. Use markdown for formatting.

                Report Summary:
                - Preflight Score: ${preflightResult.score}/100
                - Total Issues: ${preflightResult.issues.length}
                
                Detected Issues:
                ${preflightResult.issues.map(issue => `- [${issue.severity}] on page ${issue.page}: ${issue.message}`).join('\n')}
            `;

            // Fix: Call the Gemini API using the recommended `ai.models.generateContent` method.
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            // Fix: Extract the text from the response using the `.text` property.
            setAiAuditReport(response.text);

        } catch (error) {
            console.error("AI Audit Error:", error);
            setAiAuditReport(t.aiError || 'Sorry, the AI audit failed. Please try again later.');
        } finally {
            setIsAuditing(false);
        }
    };
    
    // Main render logic
    const renderContent = () => {
        switch (analysisState) {
            case 'idle':
                return <PreflightDropzone onFileSelect={handleFileSelect} t={t} />;
            case 'analyzing':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-indigo-500 mb-4"></div>
                        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{t.analyzing}</h2>
                    </div>
                );
            case 'done':
                if (!preflightResult || !pdfFile) return null;
                return (
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] lg:grid-cols-[1fr_2fr_1fr] gap-4 h-full">
                        <div className="flex flex-col gap-4 overflow-hidden">
                            <PreflightSummary summary={preflightResult.summary} score={preflightResult.score} t={t} />
                            <IssuesPanel issues={preflightResult.issues} onIssueSelect={setSelectedIssue} selectedIssue={selectedIssue} t={t} />
                        </div>
                        <div className="h-full min-h-0">
                            <PageViewer pdfFile={pdfFile} issue={selectedIssue} />
                        </div>
                        <div className="hidden lg:block">
                             <FixDrawer issue={selectedIssue} t={t} />
                        </div>
                    </div>
                );
            case 'error':
                 return <p className="text-center text-red-500">{t.aiError || 'An error occurred during analysis.'}</p>;
            default:
                return null;
        }
    };

    return (
        <div className="h-screen w-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
            <Header 
                activeProfile={activeProfile}
                onProfileChange={setActiveProfile}
                language={language}
                onLanguageChange={setLanguage}
                t={t}
                onExportReport={() => alert('Exporting report...')}
                isReportAvailable={analysisState === 'done'}
            />
            <main className="flex-grow p-4 overflow-hidden">
                {renderContent()}
            </main>
            {analysisState === 'done' && (
                <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-4 flex-shrink-0">
                    <button onClick={handleAnalyzeNew} className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">{t.analyzeNewPDF}</button>
                    <button onClick={handleAuditWithAI} disabled={isAuditing} className="px-6 py-3 border border-transparent text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400">{isAuditing ? t.auditing : t.auditWithAI}</button>
                </footer>
            )}
             <AIAuditModal 
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                isLoading={isAuditing}
                report={aiAuditReport}
                t={t}
            />
        </div>
    );
};
