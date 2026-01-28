/**
 * Embedding generation utilities
 * Uses OpenAI text-embedding-3-small
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getEmbedding(text) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('No OpenAI API key configured, returning null embedding');
    return null;
  }
  
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Truncate to model limit
    });
    
    // Format as pgvector-compatible string: [1.0, 2.0, ...]
    const embedding = response.data[0].embedding;
    return '[' + embedding.join(',') + ']';
  } catch (error) {
    console.error('Embedding generation error:', error.message);
    return null;
  }
}

async function getEmbeddings(texts) {
  if (!process.env.OPENAI_API_KEY) {
    return texts.map(() => null);
  }
  
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts.map(t => t.slice(0, 8000)),
    });
    
    return response.data.map(d => d.embedding);
  } catch (error) {
    console.error('Batch embedding error:', error.message);
    return texts.map(() => null);
  }
}

module.exports = { getEmbedding, getEmbeddings };
