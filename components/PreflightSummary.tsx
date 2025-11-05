
import React, { useMemo } from 'react';
import { PreflightResult, IssueCategory, Severity } from '../types';
import { ISSUE_CATEGORY_LABELS, SEVERITY_COLORS } from '../constants';
import { t } from '../i18n';
import { CheckCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface PreflightSummaryProps {
  score: number;
  summary: string;
  issues: PreflightResult['issues'];
}

export const PreflightSummary: React.FC<PreflightSummaryProps> = ({ score, summary, issues }) => {
  const categoryCounts = useMemo(() => {
    const counts: {
      [key in IssueCategory]?: {
        total: number;
        [Severity.INFO]?: number;
        [Severity.WARNING]?: number;
        [Severity.ERROR]?: number;
      };
    } = {};

    issues.forEach(issue => {
      if (!counts[issue.category]) {
        counts[issue.category] = { total: 0 };
      }
      counts[issue.category]!.total++;
      if (issue.severity) {
        counts[issue.category]![issue.severity] = (counts[issue.category]![issue.severity] || 0) + 1;
      }
    });
    return counts;
  }, [issues]);

  const renderSeverityIcon = (severity: Severity) => {
    const iconClass = `h-4 w-4 mr-1 inline-block`;
    switch (severity) {
      case Severity.ERROR:
        return <ExclamationCircleIcon className={`${iconClass} text-red-600`} />;
      case Severity.WARNING:
        return <ExclamationTriangleIcon className={`${iconClass} text-orange-600`} />;
      case Severity.INFO:
        return <InformationCircleIcon className={`${iconClass} text-blue-600`} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">{t('issuesSummary')}</h2>

      <div className="flex items-center mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-200 mr-4 flex-shrink-0">
          <span className="text-3xl font-bold text-gray-800">{score}</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700">{t('overallScore')}</h3>
          <p className="text-gray-600">{summary}</p>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-3">{t('issueCategories')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(IssueCategory).map(category => (
          <div key={category} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              {ISSUE_CATEGORY_LABELS[category]}
              {categoryCounts[category]?.total ? (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-800">
                  {categoryCounts[category]?.total}
                </span>
              ) : (
                <CheckCircleIcon className="h-5 w-5 ml-2 text-green-500" />
              )}
            </h4>
            {categoryCounts[category]?.total ? (
              <ul className="text-sm text-gray-600">
                {categoryCounts[category]?.[Severity.ERROR] && (
                  <li className="flex items-center">
                    {renderSeverityIcon(Severity.ERROR)}
                    <span>{categoryCounts[category]?.[Severity.ERROR]} Errors</span>
                  </li>
                )}
                {categoryCounts[category]?.[Severity.WARNING] && (
                  <li className="flex items-center">
                    {renderSeverityIcon(Severity.WARNING)}
                    <span>{categoryCounts[category]?.[Severity.WARNING]} Warnings</span>
                  </li>
                )}
                {categoryCounts[category]?.[Severity.INFO] && (
                  <li className="flex items-center">
                    {renderSeverityIcon(Severity.INFO)}
                    <span>{categoryCounts[category]?.[Severity.INFO]} Info</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No issues in this category.</p>
            )}
          </div>
        ))}
      </div>
      {issues.length === 0 && (
        <p className="mt-6 text-center text-lg text-green-700 font-semibold">
          🎉 {t('noIssuesFound')}
        </p>
      )}
    </div>
  );
};
