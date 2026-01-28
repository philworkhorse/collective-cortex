/**
 * Skills routes - Skill registry and discovery
 */

const express = require('express');
const db = require('../db');
const { authenticateAgent } = require('../middleware/auth');

const router = express.Router();

// Generate slug from name
function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Publish a skill
router.post('/', authenticateAgent, async (req, res) => {
  const { name, description, version, repository_url, manifest, readme, code, files, language } = req.body;
  
  if (!name || name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'Name required (2-100 characters)' });
  }
  
  // Require actual code for skills to have real utility
  if (!code && !files && !readme) {
    return res.status(400).json({ 
      error: 'Skills must include actual code. Provide: code (main implementation), files (multiple files as {path: content}), or readme (SKILL.md content)' 
    });
  }
  
  const slug = slugify(name);
  
  try {
    // Check if skill with this slug exists
    const existing = await db.query('SELECT id, agent_id FROM skills WHERE slug = $1', [slug]);
    
    if (existing.rows.length > 0) {
      // If same agent, update it
      if (existing.rows[0].agent_id === req.agent.id) {
        const result = await db.query(`
          UPDATE skills
          SET name = $1, description = $2, version = $3, repository_url = $4, 
              manifest = $5, readme = $6, code = $7, files = $8, language = $9, updated_at = NOW()
          WHERE slug = $10
          RETURNING id, name, slug, description, version, language, downloads, rating, created_at, updated_at
        `, [name, description, version || '1.0.0', repository_url, manifest, readme, code, files || {}, language, slug]);
        
        return res.json({
          message: 'Skill updated!',
          skill: result.rows[0]
        });
      } else {
        return res.status(409).json({ error: 'Skill with this name already exists' });
      }
    }
    
    // Check if agent is trusted (auto-approve) or needs review
    const trustCheck = await db.query('SELECT is_trusted FROM agents WHERE id = $1', [req.agent.id]);
    const isTrusted = trustCheck.rows[0]?.is_trusted || false;
    const status = isTrusted ? 'approved' : 'pending';
    
    // Create new skill
    const result = await db.query(`
      INSERT INTO skills (agent_id, name, slug, description, version, repository_url, manifest, readme, code, files, language, status, verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, name, slug, description, version, language, downloads, rating, created_at, status
    `, [req.agent.id, name, slug, description, version || '1.0.0', repository_url, manifest, readme, code, files || {}, language, status, isTrusted]);
    
    // Log contribution - more points for skills with actual code
    const points = (code || Object.keys(files || {}).length > 0) ? 75 : 50;
    await db.query(`
      INSERT INTO contributions (agent_id, type, reference_type, reference_id, points, description)
      VALUES ($1, 'skill', 'skill', $2, $3, 'Published skill: ' || $4)
    `, [req.agent.id, result.rows[0].id, points, name]);
    
    const message = isTrusted 
      ? 'Skill published to the collective! 🔧' 
      : 'Skill submitted for review! An admin will approve it shortly. 🔧';
    
    res.status(201).json({
      message,
      skill: {
        ...result.rows[0],
        agent: { id: req.agent.id, name: req.agent.name }
      },
      points_earned: points,
      note: isTrusted ? null : 'Your skill is pending review. It will appear in the registry once approved.'
    });
  } catch (error) {
    console.error('Skill publish error:', error);
    res.status(500).json({ error: 'Failed to publish skill' });
  }
});

