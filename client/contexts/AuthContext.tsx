'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: boolean;
  };
  provider: 'google' | 'local';
  customDatabases: Array<{
    _id: string;
    name: string;
    uri: string;
    username: string;
    description?: string;
  }>;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  updateUserPreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
  addCustomDatabase: (databaseInfo: Omit<User['customDatabases'][0], '_id'>) => Promise<void>;
  removeCustomDatabase: (databaseId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',  
      });

      if (response.ok) {
        const res = await response.json();
        setUser(res.data?.user || null);
      } else {
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const refreshUser = async () => checkAuthStatus();

  const login = () => {
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      router.push('/');
    }
  };

  const updateUserPreferences = async (preferences: Partial<User['preferences']>) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/auth/profile/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser.user);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  };

  const addCustomDatabase = async (databaseInfo: Omit<User['customDatabases'][0], '_id'>) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/auth/profile/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(databaseInfo),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser.user);
      }
    } catch (error) {
      console.error('Failed to add custom database:', error);
      throw error;
    }
  };

  const removeCustomDatabase = async (databaseId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token');

      const response = await fetch(`/api/auth/profile/databases/${databaseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser.user);
      }
    } catch (error) {
      console.error('Failed to remove custom database:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUserPreferences,
    addCustomDatabase,
    removeCustomDatabase,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
