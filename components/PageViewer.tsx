import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy, PageViewport, RenderTask } from 'pdfjs-dist';
import type { Issue } from '../types';

// Set worker source to a robust UMD build from a reliable CDN to ensure consistency.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.worker.min.js`;

interface PageViewerProps {
    pdfFile: File;
    issue: Issue | null;
}

export const PageViewer: React.FC<PageViewerProps> = ({ pdfFile, issue }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [zoom, setZoom] = useState(1);
    const pageCache = useRef<Map<number, PDFPageProxy>>(new Map());
    const renderTaskRef = useRef<RenderTask | null>(null);

    const [pageInput, setPageInput] = useState('1');
    const [isPageHighlighted, setIsPageHighlighted] = useState(false);
    const highlightTimeoutRef = useRef<number | null>(null);

    const getPage = useCallback(async (pageNum: number): Promise<PDFPageProxy | null> => {
        const doc = pdfDocRef.current;
        if (!doc || pageNum < 1 || pageNum > doc.numPages) {
            return null;
        }
        if (pageCache.current.has(pageNum)) {
            return pageCache.current.get(pageNum)!;
        }
        const page = await doc.getPage(pageNum);
        pageCache.current.set(pageNum, page);
        return page;
    }, []);

    useEffect(() => {
        pageCache.current.clear(); // Clear cache for new file

        const loadPdf = async () => {
            // Destroy previous doc if exists
            if (pdfDocRef.current) {
                pdfDocRef.current.destroy();
                pdfDocRef.current = null;
            }

            // Fallback for worker
            try {
                await fetch(pdfjsLib.GlobalWorkerOptions.workerSrc, { method: 'HEAD', mode: 'no-cors' });
            } catch {
                console.warn('PDF.js worker CDN is not reachable, creating a fallback from blob.');
                try {
                    const txt = await (await fetch('https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.worker.min.js')).text();
                    const blob = new Blob([txt], { type: 'application/javascript' });
                    pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
                } catch (e) {
                     console.error("Failed to create blob fallback for PDF.js worker", e);
                }
            }

            const typedarray = new Uint8Array(await pdfFile.arrayBuffer());
            const loadingTask = pdfjsLib.getDocument(typedarray);
            const pdf = await loadingTask.promise;
            pdfDocRef.current = pdf;
            setPdfDoc(pdf);
            setTotalPages(pdf.numPages);
            setCurrentPage(1);
            setZoom(1);
        };
        
        loadPdf().catch(console.error);

        return () => {
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
            if (pdfDocRef.current) {
                pdfDocRef.current.destroy();
                pdfDocRef.current = null;
            }
            pageCache.current.clear();
        };
    }, [pdfFile]);
    
    const drawOverlay = useCallback(async () => {
        const canvas = overlayCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (issue && issue.page === currentPage && issue.bbox) {
            const page = await getPage(currentPage);
            if (!page) return;

            const viewport = page.getViewport({ scale: zoom });
            
            const { x: boxX, y: boxY, width: boxWidth, height: boxHeight } = issue.bbox;
            const p1 = [boxX, boxY];
            const p2 = [boxX + boxWidth, boxY];
            const p3 = [boxX, boxY + boxHeight];
            const p4 = [boxX + boxWidth, boxY + boxHeight];
            const transform = viewport.transform;

            const tp1 = pdfjsLib.Util.applyTransform(p1, transform);
            const tp2 = pdfjsLib.Util.applyTransform(p2, transform);
            const tp3 = pdfjsLib.Util.applyTransform(p3, transform);
            const tp4 = pdfjsLib.Util.applyTransform(p4, transform);

            const minX = Math.min(tp1[0], tp2[0], tp3[0], tp4[0]);
            const minY = Math.min(tp1[1], tp2[1], tp3[1], tp4[0]);
            const maxX = Math.max(tp1[0], tp2[0], tp3[0], tp4[0]);
            const maxY = Math.max(tp1[1], tp2[1], tp3[1], tp4[1]);
            
            const transformedBbox = [minX, minY, maxX, maxY];

            const x = transformedBbox[0];
            const y = transformedBbox[1];
            const width = transformedBbox[2] - transformedBbox[0];
            const height = transformedBbox[3] - transformedBbox[1];
            
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        }
    }, [issue, currentPage, zoom, getPage]);
    
    // Sync input when currentPage changes from props or internal navigation
    useEffect(() => {
        setPageInput(String(currentPage));
    }, [currentPage]);
    
    // Highlight when a new issue is selected
    useEffect(() => {
        if (issue) {
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
            setIsPageHighlighted(true);
            highlightTimeoutRef.current = window.setTimeout(() => {
                setIsPageHighlighted(false);
            }, 1500);
        }
        return () => {
            if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
        };
    }, [issue]);

    useEffect(() => {
        if (!pdfDoc) return;

        let isCancelled = false;

        const render = async () => {
            // Always cancel any existing task before starting a new one.
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }

            const page = await getPage(currentPage);
            if (isCancelled || !page) return;

            const canvas = canvasRef.current;
            const overlayCanvas = overlayCanvasRef.current;
            if (isCancelled || !canvas || !overlayCanvas) return;

            const viewport = page.getViewport({ scale: zoom });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            overlayCanvas.height = viewport.height;
            overlayCanvas.width = viewport.width;
            
            const canvasCtx = canvas.getContext('2d');
            if (!canvasCtx) {
                console.error("Could not get 2D context from canvas");
                return;
            }
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            const overlayCtx = overlayCanvas.getContext('2d');
            overlayCtx?.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

            // The pdf.js runtime correctly uses 'canvasContext', but the project's TypeScript definitions
            // may be mismatched and incorrectly expect a different property.
            const renderContext = {
                canvasContext: canvasCtx,
                viewport: viewport,
            };

            // Fix: Cast to 'any' to bypass a TypeScript type error where the type definition
            // incorrectly requires a 'canvas' property. The object passed is correct for the runtime.
            const task = page.render(renderContext as any);
            renderTaskRef.current = task;

            try {
                await task.promise;
                if (!isCancelled) {
                    drawOverlay();
                }
            } catch (error: any) {
                if (error.name !== 'RenderingCancelledException') {
                    console.error("Page render error:", error);
                }
            } finally {
                if (renderTaskRef.current === task) {
                    renderTaskRef.current = null;
                }
            }
        };

        render();
        
        const prefetchAndClean = () => {
            const neighbors = [currentPage - 1, currentPage + 1];
            for (const pageNum of neighbors) {
                if (pageNum > 0 && pageNum <= totalPages) {
                    getPage(pageNum);
                }
            }

            const pagesToKeep = new Set([currentPage, currentPage - 1, currentPage + 1, currentPage - 2, currentPage + 2]);
            for (const pageNum of pageCache.current.keys()) {
                if (!pagesToKeep.has(pageNum)) {
                    pageCache.current.delete(pageNum);
                }
            }
        };
        const timeoutId = setTimeout(prefetchAndClean, 100);

        return () => {
            isCancelled = true;
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
            clearTimeout(timeoutId);
        };
    }, [pdfDoc, currentPage, totalPages, zoom, drawOverlay, getPage]);
    
    // Jump to the issue's page and "snap back" if the user navigates away.
    useEffect(() => {
        if (issue && issue.page !== currentPage) {
            setCurrentPage(issue.page);
        }
    }, [issue, currentPage]);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };
    
    const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 2.0));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.75));
    
    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageInput(e.target.value);
    };

    const handlePageCommit = () => {
        const pageNum = parseInt(pageInput, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            if (pageNum !== currentPage) {
                setCurrentPage(pageNum);
            }
        } else {
            // Reset to current page if input is invalid
            setPageInput(String(currentPage));
        }
    };

    const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handlePageCommit();
            e.currentTarget.blur();
        } else if (e.key === 'Escape') {
            setPageInput(String(currentPage));
            e.currentTarget.blur();
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevPage} disabled={currentPage <= 1} className="p-1 rounded-md disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Previous Page">‹</button>
                    <div className="text-sm flex items-center">
                        <label htmlFor="page-input" className="sr-only">Current Page</label>
                        <input
                            id="page-input"
                            type="text"
                            inputMode="numeric"
                            value={pageInput}
                            onChange={handlePageInputChange}
                            onBlur={handlePageCommit}
                            onKeyDown={handlePageInputKeyDown}
                            className={`w-12 text-center rounded-md bg-gray-200 dark:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isPageHighlighted ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''}`}
                            aria-describedby="total-pages"
                        />
                        <span id="total-pages" className="px-2">of {totalPages}</span>
                    </div>
                    <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="p-1 rounded-md disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Next Page">›</button>
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={handleZoomOut} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">-</button>
                    <span>{(zoom * 100).toFixed(0)}%</span>
                    <button onClick={handleZoomIn} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">+</button>
                </div>
            </div>
            <div className="flex-grow overflow-auto bg-gray-200 dark:bg-gray-900 rounded-md relative flex items-center justify-center">
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }}/>
                <canvas ref={overlayCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}/>
            </div>
        </div>
    );
};
