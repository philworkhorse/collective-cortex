/**
 * Knowledge routes - Collective memory management
 */

const express = require('express');
const db = require('../db');
const { authenticateAgent, optionalAuth } = require('../middleware/auth');
const { getEmbedding } = require('../utils/embeddings');

const router = express.Router();

// Contribute knowledge
router.post('/', authenticateAgent, async (req, res) => {
  const { title, content, category, tags } = req.body;
  
  if (!content || content.length < 10) {
    return res.status(400).json({ error: 'Content required (minimum 10 characters)' });
  }
  
  if (content.length > 10000) {
    return res.status(400).json({ error: 'Content too long (max 10000 characters)' });
  }
  
  try {
    // Generate embedding for semantic search
    const embedding = await getEmbedding(content);
    
    const result = await db.query(`
      INSERT INTO knowledge (agent_id, title, content, embedding, category, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, content, category, tags, created_at
    `, [req.agent.id, title || null, content, embedding, category || null, tags || []]);
    
    // Log contribution
    await db.query(`
      INSERT INTO contributions (agent_id, type, reference_type, reference_id, points, description)
      VALUES ($1, 'knowledge', 'knowledge', $2, 25, 'Contributed knowledge to the collective')
    `, [req.agent.id, result.rows[0].id]);
    
    res.status(201).json({
      message: 'Knowledge contributed to the collective! 🧠',
      knowledge: {
        ...result.rows[0],
        agent: { id: req.agent.id, name: req.agent.name }
      },
      points_earned: 25
    });
  } catch (error) {
    console.error('Knowledge contribution error:', error);
    res.status(500).json({ error: 'Failed to contribute knowledge' });
  }
});

// Semantic search knowledge
router.get('/search', optionalAuth, async (req, res) => {
  const { q, category, limit = 10 } = req.query;
  
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Search query required (minimum 2 characters)' });
  }
  
  try {
    const embedding = await getEmbedding(q);
    const searchLimit = Math.min(parseInt(limit), 50);
    
    let query = `
      SELECT 
        k.id, k.title, k.content, k.category, k.tags, k.citations, k.upvotes, k.created_at,
        a.id as agent_id, a.name as agent_name, a.avatar_url as agent_avatar,
        1 - (k.embedding <=> $1) as similarity
      FROM knowledge k
      LEFT JOIN agents a ON k.agent_id = a.id
      WHERE k.embedding IS NOT NULL
    `;
    
    const params = [embedding]; // Already formatted as pgvector string by getEmbedding
    
    if (category) {
      query += ` AND k.category = $${params.length + 1}`;
      params.push(category);
    }
    
    query += ` ORDER BY similarity DESC LIMIT $${params.length + 1}`;
    params.push(searchLimit);
    
    const result = await db.query(query, params);
    
    // If authenticated, log the citation for tracking
    if (req.agent && result.rows.length > 0) {
      const topResult = result.rows[0];
      await db.query(`
        INSERT INTO knowledge_citations (citing_agent_id, knowledge_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [req.agent.id, topResult.id]).catch(() => {}); // Ignore citation errors
    }
    
    res.json({
      query: q,
      results: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        tags: row.tags,
        citations: row.citations,
        upvotes: row.upvotes,
        similarity: parseFloat(row.similarity.toFixed(4)),
        created_at: row.created_at,
        agent: row.agent_id ? {
          id: row.agent_id,
          name: row.agent_name,
          avatar_url: row.agent_avatar
        } : null
      })),
      count: result.rows.length
    });
  } catch (error) {
    console.error('Knowledge search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Browse knowledge (non-semantic)
router.get('/', async (req, res) => {
  const { category, agent_id, sort = 'recent', limit = 20, offset = 0 } = req.query;
  const searchLimit = Math.min(parseInt(limit), 100);
  const searchOffset = parseInt(offset) || 0;
  
  let orderBy = 'k.created_at DESC';
  if (sort === 'citations') orderBy = 'k.citations DESC';
  if (sort === 'upvotes') orderBy = 'k.upvotes DESC';
  
  try {
    let query = `
      SELECT 
        k.id, k.title, k.content, k.category, k.tags, k.citations, k.upvotes, k.created_at,
        a.id as agent_id, a.name as agent_name, a.avatar_url as agent_avatar
      FROM knowledge k
      LEFT JOIN agents a ON k.agent_id = a.id
      WHERE 1=1
    `;
    const params = [];
    
    if (category) {
      params.push(category);
      query += ` AND k.category = $${params.length}`;
    }
    
    if (agent_id) {
      params.push(agent_id);
      query += ` AND k.agent_id = $${params.length}`;
    }
    
    params.push(searchLimit);
    params.push(searchOffset);
    query += ` ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    res.json({
      knowledge: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        tags: row.tags,
        citations: row.citations,
        upvotes: row.upvotes,
        created_at: row.created_at,
        agent: row.agent_id ? {
          id: row.agent_id,
          name: row.agent_name,
          avatar_url: row.agent_avatar
        } : null
      })),
      limit: searchLimit,
      offset: searchOffset
    });
  } catch (error) {
    console.error('Knowledge browse error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge' });
  }
});

// Get single knowledge entry
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        k.*,
        a.id as agent_id, a.name as agent_name, a.avatar_url as agent_avatar
      FROM knowledge k
      LEFT JOIN agents a ON k.agent_id = a.id
      WHERE k.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Knowledge not found' });
    }
    
    const row = result.rows[0];
    delete row.embedding; // Don't expose embedding
    
    res.json({
      knowledge: {
        ...row,
        agent: row.agent_id ? {
          id: row.agent_id,
          name: row.agent_name,
          avatar_url: row.agent_avatar
        } : null
      }
    });
  } catch (error) {
    console.error('Knowledge fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge' });
  }
});

// Upvote knowledge
router.post('/:id/upvote', authenticateAgent, async (req, res) => {
  try {
    await db.query(`
      UPDATE knowledge SET upvotes = upvotes + 1 WHERE id = $1
    `, [req.params.id]);
    
    // Log contribution for upvoting
    await db.query(`
      INSERT INTO contributions (agent_id, type, reference_type, reference_id, points, description)
      VALUES ($1, 'upvote', 'knowledge', $2, 1, 'Upvoted knowledge')
    `, [req.agent.id, req.params.id]);
    
    res.json({ message: 'Upvoted!' });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ error: 'Failed to upvote' });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT category, COUNT(*) as count
      FROM knowledge
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);
    
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
