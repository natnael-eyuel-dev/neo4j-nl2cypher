const axios = require('axios');

class LLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'gemini';
    this.apiKey = process.env.LLM_API_KEY;
    this.baseUrls = {
      gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      groq: 'https://api.groq.com/openai/v1',
    };
    this.models = {
      gemini: 'gemini-1.5-flash',
      openai: 'gpt-4',
      anthropic: 'claude-3-sonnet-20240229',
      groq: 'llama-3.1-8b-instant',
    };
  }

  ensureReturnClause(query) {
    if (!query || typeof query !== 'string') {
      return 'RETURN * LIMIT 100';
    }

    console.log('Ensuring RETURN clause for query:', query);

    let cleanedQuery = query.trim();

    cleanedQuery = cleanedQuery.replace(/;+$/, '').trim();

    const hasReturn = /RETURN\s/i.test(cleanedQuery);
    
    if (!hasReturn) {
      const hasMatch = /MATCH\s/i.test(cleanedQuery);
      
      if (hasMatch) {
        cleanedQuery += '\nRETURN * LIMIT 100';
      } else {
        if (/CREATE\s/i.test(cleanedQuery) || /MERGE\s/i.test(cleanedQuery) || 
            /DELETE\s/i.test(cleanedQuery) || /SET\s/i.test(cleanedQuery) || 
            /REMOVE\s/i.test(cleanedQuery)) {
          cleanedQuery += '\nRETURN * LIMIT 100';
        } else if (/CALL\s/i.test(cleanedQuery)) {
          if (!/YIELD\s/i.test(cleanedQuery) && !/RETURN\s/i.test(cleanedQuery)) {
            cleanedQuery += '\nYIELD * LIMIT 100';
          }
        } else {
          cleanedQuery += '\nRETURN * LIMIT 100';
        }
      }
    }

    const isReadOperation = /MATCH\s/i.test(cleanedQuery) || /RETURN\s/i.test(cleanedQuery) || 
                          /WITH\s/i.test(cleanedQuery) || /CALL\s.*YIELD/i.test(cleanedQuery);
    
    if (isReadOperation && !/LIMIT\s+\d+/i.test(cleanedQuery)) {
      if (/RETURN\s/i.test(cleanedQuery)) {
        cleanedQuery += ' LIMIT 100';
      } else if (/YIELD\s/i.test(cleanedQuery)) {
        cleanedQuery += ' LIMIT 100';
      }
    }

    return cleanedQuery;
  }

  async generateExplanation(cypherQuery, results, prompt) {
    try {
      const systemPrompt = this.buildExplanationSystemPrompt();

      const sampleRecords = this.extractSampleForExplanation(results);

      const userPrompt = `Explain this Cypher query and its results in simple, short and concise terms:
        Query: ${cypherQuery}
        Sample Results (${sampleRecords.totalRecords} total): ${JSON.stringify(sampleRecords.sample)}
        Original Request: "${prompt}"`;

      const response = await this.callLLM(systemPrompt, userPrompt);

      return {
        success: true,
        explanation: response.trim(),
        provider: this.provider,
        model: this.models[this.provider]
      };
    } catch (error) {
      console.error('❌ LLM explanation generation failed:', error);
      return {
        success: false,
        explanation: `The query "${cypherQuery}" returned ${results.records?.length || 0} records.`,
        provider: 'fallback',
        model: 'fallback'
      };
    }
  }

  extractSampleForExplanation(results) {
    if (!results || !results.records) {
      return { totalRecords: 0, sample: [] };
    }

    const totalRecords = results.records.length;
    
    const sample = results.records.slice(0, 3).map(record => {
      const simplified = {};
      for (const key in record) {
        if (record[key]?.properties) {
          const props = record[key].properties;
          simplified[key] = {
            ...(props.name && { name: props.name }),
            ...(props.title && { title: props.title }),
            _type: record[key].labels ? record[key].labels[0] : 'Unknown'
          };
        } else {
          simplified[key] = record[key];
        }
      }
      return simplified;
    });

    return {
      totalRecords,
      sample
    };
  }

  buildExplanationSystemPrompt() {
    return `You are an expert at explaining graph database queries and results in simple, clear language.

      Important: The results may show only a sample of the data (first 10 records) when there are many results.

      Rules:
      1. Explain what the query does in plain English in one or two sentences.
      2. Describe the results clearly, highlighting only the key points.
      3. If only a sample is shown, mention that these are sample results from a larger dataset.
      4. Provide 2–3 key insights from the data, each in a single short sentence.
      5. Use simple, concise language. Avoid technical jargon and unnecessary details.
      6. Focus strictly on the query and the results.
      7. If results are empty, explain in one sentence why that might be.
      8. Keep the total explanation short and readable (ideally under 5 sentences).`;
  }

  buildCypherSystemPrompt(schema) {
    if (!schema || !Array.isArray(schema.nodes) || !Array.isArray(schema.relationships)) {
      throw new Error("Invalid schema object passed to buildCypherSystemPrompt");
    }

    let schemaDetails = 'DATABASE SCHEMA DETAILS:\n\n';

    schemaDetails += 'NODE TYPES:\n';
    schema.nodes.forEach(node => {
      const props = node.properties?.map(p => p.name).join(', ') || 'No properties';
      schemaDetails += `- ${node.label}: ${props}\n`;
    });

    schemaDetails += '\nRELATIONSHIP TYPES:\n';
    schema.relationships.forEach(rel => {
      const props = rel.properties?.map(p => p.name).join(', ') || 'No properties';
      const relDescription = {
        type: rel.type,
        properties: props,
        from: rel.startNode,
        to: rel.endNode
      };
      schemaDetails += `- ${JSON.stringify(relDescription)}\n`;
    });

    const movieExamples = `
      MOVIE QUERY EXAMPLES:
      - Romantic comedies: MATCH (m:Movie) WHERE m.genres CONTAINS "Comedy" AND m.genres CONTAINS "Romance" RETURN m
      - Movies from 2000s: MATCH (m:Movie) WHERE m.releaseYear >= 2000 AND m.releaseYear < 2010 RETURN m
      - Action movies: MATCH (m:Movie) WHERE m.genres CONTAINS "Action" RETURN m
      - Movies with specific actor: MATCH (p:Person {name: "Tom Hanks"})-[:ACTED_IN]->(m:Movie) RETURN m
      - Directors and their movies: MATCH (p:Person)-[:DIRECTED]->(m:Movie) RETURN p, m
    `;

    return `You are an expert Cypher query generator for Neo4j graph databases.

    Schema Details:
      ${schemaDetails}

      ${movieExamples}

      ABSOLUTE RULES (MUST FOLLOW):
      1. Use properties from the schema above. Common movie properties: title, releaseYear, genres, rating
      2. For genre filters, use: WHERE m.genres CONTAINS "GenreName"
      3. For year ranges, use: WHERE m.releaseYear >= 2000 AND m.releaseYear < 2010
      4. EVERY query MUST include a RETURN clause
      5. Return ONLY the Cypher query. No explanations, no comments, no text

      CRITICAL: If the user asks for movies by genre or year, use the appropriate properties from the schema.`;
  }

  getBetterFallbackQuery(prompt, databaseSchema) {
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('movie') || promptLower.includes('film')) {
      if (promptLower.includes('comedy') || promptLower.includes('romantic')) {
        return 'MATCH (m:Movie) WHERE m.genres CONTAINS "Comedy" RETURN m LIMIT 100';
      }
      if (promptLower.includes('action')) {
        return 'MATCH (m:Movie) WHERE m.genres CONTAINS "Action" RETURN m LIMIT 100';
      }
      if (promptLower.includes('drama')) {
        return 'MATCH (m:Movie) WHERE m.genres CONTAINS "Drama" RETURN m LIMIT 100';
      }
      if (promptLower.includes('year') || promptLower.includes('2000') || promptLower.includes('release')) {
        return 'MATCH (m:Movie) WHERE m.releaseYear >= 2000 AND m.releaseYear < 2010 RETURN m LIMIT 100';
      }
      return 'MATCH (m:Movie) RETURN m LIMIT 100';
    }
    
    if (promptLower.includes('actor') || promptLower.includes('actress') || promptLower.includes('director')) {
      return 'MATCH (p:Person) RETURN p LIMIT 100';
    }
    
    if (promptLower.includes('acted in') || promptLower.includes('directed') || promptLower.includes('starred')) {
      return 'MATCH (p:Person)-[r]->(m:Movie) RETURN p, r, m LIMIT 100';
    }
    
    return 'MATCH (n) RETURN n LIMIT 100';
  }

  async generateCypherQuery(prompt, databaseSchema) {
    try {
      const systemPrompt = this.buildCypherSystemPrompt(databaseSchema);
      const userPrompt = `Convert this natural language request to a valid Cypher query: "${prompt}"`;

      console.log('🤖 Generating Cypher for prompt:', prompt);
      
      const response = await this.callLLM(systemPrompt, userPrompt);
      
      let rawQuery = this.extractCypherQuery(response);
      
      console.log('📝 Raw LLM response:', response);
      console.log('🔍 Extracted query:', rawQuery);
      
      rawQuery = this.ensureReturnClause(rawQuery);
      
      if (!this.validateCypherQuery(rawQuery)) {
        console.warn('❌ Generated query failed validation, using intelligent fallback');
        rawQuery = this.getBetterFallbackQuery(prompt, databaseSchema);
      }
      
      console.log('✅ Final query:', rawQuery);
      
      return {
        success: true,
        cypherQuery: rawQuery,
        rawResponse: response,
        provider: this.provider,
        model: this.models[this.provider]
      };
    } catch (error) {
      console.error('❌ LLM Cypher generation failed:', error.message);
      const fallbackQuery = this.getBetterFallbackQuery(prompt, databaseSchema);
      
      return {
        success: false,
        cypherQuery: fallbackQuery,
        error: error.message,
        provider: 'fallback',
        model: 'fallback'
      };
    }
  }

  async callLLM(systemPrompt, userPrompt) {
    switch (this.provider) {
      case 'gemini':
        return await this.callGemini(systemPrompt, userPrompt);
      case 'openai':
        return await this.callOpenAI(systemPrompt, userPrompt);
      case 'anthropic':
        return await this.callAnthropic(systemPrompt, userPrompt);
      case 'groq':
        return await this.callGroq(systemPrompt, userPrompt);
      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  async callGemini(systemPrompt, userPrompt) {
    const url = `${this.baseUrls.gemini}/${this.models.gemini}:generateContent?key=${this.apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n${userPrompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
        topP: 0.8,
        topK: 40
      }
    };

    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    return response.data.candidates[0].content.parts[0].text;
  }

  async callOpenAI(systemPrompt, userPrompt) {
    const url = `${this.baseUrls.openai}/chat/completions`;
    
    const payload = {
      model: this.models.openai,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    };

    const response = await axios.post(url, payload, {
      headers: { 
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data.choices[0].message.content;
  }

  async callAnthropic(systemPrompt, userPrompt) {
    const url = this.baseUrls.anthropic + '/messages';
    
    const payload = {
      model: this.models.anthropic,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `${systemPrompt}\n\n${userPrompt}`
      }]
    };

    const response = await axios.post(url, payload, {
      headers: { 
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      timeout: 30000
    });

    return response.data.content[0].text;
  }

  async callGroq(systemPrompt, userPrompt) {
    const url = `${this.baseUrls.groq}/chat/completions`;
    
    const payload = {
      model: this.models.groq,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1, 
      max_tokens: 1000,
      top_p: 0.8
    };

    const response = await axios.post(url, payload, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      timeout: 30000
    });

    return response.data.choices[0].message.content;
  }

  extractCypherQuery(response) {
    if (!response) return 'MATCH (n) RETURN n LIMIT 100';

    let cleanedResponse = response.replace(/```(?:\w+)?\s?/g, '').trim();

    const cypherPatterns = [
      /(MATCH\s+.*?RETURN.*?(?:LIMIT\s+\d+)?);?$/is,
      /(MATCH\s+.*?YIELD.*?(?:LIMIT\s+\d+)?);?$/is,
      /(CREATE\s+.*?RETURN.*?(?:LIMIT\s+\d+)?);?$/is,
      /(MERGE\s+.*?RETURN.*?(?:LIMIT\s+\d+)?);?$/is,
      /(CALL\s+.*?YIELD.*?(?:LIMIT\s+\d+)?);?$/is,
      
      /(MATCH\s+.*)$/im,
      /(CREATE\s+.*)$/im,
      /(MERGE\s+.*)$/im,
      /(CALL\s+.*)$/im
    ];

    let extractedQuery = null;

    for (const pattern of cypherPatterns) {
      const match = cleanedResponse.match(pattern);
      if (match && match[1]) {
        extractedQuery = match[1].trim();
        break;
      }
    }

    if (!extractedQuery) {
      const lines = cleanedResponse.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if ((trimmedLine.includes('MATCH') || trimmedLine.includes('CREATE') || 
            trimmedLine.includes('MERGE') || trimmedLine.includes('CALL')) &&
            !trimmedLine.startsWith('//') && !trimmedLine.startsWith('--')) {
          extractedQuery = trimmedLine;
          break;
        }
      }
    }

    if (!extractedQuery) {
      return 'MATCH (n) RETURN n LIMIT 100';
    }

    const hasReturnOrYield = /RETURN\s/i.test(extractedQuery) || /YIELD\s/i.test(extractedQuery);
    
    if (!hasReturnOrYield) {
      console.warn('Extracted query missing RETURN/YIELD:', extractedQuery);
      if (/MATCH\s/i.test(extractedQuery)) {
        extractedQuery += ' RETURN * LIMIT 100';
      } else if (/CALL\s/i.test(extractedQuery)) {
        extractedQuery += ' YIELD * LIMIT 100';
      } else if (/CREATE\s/i.test(extractedQuery) || /MERGE\s/i.test(extractedQuery)) {
        extractedQuery += ' RETURN * LIMIT 100';
      } else {
        return 'MATCH (n) RETURN n LIMIT 100';
      }
    }

    const isReadOperation = /MATCH\s/i.test(extractedQuery) || /RETURN\s/i.test(extractedQuery) || 
                          /WITH\s/i.test(extractedQuery) || /CALL\s.*YIELD/i.test(extractedQuery);
    
    if (isReadOperation && !/LIMIT\s+\d+/i.test(extractedQuery)) {
      extractedQuery += ' LIMIT 100';
    }

    return extractedQuery;
  }

  validateCypherQuery(query) {
    if (!query || typeof query !== 'string') return false;

    const trimmedQuery = query.trim();

    const isOverlyGeneric =
      trimmedQuery === 'MATCH (n) RETURN n LIMIT 100' ||
      trimmedQuery === 'MATCH (m:Movie) RETURN m LIMIT 100' ||
      trimmedQuery === 'MATCH (p:Person) RETURN p LIMIT 100';

    if (isOverlyGeneric) {
      console.warn('Query is too generic, needs improvement');
      return false;
    }

    const hasValidStart = /^(MATCH|CREATE|MERGE|CALL|WITH|RETURN|UNWIND)/i.test(trimmedQuery);

    const hasValidReturn =
      /RETURN\s/i.test(trimmedQuery) ||
      (/CALL\s/i.test(trimmedQuery) && /YIELD\s/i.test(trimmedQuery));

    const hasDangerousOperations =
      /\bDROP\s/i.test(trimmedQuery) ||
      /\bDETACH\s+DELETE\s/i.test(trimmedQuery) ||
      (/\bDELETE\s/i.test(trimmedQuery) && !/RETURN/i.test(trimmedQuery));

    return hasValidStart && hasValidReturn && !hasDangerousOperations;
  }

  getStatus() {
    return {
      provider: this.provider,
      model: this.models[this.provider],
      apiKeyConfigured: !!this.apiKey,
      baseUrl: this.baseUrls[this.provider]
    };
  }
}

module.exports = new LLMService();
