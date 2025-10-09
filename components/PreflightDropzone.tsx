
import React, { useCallback } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface PreflightDropzoneProps {
    onFileSelect: (file: File) => void;
    t: Record<string, string>;
}

export const PreflightDropzone: React.FC<PreflightDropzoneProps> = ({ onFileSelect, t }) => {
    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                onFileSelect(file);
            } else {
                alert("Please upload a PDF file.");
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

    const onClick = () => {
        document.getElementById('file-input')?.click();
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div
                onClick={onClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                className="w-full max-w-4xl h-96 flex flex-col items-center justify-center border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors duration-300 bg-white dark:bg-gray-800"
            >
                <input
                    id="file-input"
                    type="file"
                    accept=".pdf"
                    onChange={onFileChange}
                    className="hidden"
                />
                <ArrowUpTrayIcon className="w-24 h-24 text-gray-400 dark:text-gray-500" />
                <p className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-300">{t.uploadTitle}</p>
                <p className="mt-2 text-gray-500 dark:text-gray-400">{t.uploadSubtitle}</p>
            </div>
            <div className="mt-8 flex gap-4">
                <button
                  disabled
                  title={t.uploadDisabled}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 cursor-not-allowed"
                >
                  IDML
                </button>
                 <button
                  disabled
                  title={t.uploadDisabled}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 cursor-not-allowed"
                >
                  ZIP
                </button>
            </div>
        </div>
    );
};
