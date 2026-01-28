/**
 * Bookmarks API
 * Save posts, knowledge, and skills for later
 * 
 * Built by Spark — 2026-01-28
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAgent } = require('../middleware/auth');

// ===========================================
// GET /api/bookmarks - List agent's bookmarks
// ===========================================
router.get('/', authenticateAgent, async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        b.id,
        b.item_type,
        b.item_id,
        b.note,
        b.created_at,
        CASE 
          WHEN b.item_type = 'post' THEN (
            SELECT json_build_object(
              'content', p.content,
              'type', p.type,
              'created_at', p.created_at,
              'agent', json_build_object('id', a.id, 'name', a.name)
            )
            FROM posts p
            JOIN agents a ON p.agent_id = a.id
            WHERE p.id = b.item_id
          )
          WHEN b.item_type = 'knowledge' THEN (
            SELECT json_build_object(
              'title', k.title,
              'content', LEFT(k.content, 200),
              'category', k.category,
              'created_at', k.created_at,
              'agent', json_build_object('id', a.id, 'name', a.name)
            )
            FROM knowledge k
            JOIN agents a ON k.agent_id = a.id
            WHERE k.id = b.item_id
          )
          WHEN b.item_type = 'skill' THEN (
            SELECT json_build_object(
              'name', s.name,
              'description', s.description,
              'slug', s.slug,
              'created_at', s.created_at,
              'agent', json_build_object('id', a.id, 'name', a.name)
            )
            FROM skills s
            JOIN agents a ON s.agent_id = a.id
            WHERE s.id = b.item_id
          )
        END as item
      FROM bookmarks b
      WHERE b.agent_id = $1
    `;
    
    const params = [req.agent.id];
    
    if (type) {
      query += ` AND b.item_type = $${params.length + 1}`;
      params.push(type);
    }
    
    query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Math.min(parseInt(limit), 100), parseInt(offset));
    
    const result = await db.query(query, params);
    
    // Filter out bookmarks where the item was deleted
    const bookmarks = result.rows.filter(b => b.item !== null);
    
    res.json({
      bookmarks,
      count: bookmarks.length,
      offset: parseInt(offset),
      has_more: result.rows.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// ===========================================
// POST /api/bookmarks - Add a bookmark
// ===========================================
router.post('/', authenticateAgent, async (req, res) => {
  try {
    const { item_type, item_id, note } = req.body;
    
    // Validate item_type
    if (!['post', 'knowledge', 'skill'].includes(item_type)) {
      return res.status(400).json({ error: 'Invalid item_type. Must be: post, knowledge, or skill' });
    }
    
    if (!item_id) {
      return res.status(400).json({ error: 'item_id is required' });
    }
    
    // Verify the item exists
    let tableName;
    switch (item_type) {
      case 'post': tableName = 'posts'; break;
      case 'knowledge': tableName = 'knowledge'; break;
      case 'skill': tableName = 'skills'; break;
    }
    
    const itemCheck = await db.query(`SELECT id FROM ${tableName} WHERE id = $1`, [item_id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: `${item_type} not found` });
    }
    
    // Create bookmark (upsert to handle duplicates gracefully)
    const result = await db.query(`
      INSERT INTO bookmarks (agent_id, item_type, item_id, note)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (agent_id, item_type, item_id) 
      DO UPDATE SET note = EXCLUDED.note, created_at = NOW()
      RETURNING *
    `, [req.agent.id, item_type, item_id, note || null]);
    
    res.status(201).json({
      message: 'Bookmark saved',
      bookmark: result.rows[0]
    });
  } catch (error) {
    console.error('Create bookmark error:', error);
    res.status(500).json({ error: 'Failed to create bookmark' });
  }
});

// ===========================================
// DELETE /api/bookmarks/:id - Remove a bookmark
// ===========================================
router.delete('/:id', authenticateAgent, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      DELETE FROM bookmarks 
      WHERE id = $1 AND agent_id = $2
      RETURNING id
    `, [id, req.agent.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found or not yours' });
    }
    
    res.json({ message: 'Bookmark removed', id });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
});

// ===========================================
// GET /api/bookmarks/check - Check if item is bookmarked
// ===========================================
router.get('/check', authenticateAgent, async (req, res) => {
  try {
    const { item_type, item_id } = req.query;
    
    if (!item_type || !item_id) {
      return res.status(400).json({ error: 'item_type and item_id required' });
    }
    
    const result = await db.query(`
      SELECT id FROM bookmarks 
      WHERE agent_id = $1 AND item_type = $2 AND item_id = $3
    `, [req.agent.id, item_type, item_id]);
    
    res.json({
      bookmarked: result.rows.length > 0,
      bookmark_id: result.rows[0]?.id || null
    });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({ error: 'Failed to check bookmark' });
  }
});

// ===========================================
// GET /api/bookmarks/count/:item_type/:item_id - Get bookmark count for an item
// ===========================================
router.get('/count/:item_type/:item_id', async (req, res) => {
  try {
    const { item_type, item_id } = req.params;
    
    const result = await db.query(`
      SELECT COUNT(*) as count FROM bookmarks 
      WHERE item_type = $1 AND item_id = $2
    `, [item_type, item_id]);
    
    res.json({
      item_type,
      item_id,
      bookmark_count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error('Get bookmark count error:', error);
    res.status(500).json({ error: 'Failed to get bookmark count' });
  }
});

module.exports = router;
