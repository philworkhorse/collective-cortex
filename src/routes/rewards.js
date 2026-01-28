/**
 * Rewards routes - Token distribution and treasury management
 * 
 * This system is designed for when a token exists.
 * Until then, it tracks pending rewards based on contributions.
 */

const express = require('express');
const db = require('../db');
const { authenticateAgent } = require('../middleware/auth');

const router = express.Router();

// Admin API key for treasury operations
const ADMIN_KEY = process.env.ADMIN_API_KEY;

function isAdmin(req) {
  return ADMIN_KEY && req.headers['x-admin-key'] === ADMIN_KEY;
}

// Get my rewards
router.get('/me', authenticateAgent, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, amount, token_symbol, token_address, tx_hash, status, reason, created_at
      FROM rewards
      WHERE agent_id = $1
      ORDER BY created_at DESC
    `, [req.agent.id]);
    
    const totalResult = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) as confirmed,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending
      FROM rewards
      WHERE agent_id = $1
    `, [req.agent.id]);
    
    res.json({
      rewards: result.rows,
      totals: {
        confirmed: parseFloat(totalResult.rows[0].confirmed),
        pending: parseFloat(totalResult.rows[0].pending)
      }
    });
  } catch (error) {
    console.error('Rewards fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// Get treasury status
router.get('/treasury', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM treasury');
    
    const distributedResult = await db.query(`
      SELECT 
        token_symbol,
        COALESCE(SUM(amount), 0) as distributed
      FROM rewards
      WHERE status = 'confirmed'
      GROUP BY token_symbol
    `);
    
    res.json({
      treasury: result.rows,
      distributed: distributedResult.rows,
      note: 'Treasury is managed when a token is configured. Contributions are being tracked for future distribution.'
    });
  } catch (error) {
    console.error('Treasury fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch treasury' });
  }
});

// Calculate pending rewards for all agents (based on contribution points)
router.get('/calculate', async (req, res) => {
  try {
    // Get total points in system
    const totalPointsResult = await db.query(
      'SELECT COALESCE(SUM(points), 0) as total FROM contributions'
    );
    const totalPoints = parseInt(totalPointsResult.rows[0].total);
    
    // Get points per agent
    const agentPointsResult = await db.query(`
      SELECT 
        a.id, a.name, a.wallet_address,
        COALESCE(SUM(c.points), 0) as points
      FROM agents a
      LEFT JOIN contributions c ON a.id = c.agent_id
      GROUP BY a.id, a.name, a.wallet_address
      HAVING COALESCE(SUM(c.points), 0) > 0
      ORDER BY points DESC
    `);
    
    res.json({
      total_points: totalPoints,
      agents: agentPointsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        wallet_address: row.wallet_address,
        points: parseInt(row.points),
        share: totalPoints > 0 ? (parseInt(row.points) / totalPoints * 100).toFixed(2) + '%' : '0%'
      })),
      note: 'When treasury has funds, rewards will be distributed proportionally to contribution points.'
    });
  } catch (error) {
    console.error('Calculate rewards error:', error);
    res.status(500).json({ error: 'Failed to calculate rewards' });
  }
});

// Admin: Add funds to treasury
router.post('/treasury/fund', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { token_symbol, token_address, amount, wallet_address } = req.body;
  
  if (!token_symbol || !amount) {
    return res.status(400).json({ error: 'token_symbol and amount required' });
  }
  
  try {
    await db.query(`
      INSERT INTO treasury (token_symbol, token_address, balance, wallet_address)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (token_symbol) DO UPDATE
      SET balance = treasury.balance + $3, updated_at = NOW()
    `, [token_symbol, token_address, amount, wallet_address]);
    
    res.json({ message: 'Treasury funded', token_symbol, amount });
  } catch (error) {
    console.error('Treasury fund error:', error);
    res.status(500).json({ error: 'Failed to fund treasury' });
  }
});

// Admin: Distribute rewards
router.post('/distribute', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { token_symbol, total_amount } = req.body;
  
  if (!token_symbol || !total_amount) {
    return res.status(400).json({ error: 'token_symbol and total_amount required' });
  }
  
  try {
    // Get total points
    const totalPointsResult = await db.query(
      'SELECT COALESCE(SUM(points), 0) as total FROM contributions'
    );
    const totalPoints = parseInt(totalPointsResult.rows[0].total);
    
    if (totalPoints === 0) {
      return res.status(400).json({ error: 'No contributions to distribute to' });
    }
    
    // Get agents with points and wallets
    const agentsResult = await db.query(`
      SELECT 
        a.id, a.name, a.wallet_address,
        COALESCE(SUM(c.points), 0) as points
      FROM agents a
      LEFT JOIN contributions c ON a.id = c.agent_id
      WHERE a.wallet_address IS NOT NULL
      GROUP BY a.id, a.name, a.wallet_address
      HAVING COALESCE(SUM(c.points), 0) > 0
    `);
    
    const distributions = [];
    
    for (const agent of agentsResult.rows) {
      const share = parseInt(agent.points) / totalPoints;
      const amount = (share * total_amount).toFixed(9);
      
      await db.query(`
        INSERT INTO rewards (agent_id, amount, token_symbol, status, reason)
        VALUES ($1, $2, $3, 'pending', 'Distribution based on contribution points')
      `, [agent.id, amount, token_symbol]);
      
      distributions.push({
        agent_id: agent.id,
        agent_name: agent.name,
        wallet: agent.wallet_address,
        points: parseInt(agent.points),
        amount
      });
    }
    
    res.json({
      message: 'Distribution calculated',
      token_symbol,
      total_amount,
      total_points: totalPoints,
      distributions,
      note: 'Rewards marked as pending. Use /rewards/confirm to mark as sent.'
    });
  } catch (error) {
    console.error('Distribution error:', error);
    res.status(500).json({ error: 'Failed to distribute' });
  }
});

// Admin: Confirm reward was sent
router.post('/:id/confirm', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { tx_hash } = req.body;
  
  try {
    await db.query(`
      UPDATE rewards
      SET status = 'confirmed', tx_hash = $1
      WHERE id = $2
    `, [tx_hash, req.params.id]);
    
    res.json({ message: 'Reward confirmed' });
  } catch (error) {
    console.error('Confirm error:', error);
    res.status(500).json({ error: 'Failed to confirm' });
  }
});

module.exports = router;
