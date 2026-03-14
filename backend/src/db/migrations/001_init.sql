-- Legacy AI Vault: Initial Database Schema
-- Run this in Supabase SQL Editor

-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Experten-Profile
CREATE TABLE IF NOT EXISTS experts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    specialization TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interviews
CREATE TABLE IF NOT EXISTS interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
    transcript TEXT,
    summary TEXT,
    duration_seconds INTEGER,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'processing', 'completed', 'failed')),
    elevenlabs_conversation_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Cards (das Herzstück)
CREATE TABLE IF NOT EXISTS knowledge_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    importance TEXT DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high', 'critical')),
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat-Verlauf
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interviews_expert ON interviews(expert_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_expert ON knowledge_cards(expert_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_interview ON knowledge_cards(interview_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_tags ON knowledge_cards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

-- Vektor-Suche Funktion
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
        i.created_at AS interview_date,
        1 - (kc.embedding <=> query_embedding) AS similarity
    FROM knowledge_cards kc
    JOIN experts e ON kc.expert_id = e.id
    JOIN interviews i ON kc.interview_id = i.id
    WHERE kc.embedding IS NOT NULL
      AND 1 - (kc.embedding <=> query_embedding) > match_threshold
    ORDER BY kc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Vektor-Index für schnelle Suche (erst erstellen wenn >100 Rows vorhanden)
-- CREATE INDEX ON knowledge_cards USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security (optional, für Produktion)
-- ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE knowledge_cards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
