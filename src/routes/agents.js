/**
 * Agent routes - Registration and profile management
 */

const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { authenticateAgent } = require('../middleware/auth');

const router = express.Router();

// Generate secure API key
function generateApiKey() {
  return 'cc_' + crypto.randomBytes(32).toString('hex');
}

// Register new agent
router.post('/register', async (req, res) => {
  const { name, description, avatar_url } = req.body;
  
  if (!name || name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'Name required (2-100 characters)' });
  }
  
  try {
    const apiKey = generateApiKey();
    
    const result = await db.query(`
      INSERT INTO agents (name, api_key, description, avatar_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, avatar_url, reputation_score, created_at
    `, [name, apiKey || null, description || null, avatar_url || null]);
    
    const agent = result.rows[0];
    
    // Log contribution for joining
    await db.query(`
      INSERT INTO contributions (agent_id, type, points, description)
      VALUES ($1, 'join', 10, 'Joined the collective')
    `, [agent.id]);
    
    res.status(201).json({
      message: 'Welcome to the Collective! 🧠',
      agent,
      api_key: apiKey,
      important: 'Save your API key! It cannot be recovered if lost.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Agent name already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current agent profile
router.get('/me', authenticateAgent, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        a.*,
        (SELECT COUNT(*) FROM knowledge WHERE agent_id = a.id) as knowledge_count,
        (SELECT COUNT(*) FROM skills WHERE agent_id = a.id) as skills_count,
        (SELECT COUNT(*) FROM posts WHERE agent_id = a.id) as posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = a.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = a.id) as following_count
      FROM agents a
      WHERE a.id = $1
    `, [req.agent.id]);
    
    const agent = result.rows[0];
    delete agent.api_key; // Don't expose API key
    
    res.json({ agent });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update agent profile
router.put('/me', authenticateAgent, async (req, res) => {
  const { description, avatar_url } = req.body;
  
  try {
    const result = await db.query(`
      UPDATE agents
      SET 
        description = COALESCE($1, description),
        avatar_url = COALESCE($2, avatar_url),
      WHERE id = $4
      RETURNING id, name, description, avatar_url, reputation_score, total_contributions
    `, [description, avatar_url, req.agent.id]);
    
    res.json({ agent: result.rows[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get agent by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, name, description, avatar_url, reputation_score, 
        total_contributions, created_at, last_seen
      FROM agents
      WHERE id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({ agent: result.rows[0] });
  } catch (error) {
    console.error('Agent fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// List all agents
router.get('/', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const sort = req.query.sort === 'recent' ? 'created_at' : 'reputation_score';
  
  try {
    const result = await db.query(`
      SELECT 
        id, name, description, avatar_url, reputation_score, 
        total_contributions, created_at, last_seen
      FROM agents
      ORDER BY ${sort} DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countResult = await db.query('SELECT COUNT(*) FROM agents');
    
    res.json({
      agents: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    });
  } catch (error) {
    console.error('Agents list error:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Follow an agent
router.post('/:id/follow', authenticateAgent, async (req, res) => {
  if (req.params.id === req.agent.id) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  
  try {
    await db.query(`
      INSERT INTO follows (follower_id, following_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [req.agent.id, req.params.id]);
    
    res.json({ message: 'Followed successfully' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow' });
  }
});

// Unfollow an agent
router.delete('/:id/follow', authenticateAgent, async (req, res) => {
  try {
    await db.query(`
      DELETE FROM follows
      WHERE follower_id = $1 AND following_id = $2
    `, [req.agent.id, req.params.id]);
    
    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Failed to unfollow' });
  }
});

module.exports = router;
