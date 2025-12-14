import React, { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import { PreflightDropzone } from './components/PreflightDropzone';
import { PreflightSummary } from './components/PreflightSummary';
import { IssuesPanel } from './components/IssuesPanel';
import { PageViewer } from './components/PageViewer';
import { FixDrawer } from './components/FixDrawer';
import { AIAuditModal } from './components/AIAuditModal';
import { EfficiencyAuditModal } from './components/EfficiencyAuditModal';

import { t } from './i18n';
import {
  FileMeta,
  Issue,
  PreflightResult,
  PreflightWorkerMessage,
  PreflightWorkerCommand,
} from './types';

export default function App() {
  // ---------- Main state ----------
  const [file, setFile] = useState<File | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // AI (drawer)
  const [aiAuditOpen, setAiAuditOpen] = useState(false);
  const [efficiencyOpen, setEfficiencyOpen] = useState(false);
  const [issueForAudit, setIssueForAudit] = useState<Issue | null>(null);

  // UI flags
  const [isRunning, setIsRunning] = useState(false);
  const [lastPdfUrl, setLastPdfUrl] = useState<string | null>(null);
  const [lastPdfName, setLastPdfName] = useState<string | null>(null);
  const lastPdfUrlRef = useRef<string | null>(null);

  // ---------- Worker ----------
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    try {
      const w = new Worker(
        new URL('./workers/preflight.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = w;

      w.onmessage = (ev: MessageEvent<PreflightWorkerMessage>) => {
        const data = ev.data;
        if (!data) return;

        if (data.type === 'analysisProgress') {
          // opcional: barra de progreso
        } else if (data.type === 'analysisResult') {
          setResult(data.result || null);
          setIsRunning(false);
        } else if (data.type === 'analysisError') {
          console.error('Preflight worker error:', data.message);
          setIsRunning(false);
          window.alert('Preflight failed: ' + data.message);
        } else if (data.type === 'transformResult') {
          // PDF transformado (grayscale / rebuild)
          const blob = new Blob([data.buffer], { type: 'application/pdf' });
          const newFile = new File([blob], data.fileMeta.name, {
            type: 'application/pdf',
          });

          // 1) actualizar visor
          setFile(newFile);
          setFileMeta(data.fileMeta);
          setResult(null);
          setSelectedIssue(null);
          setNumPages(0);
          setCurrentPage(1);
          setIsRunning(false);

          // 2) descargar (and keep a "Download last PDF" link)
          downloadAndRemember(blob, data.fileMeta.name || 'output.pdf');


          // 3) aviso
          const opLabel =
            data.operation === 'grayscale'
              ? 'B&W / Grayscale'
              : 'Rebuild ≥150 dpi';
          window.alert(`Your ${opLabel} PDF is ready and has been downloaded.`);
        } else if (data.type === 'transformError') {
          console.error(
            `Transform error (${data.operation}):`,
            data.message
          );
          setIsRunning(false);
          const opLabel =
            data.operation === 'grayscale'
              ? 'B&W / Grayscale'
              : 'Rebuild ≥150 dpi';
          window.alert(`${opLabel} failed: ${data.message}`);
        }
      };

      return () => {
        w.terminate();
        workerRef.current = null;
      };
    } catch (e) {
      console.error('Error creating worker', e);
    }
  }, []);


  useEffect(() => {
    return () => {
      if (lastPdfUrlRef.current) {
        try {
          URL.revokeObjectURL(lastPdfUrlRef.current);
        } catch (e) {}
        lastPdfUrlRef.current = null;
      }
    };
  }, []);

  const downloadAndRemember = useCallback((blob: Blob, filename: string) => {
    try {
      if (lastPdfUrlRef.current) {
        URL.revokeObjectURL(lastPdfUrlRef.current);
      }
    } catch (e) {}

    const url = URL.createObjectURL(blob);
    lastPdfUrlRef.current = url;
    setLastPdfUrl(url);
    setLastPdfName(filename);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'output.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  // ---------- Handlers ----------

  const onDropFile = useCallback((f: File | null) => {
    setFile(f);
    setResult(null);
    setSelectedIssue(null);
    setNumPages(0);
    setCurrentPage(1);

    if (f) {
      setFileMeta({ name: f.name, size: f.size, type: f.type });
    } else {
      setFileMeta(null);
    }
  }, []);

  // Run Preflight
  const runPreflight = useCallback(async () => {
    if (!file || !fileMeta) return;
    if (!workerRef.current) {
      console.error('Worker not ready');
      return;
    }

    try {
      setIsRunning(true);
      setResult(null);
      setSelectedIssue(null);

      const buffer = await file.arrayBuffer();

      const cmd: PreflightWorkerCommand = {
        type: 'analyze',
        fileMeta,
        buffer,
      };

      workerRef.current.postMessage(cmd, [buffer]);
    } catch (e) {
      console.error('runPreflight failed', e);
      setIsRunning(false);
      window.alert('Run Preflight failed: ' + (e as Error).message);
    }
  }, [file, fileMeta]);

  // B&W / Grayscale (server-first; fallback to worker)
  const convertToGrayscale = useCallback(async () => {
    if (!file || !fileMeta) return;

    try {
      setIsRunning(true);
      setResult(null);
      setSelectedIssue(null);

      // Prefer server-side fix (reliable PDF regeneration via Ghostscript)
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/convert/grayscale', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server grayscale failed (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      const newFileName = file.name.replace(/\.pdf$/i, '') + '_bw.pdf';

      downloadAndRemember(blob, newFileName);

      const newFile = new File([blob], newFileName, { type: 'application/pdf' });
      setFile(newFile);
      setFileMeta({ name: newFile.name, size: newFile.size, type: newFile.type });
      setNumPages(0);
      setCurrentPage(1);
      setResult(null);
      setSelectedIssue(null);
      setIsRunning(false);
      return;
    } catch (e) {
      console.warn('Server grayscale failed, falling back to worker:', e);
    }

    // Fallback: client-side worker transform
    if (!workerRef.current) {
      setIsRunning(false);
      window.alert('B&W / Grayscale failed: worker not ready and server endpoint unavailable.');
      return;
    }

    try {
      setIsRunning(true);
      setResult(null);
      setSelectedIssue(null);

      const buffer = await file.arrayBuffer();
      const cmd: PreflightWorkerCommand = {
        type: 'convertToGrayscale',
        fileMeta,
        buffer,
      };
      workerRef.current.postMessage(cmd, [buffer]);
    } catch (e) {
      console.error('convertToGrayscale failed', e);
      setIsRunning(false);
      window.alert('B&W / Grayscale failed: ' + (e as Error).message);
    }
  }, [file, fileMeta, downloadAndRemember]);

  // Rebuild ≥150 dpi (server-first; fallback to worker)
  const upscaleLowResImages = useCallback(async () => {
    if (!file || !fileMeta) return;

    try {
      setIsRunning(true);
      setResult(null);
      setSelectedIssue(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/convert/rebuild-150dpi?dpi=150', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server rebuild failed (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      const newFileName = file.name.replace(/\.pdf$/i, '') + '_rebuild_150dpi.pdf';

      downloadAndRemember(blob, newFileName);

      const newFile = new File([blob], newFileName, { type: 'application/pdf' });
      setFile(newFile);
      setFileMeta({ name: newFile.name, size: newFile.size, type: newFile.type });
      setNumPages(0);
      setCurrentPage(1);
      setResult(null);
      setSelectedIssue(null);
      setIsRunning(false);
      return;
    } catch (e) {
      console.warn('Server rebuild failed, falling back to worker:', e);
    }

    // Fallback: client-side worker transform
    if (!workerRef.current) {
      setIsRunning(false);
      window.alert('Rebuild ≥150 dpi failed: worker not ready and server endpoint unavailable.');
      return;
    }

    try {
      setIsRunning(true);
      setResult(null);
      setSelectedIssue(null);

      const buffer = await file.arrayBuffer();
      const cmd: PreflightWorkerCommand = {
        type: 'upscaleLowResImages',
        fileMeta,
        buffer,
        minDpi: 150,
      };
      workerRef.current.postMessage(cmd, [buffer]);
    } catch (e) {
      console.error('upscaleLowResImages failed', e);
      setIsRunning(false);
      window.alert('Rebuild ≥150 dpi failed: ' + (e as Error).message);
    }
  }, [file, fileMeta, downloadAndRemember]);

  // RGB → CMYK (backend)
  const convertRgbToCmyk = useCallback(async () => {
    if (!file) return;

    try {
      setIsRunning(true);
      setResult(null);
      setSelectedIssue(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/convert/rgb-to-cmyk', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const newFileName =
        file.name.replace(/\.pdf$/i, '') + '_cmyk.pdf';

      downloadAndRemember(blob, newFileName);

      const newFile = new File([blob], newFileName, {
        type: 'application/pdf',
      });
      setFile(newFile);
      setFileMeta({
        name: newFile.name,
        size: newFile.size,
        type: newFile.type,
      });
      setNumPages(0);
      setCurrentPage(1);
    } catch (e) {
      console.error('convertRgbToCmyk failed', e);
      window.alert(
        'RGB → CMYK conversion requires a server-side endpoint (/api/convert/rgb-to-cmyk). Please configure it on the backend.'
      );
    } finally {
      setIsRunning(false);
    }
  }, [file, downloadAndRemember]);

  const onPageChange = useCallback((p: number) => setCurrentPage(p), []);

  const openIssue = useCallback((issue: Issue) => {
    setSelectedIssue(issue);
    if (typeof issue.page === 'number' && issue.page > 0) {
      setCurrentPage(issue.page);
    }
  }, []);

  const handleOpenAIAudit = useCallback((issue: Issue) => {
    setIssueForAudit(issue);
    setAiAuditOpen(true);
  }, []);

  const handleOpenEfficiencyTips = useCallback((issue: Issue) => {
    setIssueForAudit(issue);
    setEfficiencyOpen(true);
  }, []);

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/70 px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6 lg:col-span-4">
              <PreflightDropzone onDrop={onDropFile} />

              {/* ACTIONS */}
              <div className="ppp-actions">
                <button
                  type="button"
                  onClick={runPreflight}
                  disabled={!file || isRunning}
                  className="ppp-action ppp-action--run"
                >
                  <span className="ppp-action__step">1</span>
                  <span className="ppp-action__label">Run Preflight</span>
                </button>

                <button
                  type="button"
                  onClick={convertToGrayscale}
                  disabled={!file || isRunning}
                  className="ppp-action ppp-action--bw"
                >
                  <span className="ppp-action__step">2</span>
                  <span className="ppp-action__label">B&amp;W / Grayscale</span>
                </button>

                <button
                  type="button"
                  onClick={convertRgbToCmyk}
                  disabled={!file || isRunning}
                  className="ppp-action ppp-action--cmyk"
                >
                  <span className="ppp-action__step">3</span>
                  <span className="ppp-action__label">RGB → CMYK</span>
                </button>

                <button
                  type="button"
                  onClick={upscaleLowResImages}
                  disabled={!file || isRunning}
                  className="ppp-action ppp-action--rebuild"
                >
                  <span className="ppp-action__step">4</span>
                  <span className="ppp-action__label">Rebuild ≥150 dpi</span>
                </button>
              </div>

              {lastPdfUrl && (
                <div className="ppp-download-last">
                  <a
                    href={lastPdfUrl}
                    download={lastPdfName || 'output.pdf'}
                    className="ppp-download-last__link"
                  >
                    Download last PDF
                  </a>
                  {lastPdfName ? (
                    <span className="ppp-download-last__name">{lastPdfName}</span>
                  ) : null}
                </div>
              )}

              <IssuesPanel
                result={result}
                onSelectIssue={openIssue}
                emptyHint={t('noIssuesToDisplay')}
                onRunPreflight={runPreflight}
                isRunning={isRunning}
              />

              <PreflightSummary
                fileMeta={fileMeta}
                result={result}
                onRunPreflight={runPreflight}
                isRunning={isRunning}
              />
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-8 sticky top-6 self-start">
              <PageViewer
                file={file}
                numPages={numPages}
                currentPage={currentPage}
                onPageChange={onPageChange}
                onNumPagesChange={setNumPages}
                selectedIssue={selectedIssue}
              />
            </div>
          </div>
        </div>
      </main>

      <FixDrawer
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onOpenAIAudit={handleOpenAIAudit}
        onOpenEfficiencyTips={handleOpenEfficiencyTips}
      />
      <AIAuditModal
        isOpen={aiAuditOpen}
        onClose={() => setAiAuditOpen(false)}
        issue={issueForAudit}
        fileMeta={fileMeta}
        result={result}
      />
      <EfficiencyAuditModal
        isOpen={efficiencyOpen}
        onClose={() => setEfficiencyOpen(false)}
        issue={issueForAudit}
        fileMeta={fileMeta}
        result={result}
      />
    </div>
  );
}