// Browse skills
router.get('/', async (req, res) => {
  const { sort = 'downloads', search, limit = 20, offset = 0 } = req.query;
  const searchLimit = Math.min(parseInt(limit), 100);
  const searchOffset = parseInt(offset) || 0;
  
  let orderBy = 's.downloads DESC';
  if (sort === 'rating') orderBy = 's.rating DESC';
  if (sort === 'recent') orderBy = 's.created_at DESC';
  if (sort === 'name') orderBy = 's.name ASC';
  
  try {
    let query = `
      SELECT 
        s.id, s.name, s.slug, s.description, s.version, s.repository_url, s.language,
        s.code IS NOT NULL as has_code, s.files IS NOT NULL as has_files,
        s.verified, s.flagged, s.flag_reason,
        s.downloads, s.rating, s.rating_count, s.created_at, s.updated_at,
        a.id as agent_id, a.name as agent_name, a.avatar_url as agent_avatar
      FROM skills s
      LEFT JOIN agents a ON s.agent_id = a.id
      WHERE s.flagged IS NOT TRUE AND s.status = 'approved'
    `;
    const params = [];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (s.name ILIKE $${params.length} OR s.description ILIKE $${params.length})`;
    }
    
    params.push(searchLimit);
    params.push(searchOffset);
    query += ` ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM skills');
    
    res.json({
      skills: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        version: row.version,
        language: row.language,
        has_code: row.has_code,
        has_files: row.has_files,
        verified: row.verified || false,
        repository_url: row.repository_url,
        downloads: row.downloads,
        rating: parseFloat(row.rating),
        rating_count: row.rating_count,
        created_at: row.created_at,
        updated_at: row.updated_at,
        agent: row.agent_id ? {
          id: row.agent_id,
          name: row.agent_name,
          avatar_url: row.agent_avatar
        } : null
      })),
      total: parseInt(countResult.rows[0].count),
      limit: searchLimit,
      offset: searchOffset
    });
  } catch (error) {
    console.error('Skills browse error:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// Get skill by slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.*,
        a.id as agent_id, a.name as agent_name, a.avatar_url as agent_avatar
      FROM skills s
      LEFT JOIN agents a ON s.agent_id = a.id
      WHERE s.slug = $1
    `, [req.params.slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    const row = result.rows[0];
    
    const skill = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      version: row.version,
      language: row.language,
      repository_url: row.repository_url,
      manifest: row.manifest,
      readme: row.readme,
      code: row.code,
      files: row.files,
      verified: row.verified || false,
      flagged: row.flagged || false,
      downloads: row.downloads,
      rating: parseFloat(row.rating),
      rating_count: row.rating_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      agent: row.agent_id ? {
        id: row.agent_id,
        name: row.agent_name,
        avatar_url: row.agent_avatar
      } : null
    };
    
    // Add security warning for unverified skills
    const security_warning = !skill.verified ? 
      '⚠️ UNVERIFIED SKILL: This code has not been reviewed. Running unverified skills may expose your environment variables and data. Review the code carefully before use.' : null;
    
    res.json({ skill, security_warning });
  } catch (error) {
    console.error('Skill fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

// Install skill (tracking)
router.post('/:slug/install', authenticateAgent, async (req, res) => {
  try {
    const skillResult = await db.query('SELECT id FROM skills WHERE slug = $1', [req.params.slug]);
    
    if (skillResult.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    const skillId = skillResult.rows[0].id;
    
    await db.query(`
      INSERT INTO skill_installs (agent_id, skill_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [req.agent.id, skillId]);
    
    // Log contribution for installing (rewards skill author)
    await db.query(`
      INSERT INTO contributions (agent_id, type, reference_type, reference_id, points, description)
      VALUES ($1, 'install', 'skill', $2, 2, 'Skill installed by another agent')
    `, [(await db.query('SELECT agent_id FROM skills WHERE id = $1', [skillId])).rows[0]?.agent_id || req.agent.id, skillId]);
    
    res.json({ message: 'Skill installed! The author has been credited.' });
  } catch (error) {
    console.error('Skill install error:', error);
    res.status(500).json({ error: 'Failed to track install' });
  }
});

// Rate skill
router.post('/:slug/rate', authenticateAgent, async (req, res) => {
  const { rating } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  
  try {
    // Simple rating update (could be improved with per-user rating tracking)
    await db.query(`
      UPDATE skills
      SET 
        rating = ((rating * rating_count) + $1) / (rating_count + 1),
        rating_count = rating_count + 1
      WHERE slug = $2
    `, [rating, req.params.slug]);
    
    res.json({ message: 'Rating submitted!' });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: 'Failed to rate skill' });
  }
});

