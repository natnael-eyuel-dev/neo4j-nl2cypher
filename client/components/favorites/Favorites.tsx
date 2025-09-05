'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Star, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Tag,
  Clock,
  History
} from 'lucide-react';

interface FavoritesProps {
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

export const Favorites: React.FC<FavoritesProps> = ({ user, database }) => {
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
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, [pagination.page]);

  const token = localStorage.getItem('authToken');

  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try { 
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        isFavorite: 'true',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/conversations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
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

  const removeFromFavorites = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'toggleFavorite',
          isFavorite: false
        })
      });

      if (response.ok) {
        // Remove from local state
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        setSelectedConversations(prev => prev.filter(id => id !== conversationId));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (err) {
      console.error('Failed to remove from favorites:', err);
    }
  };

  const confirmRemove = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setShowDeleteConfirm(true);
  };

  const handleRemoveConfirmed = async () => {
    if (!conversationToDelete) return;
    
    try {
      await removeFromFavorites(conversationToDelete);
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    } finally {
      setShowDeleteConfirm(false);
      setConversationToDelete(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFavorites();
  };

  const handleBulkRemove = async () => {
    if (selectedConversations.length === 0) return;

    try {
      const response = await fetch('/api/conversations/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'unfavorite',
          conversationIds: selectedConversations
        })
      });

      if (response.ok) {
        setConversations(prev => prev.filter(conv => !selectedConversations.includes(conv._id)));
        setSelectedConversations([]);
        setPagination(prev => ({ ...prev, total: prev.total - selectedConversations.length }));
      }
    } catch (err) {
      console.error('Bulk remove failed:', err);
    }
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
          <Star className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to view your favorites
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
              <Star className="h-6 w-6 mr-2 text-amber-500" />
              Favorites
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {pagination.total} favorited queries
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </form>
        </div>

        {/* Bulk Actions */}
        {selectedConversations.length > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <span className="text-amber-700 dark:text-amber-300">
              {selectedConversations.length} selected
            </span>
            <button
              onClick={handleBulkRemove}
              className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-900/40"
            >
              Remove from Favorites
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
            <div className="text-red-600 dark:text-red-400 mb-2">Error loading favorites</div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchFavorites}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <Star className="h-16 w-16 mx-auto mb-4 text-amber-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? 'No favorites match your search' 
                : 'Star queries from your history to see them here'
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
                          setSelectedConversations((prev) => [...prev, conversation._id]);
                        } else {
                          setSelectedConversations((prev) =>
                            prev.filter((id) => id !== conversation._id)
                          );
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Database className="h-4 w-4 text-primary-600" />
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

                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {conversation.prompt}
                  </h4>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-3 font-mono text-sm overflow-x-auto">
                    <code className="text-primary-600 dark:text-primary-400">
                      {conversation.cypherQuery}
                    </code>
                  </div>

                  {/* Markdown explanation */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {conversation.explanation || ""}
                    </ReactMarkdown>
                  </div>

                  {conversation.tags && conversation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {conversation.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2 ml-4">
                  <button
                    onClick={() => confirmRemove(conversation._id)}
                    className="p-2 rounded-full text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    title="Remove from favorites"
                  >
                    <Star className="h-5 w-5" fill="currentColor" />
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
                    pageNum === pagination.page
                      ? 'bg-primary-600 text-white'
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Remove from Favorites
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove this query from your favorites?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConfirmed}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};