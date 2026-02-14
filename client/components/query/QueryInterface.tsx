'use client';

import React, { useState } from 'react';
import { QueryInput } from './QueryInput';
import { QueryResults } from './QueryResults';
import { QueryHistory } from './QueryHistory';
import { QuerySuggestions } from './QuerySuggestions';
import { DatabaseSchema } from './DatabaseSchema';

interface QueryInterfaceProps {
  database: any;
  user: any;
  onQueryExecute: (results: any, query: string) => void;
}

interface QueryResult {
  data?: any;
  error?: string;
  prompt?: string;
  cypherQuery?: string;
  explanation?: string;
  metadata?: {
    executionTime?: number;
    tokensUsed?: number;
    modelUsed?: string;
  };
}

export const QueryInterface: React.FC<QueryInterfaceProps> = ({ database, user, onQueryExecute }) => {
  const [activeTab, setActiveTab] = useState<'query' | 'schema' | 'history'>('query');
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const token = localStorage.getItem('authToken');

  // useEffect to reset state when database changes
  React.useEffect(() => {
    // Reset query results when database changes
    setQueryResults(null);
    
    // Switch to query tab when database changes
    setActiveTab('query');
  }, [database?.id]);

  const handleQuerySubmit = async (query: string) => {
    if (!database?.id) {
      setQueryResults({
        error: 'No database selected. Please select a database first.'
      });
      return;
    }

    setIsExecuting(true);
    setQueryResults(null);
    
    try {
      const response = await fetch('/api/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          prompt: query,
          databaseId: database.id, // Use database ID instead of type/name
          databaseType: database.type,
          databaseName: database.name
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setQueryResults(result.data);
        setActiveTab('query');

        if (onQueryExecute) {
          onQueryExecute(result.data, query);
        }
      } else {
        throw new Error(result.error || 'Query execution failed');
      }
    } catch (error) {
      console.error('Query error:', error);
      setQueryResults({
        error: error instanceof Error ? error.message : 'Failed to execute query. Please try again.',
        prompt: query
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Add function to handle schema viewing
  const handleViewSchema = () => {
    setActiveTab('schema');
  };

  // Add useEffect to handle tab changes
  React.useEffect(() => {
    if (activeTab === 'schema' && database?.id) {
      fetchSchema();
    }
  }, [activeTab, database?.id]);

  const [schema, setSchema] = useState<any>(null);
const [schemaLoading, setSchemaLoading] = useState(false);
const [schemaError, setSchemaError] = useState<string | null>(null);

  const fetchSchema = async () => {
    if (!database?.id) return;
    
    setSchemaLoading(true);
    setSchemaError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/databases/${database.id}/schema`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchema(data.data);
      } else {
        throw new Error('Failed to fetch schema');
      }
    } catch (error) {
      setSchemaError(error instanceof Error ? error.message : 'Failed to load schema');
    } finally {
      setSchemaLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('query')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'query'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Query Builder
          </button>
          
          <button
            onClick={() => setActiveTab('schema')}
            disabled={!database}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'schema'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } ${!database ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Database Schema
          </button>
          
          {user && (
            <button
              onClick={() => setActiveTab('history')}
              disabled={!database}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } ${!database ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Query History
            </button>
          )}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {activeTab === 'query' && (
          <div className="h-full flex flex-col">
            {/* Query Input Section */}
            <div className="flex-shrink-0 p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <QueryInput 
                onSubmit={handleQuerySubmit}
                isExecuting={isExecuting}
                database={database}
                disabled={!database}
              />
            </div>

            {/* Results Section */}
            <div className="p-6 flex-1 bg-gray-50 dark:bg-gray-900">
              {!database ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Database Selected
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please select a database from the sidebar to start querying
                  </p>
                </div>
              ) : queryResults ? (
                <QueryResults 
                  results={queryResults}
                  database={database}
                  user={user}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Ready to Query
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Type your question in natural language above to get started
                  </p>
                </div>
              )}
            </div>

            {/* Query Suggestions */}
            {database && (
              <div className="flex-shrink-0 p-6 bg-gray-50 dark:bg-gray-900">
                <QuerySuggestions 
                  database={database} 
                  onSuggestionClick={handleQuerySubmit} 
                  disabled={isExecuting}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'schema' && (
          <DatabaseSchema
            database={database}
            schema={schema}
            loading={schemaLoading}
            error={schemaError}
            onRefresh={fetchSchema}
          />
        )}

        {activeTab === 'history' && user && (
          <QueryHistory 
            user={user} 
            database={database} 
          />
        )}
      </div>
    </div>
  );
};