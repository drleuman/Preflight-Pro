import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Header } from './components/Header';
import { PreflightDropzone } from './components/PreflightDropzone';
import { PreflightSummary } from './components/PreflightSummary';
import { IssuesPanel } from './components/IssuesPanel';
import { PageViewer } from './components/PageViewer';
import { FixDrawer } from './components/FixDrawer';
import { AIAuditModal } from './components/AIAuditModal';
import { EfficiencyAuditModal } from './components/EfficiencyAuditModal';
import { FileMeta, Issue, PreflightResult, PreflightWorkerCommand, PreflightWorkerMessage, Severity } from './types';
import { t } from './i18n';

// Function to safely parse a JSON string from a script tag content
function getImportMapContent(): { imports: { [key: string]: string } } {
  const importMapScript = document.getElementById('main-importmap');
  if (importMapScript && importMapScript.textContent) {
    try {
      // Parse the text content of the importmap script tag
      const parsedMap = JSON.parse(importMapScript.textContent);
      // Ensure the 'imports' key exists and is an object
      if (parsedMap && typeof parsedMap === 'object' && parsedMap.imports && typeof parsedMap.imports === 'object') {
        return { imports: parsedMap.imports };
      }
    } catch (e) {
      console.error("Failed to parse main-importmap content:", e);
    }
  }
  return { imports: {} }; // Fallback empty importmap
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [preflightResult, setPreflightResult] = useState<PreflightResult | null>(null);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'analyzing' | 'error' | 'success'>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const [isAIAuditModalOpen, setIsAIAuditModalOpen] = useState(false);
  const [isEfficiencyAuditModalOpen, setIsEfficiencyAuditModalOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [geminiKeyMissing, setGeminiKeyMissing] = useState(true);

  const workerRef = useRef<Worker | null>(null);

  // Initialize worker and handle messages
  useEffect(() => {
    // Get Gemini API key from meta tag
    const metaTag = document.querySelector('meta[name="gemini-api-key"]');
    const apiKey = metaTag instanceof HTMLMetaElement ? metaTag.content : null;
    setGeminiApiKey(apiKey);
    setGeminiKeyMissing(!apiKey || apiKey === 'YOUR_KEY_HERE');

    // Get the importmap content directly as an object to embed in the worker script
    const importMapObject = getImportMapContent();
    const importMapJSONString = JSON.stringify(importMapObject); // Stringify the actual object

    // Create an inline script for the worker logic
    const workerScript = `
      // Worker scope - 'self' refers to the WorkerGlobalScope
      self.importScripts(
        'https://aistudiocdn.com/@babel/standalone@7.24.0/babel.min.js',
        'https://aistudiocdn.com/systemjs@6.14.3/dist/s.min.js'
      );

      // SystemJS config for the worker
      System.config({
        baseURL: '${window.location.origin}/', // Base URL for resolving relative paths
        map: ${importMapJSONString}.imports // Directly use the imports from the main document's importmap
      });

      // Load the custom SystemJS loader in the worker first
      System.import('./loader/systemjs-babel-loader.ts')
        .then(() => {
          // Then load the worker entry point, which exports { onmessage } as default
          return System.import('./workers/preflight.worker.ts');
        })
        .then((module) => {
          if (module && module.default && typeof module.default.onmessage === 'function') {
            self.onmessage = module.default.onmessage;
            console.log("Worker: preflight.worker.ts loaded and onmessage assigned.");
          } else {
            console.error("Worker: preflight.worker.ts did not export onmessage correctly.");
          }
        })
        .catch(err => console.error('Worker: Error in worker setup sequence:', err));
    `;

    const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    const preflightWorker = new Worker(workerUrl);
    workerRef.current = preflightWorker;

    preflightWorker.onmessage = (event: MessageEvent<PreflightWorkerMessage>) => {
      if (event.data.type === 'analysisResult') {
        const result = event.data.result;
        setPreflightResult(result);
        setLoadingState('success');
        console.log("App: Analysis result received:", result);
      } else if (event.data.type === 'analysisError') {
        setAnalysisError(event.data.message);
        setLoadingState('error');
        console.error("App: Analysis error received:", event.data.message);
      }
    };

    preflightWorker.onerror = (errorEvent) => {
      console.error("App: Worker encountered an error:", errorEvent);
      setAnalysisError(t('workerGenericError'));
      setLoadingState('error');
    };

    return () => {
      preflightWorker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []); // Empty dependency array means this runs once on mount


  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setPreflightResult(null);
    setSelectedIssue(null);
    setCurrentPage(1);
    setAnalysisError(null);
    setLoadingState('loading');

    const fileMeta: FileMeta = {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
    };

    // Simulate getting page count for mock worker
    // In a real app, this would come from PDF.js
    const samplePageCount = 5; // Placeholder for the mock worker

    // Send command to worker
    if (workerRef.current) {
      setLoadingState('analyzing');
      workerRef.current.postMessage({
        type: 'analyze',
        fileMeta,
        samplePageCount,
      } as PreflightWorkerCommand);
    }
  }, []);

  const handleIssueSelect = useCallback((issue: Issue) => {
    setSelectedIssue(issue);
    if (issue.page) {
      setCurrentPage(issue.page);
    }
    // Automatically open the drawer
    // isAIAuditModalOpen and isEfficiencyAuditModalOpen are managed by their respective buttons.
  }, []);

  const openAIAuditModal = useCallback(() => setIsAIAuditModalOpen(true), []);
  const closeAIAuditModal = useCallback(() => setIsAIAuditModalOpen(false), []);

  const openEfficiencyAuditModal = useCallback(() => setIsEfficiencyAuditModalOpen(true), []);
  const closeEfficiencyAuditModal = useCallback(() => setIsEfficiencyAuditModalOpen(false), []);

  // Effect to navigate to issue page if selected issue changes
  useEffect(() => {
    if (selectedIssue && selectedIssue.page !== currentPage) {
      setCurrentPage(selectedIssue.page);
    }
  }, [selectedIssue, currentPage]);


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Left Column: Dropzone & Summary */}
        <div className="md:col-span-1 space-y-6">
          {loadingState === 'idle' && (
            <PreflightDropzone onFileSelect={handleFileSelect} />
          )}

          {(loadingState === 'loading' || loadingState === 'analyzing') && (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-200 h-12 w-12 mb-4 animate-spin mx-auto"></div>
              <p className="text-lg font-semibold text-blue-700">{loadingState === 'loading' ? t('loadingFile') : t('analyzingPDF')}</p>
              <p className="text-gray-600">{loadingState === 'loading' ? t('preparingFileForAnalysis') : t('thisMayTakeAMoment')}</p>
            </div>
          )}

          {loadingState === 'error' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {analysisError || 'An unknown error occurred during analysis.'}</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" onClick={() => setLoadingState('idle')}><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.15a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.15 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
              </span>
            </div>
          )}

          {preflightResult && loadingState === 'success' && (
            <PreflightSummary
              score={preflightResult.score}
              summary={preflightResult.summary}
              issues={preflightResult.issues}
            />
          )}

          {geminiKeyMissing && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Warning: </strong>
              <span className="block sm:inline"> {t('geminiKeyMissingError')}</span>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline ml-2">
                {t('billingDocLink')}
              </a>
            </div>
          )}
        </div>

        {/* Middle Column: PDF Viewer */}
        <div className="md:col-span-2 flex flex-col space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md flex-grow flex flex-col overflow-hidden">
            <h2 className="text-xl font-semibold mb-4">{t('pdfViewer')}</h2>
            <PageViewer
              file={file}
              numPages={numPages} // This will need to be updated by PDF.js once loaded
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              selectedIssue={selectedIssue}
            />
          </div>

          {/* Issues Panel below PDF Viewer */}
          {preflightResult && loadingState === 'success' && (
            <div className="bg-white p-6 rounded-lg shadow-md h-96 flex flex-col">
              <IssuesPanel
                issues={preflightResult.issues}
                selectedIssue={selectedIssue}
                onIssueSelect={handleIssueSelect}
              />
            </div>
          )}
        </div>
      </main>

      {/* Fix Drawer (right-aligned) */}
      <FixDrawer
        issue={selectedIssue}
        geminiApiKey={geminiApiKey}
        onAIAuditClick={openAIAuditModal}
        onEfficiencyAuditClick={openEfficiencyAuditModal}
        geminiKeyMissing={geminiKeyMissing}
      />

      {/* Modals */}
      <AIAuditModal
        isOpen={isAIAuditModalOpen}
        onClose={closeAIAuditModal}
        issue={selectedIssue}
        geminiApiKey={geminiApiKey}
      />
      <EfficiencyAuditModal
        isOpen={isEfficiencyAuditModalOpen}
        onClose={closeEfficiencyAuditModal}
        issue={selectedIssue}
        geminiApiKey={geminiApiKey}
      />
    </div>
  );
}

export default App;