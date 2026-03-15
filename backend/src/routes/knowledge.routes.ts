import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { knowledgeCards, knowledgeCategories, employees, sessions, users, documents } from '../db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { supabase } from '../db/supabase';
import { createEmbedding } from '../services/embedding.service';
import { log, logError } from '../utils/logger';

interface MultipartPart {
    name?: string;
    filename?: string;
    contentType?: string;
    data: Buffer;
}

function parseMultipart(body: Buffer, boundary: string): MultipartPart[] {
    const parts: MultipartPart[] = [];
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const endBuffer = Buffer.from(`--${boundary}--`);

    let start = body.indexOf(boundaryBuffer) + boundaryBuffer.length;
    while (start < body.length) {
        const nextBoundary = body.indexOf(boundaryBuffer, start);
        if (nextBoundary === -1) break;

        const partData = body.subarray(start, nextBoundary);
        const headerEnd = partData.indexOf('\r\n\r\n');
        if (headerEnd === -1) { start = nextBoundary + boundaryBuffer.length; continue; }

        const headerStr = partData.subarray(0, headerEnd).toString('utf-8');
        const content = partData.subarray(headerEnd + 4, partData.length - 2); // strip trailing \r\n

        const nameMatch = headerStr.match(/name="([^"]+)"/);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);
        const ctMatch = headerStr.match(/Content-Type:\s*(.+)/i);

        parts.push({
            name: nameMatch?.[1],
            filename: filenameMatch?.[1],
            contentType: ctMatch?.[1]?.trim(),
            data: content,
        });

        start = nextBoundary + boundaryBuffer.length;
        if (body.indexOf(endBuffer, nextBoundary) === nextBoundary) break;
    }
    return parts;
}

const router = Router();
router.use(requireAuth);

