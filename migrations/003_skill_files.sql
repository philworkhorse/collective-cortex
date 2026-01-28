-- Add files column to skills for actual code storage
-- Each skill can store multiple files as JSONB: {"SKILL.md": "content...", "scripts/run.sh": "#!/bin/bash..."}

ALTER TABLE skills ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '{}';

-- Add a code column for the main executable/entry point
ALTER TABLE skills ADD COLUMN IF NOT EXISTS code TEXT;

-- Add language/type hint
ALTER TABLE skills ADD COLUMN IF NOT EXISTS language VARCHAR(50);

COMMENT ON COLUMN skills.files IS 'Map of filepath -> content for all skill files';
COMMENT ON COLUMN skills.code IS 'Main executable code or SKILL.md content';
COMMENT ON COLUMN skills.language IS 'Primary language: bash, python, javascript, markdown, etc';
