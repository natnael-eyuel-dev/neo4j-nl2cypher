# 🕸️ Natural Language to Neo4j Query System

A platform where users can query graph databases in natural language using LLM integration, LangChain, and Neo4j.

## 🎯 Features

- **Natural Language Queries**: Convert plain English to Cypher queries using LLM
- **3 Preloaded Databases**: Movies, Social Network, and Company databases
- **Custom Database Connection**: Connect to your own Neo4j instance
- **Data Upload**: Create new graphs from CSV/JSON data
- **Google OAuth**: Secure authentication system
- **Graph Visualization**: Interactive results using Neo4j Bloom
- **Conversation History**: Save and restore previous queries (for logged-in users)

## 🏗️ Architecture

- **Frontend**: Next.js with TypeScript
- **Backend**: Express.js with Node.js
- **Database**: Neo4j AuraDB (cloud-hosted)
- **Storage**: MongoDB for user data and conversation history
- **LLM Integration**: Gemini/GPT/Claude/Groq API
- **LangChain**: Node.js compatible version for query processing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB instance
- Neo4j AuraDB account
- LLM API key (Gemini, GPT, Claude or Groq)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd neo4j-natural-language-query
   npm run install:all
   ```

2. **Environment Setup:**
   ```bash
   cp client/env.local.example client/.env.local
   # Edit these files with your credentials
   ```

3. **Start Development:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
  - Backend API (same app): http://localhost:3000/api/health

## 📁 Project Structure

```
├── client/               # Next.js frontend
│   ├── components/       # React components
│   ├── pages/            # Next.js pages
│   ├── styles/           # CSS and styling
│   └── utils/            # Frontend utilities
├── server/               # Express.js backend
    ├── config/           # Configuration files
    ├── controllers/      # Route controllers
    ├── middleware/       # Express middleware
    ├── models/           # Database models
    ├── routes/           # API routes
    └── services/         # Business logic                  
```

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/neo4j-query-system

# Neo4j
NEO4J_URI=neo4j+s://your-instance.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password

# LLM API
LLM_API_KEY=your-api-key
LLM_PROVIDER=gemini  # gemini, openai, anthropic or groq

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# JWT
JWT_SECRET=your-jwt-secret
```

## 📚 API Documentation

### Authentication
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback (redirects to `/auth/callback?token=...`)
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify JWT and get user profile

### Databases
- `GET /api/databases` - List available databases
- `POST /api/databases/connect` - Connect to custom Neo4j instance
- `POST /api/databases/upload` - Upload data to create new graph

### Queries
- `POST /api/queries` - Execute natural language query
- `GET /api/conversations` - Get user conversation history
- `POST /api/conversations` - Save conversation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request