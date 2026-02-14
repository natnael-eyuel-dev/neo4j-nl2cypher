'use client';

import React, { useState } from 'react';
import { 
  Copy, Check, Star, Share2, Download, Eye, EyeOff, 
  Database, Code, MessageSquare, BarChart3, Network 
} from 'lucide-react';
import { GraphVisualization } from '../results/GraphVisualization';
import { DataTable } from '../results/DataTable';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QueryResultsProps {
  results: any;
  database: any;
  user: any;
}

export const QueryResults: React.FC<QueryResultsProps> = ({ results, database, user }) => {
  const [copied, setCopied] = useState(false);
  const [showCypher, setShowCypher] = useState(true);
  const [showExplanation, setShowExplanation] = useState(true);
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSaveToFavorites = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          prompt: results.prompt,
          cypherQuery: results.cypherQuery,
          databaseType: database.type,
          databaseName: database.name,
          results: results.results,
          explanation: results.explanation,
          isFavorite: true
        })
      });

      if (response.ok) console.log('Saved to favorites');
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  if (results.error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-sm font-medium">!</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Query Error</h3>
            <p className="text-red-700 dark:text-red-300 mt-1">{results.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Query Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Query</h3>
            <div className="prose dark:prose-invert max-w-none text-lg text-gray-700 dark:text-gray-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {results.prompt}
              </ReactMarkdown>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {user && (
              <button
                onClick={handleSaveToFavorites}
                className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                title="Save to favorites"
              >
                <Star className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => handleCopy(results.prompt)}
              className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
              title="Copy query"
            >
              {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
            </button>
            <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Share">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results Summary */}
        {results.results && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Nodes</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {results.results.nodes?.length || 0}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Network className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Relationships</span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {results.results.relationships?.length || 0}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Results</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                {results.results.records?.length || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cypher Query */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Cypher Query</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCypher(!showCypher)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showCypher ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => handleCopy(results.cypherQuery)}
              className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {showCypher && (
          <div className="p-4">
            <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm text-gray-800 dark:text-gray-200 font-mono">
              <code>{results.cypherQuery}</code>
            </pre>
          </div>
        )}
      </div>

      {/* AI Explanation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Explanation</h3>
          </div>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showExplanation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {showExplanation && (
          <div className="p-4 prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {results.explanation}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Results Visualization */}
      {results.results && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Results Visualization</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('graph')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'graph'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Graph View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Table View
              </button>
              <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Download results">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-4">
            {viewMode === 'graph' ? <GraphVisualization data={results.results} /> : <DataTable data={results.results} />}
          </div>
        </div>
      )}
    </div>
  );
};
