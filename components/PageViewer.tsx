
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { Issue, Bbox } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { t } from '../i18n';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

interface PageViewerProps {
  file: File | null;
  numPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  selectedIssue: Issue | null;
}

export const PageViewer: React.FC<PageViewerProps> = ({
  file,
  numPages,
  currentPage,
  onPageChange,
  selectedIssue,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState(1.5); // Initial scale for rendering

  // Effect to load PDF when file changes
  useEffect(() => {
    const loadPdf = async () => {
      if (!file) {
        if (pdfRef.current) {
          pdfRef.current.destroy();
          pdfRef.current = null;
        }
        return;
      }

      const fileReader = new FileReader();
      fileReader.onload = async () => {
        const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
        try {
          const loadingTask = pdfjsLib.getDocument({ data: typedArray });
          const pdf = await loadingTask.promise;
          pdfRef.current = pdf;
          // onNumPagesChange(pdf.numPages); // Would inform App.tsx about actual page count
          onPageChange(1); // Reset to first page
        } catch (error) {
          console.error("Error loading PDF:", error);
          // TODO: handle PDF loading error in UI
        }
      };
      fileReader.readAsArrayBuffer(file);

      return () => {
        if (pdfRef.current) {
          pdfRef.current.destroy();
          pdfRef.current = null;
        }
      };
    };

    loadPdf();
  }, [file]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Effect to render page when currentPage, scale, or selectedIssue changes
  useEffect(() => {
    const renderPage = async () => {
      const canvas = canvasRef.current;
      if (!canvas || !pdfRef.current || currentPage < 1 || currentPage > numPages) {
        return;
      }

      try {
        const page = await pdfRef.current.getPage(currentPage);
        const viewport = page.getViewport({ scale: scale });
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Draw bounding box if an issue is selected for this page
        if (selectedIssue && selectedIssue.page === currentPage && selectedIssue.bbox) {
          drawBbox(context, selectedIssue.bbox, viewport.width, viewport.height);
        }
      } catch (error) {
        console.error(`Error rendering page ${currentPage}:`, error);
        // TODO: handle page rendering error in UI
      }
    };

    renderPage();
  }, [currentPage, numPages, scale, selectedIssue]);

  const drawBbox = useCallback((ctx: CanvasRenderingContext2D, bbox: Bbox, canvasWidth: number, canvasHeight: number) => {
    const x = bbox.x * canvasWidth;
    const y = bbox.y * canvasHeight;
    const width = bbox.width * canvasWidth;
    const height = bbox.height * canvasHeight;

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; // Semi-transparent red fill
    ctx.strokeRect(x, y, width, height);
    ctx.fillRect(x, y, width, height);
  }, []);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < numPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, numPages, onPageChange]);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const pageNum = parseInt(e.target.value, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      onPageChange(pageNum);
    }
  }, [numPages, onPageChange]);

  if (!file) {
    return (
      <div className="flex flex-grow items-center justify-center text-gray-500">
        <p>{t('noPdfLoaded')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center flex-grow overflow-hidden">
      <div className="flex items-center mb-4 sticky top-0 bg-white p-2 rounded-lg shadow-sm z-10">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={t('prevPage')}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="mx-4 flex items-center">
          <label htmlFor="page-input" className="sr-only">{t('goToPage')}</label>
          <input
            id="page-input"
            type="number"
            value={currentPage}
            onChange={handlePageInputChange}
            className="w-16 text-center border border-gray-300 rounded-md py-1 mx-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            max={numPages}
            aria-label={`${t('goToPage')} ${currentPage} of ${numPages}`}
            title={t('typePageNumber')}
          />
          <span className="text-gray-700">of {numPages}</span>
        </div>
        <button
          onClick={handleNextPage}
          disabled={currentPage >= numPages}
          className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={t('nextPage')}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-grow overflow-auto p-4 bg-gray-50 border border-gray-200 rounded-lg w-full max-w-full flex justify-center items-start">
        <canvas ref={canvasRef} className="shadow-lg border border-gray-300 max-w-full h-auto"></canvas>
      </div>
    </div>
  );
};
