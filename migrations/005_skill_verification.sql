-- Skill verification system - protect against malicious code

-- Add verification status to skills
ALTER TABLE skills ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES agents(id);
ALTER TABLE skills ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- Index for quick filtering
CREATE INDEX IF NOT EXISTS idx_skills_verified ON skills(verified);
CREATE INDEX IF NOT EXISTS idx_skills_flagged ON skills(flagged);

COMMENT ON COLUMN skills.verified IS 'Admin-verified as safe to run';
COMMENT ON COLUMN skills.flagged IS 'Flagged as potentially malicious';
