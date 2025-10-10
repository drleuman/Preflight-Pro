

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Header } from './components/Header';
import { PreflightDropzone } from './components/PreflightDropzone';
import { PreflightSummary } from './components/PreflightSummary';
import { IssuesPanel } from './components/IssuesPanel';
import { PageViewer } from './components/PageViewer';
import { FixDrawer } from './components/FixDrawer';
import { AIAuditModal } from './components/AIAuditModal';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { XCircleIcon } from '@heroicons/react/24/solid';

import type { PreflightProfile, PreflightResult, Issue } from './types';
import { DEFAULT_PROFILES } from './profiles/defaults';
import { translations } from './i18n/translations';

type AppState = 'idle' | 'analyzing' | 'results' | 'unsupported' | 'error';

const AI_AUDIT_SYSTEM_INSTRUCTION = `
    You are an expert print production specialist named "Phil Preflight".
    Analyze the following JSON preflight report for a PDF document. Your audience is a designer who needs clear, actionable advice.

    Your response should be formatted in Markdown and include the following sections:

    1.  **Overall Summary:** Provide a helpful, friendly, and encouraging summary explaining the key issues and their potential impact on professional printing.
    2.  **Prioritized Recommendations:** Give a prioritized list of actionable recommendations to fix the most critical problems for print output.
    3.  **Cross-Media Considerations:** Based on the report, identify potential issues that might arise if this document is repurposed for other formats (like web display or Microsoft Office). For example, comment on RGB vs. CMYK color spaces, font compatibility, and transparency handling.
    4.  **Best Practices:** Briefly suggest best practices for different output intents (print vs. web), based on the issues found in the report.

    Be friendly and encouraging throughout your analysis.
`;

const UnsupportedFileView: React.FC<{
    file: File;
    onGoBack: () => void;
    // Fix: Loosen type to allow nested objects in translations
    t: Record<string, any>;
}> = ({ file, onGoBack, t }) => {
    const fileType = file.name.split('.').pop()?.toUpperCase() || 'this file type';
    const message = t.unsupportedFileMessage.replace('{fileType}', fileType);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
                <QuestionMarkCircleIcon className="w-24 h-24 text-indigo-400 dark:text-indigo-500 mx-auto" />
                <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">{t.unsupportedFileTitle}</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    File uploaded: <span className="font-semibold">{file.name}</span>
                </p>
                <p className="mt-4 text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: message }}></p>
                <button
                    onClick={onGoBack}
                    className="mt-8 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {t.analyzeDifferentFile}
                </button>
            </div>
        </div>
    );
};

