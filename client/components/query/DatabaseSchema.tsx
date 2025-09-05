'use client';

import React, { useState } from 'react';
import { 
  Database, 
  Table, 
  Link, 
  Info, 
  ChevronDown, 
  ChevronRight,
  BarChart3,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface DatabaseSchemaProps {
  database: any;
  schema: any;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

interface SchemaNode {
  label: string;
  properties: { [key: string]: string };
  count?: number;
}

interface SchemaRelationship {
  type: string;
  startNode: string;
  endNode: string;
  properties: { [key: string]: string };
  count?: number;
}

export const DatabaseSchema: React.FC<DatabaseSchemaProps> = ({ 
  database, 
  schema, 
  loading = false, 
  error = null,
  onRefresh 
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandedRelationships, setExpandedRelationships] = useState<Set<string>>(new Set());

  const toggleNodeExpansion = (nodeLabel: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeLabel)) {
      newExpanded.delete(nodeLabel);
    } else {
      newExpanded.add(nodeLabel);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleRelationshipExpansion = (relType: string) => {
    const newExpanded = new Set(expandedRelationships);
    if (newExpanded.has(relType)) {
      newExpanded.delete(relType);
    } else {
      newExpanded.add(relType);
    }
    setExpandedRelationships(newExpanded);
  };

  const getSampleQueries = () => {
    const queries = {
      movies: [
        "MATCH (m:Movie) RETURN m LIMIT 10",
        "MATCH (p:Person)-[:ACTED_IN]->(m:Movie) RETURN p, m LIMIT 10",
        "MATCH (m:Movie) WHERE m.releaseYear >= 2000 RETURN m LIMIT 10",
        "MATCH (m:Movie) WHERE m.genres CONTAINS 'Comedy' RETURN m LIMIT 10"
      ],
      social: [
        "MATCH (u:User) RETURN u LIMIT 10",
        "MATCH (u1:User)-[:FOLLOWS]->(u2:User) RETURN u1, u2 LIMIT 10",
        "MATCH (p:Post)-[:POSTED_BY]->(u:User) RETURN p, u LIMIT 10"
      ],
      company: [
        "MATCH (e:Employee) RETURN e LIMIT 10",
        "MATCH (e:Employee)-[:WORKS_IN]->(d:Department) RETURN e, d LIMIT 10",
        "MATCH (p:Project)-[:ASSIGNED_TO]->(e:Employee) RETURN p, e LIMIT 10"
      ]
    };
    return queries[database?.type as keyof typeof queries] || [
      "MATCH (n) RETURN n LIMIT 10",
      "MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 10"
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold mb-2">Failed to load schema</h3>
        <p className="text-sm mb-4">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-2">📊</div>
        <p>No schema data available</p>
        <p className="text-sm">Schema information could not be loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Database Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Database className="h-8 w-8 text-primary-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {database?.name} Schema
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Database structure and metadata
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              title="Refresh schema"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Table className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Node Types</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {schema.nodes?.length || 0}
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Link className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Relationship Types</span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
              {schema.relationships?.length || 0}
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Total Records</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
              {schema.totalRecords?.toLocaleString() || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Node Types */}
      {schema.nodes && schema.nodes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <Table className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Node Types ({schema.nodes.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {schema.nodes.map((node: SchemaNode, index: number) => (
              <div key={index} className="p-4">
                <button
                  onClick={() => toggleNodeExpansion(node.label)}
                  className="flex items-center justify-between w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg p-2"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {node.label}
                    </span>
                    {node.count !== undefined && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({node.count.toLocaleString()} nodes)
                      </span>
                    )}
                  </div>
                  {expandedNodes.has(node.label) ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {expandedNodes.has(node.label) && node.properties && (
                  <div className="mt-3 ml-6 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Properties:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(node.properties).map(([key, type]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{key}</span>
                          <span className="text-gray-500 dark:text-gray-500 font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {String(type)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relationship Types */}
      {schema.relationships && schema.relationships.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <Link className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Relationship Types ({schema.relationships.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {schema.relationships.map((rel: SchemaRelationship, index: number) => (
              <div key={index} className="p-4">
                <button
                  onClick={() => toggleRelationshipExpansion(rel.type)}
                  className="flex items-center justify-between w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg p-2"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {rel.type}
                    </span>
                    {rel.count !== undefined && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({rel.count.toLocaleString()} relationships)
                      </span>
                    )}
                  </div>
                  {expandedRelationships.has(rel.type) ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {expandedRelationships.has(rel.type) && (
                  <div className="mt-3 ml-6 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Connection:
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{rel.startNode}</span>
                          <span className="mx-2">→</span>
                          <span className="font-medium">{rel.endNode}</span>
                        </div>
                      </div>
                      
                      {rel.properties && Object.keys(rel.properties).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Properties:
                          </h4>
                          <div className="space-y-1">
                            {Object.entries(rel.properties).map(([key, type]) => (
                              <div key={key} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{key}</span>
                                <span className="text-gray-500 dark:text-gray-500 font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  {String(type)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Queries */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 p-4 border-b border-gray-200 dark:border-gray-700">
          <Info className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sample Cypher Queries
          </h3>
        </div>
        
        <div className="p-4 space-y-3">
          {getSampleQueries().map((query, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono overflow-x-auto">
                <code>{query}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};