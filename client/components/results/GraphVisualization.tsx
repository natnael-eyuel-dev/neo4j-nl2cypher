'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Types for our graph data
interface GraphNode {
  y: number;
  x: number;
  id: string;
  name: string;
  type: string;
  val?: number;
  properties?: Record<string, any>;
}

interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  properties?: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface GraphVisualizationProps {
  data: any;
}

// Dynamically import to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
});

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({ data }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Update dimensions on resize and fullscreen toggle
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: isFullscreen ? window.innerWidth - 40 : 800,
        height: isFullscreen ? window.innerHeight - 100 : 400
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFullscreen]);

  // Normalize Neo4j data for force graph
  useEffect(() => {
    if (!data) {
      setGraphData({ nodes: [], links: [] });
      return;
    }

    const normalizedData = normalizeGraphData(data);
    setGraphData(normalizedData);
    console.log('Normalized graph data:', normalizedData);
  }, [data]);

  const normalizeGraphData = (rawData: any): GraphData => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    console.log('Raw data structure:', rawData);

    // Handle direct nodes/relationships format (your data structure)
    if (rawData.nodes && Array.isArray(rawData.nodes)) {
      console.log('Processing nodes array:', rawData.nodes.length);
      
      // Process nodes
      rawData.nodes.forEach((node: any, index: number) => {
        const nodeId = node.id || node.elementId || `node-${index}`;
        const nodeLabels = node.labels || [];
        const nodeType = nodeLabels[0] || 'Unknown';
        const nodeName = node.properties?.title || node.properties?.name || 
                         node.properties?.id || nodeType;

        if (!nodeMap.has(nodeId)) {
          const graphNode: GraphNode = {
            id: nodeId,
            name: nodeName,
            type: nodeType,
            val: 8, // Size based on importance
            properties: node.properties || {},
            x: Math.random() * 400 - 200, 
            y: Math.random() * 400 - 200  
          };
          nodeMap.set(nodeId, graphNode);
          nodes.push(graphNode);
        }
      });

      // Process relationships if they exist
      if (rawData.relationships && Array.isArray(rawData.relationships)) {
        console.log('Processing relationships:', rawData.relationships.length);
        
        rawData.relationships.forEach((rel: any, index: number) => {
          const linkId = rel.id || rel.elementId || `link-${index}`;
          const link: GraphLink = {
            id: linkId,
            source: rel.startNode || rel.start || rel.source,
            target: rel.endNode || rel.end || rel.target,
            type: rel.type || 'RELATED',
            properties: rel.properties || {}
          };
          links.push(link);
        });
      } else {
        console.log('No relationships found in data');
      }
    }
    // Handle records format (alternative structure)
    else if (rawData.records && Array.isArray(rawData.records)) {
      console.log('Processing records format');
      // ... (keep the previous records processing logic)
    }
    // Handle empty or unexpected data
    else {
      console.warn('Unexpected data format:', rawData);
      return { nodes: [], links: [] };
    }

    // Convert string references to actual node objects for links
    const finalLinks = links.map(link => {
      let sourceNode: GraphNode | undefined;
      let targetNode: GraphNode | undefined;

      // Handle string source/target
      if (typeof link.source === 'string') {
        sourceNode = nodeMap.get(link.source);
      } else {
        sourceNode = link.source as GraphNode;
      }

      if (typeof link.target === 'string') {
        targetNode = nodeMap.get(link.target);
      } else {
        targetNode = link.target as GraphNode;
      }

      // Only include links where both ends exist
      if (sourceNode && targetNode) {
        return {
          ...link,
          source: sourceNode,
          target: targetNode
        };
      }
      
      console.warn('Skipping link with missing nodes:', link);
      return null;
    }).filter(Boolean) as GraphLink[];

    console.log('Final graph data - Nodes:', nodes.length, 'Links:', finalLinks.length);
    return { nodes, links: finalLinks };
  };

  const getNodeColor = (node: GraphNode): string => {
    const colors: Record<string, string> = {
      Movie: '#f56565',
      Person: '#4299e1',
      Genre: '#48bb78',
      Actor: '#ed8936',
      Director: '#9f7aea',
      User: '#38b2ac',
      Post: '#ed64a6',
      Employee: '#667eea',
      Department: '#f093fb',
      Project: '#4facfe',
    };
    return colors[node.type] || '#718096';
  };

  // Fallback for empty data
  if (!data || (!data.nodes || data.nodes.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No graph data available</p>
          <p className="text-sm">Try running a query that returns nodes and relationships</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button 
          onClick={() => window.location.reload()} 
          title="Reset View" 
          className="control-btn bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)} 
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} 
          className="control-btn bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Graph Info */}
      <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 px-3 py-1 rounded text-sm text-gray-600 dark:text-gray-400">
        {graphData.nodes.length} nodes • {graphData.links.length} links
      </div>

      {/* Debug info */}
      <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 px-3 py-1 rounded text-xs text-gray-500 dark:text-gray-400">
        Data: {data.nodes?.length || 0} nodes, {data.relationships?.length || 0} relationships
      </div>

      {/* Force Graph */}
      <div className="h-96 w-full">
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel={(node: any) => {
              const n = node as GraphNode;
              return `
              ${n.name}
              Type: ${n.type}
              ${n.properties ? JSON.stringify(n.properties, null, 2) : ''}
            `;
            }}
            nodeAutoColorBy="type"
            linkLabel={(link: any) => {
              const l = link as GraphLink;
              return `
              ${l.type}
              ${l.properties ? JSON.stringify(l.properties, null, 2) : ''}
            `;
            }}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            backgroundColor="rgba(255,255,255,0)"
            width={dimensions.width}
            height={dimensions.height}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const n = node as GraphNode;
              const label = n.name || n.id;
              const fontSize = 12 / Math.max(1, globalScale);
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = getNodeColor(n);
              ctx.beginPath();
              ctx.arc(n.x!, n.y!, 8, 0, 2 * Math.PI, false);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.fillText(label, n.x!, n.y!);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p>Processing graph data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};