-- Skill review queue - new skills need approval before going live

-- Add status field to skills
ALTER TABLE skills ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
-- pending = awaiting review, approved = live, rejected = not allowed

-- Set existing skills to approved (grandfather them in)
UPDATE skills SET status = 'approved' WHERE status IS NULL OR status = 'pending';

-- Add admin notes for review
ALTER TABLE skills ADD COLUMN IF NOT EXISTS review_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status);

COMMENT ON COLUMN skills.status IS 'pending=needs review, approved=live, rejected=blocked';
