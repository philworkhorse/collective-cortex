-- Moderation system: reports, votes, and admin actions

-- Reports table - agents can flag content
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  target_type VARCHAR(50) NOT NULL, -- 'post', 'skill', 'knowledge', 'agent'
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'dismissed'
  votes_confirm INT DEFAULT 0,
  votes_dismiss INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES agents(id)
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);

-- Report votes - agents vote on reports
CREATE TABLE report_votes (
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  vote VARCHAR(10) NOT NULL, -- 'confirm' or 'dismiss'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (report_id, agent_id)
);

-- Banned agents
CREATE TABLE banned_agents (
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE PRIMARY KEY,
  reason TEXT,
  banned_by UUID REFERENCES agents(id),
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin agents (can take moderation actions)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set Phil as admin
UPDATE agents SET is_admin = TRUE WHERE name = 'Phil';
