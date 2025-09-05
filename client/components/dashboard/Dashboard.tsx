'use client';

import React, { useState, useEffect } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Database, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock,
  Star,
  Activity,
  Plus,
  FileText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface DashboardProps {
  onSectionChange: (section: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSectionChange }) => {
  const { availableDatabases, selectedDatabase } = useDatabase();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [queryHistoryCount, setQueryHistoryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch query history count from API (not localStorage)
      if (user && token) {
        try {
          const historyResponse = await fetch('/api/conversations?limit=1', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            if (historyData.success) {
              setQueryHistoryCount(historyData.data.pagination.total);
            }
          }
        } catch (historyError) {
          console.warn('Failed to fetch query history count:', historyError);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDatabase, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleNavigation = (section: string) => {
    onSectionChange(section);
  };

  const stats = [
    {
      title: 'Total Databases',
      value: availableDatabases.length,
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      description: 'Available databases',
      loading: false
    },
    {
      title: 'Query History',
      value: queryHistoryCount.toLocaleString(),
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
      description: 'Your saved queries',
      loading: false
    },
  ];

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center mx-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of your graph databases and activity
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back{user ? `, ${user.name}` : ''}! 👋
            </h1>
            <p className="text-blue-100 opacity-90">
              Ready to explore your graph databases with natural language queries.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                {stat.loading ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {stat.description}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Database Details Section */}
      {selectedDatabase && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-600" />
              Database Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium">{selectedDatabase.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-medium capitalize">{selectedDatabase.type}</span>
              </div>
              {selectedDatabase.description && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Description:</span>
                  <span className="font-medium text-right">{selectedDatabase.description}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={ () => handleNavigation('query-builder') }
                className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
              >
                <Plus className="h-6 w-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium" onClick={() => handleNavigation('query-builder')}>New Query</span>
              </button>
              <button 
                onClick={() => handleNavigation('history')}
                className="flex flex-col items-center justify-center p-4 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
              >
                <Clock className="h-6 w-6 text-amber-600 mb-2" />
                <span className="text-sm font-medium" onClick={() => handleNavigation('history')}>Query History</span>
              </button>
              <button 
                onClick={() => handleNavigation('export')}
                className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 transition-colors cursor-pointer"
              >
                <FileText className="h-6 w-6 text-green-600 mb-2" />
                <span className="text-sm font-medium">Export Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started */}
      {!selectedDatabase && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <Star className="h-5 w-5 mr-2 text-amber-500" />
            Get Started
          </h2>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            Select a database from the sidebar to start querying, or connect your own Neo4j database.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-connect'))}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Database
            </button>
            <button 
              onClick={() => window.open('/docs', '_blank')}
              className="px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Documentation
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-3" />
            <span>Loading dashboard data...</span>
          </div>
        </div>
      )}
    </div>
  );
};