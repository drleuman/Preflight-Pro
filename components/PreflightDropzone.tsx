
import React, { useCallback } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import type { Translations } from '../types';

interface PreflightDropzoneProps {
    onFileSelect: (file: File) => void;
    t: Translations;
}

export const PreflightDropzone: React.FC<PreflightDropzoneProps> = ({ onFileSelect, t }) => {
    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            const fileType = file.name.split('.').pop()?.toLowerCase();
            if (file.type === 'application/pdf' || fileType === 'idml' || file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || fileType === 'zip') {
                onFileSelect(file);
            } else {
                alert("Please upload a PDF, IDML, or ZIP file.");
            }
            event.dataTransfer.clearData();
        }
    }, [onFileSelect]);

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            onFileSelect(event.target.files[0]);
        }
    };

    const handleClick = () => {
        document.getElementById('file-input')?.click();
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div
                role="button"
                tabIndex={0}
                aria-label={t.uploadTitle}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                onDrop={onDrop}
                onDragOver={onDragOver}
                className="w-full max-w-4xl h-96 flex flex-col items-center justify-center border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors duration-300 bg-white dark:bg-gray-800"
            >
                <input
                    id="file-input"
                    type="file"
                    accept=".pdf" // Only accept PDF for now
                    onChange={onFileChange}
                    className="hidden"
                    aria-hidden="true"
                />
                <ArrowUpTrayIcon className="w-24 h-24 text-gray-400 dark:text-gray-500" />
                <p className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-300">{t.uploadTitle}</p>
                <p className="mt-2 text-gray-500 dark:text-gray-400">{t.uploadSubtitle}</p>
            </div>
            <div className="mt-8 flex gap-4">
                <button
                  disabled
                  title="Próximamente"
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                  IDML
                </button>
                 <button
                  disabled
                  title="Próximamente"
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArchiveBoxIcon className="w-5 h-5 text-purple-500" />
                  ZIP
                </button>
            </div>
        </div>
    );
};
