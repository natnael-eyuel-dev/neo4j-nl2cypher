'use client';

import React, { useState } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseSelector } from '@/components/database/DatabaseSelector';
import { QueryInterface } from '@/components/query/QueryInterface';
import { ResultsDisplay } from '@/components/results/ResultsDisplay';
import { WelcomeScreen } from '@/components/welcome/WelcomeScreen';

interface MainContentProps {
  user: any;
}

export const MainContent: React.FC<MainContentProps> = ({ user }) => {
  const { selectedDatabase } = useDatabase();
  const [activeTab, setActiveTab] = useState<'query' | 'results' | 'history'>('query');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [lastQuery, setLastQuery] = useState<string>('');

  // Function to handle query execution from QueryInterface
  const handleQueryResults = (apiResponse: any, query: string) => {
    setQueryResults(apiResponse);
    setLastQuery(query);
    setActiveTab('results');    // Auto-switch to results tab
  };

  if (!selectedDatabase) {
    return <WelcomeScreen />;
  }

  return (
    <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="h-full flex flex-col">
        {/* Database Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedDatabase.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {selectedDatabase.description}
              </p>
            </div>
            <DatabaseSelector />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('query')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'query'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Query Builder
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'results'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Results
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                History
              </button>
            )}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'query' && (
            <QueryInterface 
              database={selectedDatabase} 
              user={user} 
              onQueryExecute={handleQueryResults}
            />
          )}
          {activeTab === 'results' && (
            <ResultsDisplay 
              database={selectedDatabase} 
              results={queryResults} 
              query={lastQuery}      
              onQueryExecute={handleQueryResults} 
            />
          )}
          {activeTab === 'history' && user && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Query History
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your previous queries will appear here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};