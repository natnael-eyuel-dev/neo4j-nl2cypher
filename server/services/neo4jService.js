const neo4j = require('neo4j-driver');
const { getSampleDatabase } = require('../config/database');

class Neo4jService {
  constructor() {
    this.drivers = new Map();
    this.connections = new Map();
  }

  async getDriver(databaseType, customConfig = null) {
    const key = customConfig ? 'custom' : databaseType;
    
    if (this.drivers.has(key)) {
      return this.drivers.get(key);
    }

    try {
      let driver;
      
      if (customConfig) {
        driver = neo4j.driver(
          customConfig.uri,
          neo4j.auth.basic(customConfig.username, customConfig.password)
        );
      } else {
        const sampleDB = getSampleDatabase(databaseType);
        if (!sampleDB) {
          throw new Error(`Sample database '${databaseType}' not found`);
        }
        
        driver = neo4j.driver(
          sampleDB.uri,
          neo4j.auth.basic(sampleDB.username, sampleDB.password)
        );
      }

      await driver.verifyConnectivity();
      
      this.drivers.set(key, driver);
      
      console.log(`✅ Neo4j driver created for ${key}`);
      return driver;
    } catch (error) {
      console.error(`❌ Failed to create Neo4j driver for ${key}:`, error);
      throw new Error(`Neo4j connection failed: ${error.message}`);
    }
  }

  async executeQuery(databaseType, cypherQuery, customConfig = null) {
    const startTime = Date.now();
    let session;
    
    try {
      const driver = await this.getDriver(databaseType, customConfig);
      session = driver.session();
      
      console.log(`🔍 Executing query on ${databaseType}:`, cypherQuery);
      
      const result = await session.run(cypherQuery);
      const executionTime = Date.now() - startTime;
      
      const processedResults = this.processResults(result);
      
      return {
        success: true,
        results: processedResults,
        executionTime,
        query: cypherQuery,
        databaseType,
        recordCount: result.records.length
      };
    } catch (error) {
      console.error(`❌ Query execution failed:`, error);
      throw new Error(`Query execution failed: ${error.message}`);
    } finally {
      if (session) {
        await session.close();
      }
    }
  }

  processResults(result) {
    try {
      const nodes = new Map();
      const relationships = new Map();
      const processedRecords = []; 

      result.records.forEach((record, index) => {
        const processedRecord = {}; 
        
        record.keys.forEach(key => {
          let value = record.get(key);
          
          if (neo4j.isInt(value)) {
            // Convert Neo4j integers to regular numbers
            processedRecord[key] = value.toNumber(); 
          } else if (neo4j.isDate(value)) {
            // Convert Neo4j dates to ISO strings
            processedRecord[key] = value.toString(); 
          } else if (neo4j.isDateTime(value)) {
            // Convert Neo4j datetimes to ISO strings
            processedRecord[key] = value.toString(); 
          } else {
            // Keep other values as-is
            processedRecord[key] = value; 
          }
        });
        
        this.extractGraphElements(record, nodes, relationships);
        
        processedRecords.push(processedRecord); 
      });

      return {
        records: processedRecords,
        fields: result.records[0] ? result.records[0].keys : [],
        summary: result.summary,
        nodes: Array.from(nodes.values()),
        relationships: Array.from(relationships.values())
      };
    } catch (error) {
      console.error('Error processing results:', error);
      throw error;
    }
  }   

  extractGraphElements(record, nodes, relationships) {
    record.keys.forEach(key => {
      const value = record.get(key);
      
      if (neo4j.isNode(value)) {
        // Extract node information
        const nodeId = value.identity.toString();
        if (!nodes.has(nodeId)) {
          nodes.set(nodeId, {
            id: nodeId,
            labels: value.labels,
            properties: this.sanitizeProperties(value.properties)
          });
        }
      } else if (neo4j.isRelationship(value)) {
        const relId = value.identity.toString();
        if (!relationships.has(relId)) {
          relationships.set(relId, {
            id: relId,
            type: value.type,
            startNode: value.startNode.toString(),
            endNode: value.endNode.toString(),
            properties: this.sanitizeProperties(value.properties)
          });
        }
      }
    });
  }

