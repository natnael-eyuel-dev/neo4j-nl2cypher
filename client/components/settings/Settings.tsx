'use client';

import React, { useCallback, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Save,
  User,
  Database,
  LogOut,
  AlertCircle
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'appearance' | 'account' | 'databases'>('appearance');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  const updatePreferences = async (newTheme: string) => {
    setSaving(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/profile/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          theme: newTheme
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setError(error instanceof Error ? error.message : 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
    if (user) {
      await updatePreferences(newTheme);
    }
  };

  const goToSection = useCallback((section: 'appearance' | 'account' | 'databases') => {
    setActiveSection(section);
    const el = document.getElementById(`settings-${section}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      logout();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your application preferences
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-700 dark:text-green-300">
            Preferences updated successfully!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <nav className="space-y-2">
              <button
                type="button"
                onClick={() => goToSection('appearance')}
                className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors ${
                  activeSection === 'appearance'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                }`}
              >
                <Sun className="h-4 w-4 inline mr-2" />
                Appearance
              </button>

              <button
                type="button"
                onClick={() => goToSection('account')}
                className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors ${
                  activeSection === 'account'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Account
              </button>

              {user?.customDatabases && user.customDatabases.length > 0 && (
                <button
                  type="button"
                  onClick={() => goToSection('databases')}
                  className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors ${
                    activeSection === 'databases'
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                  }`}
                >
                  <Database className="h-4 w-4 inline mr-2" />
                  Databases
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Theme Settings */}
          <div id="settings-appearance" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 scroll-mt-24">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Appearance
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleThemeChange(option.value)}
                      disabled={saving}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                        theme === option.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <option.icon className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div id="settings-account" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 scroll-mt-24">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Account
            </h2>
            
            <div className="space-y-4">
              {user && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Google Account
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-3 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Database Settings - Only show if user has custom databases */}
          {user?.customDatabases && user.customDatabases.length > 0 && (
            <div id="settings-databases" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 scroll-mt-24">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Databases
              </h2>
              
              <div className="space-y-3">
                {user.customDatabases.map((db) => (
                  <div key={db._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {db.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {db.uri}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                      Connected
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saving Indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Saving preferences...</span>
        </div>
      )}
    </div>
  );
};