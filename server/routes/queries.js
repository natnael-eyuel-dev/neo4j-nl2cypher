const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const llmService = require('../services/llmService');
const neo4jService = require('../services/neo4jService');
const Conversation = require('../models/Conversation');
const { getSampleDatabase } = require('../config/database');

const router = express.Router();

// execute natural language query
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { prompt, databaseType, customConfig } = req.body;
    
    if (!prompt || !databaseType) {
      return res.status(400).json({
        success: false,
        error: 'Prompt and database type are required'
      });
    }
    
    const startTime = Date.now();
    
    // get database schema for LLM context
    let databaseSchema;
    let databaseName;
    
    if (['movies', 'social', 'company'].includes(databaseType)) {
      const sampleDB = getSampleDatabase(databaseType);
      databaseSchema = sampleDB.schema;
      databaseName = sampleDB.name;
    } else if (customConfig && req.user) {
      // custom database
      databaseSchema = await neo4jService.getDatabaseSchema('custom', customConfig);
      databaseName = customConfig.name || 'Custom Database';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid database type or missing custom configuration'
      });
    }

    // generate Cypher query using LLM
    console.log('🤖 Generating Cypher query...');
    const cypherResult = await llmService.generateCypherQuery(prompt, databaseSchema);
    
    if (!cypherResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate Cypher query'
      });
    }
    
    const cypherQuery = cypherResult.cypherQuery;
    console.log('✅ Generated Cypher query:', cypherQuery);
    
    // execute query on Neo4j
    console.log('🔍 Executing query on Neo4j...');
    const queryResult = await neo4jService.executeQuery(
      databaseType, 
      cypherQuery, 
      customConfig
    );
    
    if (!queryResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to execute query on Neo4j'
      });
    }
    
    // generate natural language explanation
    console.log('💬 Generating explanation...');
    const explanationResult = await llmService.generateExplanation(
      cypherQuery,
      queryResult.results,
      prompt
    );
    
    const totalExecutionTime = Date.now() - startTime;

    // prepare response data
    const responseData = {
      prompt,
      cypherQuery,
      databaseType,
      databaseName,
      results: queryResult.results,
      explanation: explanationResult.explanation,
      executionTime: queryResult.executionTime,
      totalTime: totalExecutionTime,
      llmProvider: cypherResult.provider,
      llmModel: cypherResult.model,
      recordCount: queryResult.recordCount
    };
    
    // save conversation if user is logged in
    if (req.user) {
      try {
        const conversation = new Conversation({
          user: req.user._id,
          prompt,
          cypherQuery,
          databaseType,
          databaseName,
          results: queryResult.results,
          explanation: explanationResult.explanation,
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            executionTime: queryResult.executionTime,
            tokensUsed: 0, 
            modelUsed: cypherResult.model
          }
        });
        
        await conversation.save();
        console.log('💾 Conversation saved to database');
      } catch (error) {
        console.error('⚠️ Failed to save conversation:', error);
      }
    }
    
    res.json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    console.error('❌ Query execution failed:', error);
    res.status(500).json({
      success: false,
      error: `Query execution failed: ${error.message}`
    });
  }
});

// execute raw Cypher query (for debugging/testing)
router.post('/cypher', optionalAuth, async (req, res) => {
  try {
    const { cypherQuery, databaseType, customConfig } = req.body;
    
    if (!cypherQuery || !databaseType) {
      return res.status(400).json({
        success: false,
        error: 'Cypher query and database type are required'
      });
    }
    
    // execute the query directly
    const result = await neo4jService.executeQuery(
      databaseType, 
      cypherQuery, 
      customConfig
    );
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Cypher query execution failed:', error);
    res.status(500).json({
      success: false,
      error: `Cypher query execution failed: ${error.message}`
    });
  }
});

// get query suggestions based on database type
router.get('/suggestions/:databaseType', async (req, res) => {
  try {
    const { databaseType } = req.params;
    
    if (!['movies', 'social', 'company'].includes(databaseType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid database type'
      });
    }
    
    const suggestions = getQuerySuggestions(databaseType);
    
    res.json({
      success: true,
      data: suggestions
    });
    
  } catch (error) {
    console.error('❌ Get query suggestions failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get query suggestions'
    });
  }
});

// validate Cypher query syntax
router.post('/validate', async (req, res) => {
  try {
    const { cypherQuery } = req.body;
    
    if (!cypherQuery) {
      return res.status(400).json({
        success: false,
        error: 'Cypher query is required'
      });
    }
    
    const isValid = llmService.validateCypherQuery(cypherQuery);
    
    res.json({
      success: true,
      data: {
        isValid,
        query: cypherQuery
      }
    });
    
  } catch (error) {
    console.error('❌ Query validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate query'
    });
  }
});

// get LLM service status
router.get('/llm/status', async (req, res) => {
  try {
    const status = llmService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('❌ Get LLM status failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get LLM status'
    });
  }
});

// get Neo4j service status
router.get('/neo4j/status', async (req, res) => {
  try {
    const status = neo4jService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('❌ Get Neo4j status failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Neo4j status'
    });
  }
});

// helper function to get query suggestions
function getQuerySuggestions(databaseType) {
  const suggestions = {
    movies: [
      "Show all movies directed by Christopher Nolan",
      "Find actors who appeared in more than 5 movies",
      "What movies were released in 2023?",
      "Show the cast of The Dark Knight",
      "Find movies with ratings above 8.0",
      "Which director has the most movies?",
      "Show movies by genre",
      "Find movies starring Tom Hanks"
    ],
    social: [
      "Show all friends of John Doe",
      "Find people with more than 10 friends",
      "Show messages sent in the last week",
      "Find the most active users",
      "Show mutual friends between two people",
      "Find people who haven't posted in a month",
      "Show the longest friendship",
      "Find users with similar interests"
    ],
    company: [
      "Show all employees in the Engineering department",
      "Find managers with more than 5 direct reports",
      "Show the company hierarchy",
      "Find employees who joined in 2023",
      "Show departments by employee count",
      "Find the highest paid employees",
      "Show projects and their team members",
      "Find employees working on multiple projects"
    ]
  };
  
  return suggestions[databaseType] || [];
}

module.exports = router;
