import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';

import { Header } from './components/Header';
import { PreflightDropzone } from './components/PreflightDropzone';
import { PreflightSummary } from './components/PreflightSummary';
import { IssuesPanel } from './components/IssuesPanel';
import { PageViewer } from './components/PageViewer';
import { FixDrawer } from './components/FixDrawer';
import { AIAuditModal } from './components/AIAuditModal';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { XCircleIcon } from '@heroicons/react/24/solid';

import type { PreflightProfile, PreflightResult, Issue, Translations, AIAuditReportData } from './types';
import { DEFAULT_PROFILES } from './profiles/defaults';
import { translations } from './i18n/translations';
import { PDF_REPORT_COLORS, AI_MODEL_NAME, AI_AUDIT_SYSTEM_INSTRUCTION } from './constants';

type AppState = 'idle' | 'analyzing' | 'results' | 'unsupported' | 'error';

// Extend the jsPDF interface to include the properties added by the autoTable plugin.
// FIX: Changed from interface to type alias with intersection to correctly extend jsPDF instance type.
// This resolves issues where TypeScript couldn't find standard jsPDF methods on the extended type.
type jsPDFWithAutoTable = jsPDF & {
  lastAutoTable: {
    finalY: number;
  };
};

const UnsupportedFileView: React.FC<{
    file: File;
    onGoBack: () => void;
    t: Translations;
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
    t: Translations;
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
    const [resolvedIssueIds, setResolvedIssueIds] = useState<Set<string>>(new Set());

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiReport, setAiReport] = useState<AIAuditReportData | string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const workerRef = useRef<Worker | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    const t = translations;

    useEffect(() => {
        // Safely access the API key. In non-Node.js environments, `process` may be undefined or null.
        // This robust check prevents a critical runtime error that would stop the app from loading.
        const apiKey = (typeof process !== 'undefined' && process && process.env) ? process.env.API_KEY : undefined;
        if (apiKey) {
            aiRef.current = new GoogleGenAI({ apiKey });
        } else {
            console.warn("Gemini API key not found. AI features will be disabled.");
        }
        
        let worker: Worker | null = null;
        let workerUrl: string | null = null;

        const initializeWorker = async () => {
            try {
                // Set the worker source for pdfjs-dist for components like PageViewer.
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.worker.min.js`;

                // Fetch the pdf.js library and our custom worker script.
                const [pdfjsResponse, workerResponse] = await Promise.all([
                    fetch('https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.min.js'),
                    fetch('./workers/preflight.worker.js')
                ]);

                if (!pdfjsResponse.ok) throw new Error(`Failed to fetch pdf.js library: ${pdfjsResponse.statusText}`);
                if (!workerResponse.ok) throw new Error(`Failed to fetch worker script: ${workerResponse.statusText}`);

                const [pdfjsScript, workerScript] = await Promise.all([
                    pdfjsResponse.text(),
                    workerResponse.text()
                ]);
                
                // Combine them into a single script. The semicolon is a safeguard.
                const combinedScript = `${pdfjsScript};\n${workerScript}`;
                
                // Create a self-contained blob. The worker will have all dependencies and won't need to make network requests.
                const blob = new Blob([combinedScript], { type: 'application/javascript' });
                workerUrl = URL.createObjectURL(blob);
                
                worker = new Worker(workerUrl, { type: 'classic' });
                workerRef.current = worker;

                worker.onmessage = (event: MessageEvent<{type: string, payload: any}>) => {
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

                worker.onerror = (error) => {
                    console.error("Error from preflight worker:", error);
                    setErrorMessage(error.message || "An unexpected error occurred in the analysis engine.");
                    setAppState('error');
                };

            } catch (error) {
                console.error("Failed to initialize preflight worker:", error);
                const fetchError = error as Error;
                setErrorMessage(`Could not load the analysis engine. Please check your network connection and refresh the page. Details: ${fetchError.message}`);
                setAppState('error');
            }
        };

        initializeWorker();

        return () => {
            // Terminate the worker and revoke the object URL to free up resources.
            workerRef.current?.terminate();
            if (workerUrl) {
                URL.revokeObjectURL(workerUrl);
            }
        };
    }, []);

    const resetState = () => {
        setSelectedIssue(null);
        setPreflightResult(null);
        setErrorMessage(null);
        setAnalysisProgress(0);
        setResolvedIssueIds(new Set());
    };

    const handleFileSelect = (file: File) => {
        resetState();
        setSelectedFile(file);

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
    
    const handleToggleIssueResolved = (issueId: string) => {
        setResolvedIssueIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(issueId)) {
                newSet.delete(issueId);
            } else {
                newSet.add(issueId);
            }
            return newSet;
        });
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
        resetState();
        workerRef.current?.postMessage({ type: 'CANCEL' });
    };

    const handleAiAudit = async () => {
        if (!preflightResult) {
            return;
        }

        setIsAiModalOpen(true);
        setIsAiLoading(true);
        setAiReport(null);

        if (!aiRef.current) {
            setAiReport(t.aiErrorApiKey);
            setIsAiLoading(false);
            return;
        }

        try {
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    overallAssessment: { type: Type.STRING, description: "A technical summary of the document's print-readiness." },
                    printReadinessScore: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.NUMBER, description: "A numerical score from 0-100 for print readiness." },
                            rationale: { type: Type.STRING, description: "A brief, technical rationale for the score." },
                        },
                        required: ['score', 'rationale'],
                    },
                    criticalIssues: {
                        type: Type.ARRAY,
                        description: "A list of all 'Blocker' and 'Major' severity issues.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                issueSummary: { type: Type.STRING, description: "A concise summary of the issue." },
                                impact: { type: Type.STRING, description: "The technical impact of the issue on production." },
                                recommendation: { type: Type.STRING, description: "A clear recommendation for fixing the issue." },
                            },
                            required: ['issueSummary', 'impact', 'recommendation'],
                        },
                    },
                    minorIssues: {
                        type: Type.ARRAY,
                        description: "A list of all 'Minor', 'Nit', and 'Info' severity issues.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                issueSummary: { type: Type.STRING, description: "A concise summary of the issue." },
                                impact: { type: Type.STRING, description: "The technical impact of the issue on production." },
                                recommendation: { type: Type.STRING, description: "A clear recommendation for fixing the issue." },
                            },
                             required: ['issueSummary', 'impact', 'recommendation'],
                        },
                    },
                    proactiveSuggestions: {
                        type: Type.ARRAY,
                        description: "A list of actionable best-practice suggestions to improve the file.",
                        items: { type: Type.STRING },
                    },
                },
                required: ['overallAssessment', 'printReadinessScore', 'criticalIssues', 'minorIssues', 'proactiveSuggestions'],
            };

            const userPrompt = `Preflight Report:\n${JSON.stringify(preflightResult, null, 2)}`;

            const response = await aiRef.current.models.generateContent({
                model: AI_MODEL_NAME,
                contents: userPrompt,
                config: {
                    systemInstruction: AI_AUDIT_SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                }
            });

            const reportText = response.text;
            if (reportText && reportText.trim()) {
                try {
                    const parsedReport: AIAuditReportData = JSON.parse(reportText);
                    setAiReport(parsedReport);
                } catch (parseError) {
                    console.error('AI Audit JSON parsing failed:', parseError);
                    console.error('Raw AI response:', reportText);
                    setAiReport(t.aiError);
                }
            } else {
                console.error('AI Audit returned an empty response.');
                setAiReport(t.aiErrorEmptyResponse);
            }

        } catch (error) {
            console.error('AI Audit failed:', error);
            const err = error as Error;
            const errorMessage = err.message || err.toString();
            
            if (errorMessage.toLowerCase().includes('api key')) {
                setAiReport(t.aiErrorApiKeyInvalid);
            } else if (err.name === 'TypeError' && errorMessage.toLowerCase().includes('fetch')) {
                setAiReport(t.aiErrorNetwork);
            } else {
                setAiReport(t.aiError);
            }
        } finally {
            setIsAiLoading(false);
        }
    };

    const generatePdfReport = (result: PreflightResult, profile: PreflightProfile, fileName: string, t: Translations) => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        const pageHeight = doc.internal.pageSize.height;
        let y = 20;

        doc.setFontSize(22);
        doc.text(t.pdfReportTitle, 14, y);
        y += 10;

        doc.setFontSize(10);
        doc.text(`${t.pdfFileName}: ${fileName}`, 14, y);
        y += 5;
        doc.text(`${t.pdfProfileUsed}: ${t[profile.name as keyof typeof t] || profile.name}`, 14, y);
        y += 5;
        doc.text(`${t.pdfAnalysisDate}: ${new Date().toLocaleString()}`, 14, y);
        y += 10;

        doc.setFontSize(12);
        doc.text(`${t.pdfOverallScore}:`, 14, y);
        doc.setFontSize(20).setTextColor(result.score > 80 ? PDF_REPORT_COLORS.OK : result.score > 50 ? PDF_REPORT_COLORS.WARNING : PDF_REPORT_COLORS.ERROR);
        doc.text(String(result.score.toFixed(0)), 50, y);
        doc.setTextColor(PDF_REPORT_COLORS.TEXT);
        y += 15;

        doc.setFontSize(16);
        doc.text(t.pdfSummaryTitle, 14, y);
        
        autoTable(doc, {
            startY: y + 8,
            head: [[t.pdfCategory, t.pdfStatus, t.issues]],
            // FIX: Cast translated values to string to resolve type ambiguity.
            // TypeScript was inferring the type of `t[...]` too broadly, including object types from `t.fixSteps`.
            body: result.summary.map(s => [(t[s.id as keyof typeof t] || s.title) as string, (t[s.status as keyof typeof t] || s.status) as string, s.issueCount]),
            theme: 'striped',
            headStyles: { fillColor: PDF_REPORT_COLORS.PRIMARY },
            didParseCell: (data) => {
                if (data.column.index === 1 && data.cell.section === 'body') {
                    const status = data.cell.text[0].toLowerCase();
                    if (status.includes('ok')) data.cell.styles.textColor = PDF_REPORT_COLORS.OK;
                    if (status.includes('warning')) data.cell.styles.textColor = PDF_REPORT_COLORS.WARNING;
                    if (status.includes('error')) data.cell.styles.textColor = PDF_REPORT_COLORS.ERROR;
                }
            }
        });
        y = doc.lastAutoTable.finalY + 15;

        if (result.issues.length > 0) {
            if (y > pageHeight - 40) { doc.addPage(); y = 20; }
            doc.setFontSize(16);
            doc.text(t.pdfIssuesTitle, 14, y);
            
            autoTable(doc, {
                startY: y + 8,
                head: [[t.pdfPage, t.pdfSeverity, t.pdfDescription]],
                // FIX: Cast translated severity to string to resolve type ambiguity.
                // TypeScript was inferring the type of `t[...]` too broadly, including object types from `t.fixSteps`.
                body: result.issues.map(issue => [issue.page, (t[issue.severity as keyof typeof t] || issue.severity) as string, issue.message]),
                theme: 'grid',
                headStyles: { fillColor: PDF_REPORT_COLORS.PRIMARY }
            });
            y = doc.lastAutoTable.finalY + 15;

            const hasTransparencyIssue = result.issues.some(issue => issue.ruleId === 'TRANSPARENCY_DETECTED');
            if (hasTransparencyIssue) {
                if (y > pageHeight - 60) { doc.addPage(); y = 20; }
                doc.setFontSize(14).setFont(undefined, 'bold');
                doc.text(t.pdfTransparencyWarningTitle, 14, y);
                y += 8;
                
                doc.setFontSize(10).setFont(undefined, 'normal');
                const translatedProfile = t[profile.name as keyof typeof t];
                const profileDisplayName = typeof translatedProfile === 'string' ? translatedProfile : profile.name;
                const bodyText = t.pdfTransparencyWarningBody.replace('{profileName}', profileDisplayName);
                const splitText = doc.splitTextToSize(bodyText, 180);
                doc.text(splitText, 14, y);
                y += (splitText.length * 5) + 10;
            }

            if (y > pageHeight - 40) { doc.addPage(); y = 20; }
            doc.setFontSize(16);
            doc.text(t.pdfFixDetailsTitle, 14, y);
            y += 10;
            
            result.issues.forEach((issue, index) => {
                const fixSteps = t.fixSteps[issue.ruleId as keyof typeof t.fixSteps];
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
                    <div className="flex flex-col items-center justify-center h-full text-xl">
                        <svg className="animate-spin mb-4 h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.analyzing} ({analysisProgress}%)
                    </div>
                )}
                
                {appState === 'results' && selectedFile && preflightResult && (
                    <div className="grid grid-cols-12 gap-4 h-full">
                        <div className="col-span-12 xl:col-span-3 flex flex-col gap-4 overflow-y-auto">
                           <PreflightSummary
                                summary={preflightResult.summary}
                                score={preflightResult.score}
                                t={t}
                                totalIssues={preflightResult.issues.length}
                                resolvedIssuesCount={resolvedIssueIds.size}
                            />
                            <div className="flex-grow h-0 min-h-[200px]">
                                <IssuesPanel 
                                    issues={preflightResult.issues}
                                    onIssueSelect={setSelectedIssue}
                                    selectedIssue={selectedIssue}
                                    resolvedIssueIds={resolvedIssueIds}
                                    onToggleIssueResolved={handleToggleIssueResolved}
                                    t={t}
                                />
                            </div>
                        </div>
                        <div className="col-span-12 xl:col-span-6 flex flex-col h-full">
                            <PageViewer pdfFile={selectedFile} issue={selectedIssue} />
                        </div>
                        <div className="col-span-12 xl:col-span-3 flex flex-col h-full">
                            <FixDrawer
                                issue={selectedIssue}
                                t={t}
                                onToggleIssueResolved={handleToggleIssueResolved}
                                resolvedIssueIds={resolvedIssueIds}
                            />
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
                reportData={aiReport}
                t={t}
            />
        </div>
    );
};

export default App;