'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, History, Lightbulb } from 'lucide-react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isExecuting: boolean;
  database: any;
  disabled?: boolean;
}

export const QueryInput: React.FC<QueryInputProps> = ({ onSubmit, isExecuting, database, disabled }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sample query suggestions based on database type
  const getQuerySuggestions = () => {
    const suggestions = {
      movies: [
        "Who directed The Matrix?",
        "What movies did Tom Hanks star in?",
        "Find all action movies from the 1990s",
        "Who are the top 10 highest-grossing actors?",
        "What genres are most popular?"
      ],
      social: [
        "Who are my mutual friends with John?",
        "Find people who live in New York",
        "What posts got the most likes this week?",
        "Who follows me but I don't follow back?",
        "Find the most influential users"
      ],
      company: [
        "Who reports to the CEO?",
        "Find employees in the Engineering department",
        "What projects is Alice working on?",
        "Who has the highest salary?",
        "Find teams with more than 5 members"
      ]
    };
    return suggestions[database.type as keyof typeof suggestions] || [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isExecuting) {
      onSubmit(query.trim());
      // Add to recent queries
      setRecentQueries(prev => [query.trim(), ...prev.filter(q => q !== query.trim())].slice(0, 5));
      setQuery('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDisable = () => {
    return disabled || !database?.id;
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);

  return (
    <div className="space-y-4">
      {/* Main Query Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${database.name} in natural language...`}
            className="w-full px-4 py-3 pr-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            rows={1}
            disabled={handleDisable()}
          />
          
          <button
            type="submit"
            disabled={!query.trim() || isExecuting}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-primary-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isExecuting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* AI Enhancement Button */}
        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Lightbulb className="h-4 w-4" />
            <span>Get suggestions</span>
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4" />
            <span>Powered by AI</span>
          </div>
        </div>
      </form>

      {/* Query Suggestions */}
      {showSuggestions && (
        <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Try these questions:
          </h4>
          <div className="grid gap-2">
            {getQuerySuggestions().map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Queries */}
      {recentQueries.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <History className="h-4 w-4 mr-2" />
            Recent Queries
          </h4>
          <div className="space-y-2">
            {recentQueries.map((recentQuery, index) => (
              <button
                key={index}
                onClick={() => setQuery(recentQuery)}
                className="w-full text-left p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
              >
                {recentQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>💡 Tip: You can ask questions like "Who directed The Matrix?" or "Find all action movies"</p>
        <p>Press Enter to submit, Shift+Enter for new line</p>
      </div>
    </div>
  );
};
