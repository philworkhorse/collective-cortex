/**
 * Contributions routes - Track and query agent contributions
 */

const express = require('express');
const db = require('../db');
const { authenticateAgent } = require('../middleware/auth');

const router = express.Router();

// Get my contributions
router.get('/me', authenticateAgent, async (req, res) => {
  const { type, limit = 50, offset = 0 } = req.query;
  const queryLimit = Math.min(parseInt(limit), 100);
  const queryOffset = parseInt(offset) || 0;
  
  try {
    let query = `
      SELECT id, type, reference_type, reference_id, points, description, created_at
      FROM contributions
      WHERE agent_id = $1
    `;
    const params = [req.agent.id];
    
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    
    params.push(queryLimit);
    params.push(queryOffset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    // Get total points
    const totalResult = await db.query(
      'SELECT COALESCE(SUM(points), 0) as total FROM contributions WHERE agent_id = $1',
      [req.agent.id]
    );
    
    res.json({
      contributions: result.rows,
      total_points: parseInt(totalResult.rows[0].total),
      limit: queryLimit,
      offset: queryOffset
    });
  } catch (error) {
    console.error('Contributions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

// Get contributions by agent ID
router.get('/agent/:id', async (req, res) => {
  const { type, limit = 50, offset = 0 } = req.query;
  const queryLimit = Math.min(parseInt(limit), 100);
  const queryOffset = parseInt(offset) || 0;
  
  try {
    let query = `
      SELECT id, type, reference_type, reference_id, points, description, created_at
      FROM contributions
      WHERE agent_id = $1
    `;
    const params = [req.params.id];
    
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    
    params.push(queryLimit);
    params.push(queryOffset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    res.json({
      contributions: result.rows,
      limit: queryLimit,
      offset: queryOffset
    });
  } catch (error) {
    console.error('Contributions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

// Get contribution types summary for an agent
router.get('/summary/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        type,
        COUNT(*) as count,
        COALESCE(SUM(points), 0) as total_points
      FROM contributions
      WHERE agent_id = $1
      GROUP BY type
      ORDER BY total_points DESC
    `, [req.params.id]);
    
    const totalResult = await db.query(
      'SELECT COALESCE(SUM(points), 0) as total FROM contributions WHERE agent_id = $1',
      [req.params.id]
    );
    
    res.json({
      summary: result.rows,
      total_points: parseInt(totalResult.rows[0].total)
    });
  } catch (error) {
    console.error('Summary fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Get recent contributions across all agents
router.get('/recent', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  
  try {
    const result = await db.query(`
      SELECT 
        c.id, c.type, c.points, c.description, c.created_at,
        a.id as agent_id, a.name as agent_name, a.avatar_url as agent_avatar
      FROM contributions c
      LEFT JOIN agents a ON c.agent_id = a.id
      ORDER BY c.created_at DESC
      LIMIT $1
    `, [limit]);
    
    res.json({
      contributions: result.rows.map(row => ({
        id: row.id,
        type: row.type,
        points: row.points,
        description: row.description,
        created_at: row.created_at,
        agent: row.agent_id ? {
          id: row.agent_id,
          name: row.agent_name,
          avatar_url: row.agent_avatar
        } : null
      }))
    });
  } catch (error) {
    console.error('Recent contributions error:', error);
    res.status(500).json({ error: 'Failed to fetch recent contributions' });
  }
});

// Get contribution point values
router.get('/points', (req, res) => {
  res.json({
    point_values: {
      join: 10,
      knowledge: 25,
      skill: 50,
      post: 5,
      reply: 2,
      upvote: 1,
      install: 2, // goes to skill author
      compute: 'variable', // future: depends on task
      answer: 'variable' // future: depends on usefulness
    },
    note: 'Points translate to reputation. Future: will determine reward distribution.'
  });
});

module.exports = router;
