const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { protect, optionalAuth } = require('../middleware/auth');
const { getAllSampleDatabases, getSampleDatabase } = require('../config/database');
const neo4jService = require('../services/neo4jService');

const router = express.Router();

// configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, 
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'), false);
    }
  }
});

// get all available databases (sample + user's custom)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const sampleDatabases = getAllSampleDatabases();
    let customDatabases = [];
    
    // add user's custom databases if logged in
    if (req.user) {
      customDatabases = req.user.customDatabases.map(db => ({
        id: db._id.toString(),
        type: 'custom',
        name: db.name,
        description: db.description,
        uri: db.uri,
        username: db.username,
        createdAt: db.createdAt
      }));
    }
    
    res.json({
      success: true,
      data: {
        sample: sampleDatabases,
        custom: customDatabases,
        total: sampleDatabases.length + customDatabases.length
      }
    });
  } catch (error) {
    console.error('❌ Get databases failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get databases'
    });
  }
});

// get specific database details
router.get('/:databaseId', optionalAuth, async (req, res) => {
  try {
    const { databaseId } = req.params;
    
    // check if it's a sample database
    if (['movies', 'social', 'company'].includes(databaseId)) {
      const sampleDB = getSampleDatabase(databaseId);
      
      if (!sampleDB) {
        return res.status(404).json({
          success: false,
          error: 'Sample database not found'
        });
      }
      
      // get schema and stats
      const [schema, stats] = await Promise.all([
        neo4jService.getDatabaseSchema(databaseId),
        neo4jService.getDatabaseStats(databaseId)
      ]);
      
      return res.json({
        success: true,
        data: {
          ...sampleDB,
          schema,
          stats
        }
      });
    }
    
    // check if it's a user's custom database
    if (req.user) {
      const customDB = req.user.customDatabases.find(db => db._id.toString() === databaseId);
      
      if (customDB) {
        // get schema and stats for custom database
        const customConfig = {
          uri: customDB.uri,
          username: customDB.username,
          password: req.body.password 
        };
        
        const [schema, stats] = await Promise.all([
          neo4jService.getDatabaseSchema('custom', customConfig),
          neo4jService.getDatabaseStats('custom', customConfig)
        ]);
        
        return res.json({
          success: true,
          data: {
            id: customDB._id.toString(),
            type: 'custom',
            name: customDB.name,
            description: customDB.description,
            uri: customDB.uri,
            username: customDB.username,
            createdAt: customDB.createdAt,
            schema,
            stats
          }
        });
      }
    }
    
    res.status(404).json({
      success: false,
      error: 'Database not found'
    });
  } catch (error) {
    console.error('❌ Get database details failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database details'
    });
  }
});

// test custom database connection
router.post('/test-connection', async (req, res) => {
  try {
    const { uri, username, password } = req.body;
    
    if (!uri || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'URI, username, and password are required'
      });
    }
    
    const result = await neo4jService.testConnection(uri, username, password);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Test connection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test connection'
    });
  }
});

// upload data to create new graph (protected route)
router.post('/upload', protect, upload.single('data'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const { databaseName, nodeMapping, relationshipMapping } = req.body;
    
    if (!databaseName || !nodeMapping) {
      return res.status(400).json({
        success: false,
        error: 'Database name and node mapping are required'
      });
    }
    
    let parsedData;
    
    // parse file based on type
    if (req.file.mimetype === 'text/csv') {
      parsedData = await parseCSV(req.file.buffer);
    } else if (req.file.mimetype === 'application/json') {
      parsedData = JSON.parse(req.file.buffer.toString());
    }
    
    if (!parsedData || !Array.isArray(parsedData)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file format or empty data'
      });
    }
    
    // process the data and create Cypher statements
    const cypherStatements = generateCypherStatements(
      parsedData, 
      JSON.parse(nodeMapping), 
      JSON.parse(relationshipMapping || '{}')
    );
    
    // execute the Cypher statements
    const results = [];
    for (const statement of cypherStatements) {
      try {
        const result = await neo4jService.executeQuery('custom', statement, {
          uri: process.env.NEO4J_URI,
          username: process.env.NEO4J_USERNAME,
          password: process.env.NEO4J_PASSWORD
        });
        results.push({ statement, success: true, result });
      } catch (error) {
        results.push({ statement, success: false, error: error.message });
      }
    }
    
    res.json({
      success: true,
      data: {
        databaseName,
        recordsProcessed: parsedData.length,
        cypherStatements: cypherStatements.length,
        results
      },
      message: 'Data uploaded and processed successfully'
    });
  } catch (error) {
    console.error('❌ Data upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload and process data'
    });
  }
});

