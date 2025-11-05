
import React from 'react';
import { Issue, Severity } from '../types';
import { SEVERITY_COLORS, SEVERITY_ICONS } from '../constants';
import { t } from '../i18n';

interface IssuesPanelProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onIssueSelect: (issue: Issue) => void;
}

export const IssuesPanel: React.FC<IssuesPanelProps> = ({ issues, selectedIssue, onIssueSelect }) => {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4">{t('issuesFound')} ({issues.length})</h2>
      {issues.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-gray-500 text-center">
          <p>{t('noIssuesToDisplay')}</p>
        </div>
      ) : (
        <div className="overflow-auto flex-grow border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('severity')}
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('page')}
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('message')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  className={`cursor-pointer hover:bg-gray-50 ${selectedIssue?.id === issue.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  onClick={() => onIssueSelect(issue)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedIssue?.id === issue.id}
                  aria-label={`${t('severity')}: ${issue.severity}, ${t('page')}: ${issue.page}, ${t('message')}: ${issue.message}`}
                >
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[issue.severity]}`}>
                      {SEVERITY_ICONS[issue.severity]} {issue.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                    {issue.page}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {issue.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
