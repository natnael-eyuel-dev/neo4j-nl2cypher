'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface DatabaseInfo {
  id: string;
  name: string;
  type: 'movies' | 'social' | 'company' | 'custom';
  uri?: string;
  username?: string;
  description: string;
  nodeCount?: number;
  relationshipCount?: number;
  password?: string; 
  schema?: Record<string, any>;
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
  const [isLoading, setIsLoading] = useState(true);

  const refreshDatabases = () => {
    // This would typically fetch updated database information from the server
    // For now, we'll just trigger a re-render
    setCustomDatabases(prev => [...prev]);
  };

  // load custom databases from backend on mount
  useEffect(() => {
    const loadCustomDatabases = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/databases/profile/databases', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Convert backend format to frontend format
            const backendDatabases = Array.isArray(data.data) ? data.data : [data.data];
            const formattedDatabases: DatabaseInfo[] = backendDatabases.map((db: { _id: any; id: any; name: any; uri: any; username: any; description: any; nodeCount: any; relationshipCount: any; schema: any; }) => ({
              id: db._id || db.id,
              name: db.name,
              type: 'custom' as const,
              uri: db.uri,
              username: db.username,
              description: db.description || '',
              nodeCount: db.nodeCount,
              relationshipCount: db.relationshipCount,
              schema: db.schema
            }));
            
            setCustomDatabases(formattedDatabases);
          }
        }
      } catch (error) {
        console.error('Failed to load custom databases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomDatabases();
  }, []);

  const availableDatabases = [...defaultDatabases, ...customDatabases];

  const addCustomDatabase = async (database: Omit<DatabaseInfo, 'id'>) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/databases/profile/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: database.name,
          description: database.description,
          uri: database.uri,
          username: database.username,
          password: database.password
      })
      });

      const data = await response.json();
      
      if (data.success) {
        // Use the database from backend response
        const newDatabase: DatabaseInfo = {
          id: data.data.id,
          name: data.data.name,
          type: 'custom',
          uri: data.data.uri,
          username: data.data.username,
          description: data.data.description,
          nodeCount: data.data.nodeCount,
          relationshipCount: data.data.relationshipCount,
          schema: data.data.schema
        };
        
        setCustomDatabases(prev => [...prev, newDatabase]);
        return newDatabase;
      } else {
        throw new Error(data.error || 'Failed to add database');
      }
    } catch (error) {
      console.error('Failed to add custom database:', error);
      throw error;
    }
  };

  const removeCustomDatabase = async (databaseId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch(`/api/databases/profile/databases/${databaseId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      setCustomDatabases(prev => prev.filter(db => db.id !== databaseId));
      if (selectedDatabase?.id === databaseId) {
        setSelectedDatabase(null);
      }
    } catch (error) {
      console.error('Failed to remove custom database:', error);
      throw error;
    }
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
