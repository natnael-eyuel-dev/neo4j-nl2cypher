const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');

// mongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// neo4j Driver Factory
const createNeo4jDriver = (uri, username, password) => {
  try {
    const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    
    // test the connection
    return driver.verifyConnectivity()
      .then(() => {
        console.log('✅ Neo4j connection verified');
        return driver;
      })
      .catch((error) => {
        console.error('❌ Neo4j connection failed:', error);
        throw error;
      });
  } catch (error) {
    console.error('❌ Failed to create Neo4j driver:', error);
    throw error;
  }
};

// sample Database Connections
const sampleDatabases = {
  movies: {
    uri: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    name: 'Movies Database',
    description: 'Sample database with movies, people (actors, and directors)',
    schema: {
      nodes: [
        {
          label: 'Person',
          properties: [
            { name: 'personId', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'birthYear', type: 'integer' },
            { name: 'deathYear', type: 'integer' }
          ]
        },
        {
          label: 'Movie',
          properties: [
            { name: 'movieId', type: 'string' },
            { name: 'title', type: 'string' },
            { name: 'avgVote', type: 'float' },
            { name: 'releaseYear', type: 'integer' },
            { name: 'genres', type: 'string[]' }
          ]
        }
      ],
      relationships: [
        {
          type: 'ACTED_IN',
          properties: [
            { name: 'roles', type: 'string[]' },
            { name: 'billing', type: 'integer' }
          ], 
          startNode: 'Person',
          endNode: 'Movie'
        },
        {
          type: 'DIRECTED',
          properties: [],
          startNode: 'Person',
          endNode: 'Movie'
        }
      ]
    }
  },
  social: {
    uri: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    name: 'Social Network Database',
    description: 'Sample database with people, friendships, and messages',
    schema: {
      nodes: [
        {
          label: 'Person',
          properties: [
            { name: 'userId', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'email', type: 'string' },
            { name: 'age', type: 'integer' },
            { name: 'location', type: 'string' },
            { name: 'joinDate', type: 'date' }
          ]
        },
        {
          label: 'Friend',
          properties: [
            { name: 'friendId', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'mutualFriends', type: 'integer' }
          ]
        },
        {
          label: 'Message',
          properties: [
            { name: 'messageId', type: 'string' },
            { name: 'content', type: 'string' },
            { name: 'timestamp', type: 'datetime' },
            { name: 'isRead', type: 'boolean' },
            { name: 'priority', type: 'string' }
          ]
        }
      ],
      relationships: [
        {
          type: 'FRIENDS_WITH',
          properties: [
            { name: 'since', type: 'date' },
            { name: 'closeness', type: 'integer' },
            { name: 'isMutual', type: 'boolean' }
          ]
        },
        {
          type: 'SENT_MESSAGE',
          properties: [
            { name: 'timestamp', type: 'datetime' },
            { name: 'channel', type: 'string' }
          ]
        },
        {
          type: 'RECEIVED_MESSAGE',
          properties: [
            { name: 'readStatus', type: 'boolean' },
            { name: 'readTimestamp', type: 'datetime' }
          ]
        }
      ]
    }
  },
  company: {
    uri: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    name: 'Company Database',
    description: 'Sample database with companies, employees, and departments',
    schema: {
      nodes: [
        {
          label: 'Company',
          properties: [
            { name: 'companyId', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'industry', type: 'string' },
            { name: 'founded', type: 'integer' },
            { name: 'revenue', type: 'float' },
            { name: 'employeeCount', type: 'integer' }
          ]
        },
        {
          label: 'Employee',
          properties: [
            { name: 'employeeId', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'position', type: 'string' },
            { name: 'salary', type: 'float' },
            { name: 'hireDate', type: 'date' },
            { name: 'department', type: 'string' }
          ]
        },
        {
          label: 'Department',
          properties: [
            { name: 'departmentId', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'budget', type: 'float' },
            { name: 'location', type: 'string' },
            { name: 'manager', type: 'string' }
          ]
        }
      ],
      relationships: [
        {
          type: 'WORKS_FOR',
          properties: [
            { name: 'since', type: 'date' },
            { name: 'position', type: 'string' },
            { name: 'isCurrent', type: 'boolean' }
          ]
        },
        {
          type: 'BELONGS_TO',
          properties: [
            { name: 'since', type: 'date' },
            { name: 'role', type: 'string' }
          ]
        },
        {
          type: 'MANAGES',
          properties: [
            { name: 'since', type: 'date' },
            { name: 'title', type: 'string' },
            { name: 'reports', type: 'integer' }
          ]
        }
      ]
    }
  }
};

// get sample database by type
const getSampleDatabase = (type) => {
  return sampleDatabases[type] || null;
};

// get all sample databases
const getAllSampleDatabases = () => {
  return Object.keys(sampleDatabases).map(key => ({
    id: key,
    ...sampleDatabases[key]
  }));
};

// close Neo4j driver
const closeNeo4jDriver = (driver) => {
  if (driver) {
    driver.close();
  }
};

module.exports = {
  connectDB,
  createNeo4jDriver,
  getSampleDatabase,
  getAllSampleDatabases,
  closeNeo4jDriver,
  sampleDatabases
};
