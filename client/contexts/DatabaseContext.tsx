'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DatabaseInfo {
  id: string;
  name: string;
  type: 'movies' | 'social' | 'company' | 'custom';
  uri?: string;
  username?: string;
  description: string;
  nodeCount?: number;
  relationshipCount?: number;
  schema?: any;
}

interface DatabaseContextType {
  selectedDatabase: DatabaseInfo | null;
  setSelectedDatabase: (database: DatabaseInfo | null) => void;
  availableDatabases: DatabaseInfo[];
  customDatabases: DatabaseInfo[];
  addCustomDatabase: (database: Omit<DatabaseInfo, 'id'>) => void;
  removeCustomDatabase: (databaseId: string) => void;
  refreshDatabases: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

const defaultDatabases: DatabaseInfo[] = [
  {
    id: 'movies',
    name: 'Movies Database',
    type: 'movies',
    description: 'Sample movie database with actors, directors, and genres',
    nodeCount: 1000,
    relationshipCount: 5000,
  },
  {
    id: 'social',
    name: 'Social Network',
    type: 'social',
    description: 'Sample social network with users, posts, and relationships',
    nodeCount: 500,
    relationshipCount: 2000,
  },
  {
    id: 'company',
    name: 'Company Structure',
    type: 'company',
    description: 'Sample company database with employees, departments, and projects',
    nodeCount: 300,
    relationshipCount: 800,
  },
];

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseInfo | null>(null);
  const [customDatabases, setCustomDatabases] = useState<DatabaseInfo[]>([]);

  const availableDatabases = [...defaultDatabases, ...customDatabases];

  const addCustomDatabase = (database: Omit<DatabaseInfo, 'id'>) => {
    const newDatabase: DatabaseInfo = {
      ...database,
      id: `custom-${Date.now()}`,
    };
    setCustomDatabases(prev => [...prev, newDatabase]);
  };

  const removeCustomDatabase = (databaseId: string) => {
    setCustomDatabases(prev => prev.filter(db => db.id !== databaseId));
    if (selectedDatabase?.id === databaseId) {
      setSelectedDatabase(null);
    }
  };

  const refreshDatabases = () => {
    // This would typically fetch updated database information from the server
    // For now, we'll just trigger a re-render
    setCustomDatabases(prev => [...prev]);
  };

  const value: DatabaseContextType = {
    selectedDatabase,
    setSelectedDatabase,
    availableDatabases,
    customDatabases,
    addCustomDatabase,
    removeCustomDatabase,
    refreshDatabases,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
