
import React from 'react';
import { Issue, Severity } from '../types';
import { SEVERITY_COLORS, SEVERITY_ICONS, ISSUE_CATEGORY_LABELS } from '../constants';
import { t } from '../i18n';

interface FixDrawerProps {
  issue: Issue | null;
  geminiApiKey: string | null;
  onAIAuditClick: () => void;
  onEfficiencyAuditClick: () => void;
  geminiKeyMissing: boolean;
}

export const FixDrawer: React.FC<FixDrawerProps> = ({
  issue,
  geminiApiKey,
  onAIAuditClick,
  onEfficiencyAuditClick,
  geminiKeyMissing,
}) => {
  const isDrawerOpen = !!issue;

  return (
    <div
      className={`fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-xl transform
        transition-transform duration-300 ease-in-out z-20 p-6 flex flex-col
        ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      role="complementary"
      aria-hidden={!isDrawerOpen}
      aria-label={t('selectedIssueDetails')}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">{t('selectedIssueDetails')}</h3>
        {/* Close button can be added here if needed, or rely on clicking outside to close by setting selectedIssue to null in App.tsx */}
      </div>

      {!issue ? (
        <div className="flex-grow flex items-center justify-center text-gray-500 text-center">
          <p>{t('selectAnIssue')}</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto pr-2">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-700">{t('currentIssue')}</h4>
            <p className="text-gray-600 mb-2">{issue.message}</p>
            <div className="flex items-center space-x-2 text-sm">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[issue.severity]}`}>
                {SEVERITY_ICONS[issue.severity]} {issue.severity.toUpperCase()}
              </span>
              <span className="text-gray-500">Page: {issue.page}</span>
              <span className="text-gray-500">Category: {ISSUE_CATEGORY_LABELS[issue.category]}</span>
            </div>
          </div>

          {issue.details && (
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-700">{t('details')}</h4>
              <p className="text-gray-600">{issue.details}</p>
            </div>
          )}

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">{t('actions')}</h4>
            <div className="space-y-4">
              <button
                onClick={onAIAuditClick}
                className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm
                  ${geminiKeyMissing ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}
                  transition-colors duration-200`}
                disabled={geminiKeyMissing}
              >
                {t('explainSuggestFix')}
              </button>
              <p className="text-sm text-gray-500 text-center">{t('aiDescriptionExplain')}</p>

              <button
                onClick={onEfficiencyAuditClick}
                className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm
                  ${geminiKeyMissing ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}
                  transition-colors duration-200`}
                disabled={geminiKeyMissing}
              >
                {t('getEfficiencyTips')}
              </button>
              <p className="text-sm text-gray-500 text-center">{t('aiDescriptionEfficiency')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