// GET /api/knowledge/categories
router.get('/categories', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const cardsByCategory = await db.select({
            category: knowledgeCards.category,
            count: sql<number>`count(*)::int`,
            sourceSessions: sql<number>`count(distinct ${knowledgeCards.sessionId})::int`,
        })
            .from(knowledgeCards)
            .innerJoin(sessions, eq(knowledgeCards.sessionId, sessions.id))
            .where(eq(sessions.workspaceId, user.workspaceId))
            .groupBy(knowledgeCards.category);

        const customCats = await db.select().from(knowledgeCategories)
            .where(eq(knowledgeCategories.workspaceId, user.workspaceId));

        const result = cardsByCategory.map(c => {
            const custom = customCats.find(cc => cc.name === c.category);
            return {
                id: custom?.id || c.category,
                name: c.category || 'Uncategorized',
                icon: custom?.icon || 'folder',
                count: c.count,
                completeness: Math.min(100, c.count * 10),
                sourceSessions: c.sourceSessions,
                status: custom?.status || 'draft',
            };
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/knowledge/cards
router.get('/cards', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const result = await db.select({
            card: knowledgeCards,
            employeeName: employees.name,
            employeeDepartment: employees.department,
        })
            .from(knowledgeCards)
            .leftJoin(employees, eq(knowledgeCards.employeeId, employees.id))
            .innerJoin(sessions, eq(knowledgeCards.sessionId, sessions.id))
            .where(eq(sessions.workspaceId, user.workspaceId));

        res.json(result.map(r => ({
            ...r.card,
            expertName: r.employeeName,
            expertDepartment: r.employeeDepartment,
        })));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/knowledge/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const [cardCount] = await db.select({ count: sql<number>`count(*)::int` }).from(knowledgeCards)
            .innerJoin(sessions, eq(knowledgeCards.sessionId, sessions.id))
            .where(eq(sessions.workspaceId, user.workspaceId));

        const [empCount] = await db.select({ count: sql<number>`count(*)::int` }).from(employees)
            .where(eq(employees.workspaceId, user.workspaceId));

        const [sessionCount] = await db.select({ count: sql<number>`count(*)::int` }).from(sessions)
            .where(eq(sessions.workspaceId, user.workspaceId));

        res.json({
            totalCards: cardCount?.count || 0,
            totalEmployees: empCount?.count || 0,
            totalSessions: sessionCount?.count || 0,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/knowledge/documents — list uploaded documents
router.get('/documents', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const docs = await db.select().from(documents)
            .where(eq(documents.workspaceId, user.workspaceId))
            .orderBy(desc(documents.createdAt));

        res.json(docs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/knowledge/documents — upload and process a document
router.post('/documents', async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
        if (!user?.workspaceId) return res.status(400).json({ error: 'No workspace' });

        const contentType = req.headers['content-type'] || '';
        if (!contentType.includes('multipart/form-data')) {
            return res.status(400).json({ error: 'Expected multipart/form-data' });
        }

        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk: Buffer) => chunks.push(chunk));
            req.on('end', resolve);
            req.on('error', reject);
        });
        const rawBody = Buffer.concat(chunks);

        const boundary = contentType.split('boundary=')[1];
        if (!boundary) return res.status(400).json({ error: 'Missing multipart boundary' });

        const parts = parseMultipart(rawBody, boundary);
        const filePart = parts.find(p => p.filename);
        const categoryPart = parts.find(p => p.name === 'category');

        if (!filePart) return res.status(400).json({ error: 'No file provided' });

        const filename = filePart.filename!;
        const mimeType = filePart.contentType || 'application/octet-stream';
        const fileBuffer = filePart.data;
        const category = categoryPart ? categoryPart.data.toString('utf-8').trim() : 'Uploaded';

        const storagePath = `documents/${user.workspaceId}/${Date.now()}_${filename}`;

        const { error: uploadError } = await supabase.storage
            .from('knowledge-docs')
            .upload(storagePath, fileBuffer, { contentType: mimeType });

        if (uploadError) {
            log('Supabase storage upload failed, storing metadata only', { error: uploadError.message });
        }

        const [doc] = await db.insert(documents).values({
            workspaceId: user.workspaceId,
            uploadedBy: user.id,
            filename,
            mimeType,
            sizeBytes: fileBuffer.length,
            storagePath,
            category,
            status: 'processing',
        }).returning();

        res.status(201).json(doc);

        // Process document async (don't block response)
        (async () => {
            try {
                let text = '';
                if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
                    text = fileBuffer.toString('utf-8');
                } else {
                    text = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t\u00C0-\u024F\u1E00-\u1EFF]/g, ' ');
                }

                if (!text.trim()) {
                    await db.update(documents).set({ status: 'failed', error: 'Could not extract text from document' }).where(eq(documents.id, doc.id));
                    return;
                }

                const { createHfChatCompletion } = await import('../services/hf.service');
                const extractionResponse = await createHfChatCompletion({
                    messages: [
                        {
                            role: 'system',
                            content: `You are a knowledge extraction expert. Extract structured knowledge from the following document text.
Return a JSON object with a "cards" array. Each card must have:
- topic: short title (max 10 words)
- content: the knowledge in 2-5 clear sentences
- category: a descriptive category name
- tags: 2-5 relevant tags as array
- importance: "low" | "normal" | "high" | "critical"
- confidence: number 0-1

Respond ONLY with valid JSON.`,
                        },
                        { role: 'user', content: text.slice(0, 12000) },
                    ],
                    responseFormat: { type: 'json_object' },
                    temperature: 0.3,
                    maxTokens: 3000,
                });

                const parsed = JSON.parse(extractionResponse);
                const cards = parsed.cards || [];

                for (const card of cards) {
                    const embeddingText = `${card.topic}: ${card.content}`;
                    let embedding: number[] | undefined;
                    try {
                        embedding = await createEmbedding(embeddingText);
                    } catch {
                        log('Embedding generation failed for document card, storing without embedding');
                    }

                    await db.insert(knowledgeCards).values({
                        employeeId: undefined,
                        sessionId: undefined,
                        documentId: doc.id,
                        source: 'upload',
                        topic: card.topic,
                        content: card.content,
                        category: card.category || category,
                        tags: card.tags || [],
                        importance: card.importance || 'normal',
                        confidence: card.confidence || 0.8,
                        embedding,
                    });
                }

                await db.update(documents).set({ status: 'ready' }).where(eq(documents.id, doc.id));
                log('Document processed successfully', { documentId: doc.id, cardCount: cards.length });
            } catch (error: any) {
                logError('Document processing failed', { documentId: doc.id, error: error?.message || error });
                await db.update(documents).set({ status: 'failed', error: error?.message || 'Processing failed' }).where(eq(documents.id, doc.id));
            }
        })();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/knowledge/search — vector search
router.post('/search', async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.body;
        const embedding = await createEmbedding(query);

        const { data, error } = await supabase.rpc('search_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.65,
            match_count: 10,
        });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/knowledge/:categoryName — cards for a category (must be AFTER static routes)
router.get('/:categoryName', async (req: AuthRequest, res: Response) => {
    try {
        const cards = await db.select({
            card: knowledgeCards,
            employeeName: employees.name,
        })
            .from(knowledgeCards)
            .leftJoin(employees, eq(knowledgeCards.employeeId, employees.id))
            .where(eq(knowledgeCards.category, decodeURIComponent(req.params.categoryName)));

        res.json({
            category: decodeURIComponent(req.params.categoryName),
            blocks: cards.map(c => ({ ...c.card, expertName: c.employeeName })),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/knowledge/:categoryName/chat — AI chat about category
router.post('/:categoryName/chat', async (req: AuthRequest, res: Response) => {
    try {
        const { question, history } = req.body;

        const cards = await db.select().from(knowledgeCards)
            .where(eq(knowledgeCards.category, decodeURIComponent(req.params.categoryName)));

        const context = cards.map(c =>
            `Topic: ${c.topic}\nContent: ${c.content}\nTags: ${c.tags?.join(', ')}`
        ).join('\n\n---\n\n');

        const hfToken = process.env.HUGGINGFACE_API_TOKEN;
        if (!hfToken) {
            return res.status(500).json({ error: 'Missing HUGGINGFACE_API_TOKEN in environment variables' });
        }

        const messages: any[] = [
            { role: 'system', content: `You are a knowledge assistant. Answer based on these knowledge cards:\n\n${context}\n\nOnly answer from available information. Cite sources.` },
            ...(history || []),
            { role: 'user', content: question },
        ];

        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${hfToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'Qwen/Qwen2.5-72B-Instruct:novita',
                messages,
                temperature: 0.3,
                max_tokens: 1200,
            }),
        });

        if (!response.ok) {
            const body = await response.text();
            return res.status(502).json({ error: `Hugging Face API error: ${response.status} ${body}` });
        }

        const completion = await response.json() as any;
        const answer = completion?.choices?.[0]?.message?.content || 'No answer returned.';

        res.json({
            answer,
            sources: cards.map(c => ({ id: c.id, topic: c.topic })),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