// get database schema
router.get('/:databaseId/schema', optionalAuth, async (req, res) => {
  try {
    const { databaseId } = req.params;
    const { password } = req.body; 
    
    let schema;
    
    if (['movies', 'social', 'company'].includes(databaseId)) {
      schema = await neo4jService.getDatabaseSchema(databaseId);
    } else if (req.user) {
      const customDB = req.user.customDatabases.find(db => db._id.toString() === databaseId);
      if (customDB && password) {
        const customConfig = {
          uri: customDB.uri,
          username: customDB.username,
          password
        };
        schema = await neo4jService.getDatabaseSchema('custom', customConfig);
      }
    }
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        error: 'Schema not found'
      });
    }
    
    res.json({
      success: true,
      data: schema
    });
  } catch (error) {
    console.error('❌ Get schema failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database schema'
    });
  }
});

// get database statistics
router.get('/:databaseId/stats', optionalAuth, async (req, res) => {
  try {
    const { databaseId } = req.params;
    const { password } = req.body; 
    
    let stats;
    
    if (['movies', 'social', 'company'].includes(databaseId)) {
      stats = await neo4jService.getDatabaseStats(databaseId);
    } else if (req.user) {
      const customDB = req.user.customDatabases.find(db => db._id.toString() === databaseId);
      if (customDB && password) {
        const customConfig = {
          uri: customDB.uri,
          username: customDB.username,
          password
        };
        stats = await neo4jService.getDatabaseStats('custom', customConfig);
      }
    }
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Statistics not found'
      });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get stats failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database statistics'
    });
  }
});

// helper function to parse CSV data
async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = require('stream');
    const readable = new stream.Readable();
    readable.push(buffer);
    readable.push(null);
    
    readable
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// helper function to generate Cypher statements
function generateCypherStatements(data, nodeMapping, relationshipMapping) {
  const statements = [];
  
  // Create nodes
  data.forEach((row, index) => {
    const nodeLabels = nodeMapping.labels || ['Node'];
    const nodeProperties = {};
    
    // map CSV columns to node properties
    Object.keys(nodeMapping.properties || {}).forEach(csvColumn => {
      const propertyName = nodeMapping.properties[csvColumn];
      if (row[csvColumn] !== undefined) {
        nodeProperties[propertyName] = row[csvColumn];
      }
    });
    
    // add unique identifier
    nodeProperties.id = row[nodeMapping.idColumn] || `node_${index}`;
    
    const labels = nodeLabels.map(label => `:${label}`).join('');
    const properties = JSON.stringify(nodeProperties).replace(/"/g, "'");
    
    statements.push(`CREATE (n${index}${labels} ${properties})`);
  });
  
  // create relationships if specified
  if (relationshipMapping && relationshipMapping.type) {
    data.forEach((row, index) => {
      if (index < data.length - 1) {
        const sourceId = row[relationshipMapping.sourceColumn] || `node_${index}`;
        const targetId = data[index + 1][relationshipMapping.targetColumn] || `node_${index + 1}`;
        
        statements.push(`
          MATCH (source {id: '${sourceId}'})
          MATCH (target {id: '${targetId}'})
          CREATE (source)-[:${relationshipMapping.type}]->(target)
        `);
      }
    });
  }
  
  return statements;
}

module.exports = router;
