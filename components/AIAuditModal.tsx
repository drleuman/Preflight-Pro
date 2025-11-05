
import React, { useState, useEffect, useCallback } from 'react';
import { Issue } from '../types';
import { ModalProps } from '../types';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { SafeHtmlMarkdown } from './SafeHtmlMarkdown';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { t } from '../i18n';

interface AIAuditModalProps extends ModalProps {
  issue: Issue | null;
  geminiApiKey: string | null;
}

export const AIAuditModal: React.FC<AIAuditModalProps> = ({ isOpen, onClose, issue, geminiApiKey }) => {
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAIExplanation = useCallback(async () => {
    if (!issue || !geminiApiKey) {
      setError(t('geminiKeyMissingError'));
      return;
    }

    setLoading(true);
    setError(null);
    setAiResponse(null);

    const prompt = `
      You are an expert preflight analyst for print production.
      Explain the following PDF preflight issue and provide step-by-step suggestions on how to fix it,
      assuming the user might be using professional tools like Adobe InDesign or Acrobat.
      Be concise, clear, and actionable. Use Markdown for formatting.

      Issue Details:
      - Category: ${issue.category}
      - Severity: ${issue.severity}
      - Page: ${issue.page}
      - Message: ${issue.message}
      ${issue.details ? `- Details: ${issue.details}` : ''}
    `;

    try {
      // Create a new GoogleGenAI instance right before making an API call
      // to ensure it always uses the most up-to-date API key.
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });
      setAiResponse(response.text);
    } catch (e: any) {
      console.error('Gemini API Error:', e);
      setError(t('aiError'));
      // Specific error handling for "Requested entity was not found." for Veo, not strictly for text models,
      // but good to keep in mind if we expand model usage.
    } finally {
      setLoading(false);
    }
  }, [issue, geminiApiKey]);

  useEffect(() => {
    if (isOpen && issue && geminiApiKey) {
      fetchAIExplanation();
    } else if (!isOpen) {
      // Clear state when modal closes
      setAiResponse(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, issue, geminiApiKey, fetchAIExplanation]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      aria-modal="true"
      role="dialog"
      aria-labelledby="ai-audit-modal-title"
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 transform scale-95 opacity-0 animate-fade-in"
           onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 id="ai-audit-modal-title" className="text-xl font-semibold text-gray-800">
            {t('aiAuditTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label={t('close')}
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-grow">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-200 h-12 w-12 mb-4 animate-spin"></div>
              <p className="text-gray-600">{t('fetchingAIResponse')}</p>
            </div>
          )}
          {error && <p className="text-red-500 text-center p-4">{error}</p>}
          {aiResponse && (
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('aiResponse')}</h3>
              <SafeHtmlMarkdown markdown={aiResponse} className="markdown-body p-2 bg-gray-50 rounded-md" />
            </div>
          )}
          {!loading && !error && !aiResponse && issue && geminiApiKey && (
             <p className="text-gray-500 text-center">No AI response yet. Click "Explain & Suggest Fix" to generate.</p>
          )}
          {!geminiApiKey && (
             <p className="text-red-500 text-center">{t('geminiKeyMissingError')}</p>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
