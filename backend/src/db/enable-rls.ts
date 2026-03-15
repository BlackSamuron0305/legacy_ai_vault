/**
 * Enable RLS on all public tables + create policies for postgres & service_role.
 * Also creates indexes and the search_knowledge_by_category function.
 *
 * Run AFTER every `npx drizzle-kit push` since drizzle resets RLS.
 *
 * Usage:  npx tsx src/db/enable-rls.ts
 */
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL as string, { prepare: false });

async function main() {
  // All tables in the public schema managed by our app
  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;

  for (const { tablename } of tables) {
    await sql.unsafe(`ALTER TABLE public."${tablename}" ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Allow service role full access" ON public."${tablename}"`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Allow postgres full access" ON public."${tablename}"`);
    await sql.unsafe(`
      CREATE POLICY "Allow service role full access" ON public."${tablename}"
      FOR ALL TO service_role USING (true) WITH CHECK (true)
    `);
    await sql.unsafe(`
      CREATE POLICY "Allow postgres full access" ON public."${tablename}"
      FOR ALL TO postgres USING (true) WITH CHECK (true)
    `);
    console.log(`[✓] ${tablename}`);
  }

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_knowledge_cards_document ON knowledge_cards(document_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_knowledge_cards_source ON knowledge_cards(source)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_knowledge_cards_category ON knowledge_cards(category)`;
  console.log('[✓] Indexes');

  // Vector search function
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION search_knowledge_by_category(
        query_embedding VECTOR(1536),
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
        WHERE kc.embedding IS NOT NULL
          AND (category_filter IS NULL OR kc.category = category_filter)
          AND 1 - (kc.embedding <=> query_embedding) > match_threshold
        ORDER BY kc.embedding <=> query_embedding
        LIMIT match_count;
    END;
    $$;
  `);
  console.log('[✓] search_knowledge_by_category function');

  // Global RAG search function
  await sql.unsafe(`DROP FUNCTION IF EXISTS search_knowledge(VECTOR, FLOAT, INT)`);
  await sql.unsafe(`
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
            COALESCE(e.name, 'Document')::TEXT AS expert_name,
            COALESCE(e.department, '')::TEXT AS expert_department,
            COALESCE(s.created_at, d.created_at) AS interview_date,
            1 - (kc.embedding <=> query_embedding) AS similarity
        FROM knowledge_cards kc
        LEFT JOIN sessions s ON kc.session_id = s.id
        LEFT JOIN employees e ON kc.employee_id = e.id
        LEFT JOIN documents d ON kc.document_id = d.id
        WHERE kc.embedding IS NOT NULL
          AND 1 - (kc.embedding <=> query_embedding) > match_threshold
        ORDER BY kc.embedding <=> query_embedding
        LIMIT match_count;
    END;
    $$;
  `);
  console.log('[✓] search_knowledge function');

  console.log('\nDone. All tables have RLS enabled.');
  process.exit(0);
}
main();
