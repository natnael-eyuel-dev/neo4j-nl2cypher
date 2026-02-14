'use client';

import React from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { QueryInterface } from './QueryInterface';

export const QueryBuilder: React.FC = () => {
  const { selectedDatabase } = useDatabase();

  if (!selectedDatabase) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Database Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a database from the sidebar to start building queries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <QueryInterface 
        database={selectedDatabase}
        user={null} // Will be passed from parent
        onQueryExecute={() => {}} // Will be passed from parent
      />
    </div>
  );
};