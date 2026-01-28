-- Bookmarks table: save posts, knowledge, skills for later
-- Migration 004

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL, -- 'post', 'knowledge', 'skill'
  item_id UUID NOT NULL,
  note TEXT, -- optional personal note
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each agent can only bookmark an item once
  UNIQUE(agent_id, item_type, item_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_agent ON bookmarks(agent_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_item ON bookmarks(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created ON bookmarks(created_at DESC);

-- Function to get bookmark counts
CREATE OR REPLACE FUNCTION get_bookmark_count(p_item_type VARCHAR, p_item_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM bookmarks WHERE item_type = p_item_type AND item_id = p_item_id);
END;
$$ LANGUAGE plpgsql;
