'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LogOut, User, Moon, Sun, Monitor } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, logout, updateUserPreferences } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <User className="h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No profile loaded</p>
      </div>
    );
  }

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    try {
      await updateUserPreferences({ theme: newTheme });
    } catch (err) {
      console.error('Failed to update theme preference:', err);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    setLoading(false);
  };

  return (
    <div className="h-full p-6 mb-5 bg-white dark:bg-gray-800 space-y-6">
      {/* User Info */}
      <div className="flex items-center space-x-4">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full" />
        ) : (
          <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <User className="h-8 w-8 text-primary-600" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Theme Preference */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => handleThemeChange('light')}
            className={`p-2 rounded-lg border ${
              theme === 'light'
                ? 'bg-primary-100 dark:bg-primary-900/20 border-primary-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <Sun className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`p-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-primary-100 dark:bg-primary-900/20 border-primary-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <Moon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={`p-2 rounded-lg border ${
              theme === 'system'
                ? 'bg-primary-100 dark:bg-primary-900/20 border-primary-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <Monitor className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {loading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
};
