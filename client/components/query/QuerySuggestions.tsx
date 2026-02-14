'use client';

import React from 'react';
import { Lightbulb, Zap, TrendingUp, Users, Film, Building, Database } from 'lucide-react';

interface QuerySuggestionsProps {
  database: any;
  onSuggestionClick: (suggestion: string) => void;
  disabled?: boolean;
}

export const QuerySuggestions: React.FC<QuerySuggestionsProps> = ({ database, onSuggestionClick, disabled }) => {
  const getSuggestionsByCategory = () => {
    const suggestions = {
      movies: {
        'Popular Queries': [
          "Who directed The Matrix?",
          "What movies did Tom Hanks star in?",
          "Find all action movies from the 1990s"
        ],
        'Actor Analysis': [
          "Who are the top 10 highest-grossing actors?",
          "Find actors who worked with Christopher Nolan",
          "Which actors appear in both Marvel and DC movies?"
        ],
        'Genre Exploration': [
          "What genres are most popular?",
          "Find sci-fi movies with high ratings",
          "Show me romantic comedies from the 2000s"
        ]
      },
      social: {
        'Network Analysis': [
          "Who are my mutual friends with John?",
          "Find people who live in New York",
          "Who follows me but I don't follow back?"
        ],
        'Content Discovery': [
          "What posts got the most likes this week?",
          "Find trending hashtags",
          "Show me posts about technology"
        ],
        'Influence Metrics': [
          "Find the most influential users",
          "Who has the most followers?",
          "Find users with high engagement rates"
        ]
      },
      company: {
        'Organizational Structure': [
          "Who reports to the CEO?",
          "Find employees in the Engineering department",
          "Show me the management hierarchy"
        ],
        'Project Management': [
          "What projects is Alice working on?",
          "Find teams with more than 5 members",
          "Which projects are behind schedule?"
        ],
        'Performance Analysis': [
          "Who has the highest salary?",
          "Find employees who joined this year",
          "Show me departments by headcount"
        ]
      }
    };
    return suggestions[database.type as keyof typeof suggestions] || {};
  };

  const getDatabaseIcon = () => {
    switch (database.type) {
      case 'movies':
        return <Film className="h-5 w-5 text-red-500" />;
      case 'social':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'company':
        return <Building className="h-5 w-5 text-green-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleDisabled = () => {
    return disabled || !database?.id;
  };

   // where to handle disabled state handling 

  const suggestionsByCategory = getSuggestionsByCategory();

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Lightbulb className="h-4 w-4 text-yellow-500" />
        <span>Query Suggestions for {database.name}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(suggestionsByCategory).map(([category, suggestions]) => (
          <div key={category} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Zap className="h-4 w-4 text-primary-500 mr-2" />
              {category}
            </h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="w-full text-left p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors hover:text-primary-600"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
        <div className="flex items-start space-x-3">
          <TrendingUp className="h-5 w-5 text-primary-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-2">
              Pro Tips for Better Queries
            </h4>
            <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-1">
              <li>• Be specific: "Find action movies from 1995-2000" vs "Find action movies"</li>
              <li>• Use relationships: "Who worked with" instead of just "Who"</li>
              <li>• Ask for comparisons: "Which is better" or "Compare"</li>
              <li>• Request specific data: "Show me the top 5" or "List all"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
