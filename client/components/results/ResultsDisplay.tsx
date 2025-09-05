'use client';

import React from 'react';
import { Database, BarChart3, TrendingUp } from 'lucide-react';

interface ResultsDisplayProps {
  database: any;
  results?: any; 
  query?: string; 
  onQueryExecute?: (results: any, query: string) => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  database, 
  results, 
  query 
}) => {
  // If no results, show the placeholder
  if (!results) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Results Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Run a query in the Query Builder tab to see results here
          </p>
        </div>
      </div>
    );
  }

  console.log('Raw results:', results);

  // ✅ Extract the actual Neo4j results from the nested structure
  const neo4jResults = results.data?.results || results.results;
  
  // If we have Neo4j results, display them
  if (neo4jResults && neo4jResults.records) {
    return (
      <div className="h-full p-6 overflow-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Query Results
          </h3>
          
          {query && (
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <code className="text-sm text-gray-800 dark:text-gray-200">
                {query}
              </code>
            </div>
          )}

          {/* Display explanation if available */}
          {results.data?.explanation && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Explanation
              </h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                {results.data.explanation}
              </p>
            </div>
          )}

          {/* Display the actual results */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {neo4jResults.fields?.map((field: string, index: number) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {neo4jResults.records?.map((record: any, rowIndex: number) => (
                  <tr key={rowIndex}>
                    {neo4jResults.fields?.map((field: string, colIndex: number) => (
                      <td
                        key={colIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                      >
                        {record[field]?.toString() || 'null'} {/* ✅ FIXED: Use bracket notation */}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {neo4jResults.records && (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {neo4jResults.records.length} row{neo4jResults.records.length !== 1 ? 's' : ''} returned
              {results.data?.executionTime && (
                <span className="ml-4">• Execution time: {results.data.executionTime}ms</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ Fallback: if the results structure is different
  return (
    <div className="h-full p-6 overflow-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Query Results (Debug View)
        </h3>
        
        {query && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              {query}
            </code>
          </div>
        )}

        <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  );
};