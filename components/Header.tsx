
import React from 'react';
import type { PreflightProfile, Translations } from '../types';
import { DEFAULT_PROFILES } from '../profiles/defaults';
import { DocumentArrowDownIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
    activeProfile: PreflightProfile;
    onProfileChange: (profile: PreflightProfile) => void;
    t: Translations;
    onExportReport: () => void;
    isReportAvailable: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    activeProfile,
    onProfileChange,
    t,
    onExportReport,
    isReportAvailable
}) => {
    
    const handleProfileChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const profileId = event.target.value;
        const newProfile = DEFAULT_PROFILES.find(p => p.id === profileId);
        if (newProfile) {
            onProfileChange(newProfile);
        }
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
                <DocumentChartBarIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-xl font-bold">Print Price Pro Preflight</h1>
            </div>
            <div className="flex items-center gap-4">
                <div>
                    <label htmlFor="profile-select" className="text-sm font-medium mr-2">{t.preflightProfile}</label>
                    <select
                        id="profile-select"
                        value={activeProfile.id}
                        onChange={handleProfileChange}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600"
                    >
                        {DEFAULT_PROFILES.map(profile => (
                            <option key={profile.id} value={profile.id}>
                                {/* FIX: Cast the translation lookup result to string to satisfy React's renderable type requirement. */}
                                {(t[profile.name as keyof typeof t] || profile.name) as string}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={onExportReport}
                    disabled={!isReportAvailable}
                    title={isReportAvailable ? t.exportReport : t.reportNotAvailable}
                    className="flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    {t.exportReport}
                </button>
            </div>
        </header>
    );
};