
import React from 'react';
import { t } from '../i18n';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t('appName')}
        </h1>
        {/* Potentially add navigation or user info here */}
      </div>
    </header>
  );
};
