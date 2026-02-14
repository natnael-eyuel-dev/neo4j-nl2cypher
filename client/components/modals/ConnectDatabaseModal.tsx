'use client';

import React, { useState } from 'react';
import { X, Database, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface ConnectDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: DatabaseConfig) => void;
}

interface DatabaseConfig {
  name: string;
  uri: string;
  username: string;
  password: string;
  description?: string;
}

export const ConnectDatabaseModal: React.FC<ConnectDatabaseModalProps> = ({
  isOpen,
  onClose,
  onConnect
}) => {
  const [formData, setFormData] = useState<DatabaseConfig>({
    name: '',
    uri: '',
    username: '',
    password: '',
    description: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [connecting, setConnecting] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/databases/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uri: formData.uri,
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/databases/profile/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        onConnect(formData);
        onClose();
      } else {
        alert(data.error || 'Failed to connect database');
      }
    } catch (error) {
      alert('Failed to connect database');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Connect Database
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Database Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My Production Database"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Connection URI *
            </label>
            <input
              type="text"
              name="uri"
              value={formData.uri}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="bolt://localhost:7687"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Format: bolt://hostname:port or neo4j://hostname:port
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="neo4j"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Production database for customer data..."
            />
          </div>

          {/* Test Connection */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !formData.uri || !formData.username || !formData.password}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>

            {testResult && (
              <div className={`flex items-center space-x-2 text-sm ${
                testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={connecting || !formData.name || !formData.uri || !formData.username || !formData.password}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {connecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                'Connect Database'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};