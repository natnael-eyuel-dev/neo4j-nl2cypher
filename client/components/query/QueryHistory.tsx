'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Star, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Database,
  Tag,
  Clock,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QueryHistoryProps {
  user: any;
  database: any;
}

interface Conversation {
  _id: string;
  prompt: string;
  cypherQuery: string;
  explanation: string;
  databaseType: string;
  databaseName: string;
  createdAt: string;
  isFavorite: boolean;
  tags: string[];
  executionTime?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({ user, database }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isFavorite: false,
    databaseType: '',
    tags: [] as string[]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [showBulkActionConfirm, setShowBulkActionConfirm] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'favorite' | 'unfavorite' | 'delete' | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [pagination.page, filters]);

  const token = localStorage.getItem('authToken');

  const fetchConversations = async () => {
    if (!user) return;
    
    setLoading(true);
    try { 
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.isFavorite && { isFavorite: 'true' }),
        ...(filters.databaseType && { databaseType: filters.databaseType }),
        ...(filters.tags.length > 0 && { tags: filters.tags.join(',') }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/conversations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      if (data.success) {
        setConversations(data.data.conversations);
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (conversationId: string, currentStatus: boolean) => {
    console.log('Toggling favorite for:', conversationId, 'Current status:', currentStatus);
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'toggleFavorite',
          isFavorite: !currentStatus
        })
      });

      console.log('Toggle favorite response:', response.status, response.statusText);

      if (response.ok) {
        // Update local state
        setConversations(prev => prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, isFavorite: !currentStatus }
            : conv
        ));
      } else {
      // Handle error response
      const errorData = await response.json();
      console.error('Failed to toggle favorite:', errorData);
    }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const confirmDelete = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    console.log('Deleting conversation:', conversationToDelete);

    if (!conversationToDelete) return;
    
    try {
      const response = await fetch(`/api/conversations/${conversationToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Delete response:', response.status, response.statusText);

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv._id !== conversationToDelete));
        setSelectedConversations(prev => prev.filter(id => id !== conversationToDelete));
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setShowDeleteConfirm(false);
      setConversationToDelete(null);
    }
  };

  const confirmBulkAction = (action: 'favorite' | 'unfavorite' | 'delete') => {
    if (selectedConversations.length === 0) return;
    
    setBulkActionType(action);
    setShowBulkActionConfirm(true);
  };

  const handleBulkActionConfirmed = async () => {
    if (!bulkActionType) return;

    try {
      const response = await fetch('/api/conversations/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: bulkActionType,
          conversationIds: selectedConversations
        })
      });

      if (response.ok) {
        if (bulkActionType === 'delete') {
          setConversations(prev => prev.filter(conv => !selectedConversations.includes(conv._id)));
        } else {
          const newFavoriteStatus = bulkActionType === 'favorite';
          setConversations(prev => prev.map(conv => 
            selectedConversations.includes(conv._id) 
              ? { ...conv, isFavorite: newFavoriteStatus }
              : conv
          ));
        }
        setSelectedConversations([]);
        fetchConversations();
      }
    } catch (err) {
      console.error('Bulk action failed:', err);
    } finally {
      setShowBulkActionConfirm(false);
      setBulkActionType(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchConversations();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatTime = (ms?: number) => {
    if (!ms) return 'N/A';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <History className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to view your query history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <History className="h-6 w-6 mr-2 text-blue-600" />
              Query History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {pagination.total} total queries
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="h-4 w-4" />
              Filters
              {Object.values(filters).some(val => 
                Array.isArray(val) ? val.length > 0 : Boolean(val)
              ) && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>
            
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </form>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Database Type
                </label>
                <select
                  value={filters.databaseType}
                  onChange={(e) => setFilters(prev => ({ ...prev, databaseType: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All types</option>
                  <option value="movies">Movies</option>
                  <option value="social">Social</option>
                  <option value="company">Company</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Favorites
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.isFavorite}
                    onChange={(e) => setFilters(prev => ({ ...prev, isFavorite: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Show favorites only</span>
                </label>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ isFavorite: false, databaseType: '', tags: [] })}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Clear filters
                </button>
                <button
                  onClick={fetchConversations}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedConversations.length > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <button
              onClick={() => confirmBulkAction('favorite')}
              className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-900/40"
            >
              Favorite
            </button>
            <button
              onClick={() => confirmBulkAction('unfavorite')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Unfavorite
            </button>
            <button
              onClick={() => confirmBulkAction('delete')}
              className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/40"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                  <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded ml-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-2">Error loading conversations</div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchConversations}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <History className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No queries yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || Object.values(filters).some(val => 
                Array.isArray(val) ? val.length > 0 : Boolean(val)
              ) 
                ? 'No queries match your search criteria' 
                : 'Your query history will appear here once you start making queries'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div
                key={conversation._id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedConversations.includes(conversation._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedConversations((prev) => [
                              ...prev,
                              conversation._id,
                            ]);
                          } else {
                            setSelectedConversations((prev) =>
                              prev.filter((id) => id !== conversation._id)
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {conversation.databaseName} ({conversation.databaseType})
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(conversation.createdAt)}
                      </span>
                      {conversation.executionTime && (
                        <span className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(conversation.executionTime)}
                        </span>
                      )}
                    </div>

                    {/* Markdown for prompt */}
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      <ReactMarkdown>{conversation.prompt}</ReactMarkdown>
                    </h4>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-3 font-mono text-sm">
                      <code className="text-blue-600 dark:text-blue-400">
                        {conversation.cypherQuery}
                      </code>
                    </div>

                    {/* Markdown for explanation */}
                    <div className="text-gray-600 dark:text-gray-400 text-sm prose dark:prose-invert max-w-none">
                      <ReactMarkdown>{conversation.explanation}</ReactMarkdown>
                    </div>

                    {conversation.tags && conversation.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {conversation.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2 ml-4">
                    {/* Favorite button */}
                    <button
                      onClick={() => {
                        console.log(
                          "Favorite button clicked for:",
                          conversation._id,
                          conversation.isFavorite
                        );
                        toggleFavorite(conversation._id, conversation.isFavorite);
                      }}
                      className={`p-2 rounded-full ${
                        conversation.isFavorite
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                          : "text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      }`}
                    >
                      <Star
                        className="h-5 w-5"
                        fill={conversation.isFavorite ? "currentColor" : "none"}
                      />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => confirmDelete(conversation._id)}
                      className="p-2 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                  className={`w-8 h-8 rounded text-sm ${
                    pagination.page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {pagination.pages > 5 && (
              <span className="px-2 text-gray-500">...</span>
            )}

            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="p-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this query? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkActionConfirm && bulkActionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm {bulkActionType === 'delete' ? 'Delete' : bulkActionType === 'favorite' ? 'Favorite' : 'Unfavorite'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {bulkActionType === 'delete' 
                ? `Are you sure you want to delete ${selectedConversations.length} queries? This action cannot be undone.`
                : `Are you sure you want to ${bulkActionType} ${selectedConversations.length} queries?`
              }
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkActionConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkActionConfirmed}
                className={`px-4 py-2 text-white rounded-lg ${
                  bulkActionType === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700'
                    : bulkActionType === 'favorite'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {bulkActionType === 'delete' 
                  ? `Delete ${selectedConversations.length} Queries`
                  : `${bulkActionType === 'favorite' ? 'Favorite' : 'Unfavorite'} ${selectedConversations.length} Queries`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};