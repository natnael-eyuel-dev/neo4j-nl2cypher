'use client';

import React, { useState } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Database, 
  ChevronDown, 
  Plus, 
  Settings, 
  Trash2,
  ExternalLink,
  Check
} from 'lucide-react';

export const DatabaseSelector: React.FC = () => {
  const { 
    selectedDatabase, 
    setSelectedDatabase, 
    availableDatabases,
    addCustomDatabase 
  } = useDatabase();
  const { user } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFormData, setCustomFormData] = useState({
    name: '',
    uri: '',
    username: '',
    password: '',
    description: ''
  });

  const handleCustomDatabaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFormData.name && customFormData.uri && customFormData.username) {
      addCustomDatabase({
        name: customFormData.name,
        uri: customFormData.uri,
        username: customFormData.username,
        description: customFormData.description,
        type: 'custom' as const
      });
      
      // Reset form
      setCustomFormData({
        name: '',
        uri: '',
        username: '',
        password: '',
        description: ''
      });
      setShowCustomForm(false);
    }
  };

  const handleDatabaseSelect = (database: any) => {
    setSelectedDatabase(database);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Database Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        <Database className="h-5 w-5 text-primary-600" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {selectedDatabase?.name || 'Select Database'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Database
              </h3>
              {user && (
                <button
                  onClick={() => setShowCustomForm(!showCustomForm)}
                  className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Custom</span>
                </button>
              )}
            </div>

            {/* Custom Database Form */}
            {showCustomForm && (
              <form onSubmit={handleCustomDatabaseSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Database Name"
                    value={customFormData.name}
                    onChange={(e) => setCustomFormData({...customFormData, name: e.target.value})}
                    className="input w-full"
                    required
                  />
                  <input
                    type="url"
                    placeholder="Neo4j URI (neo4j+s://...)"
                    value={customFormData.uri}
                    onChange={(e) => setCustomFormData({...customFormData, uri: e.target.value})}
                    className="input w-full"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={customFormData.username}
                    onChange={(e) => setCustomFormData({...customFormData, username: e.target.value})}
                    className="input w-full"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={customFormData.password}
                    onChange={(e) => setCustomFormData({...customFormData, password: e.target.value})}
                    className="input w-full"
                    required
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={customFormData.description}
                    onChange={(e) => setCustomFormData({...customFormData, description: e.target.value})}
                    className="input w-full"
                    rows={2}
                  />
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                    >
                      Add Database
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Database List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableDatabases.map((database) => (
                <button
                  key={database.id}
                  onClick={() => handleDatabaseSelect(database)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    selectedDatabase?.id === database.id
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-primary-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {database.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {database.type === 'custom' ? 'Custom' : 'Sample'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedDatabase?.id === database.id && (
                      <Check className="h-4 w-4 text-primary-600" />
                    )}
                    {database.type === 'custom' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle edit/delete custom database
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{availableDatabases.length} databases available</span>
                {user && (
                  <button className="text-primary-600 hover:text-primary-700 transition-colors">
                    Manage Databases
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
