-- Legacy AI Vault: Initial Database Schema
-- Run this in Supabase SQL Editor

-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT,
    industry TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- = supabase auth.users.id
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    avatar_initials TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees (departing experts)
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    department TEXT,
    email TEXT,
    avatar_initials TEXT,
    exit_date TEXT,
    tenure TEXT,
    session_status TEXT DEFAULT 'not_started',
    transcript_status TEXT DEFAULT 'none',
    coverage_score REAL DEFAULT 0,
    risk_level TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (interview sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'scheduled',
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    coverage_score REAL DEFAULT 0,
    transcript_status TEXT DEFAULT 'pending',
    report_status TEXT DEFAULT 'pending',
    duration TEXT,
    topics_extracted INTEGER DEFAULT 0,
    transcript TEXT,
    summary TEXT,
    elevenlabs_conversation_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcript Segments
CREATE TABLE IF NOT EXISTS transcript_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    timestamp TEXT NOT NULL,
    speaker TEXT NOT NULL,
    text TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- Knowledge Cards
CREATE TABLE IF NOT EXISTS knowledge_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    importance TEXT DEFAULT 'normal',
    confidence REAL DEFAULT 0,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Categories
CREATE TABLE IF NOT EXISTS knowledge_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'folder',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'Handover Report',
    content TEXT,
    status TEXT DEFAULT 'draft',
    export_status TEXT DEFAULT 'pending',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_workspace ON employees(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sessions_employee ON sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_sessions_workspace ON sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_employee ON knowledge_cards(employee_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_session ON knowledge_cards(session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_category ON knowledge_cards(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_tags ON knowledge_cards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_activities_workspace ON activities(workspace_id);

-- Vector search function (aligned with Drizzle schema: employees + sessions)
CREATE OR REPLACE FUNCTION search_knowledge(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    topic TEXT,
    content TEXT,
    tags TEXT[],
    importance TEXT,
    expert_name TEXT,
    expert_department TEXT,
    interview_date TIMESTAMPTZ,
    similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc.topic,
        kc.content,
        kc.tags,
        kc.importance,
        e.name AS expert_name,
        e.department AS expert_department,
        s.created_at AS interview_date,
        1 - (kc.embedding <=> query_embedding) AS similarity
    FROM knowledge_cards kc
    JOIN employees e ON kc.employee_id = e.id
    JOIN sessions s ON kc.session_id = s.id
    WHERE kc.embedding IS NOT NULL
      AND 1 - (kc.embedding <=> query_embedding) > match_threshold
    ORDER BY kc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
