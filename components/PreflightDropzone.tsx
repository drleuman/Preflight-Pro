
import React, { useState, useCallback } from 'react';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { t } from '../i18n';

interface PreflightDropzoneProps {
  onFileSelect: (file: File) => void;
}

export const PreflightDropzone: React.FC<PreflightDropzoneProps> = ({ onFileSelect }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
    setError(null); // Clear error on new drag
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onFileSelect(file);
      } else {
        setError(t('invalidFileType'));
      }
    }
  }, [onFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        onFileSelect(file);
        setError(null);
      } else {
        setError(t('invalidFileType'));
      }
    }
  }, [onFileSelect]);

  return (
    <div
      className={`relative p-8 border-2 border-dashed rounded-lg text-center cursor-pointer
        transition-all duration-200 ease-in-out
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
      role="button"
      tabIndex={0}
      aria-label={t('dragDropPrompt')}
    >
      <input
        id="fileInput"
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <div className="flex flex-col items-center justify-center">
        <DocumentArrowUpIcon className={`w-16 h-16 mb-4 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
        <p className={`text-xl font-semibold ${isDragActive ? 'text-blue-700' : 'text-gray-700'}`}>
          {t('dragDropPrompt')}
        </p>
        {error && (
          <p className="mt-4 text-red-500 font-medium">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
