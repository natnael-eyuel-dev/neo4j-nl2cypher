'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Menu, 
  Sun, 
  Moon, 
  Monitor, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  Database,
  Bell
} from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  user: any;
  onSectionChange: (section: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick, user, onSectionChange }) => {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setShowThemeMenu(false);
  };

  const handleNavigation = (section: string) => {
    onSectionChange(section);   // switch content in HomePage
    setShowUserMenu(false);
    setShowThemeMenu(false);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu button and title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center space-x-2">
            <Database className="h-8 w-8 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Neo4j Query System
            </h1>
          </div>
        </div>

        {/* Right side - Theme toggle and user menu */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'light' ? (
                <Sun size={20} />
              ) : theme === 'dark' ? (
                <Moon size={20} />
              ) : (
                <Monitor size={20} />
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'light' ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Sun size={16} />
                      <span>Light</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'dark' ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Moon size={16} />
                      <span>Dark</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'system' ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Monitor size={16} />
                      <span>System</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <User size={16} className="text-primary-600" />
                  </div>
                )}
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.name}
                </span>
                <ChevronDown size={16} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => handleNavigation('profile')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <User size={16} />
                      <span>Profile</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavigation('settings')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Settings size={16} />
                      <span>Settings</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { handleLogout(); handleNavigation('dashboard'); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <LogOut size={16} />
                      <span>Logout</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => window.location.href = '/api/auth/google'}
              className="btn btn-primary"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showThemeMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowThemeMenu(false);
          }}
        />
      )}
    </header>
  );
};