const ErrorView: React.FC<{
    file: File;
    message: string;
    onGoBack: () => void;
    // Fix: Loosen type to allow nested objects in translations
    t: Record<string, any>;
}> = ({ file, message, onGoBack, t }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
                <XCircleIcon className="w-24 h-24 text-red-500 mx-auto" />
                <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">{t.analysisFailedTitle}</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    File: <span className="font-semibold">{file.name}</span>
                </p>
                <div className="mt-4 text-left bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                    <p className="font-semibold text-red-800 dark:text-red-200">Error Details:</p>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>
                </div>
                <button
                    onClick={onGoBack}
                    className="mt-8 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {t.analyzeDifferentFile}
                </button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('idle');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [activeProfile, setActiveProfile] = useState<PreflightProfile>(DEFAULT_PROFILES[0]);
    const [preflightResult, setPreflightResult] = useState<PreflightResult | null>(null);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState(0);

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiReport, setAiReport] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const workerRef = useRef<Worker | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    const t = translations;

    useEffect(() => {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });

        let worker: Worker | null = null;
        let workerUrl: string | null = null;

        const initializeWorker = async () => {
            try {
                // Fetch both the PDF.js library and the worker script as text to pre-bundle them.
                const pdfjsLibResponse = await fetch('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/legacy/build/pdf.min.js');
                const pdfjsLibScript = await pdfjsLibResponse.text();

                const workerScriptResponse = await fetch('./workers/preflight.worker.js');
                const workerScript = await workerScriptResponse.text();
                
                // Concatenate them into a single script. pdf.min.js must come first.
                const combinedScript = pdfjsLibScript + '\n' + workerScript;
                
                const blob = new Blob([combinedScript], { type: 'application/javascript' });
                workerUrl = URL.createObjectURL(blob);
                
                const newWorker = new Worker(workerUrl, { type: 'classic' });
                workerRef.current = newWorker;
                worker = newWorker; // for cleanup

                newWorker.onmessage = (event: MessageEvent<{type: string, payload: any}>) => {
                    const { type, payload } = event.data;

                    switch(type) {
                        case 'PROGRESS':
                            setAnalysisProgress(payload.percent);
                            break;
                        case 'RESULT':
                            setPreflightResult(payload);
                            setAppState('results');
                            setErrorMessage(null);
                            setAnalysisProgress(100);
                            break;
                        case 'ERROR':
                            setErrorMessage(payload);
                            setAppState('error');
                            break;
                        case 'CANCELLED':
                            setAppState('idle');
                            break;
                    }
                };
            } catch (error) {
                console.error("Failed to initialize preflight worker:", error);
                setErrorMessage("Could not load the analysis engine. Please try refreshing the page.");
                setAppState('error');
            }
        };

        initializeWorker();

        return () => {
            if (worker) {
                worker.terminate();
            }
            if (workerUrl) {
                URL.revokeObjectURL(workerUrl);
            }
        };
    }, []);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setSelectedIssue(null);
        setPreflightResult(null);
        setErrorMessage(null);
        setAnalysisProgress(0);

        const fileType = file.name.split('.').pop()?.toLowerCase();

        if (fileType === 'pdf') {
            setAppState('analyzing');
            file.arrayBuffer().then(buffer => {
                workerRef.current?.postMessage({
                    type: 'ANALYZE',
                    payload: { buffer, profile: activeProfile }
                }, [buffer]);
            });
        } else if (fileType === 'idml' || fileType === 'zip') {
            setAppState('unsupported');
        } else {
            alert('Unsupported file type.');
            setAppState('idle');
            setSelectedFile(null);
        }
    };

    const handleProfileChange = (profile: PreflightProfile) => {
        setActiveProfile(profile);
        if (selectedFile && selectedFile.name.endsWith('.pdf')) {
            handleFileSelect(selectedFile);
        }
    };

    const handleAnalyzeNew = () => {
        setAppState('idle');
        setSelectedFile(null);
        setPreflightResult(null);
        setSelectedIssue(null);
        setErrorMessage(null);
        setAnalysisProgress(0);
        workerRef.current?.postMessage({ type: 'CANCEL' });
    };

    const handleAiAudit = async () => {
        if (!preflightResult || !aiRef.current) return;

        setIsAiModalOpen(true);
        setIsAiLoading(true);
        setAiReport('');

        try {
            const userPrompt = `Preflight Report:\n${JSON.stringify(preflightResult, null, 2)}`;

            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: {
                    systemInstruction: AI_AUDIT_SYSTEM_INSTRUCTION,
                }
            });

            const reportText = response.text;
            if (reportText && reportText.trim()) {
                setAiReport(reportText);
            } else {
                console.error('AI Audit returned an empty response.');
                setAiReport(t.aiError);
            }

        } catch (error) {
            console.error('AI Audit failed:', error);
            setAiReport(t.aiError);
        } finally {
            setIsAiLoading(false);
        }
    };

    const generatePdfReport = (result: PreflightResult, profile: PreflightProfile, fileName: string, t: Record<string, any>) => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        let y = 20;

        doc.setFontSize(22);
        doc.text(t.pdfReportTitle, 14, y);
        y += 10;

        doc.setFontSize(10);
        doc.text(`${t.pdfFileName}: ${fileName}`, 14, y);
        y += 5;
        doc.text(`${t.pdfProfileUsed}: ${t[profile.name] || profile.name}`, 14, y);
        y += 5;
        doc.text(`${t.pdfAnalysisDate}: ${new Date().toLocaleString()}`, 14, y);
        y += 10;

        doc.setFontSize(12);
        doc.text(`${t.pdfOverallScore}:`, 14, y);
        doc.setFontSize(20).setTextColor(result.score > 80 ? '#22c55e' : result.score > 50 ? '#f59e0b' : '#ef4444');
        doc.text(String(result.score.toFixed(0)), 50, y);
        doc.setTextColor(0, 0, 0);
        y += 15;

        doc.setFontSize(16);
        doc.text(t.pdfSummaryTitle, 14, y);
        
        autoTable(doc, {
            startY: y + 8,
            head: [[t.pdfCategory, t.pdfStatus, t.issues]],
            body: result.summary.map(s => [t[s.id] || s.title, t[s.status] || s.status, s.issueCount]),
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            didParseCell: (data) => {
                if (data.column.index === 1 && data.cell.section === 'body') {
                    const status = data.cell.text[0].toLowerCase();
                    if (status.includes('ok')) data.cell.styles.textColor = '#22c55e';
                    if (status.includes('warning')) data.cell.styles.textColor = '#f59e0b';
                    if (status.includes('error')) data.cell.styles.textColor = '#ef4444';
                }
            }
        });
        y = (doc as any).lastAutoTable.finalY + 15;

        if (result.issues.length > 0) {
            if (y > pageHeight - 40) { doc.addPage(); y = 20; }
            doc.setFontSize(16);
            doc.text(t.pdfIssuesTitle, 14, y);
            
            autoTable(doc, {
                startY: y + 8,
                head: [[t.pdfPage, t.pdfSeverity, t.pdfDescription]],
                body: result.issues.map(issue => [issue.page, t[issue.severity] || issue.severity, issue.message]),
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] }
            });
            y = (doc as any).lastAutoTable.finalY + 15;

            const hasTransparencyIssue = result.issues.some(issue => issue.ruleId === 'TRANSPARENCY_DETECTED');
            if (hasTransparencyIssue) {
                if (y > pageHeight - 60) { doc.addPage(); y = 20; }
                doc.setFontSize(14).setFont(undefined, 'bold');
                doc.text(t.pdfTransparencyWarningTitle, 14, y);
                y += 8;
                
                doc.setFontSize(10).setFont(undefined, 'normal');
                const bodyText = t.pdfTransparencyWarningBody.replace('{profileName}', t[profile.name] || profile.name);
                const splitText = doc.splitTextToSize(bodyText, 180);
                doc.text(splitText, 14, y);
                y += (splitText.length * 5) + 10;
            }

            if (y > pageHeight - 40) { doc.addPage(); y = 20; }
            doc.setFontSize(16);
            doc.text(t.pdfFixDetailsTitle, 14, y);
            y += 10;
            
            result.issues.forEach((issue, index) => {
                const fixSteps = t.fixSteps?.[issue.ruleId];
                if (!fixSteps) return;

                if (y > pageHeight - 60) { doc.addPage(); y = 20; }
                
                doc.setFontSize(12).setFont(undefined, 'bold');
                const issueTitle = `Issue ${index + 1}: ${issue.message} (${t.page} ${issue.page})`;
                const splitTitle = doc.splitTextToSize(issueTitle, 180);
                doc.text(splitTitle, 14, y);
                y += (splitTitle.length * 5) + 2;

                const drawFixSteps = (program: string, steps: string[]) => {
                    if (!steps || steps.length === 0) return;
                    if (y > pageHeight - 20) { doc.addPage(); y = 20; }
                    doc.setFontSize(10).setFont(undefined, 'bold');
                    doc.text(program, 16, y);
                    y += 5;
                    doc.setFont(undefined, 'normal');
                    steps.forEach(step => {
                        const cleanStep = step.replace(/<[^>]*>?/gm, '');
                        const splitText = doc.splitTextToSize(cleanStep, 170);
                        if (y > pageHeight - (splitText.length * 4) - 5) { doc.addPage(); y = 20; }
                        doc.text(`• ${splitText.join('\n  ')}`, 20, y);
                        y += (splitText.length * 4) + 2;
                    });
                    y += 5;
                };

                drawFixSteps(t.fixInDesign, fixSteps.inDesign);
                drawFixSteps(t.fixIllustrator, fixSteps.illustrator);
                drawFixSteps(t.fixWord, fixSteps.word);
            });
        }

        doc.save(`${fileName.replace(/\.[^/.]+$/, '')}-preflight-report.pdf`);
    };

    const handleExportReport = () => {
        if (!preflightResult || !selectedFile) return;
        generatePdfReport(preflightResult, activeProfile, selectedFile.name, t);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <Header 
                activeProfile={activeProfile}
                onProfileChange={handleProfileChange}
                t={t}
                onExportReport={handleExportReport}
                isReportAvailable={appState === 'results'}
            />

            <main className="flex-grow p-4 overflow-hidden">
                {appState === 'idle' && <PreflightDropzone onFileSelect={handleFileSelect} t={t} />}

                {appState === 'unsupported' && selectedFile && (
                    <UnsupportedFileView file={selectedFile} onGoBack={handleAnalyzeNew} t={t} />
                )}

                {appState === 'error' && selectedFile && errorMessage && (
                    <ErrorView file={selectedFile} message={errorMessage} onGoBack={handleAnalyzeNew} t={t} />
                )}

                {appState === 'analyzing' && (
                    <div className="flex flex-col items-center justify-center h-full text-lg">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.analyzing} ({analysisProgress}%)
                    </div>
                )}
                
                {appState === 'results' && selectedFile && preflightResult && (
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
                            <PageViewer pdfFile={selectedFile} issue={selectedIssue} />
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

export default App;