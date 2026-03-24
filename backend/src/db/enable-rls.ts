/**
 * Create indexes and pgvector search functions for knowledge_cards.
 *
 * Run AFTER every `npx drizzle-kit push` since drizzle may reset functions.
 *
 * Usage:  npx tsx src/db/enable-rls.ts
 */
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL as string, { prepare: false });

async function main() {
  // Ensure pgvector extension is available
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_knowledge_cards_document ON knowledge_cards(document_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_knowledge_cards_source ON knowledge_cards(source)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_knowledge_cards_category ON knowledge_cards(category)`;

  // HNSW vector index for fast approximate nearest-neighbor search
  await sql`CREATE INDEX IF NOT EXISTS idx_knowledge_cards_embedding_hnsw ON knowledge_cards USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)`;

  // Full-text search support (hybrid BM25 + vector)
  await sql`ALTER TABLE knowledge_cards ADD COLUMN IF NOT EXISTS tsv tsvector`;
  await sql`UPDATE knowledge_cards SET tsv = to_tsvector('english', coalesce(topic, '') || ' ' || coalesce(content, '')) WHERE tsv IS NULL`;
  await sql`CREATE INDEX IF NOT EXISTS idx_knowledge_cards_tsv ON knowledge_cards USING gin(tsv)`;
  // Auto-update trigger for tsv column
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION knowledge_cards_tsv_trigger() RETURNS trigger AS $$
    BEGIN
      NEW.tsv := to_tsvector('english', coalesce(NEW.topic, '') || ' ' || coalesce(NEW.content, ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await sql.unsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_knowledge_cards_tsv') THEN
        CREATE TRIGGER trg_knowledge_cards_tsv BEFORE INSERT OR UPDATE OF topic, content
        ON knowledge_cards FOR EACH ROW EXECUTE FUNCTION knowledge_cards_tsv_trigger();
      END IF;
    END; $$;
  `);
  console.log('[✓] Indexes (including HNSW + GIN full-text)');

  // Category-filtered vector search (workspace-scoped)
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION search_knowledge_by_category(
        query_embedding VECTOR(384),
        p_workspace_id UUID DEFAULT NULL,
        match_threshold FLOAT DEFAULT 0.65,
        match_count INT DEFAULT 10,
        category_filter TEXT DEFAULT NULL
    )
    RETURNS TABLE (
        id UUID,
        topic TEXT,
        content TEXT,
        tags TEXT[],
        importance TEXT,
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
            1 - (kc.embedding <=> query_embedding) AS similarity
        FROM knowledge_cards kc
        LEFT JOIN sessions s ON kc.session_id = s.id
        LEFT JOIN documents d ON kc.document_id = d.id
        WHERE kc.embedding IS NOT NULL
          AND (category_filter IS NULL OR kc.category = category_filter)
          AND (p_workspace_id IS NULL OR s.workspace_id = p_workspace_id OR d.workspace_id = p_workspace_id)
          AND 1 - (kc.embedding <=> query_embedding) > match_threshold
        ORDER BY kc.embedding <=> query_embedding
        LIMIT match_count;
    END;
    $$;
  `);
  console.log('[✓] search_knowledge_by_category function (workspace-scoped)');

  // Global RAG search function (workspace-scoped + hybrid BM25)
  await sql.unsafe(`DROP FUNCTION IF EXISTS search_knowledge(VECTOR, FLOAT, INT)`);
  await sql.unsafe(`DROP FUNCTION IF EXISTS search_knowledge(VECTOR, UUID, FLOAT, INT, TEXT)`);
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION search_knowledge(
        query_embedding VECTOR(384),
        p_workspace_id UUID DEFAULT NULL,
        match_threshold FLOAT DEFAULT 0.7,
        match_count INT DEFAULT 5,
        query_text TEXT DEFAULT NULL
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
            COALESCE(e.name, 'Document')::TEXT AS expert_name,
            COALESCE(e.department, '')::TEXT AS expert_department,
            COALESCE(s.created_at, d.created_at) AS interview_date,
            CASE
                WHEN query_text IS NOT NULL AND kc.tsv @@ plainto_tsquery('english', query_text)
                THEN LEAST(1.0, (1 - (kc.embedding <=> query_embedding)) * 1.0 + ts_rank(kc.tsv, plainto_tsquery('english', query_text)) * 0.3)
                ELSE 1 - (kc.embedding <=> query_embedding)
            END AS similarity
        FROM knowledge_cards kc
        LEFT JOIN sessions s ON kc.session_id = s.id
        LEFT JOIN employees e ON kc.employee_id = e.id
        LEFT JOIN documents d ON kc.document_id = d.id
        WHERE kc.embedding IS NOT NULL
          AND (p_workspace_id IS NULL OR s.workspace_id = p_workspace_id OR d.workspace_id = p_workspace_id)
          AND (
            1 - (kc.embedding <=> query_embedding) > match_threshold
            OR (query_text IS NOT NULL AND kc.tsv @@ plainto_tsquery('english', query_text))
          )
        ORDER BY similarity DESC
        LIMIT match_count;
    END;
    $$;
  `);
  console.log('[✓] search_knowledge function (workspace-scoped + hybrid)');

  // ── 4NF: Computed VIEW for employees with derived session status ──
  await sql.unsafe(`
    CREATE OR REPLACE VIEW employees_enriched AS
    SELECT
      e.id, e.workspace_id, e.name, e.role, e.department, e.email,
      e.avatar_initials, e.exit_date, e.tenure, e.risk_level, e.created_at,
      COALESCE(ls.status, 'not_started') AS session_status,
      COALESCE(ls.transcript_status, 'none') AS transcript_status,
      COALESCE(ls.coverage_score, 0) AS coverage_score
    FROM employees e
    LEFT JOIN LATERAL (
      SELECT s.status, s.transcript_status, s.coverage_score
      FROM sessions s
      WHERE s.employee_id = e.id
      ORDER BY s.last_activity DESC NULLS LAST
      LIMIT 1
    ) ls ON true;
  `);
  console.log('[✓] employees_enriched VIEW (4NF computed status)');

  // ── CHECK constraints on status/role enums ──
  await sql.unsafe(`
    DO $$ BEGIN
      ALTER TABLE sessions ADD CONSTRAINT chk_sessions_status
        CHECK (status IN ('scheduled','in_progress','paused','awaiting_review','awaiting_approval','processing','processing_failed','finalized'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await sql.unsafe(`
    DO $$ BEGIN
      ALTER TABLE employees ADD CONSTRAINT chk_employees_risk_level
        CHECK (risk_level IN ('low','medium','high','critical'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await sql.unsafe(`
    DO $$ BEGIN
      ALTER TABLE chat_messages ADD CONSTRAINT chk_chat_messages_role
        CHECK (role IN ('user','assistant'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log('[✓] CHECK constraints on enums');

  // ── pgcrypto for API key encryption at rest ──
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  console.log('[✓] pgcrypto extension');

  // ── Additional performance indexes ──
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_employee ON sessions(employee_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_workspace ON sessions(workspace_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transcript_segments_session ON transcript_segments(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_workspace ON chat_messages(workspace_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_activities_workspace ON activities(workspace_id)`;
  console.log('[✓] Additional performance indexes');

  console.log('\nDone. Indexes, constraints, VIEW, and search functions created.');
  process.exit(0);
}
main();
