import React from 'react';
import type { PreflightProfile, Language } from '../types';
import { DEFAULT_PROFILES } from '../profiles/defaults';

interface HeaderProps {
    activeProfile: PreflightProfile;
    onProfileChange: (profile: PreflightProfile) => void;
    language: Language;
    onLanguageChange: (lang: Language) => void;
    t: Record<string, string>;
    onExportReport: () => void;
    isReportAvailable: boolean;
}

const languages: { id: Language, name: string }[] = [
    { id: 'en', name: 'English' },
    { id: 'es', name: 'Español' },
    { id: 'fr', name: 'Français' },
    { id: 'de', name: 'Deutsch' },
];

export const Header: React.FC<HeaderProps> = ({
    activeProfile,
    onProfileChange,
    language,
    onLanguageChange,
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

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onLanguageChange(event.target.value as Language);
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1.5 2.5a.5.5 0 000 1h5a.5.5 0 000-1h-5zM5 8a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5A.5.5 0 015 8zm0 2a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2A.5.5 0 015 10zm10-4.5a.5.5 0 00-.5-.5h-2a.5.5 0 000 1h2a.5.5 0 00.5-.5zM15 8a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2a.5.5 0 01.5.5zm-5 6.5a.5.5 0 000 1h5a.5.5 0 000-1h-5z" clipRule="evenodd" />
                </svg>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">PDF Preflight</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="profile-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.preflightProfile}:</label>
                    <select
                        id="profile-select"
                        value={activeProfile.id}
                        onChange={handleProfileChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        {DEFAULT_PROFILES.map(profile => (
                            <option key={profile.id} value={profile.id}>{t[profile.name] || profile.name}</option>
                        ))}
                    </select>
                </div>
                 <div className="flex items-center gap-2">
                    <label htmlFor="language-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.language}:</label>
                    <select
                        id="language-select"
                        value={language}
                        onChange={handleLanguageChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        {languages.map(lang => (
                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={onExportReport}
                    disabled={!isReportAvailable}
                    title={isReportAvailable ? t.exportReport : t.reportNotAvailable}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {t.exportReport}
                </button>
            </div>
        </header>
    );
};