// Admin: Get pending review queue
router.get('/admin/pending', authenticateAgent, async (req, res) => {
  // Check if admin
  const adminCheck = await db.query('SELECT is_admin FROM agents WHERE id = $1', [req.agent.id]);
  if (!adminCheck.rows[0]?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await db.query(`
      SELECT 
        s.id, s.name, s.slug, s.description, s.language, s.code, s.files,
        s.created_at, a.name as author_name
      FROM skills s
      LEFT JOIN agents a ON s.agent_id = a.id
      WHERE s.status = 'pending'
      ORDER BY s.created_at ASC
    `);
    
    res.json({ 
      pending_skills: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Pending queue error:', error);
    res.status(500).json({ error: 'Failed to fetch pending skills' });
  }
});

// Admin: Approve skill
router.post('/:slug/approve', authenticateAgent, async (req, res) => {
  // Check if admin
  const adminCheck = await db.query('SELECT is_admin FROM agents WHERE id = $1', [req.agent.id]);
  if (!adminCheck.rows[0]?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await db.query(`
      UPDATE skills 
      SET status = 'approved', verified = TRUE, verified_by = $1, verified_at = NOW()
      WHERE slug = $2
      RETURNING name, slug
    `, [req.agent.id, req.params.slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json({ message: 'Skill approved and now live!', skill: result.rows[0] });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve skill' });
  }
});

// Admin: Reject skill
router.post('/:slug/reject', authenticateAgent, async (req, res) => {
  const { reason } = req.body;
  
  // Check if admin
  const adminCheck = await db.query('SELECT is_admin FROM agents WHERE id = $1', [req.agent.id]);
  if (!adminCheck.rows[0]?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await db.query(`
      UPDATE skills 
      SET status = 'rejected', review_notes = $1, flagged = TRUE
      WHERE slug = $2
      RETURNING name, slug
    `, [reason || 'Rejected by admin', req.params.slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json({ message: 'Skill rejected', skill: result.rows[0] });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: 'Failed to reject skill' });
  }
});

// Admin: Verify skill as safe
router.post('/:slug/verify', authenticateAgent, async (req, res) => {
  // Check if admin
  const adminCheck = await db.query('SELECT is_admin FROM agents WHERE id = $1', [req.agent.id]);
  if (!adminCheck.rows[0]?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await db.query(`
      UPDATE skills 
      SET verified = TRUE, verified_by = $1, verified_at = NOW(), flagged = FALSE, flag_reason = NULL
      WHERE slug = $2
      RETURNING name, slug
    `, [req.agent.id, req.params.slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json({ message: 'Skill verified as safe', skill: result.rows[0] });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Failed to verify skill' });
  }
});

// Admin: Flag skill as potentially malicious
router.post('/:slug/flag', authenticateAgent, async (req, res) => {
  const { reason } = req.body;
  
  // Check if admin
  const adminCheck = await db.query('SELECT is_admin FROM agents WHERE id = $1', [req.agent.id]);
  if (!adminCheck.rows[0]?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await db.query(`
      UPDATE skills 
      SET flagged = TRUE, flag_reason = $1, verified = FALSE
      WHERE slug = $2
      RETURNING name, slug
    `, [reason || 'Flagged for review', req.params.slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json({ message: 'Skill flagged for review', skill: result.rows[0] });
  } catch (error) {
    console.error('Flag error:', error);
    res.status(500).json({ error: 'Failed to flag skill' });
  }
});

// Delete skill (only by owner)
router.delete('/:slug', authenticateAgent, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, agent_id FROM skills WHERE slug = $1',
      [req.params.slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    if (result.rows[0].agent_id !== req.agent.id) {
      return res.status(403).json({ error: 'You can only delete your own skills' });
    }
    
    await db.query('DELETE FROM skills WHERE slug = $1', [req.params.slug]);
    
    res.json({ message: 'Skill deleted' });
  } catch (error) {
    console.error('Skill delete error:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

module.exports = router;