  sanitizeProperties(properties) {
    const sanitized = {};
    
    Object.keys(properties).forEach(key => {
      const value = properties[key];
      
      if (neo4j.isInt(value)) {
        sanitized[key] = value.toNumber();
      } else if (neo4j.isDate(value)) {
        sanitized[key] = value.toString();
      } else if (neo4j.isDateTime(value)) {
        sanitized[key] = value.toString();
      } else if (neo4j.isLocalDateTime(value)) {
        sanitized[key] = value.toString();
      } else if (neo4j.isLocalTime(value)) {
        sanitized[key] = value.toString();
      } else if (neo4j.isTime(value)) {
        sanitized[key] = value.toString();
      } else if (neo4j.isDuration(value)) {
        sanitized[key] = value.toString();
      } else if (neo4j.isPoint(value)) {
        sanitized[key] = {
          x: value.x,
          y: value.y,
          z: value.z,
          srid: value.srid
        };
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  async getDatabaseSchema(databaseType, customConfig = null) {
    try {
      const schemaQuery = `
        CALL db.schema.visualization()
        YIELD nodes, relationships
        RETURN nodes, relationships
      `;
      
      const result = await this.executeQuery(databaseType, schemaQuery, customConfig);
      
      if (result.success && result.results.records.length > 0) {
        const record = result.results.records[0];
        return {
          nodes: record.nodes || [],
          relationships: record.relationships || []
        };
      }
      
      return await this.getBasicSchema(databaseType, customConfig);
    } catch (error) {
      console.error('❌ Failed to get database schema:', error);
      return await this.getBasicSchema(databaseType, customConfig);
    }
  }

  async getBasicSchema(databaseType, customConfig = null) {
    try {
      const labelsQuery = `
        CALL db.labels()
        YIELD label
        RETURN collect(label) as labels
      `;
      
      const relTypesQuery = `
        CALL db.relationshipTypes()
        YIELD relationshipType
        RETURN collect(relationshipType) as relationshipTypes
      `;
      
      const [labelsResult, relTypesResult] = await Promise.all([
        this.executeQuery(databaseType, labelsQuery, customConfig),
        this.executeQuery(databaseType, relTypesQuery, customConfig)
      ]);
      
      const labels = labelsResult.success && labelsResult.results.records.length > 0
        ? labelsResult.results.records[0].labels || []
        : [];
      
      const relationshipTypes = relTypesResult.success && relTypesResult.results.records.length > 0
        ? relTypesResult.results.records[0].relationshipTypes || []
        : [];
      
      return {
        nodes: labels,
        relationships: relationshipTypes
      };
    } catch (error) {
      console.error('❌ Failed to get basic schema:', error);
      const sampleDB = getSampleDatabase(databaseType);
      return sampleDB ? sampleDB.schema : { nodes: [], relationships: [] };
    }
  }

  async testConnection(uri, username, password) {
    try {
      const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      await driver.verifyConnectivity();
      await driver.close();
      
      return {
        success: true,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  async getDatabaseStats(databaseType, customConfig = null) {
    try {
      const statsQuery = `
        MATCH (n)
        RETURN 
          count(n) as totalNodes,
          count(DISTINCT labels(n)) as nodeTypes
        UNION
        MATCH ()-[r]->()
        RETURN 
          count(r) as totalRelationships,
          count(DISTINCT type(r)) as relationshipTypes
      `;
      
      const result = await this.executeQuery(databaseType, statsQuery, customConfig);
      
      if (result.success && result.results.records.length >= 2) {
        const nodeStats = result.results.records[0];
        const relStats = result.results.records[1];
        
        return {
          totalNodes: nodeStats.totalNodes || 0,
          nodeTypes: nodeStats.nodeTypes || 0,
          totalRelationships: relStats.totalRelationships || 0,
          relationshipTypes: relStats.relationshipTypes || 0
        };
      }
      
      return {
        totalNodes: 0,
        nodeTypes: 0,
        totalRelationships: 0,
        relationshipTypes: 0
      };
    } catch (error) {
      console.error('❌ Failed to get database stats:', error);
      return {
        totalNodes: 0,
        nodeTypes: 0,
        totalRelationships: 0,
        relationshipTypes: 0
      };
    }
  }

  async closeAllConnections() {
    for (const [key, driver] of this.drivers) {
      try {
        await driver.close();
        console.log(`✅ Closed Neo4j driver for ${key}`);
      } catch (error) {
        console.error(`❌ Error closing driver for ${key}:`, error);
      }
    }
    
    this.drivers.clear();
    this.connections.clear();
  }

  getStatus() {
    return {
      activeConnections: this.drivers.size,
      databases: Array.from(this.drivers.keys()),
      availableSampleDatabases: ['movies', 'social', 'company']
    };
  }
}

module.exports = new Neo4jService();
