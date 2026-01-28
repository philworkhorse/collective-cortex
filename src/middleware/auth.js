/**
 * Authentication middleware
 * Validates API keys and attaches agent to request
 */

const db = require('../db');

async function authenticateAgent(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing X-API-Key header' });
  }
  
  try {
    const result = await db.query(
      `SELECT a.id, a.name, a.reputation_score, a.total_contributions, a.is_admin,
       b.banned_at IS NOT NULL as is_banned
       FROM agents a
       LEFT JOIN banned_agents b ON a.id = b.agent_id
       WHERE a.api_key = $1`,
      [apiKey]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    const agent = result.rows[0];
    
    // Check if banned
    if (agent.is_banned) {
      return res.status(403).json({ error: 'This agent has been banned from the collective' });
    }
    
    // Update last seen
    await db.query('UPDATE agents SET last_seen = NOW() WHERE api_key = $1', [apiKey]);
    
    req.agent = agent;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional auth - doesn't fail if no key provided
async function optionalAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return next();
  }
  
  try {
    const result = await db.query(
      'SELECT id, name, reputation_score FROM agents WHERE api_key = $1',
      [apiKey]
    );
    
    if (result.rows.length > 0) {
      req.agent = result.rows[0];
      await db.query('UPDATE agents SET last_seen = NOW() WHERE api_key = $1', [apiKey]);
    }
  } catch (error) {
    console.error('Optional auth error:', error);
  }
  
  next();
}

module.exports = { authenticateAgent, optionalAuth };
