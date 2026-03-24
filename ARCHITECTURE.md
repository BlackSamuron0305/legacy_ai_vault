# LegacyAI Vault — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER                                       │
│                                                                      │
│   👨‍🔧 Expert                               👩‍💻 New Employee            │
│   (shares knowledge)                     (retrieves knowledge)       │
└──────┬──────────────────────────────────────────┬────────────────────┘
       │                                          │
       ▼                                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 18 / TypeScript)                  │
│                                                                      │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │  📋 Interview    │  │  🗂️ Knowledge    │  │  💬 Knowledge      │  │
│  │     Station      │  │     Vault        │  │     Chatbot        │  │
│  │                  │  │                  │  │                    │  │
│  │ • Select topic   │  │ • Card overview  │  │ • Ask questions    │  │
│  │ • Start voice    │  │ • Filter & search│  │ • Voice or text    │  │
│  │ • Live cards     │  │ • Expert profiles│  │ • Source refs      │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────────┬──────────┘ │
└───────────┼─────────────────────┼───────────────────────┼────────────┘
            │                     │                       │
            ▼                     ▼                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    API LAYER (Express + TypeScript)                   │
│                                                                      │
│  POST /sessions/:id/start    GET /knowledge/cards    POST /chat/ask │
│  POST /sessions/:id/end      GET /knowledge/search   GET /chat/hist │
│  GET  /sessions/:id/token    POST /knowledge/upload                 │
└───────────┬─────────────────────┬───────────────────────┬────────────┘
            │                     │                       │
     ┌──────▼──────┐       ┌─────▼──────┐         ┌──────▼──────┐
     │ ELEVENLABS  │       │ PostgreSQL │         │ HuggingFace │
     │ Convers. AI │       │ + pgvector │         │ Router API  │
     │             │       │            │         │             │
     │ • Voice I/O │       │ • 13 tables│         │ • RAG query │
     │ • AI inter- │       │ • vector   │         │ • Knowledge │
     │   viewer    │       │   search   │         │   extraction│
     │             │       │ • Local FS │         │ • Embeddings│
     └─────────────┘       └────────────┘         └─────────────┘
```

---

## Services (Docker Compose)

| Service | Image | Port | Purpose |
|---|---|---|---|
| `postgres` | `pgvector/pgvector:pg16` | 5432 | PostgreSQL with pgvector extension |
| `backend` | Custom (Node 20) | 3001 | Express API server |
| `frontend` | Custom (nginx) | 8080 | React SPA |
| `ai-service` | Custom (Python 3.11) | 5000 | Flask AI microservice |

Volumes:
- `pgdata` — PostgreSQL data persistence
- `uploads` — Document and report file storage

---

## Data Flows

### Interview Flow (Knowledge Capture)

```
Expert              Frontend              Backend              ElevenLabs         PostgreSQL
  │                    │                     │                     │                  │
  │  Clicks "Start"    │                     │                     │                  │
  │───────────────────▶│                     │                     │                  │
  │                    │  POST /session/start │                     │                  │
  │                    │────────────────────▶│                     │                  │
  │                    │                     │  INSERT session +   │                  │
  │                    │                     │  update employee    │                  │
  │                    │                     │─────────────────────────────────────── ▶│
  │                    │                     │                     │                  │
  │                    │  GET /session/token  │                     │                  │
  │                    │────────────────────▶│                     │                  │
  │                    │                     │  GET signed-url     │                  │
  │                    │                     │────────────────────▶│                  │
  │                    │                     │  { signed_url }     │                  │
  │                    │                     │◄────────────────────│                  │
  │                    │  { signed_url }     │                     │                  │
  │                    │◄────────────────────│                     │                  │
  │                    │                     │                     │                  │
  │  useConversation   │  WebSocket voice stream                  │                  │
  │  ◄────────────────▶│ ◄──────────────────────────────────────▶│                  │
  │  Talks with AI     │                     │                     │                  │
  │  (5-15 minutes)    │                     │                     │                  │
  │                    │                     │                     │                  │
  │  Clicks "End"      │  POST /session/end  │                     │                  │
  │───────────────────▶│────────────────────▶│                     │                  │
  │                    │                     │  GET transcript     │                  │
  │                    │                     │────────────────────▶│                  │
  │                    │                     │                     │                  │
  │                    │                     │  HF LLM: Extract    │                  │
  │                    │                     │  knowledge cards    │                  │
  │                    │                     │──────┐              │                  │
  │                    │                     │      │ processing   │                  │
  │                    │                     │◄─────┘              │                  │
  │                    │                     │                     │                  │
  │                    │                     │  INSERT cards +     │                  │
  │                    │                     │  embeddings (384d)  │                  │
  │                    │                     │─────────────────────────────────────── ▶│
  │                    │  Knowledge Cards    │                     │                  │
  │                    │◄────────────────────│                     │                  │
  │  Sees cards        │                     │                     │                  │
  │◄───────────────────│                     │                     │                  │
```

### RAG Chat Flow (Knowledge Retrieval)

```
Employee            Frontend              Backend              HuggingFace        PostgreSQL
  │                    │                     │                     │                  │
  │  "What to do       │                     │                     │                  │
  │   when X fails?"   │                     │                     │                  │
  │───────────────────▶│                     │                     │                  │
  │                    │  POST /chat/ask     │                     │                  │
  │                    │  { question }       │                     │                  │
  │                    │────────────────────▶│                     │                  │
  │                    │                     │  Embed question     │                  │
  │                    │                     │────────────────────▶│                  │
  │                    │                     │  vector(384)        │                  │
  │                    │                     │◄────────────────────│                  │
  │                    │                     │                     │                  │
  │                    │                     │  search_knowledge() │                  │
  │                    │                     │─────────────────────────────────────── ▶│
  │                    │                     │  Top 5 cards        │                  │
  │                    │                     │◄──────────────────────────────────────  │
  │                    │                     │                     │                  │
  │                    │                     │  "Answer using      │                  │
  │                    │                     │   these sources:"   │                  │
  │                    │                     │────────────────────▶│                  │
  │                    │                     │  Answer + sources   │                  │
  │                    │                     │◄────────────────────│                  │
  │                    │                     │                     │                  │
  │                    │  { answer, sources } │                     │                  │
  │                    │◄────────────────────│                     │                  │
  │  Sees answer with  │                     │                     │                  │
  │  source references │                     │                     │                  │
  │◄───────────────────│                     │                     │                  │
```

---

## Authentication Flow

```
POST /api/auth/register { email, password, fullName }
  │
  ├─ bcrypt.hash(password, 12)  →  passwordHash
  │
  ├─ Domain matching:
  │   email ends with @acme.com + workspace with domain='acme.com' exists?
  │   YES  → Join workspace (role: 'member')
  │   NO   → Create new workspace (role: 'owner')
  │
  ├─ INSERT INTO users { id: uuid(), email, passwordHash, fullName, ... }
  │
  └─ jwt.sign({ sub: user.id, email }, JWT_SECRET, { expiresIn: '7d' })
     → { user, session: { access_token: '<jwt>' } }


Every subsequent request:
  Authorization: Bearer <jwt>
    │
    └─ requireAuth middleware:
        jwt.verify(token, JWT_SECRET)
        → req.userId = payload.sub
        → db.select().where(eq(users.id, req.userId))
        → req.workspaceId = user.workspaceId
```

---

## File Storage

Reports and documents are stored on the local filesystem instead of external cloud storage:

```
UPLOADS_DIR/
├── reports/
│   ├── html/
│   │   └── {sessionId}.html
│   └── pdf/
│       └── {sessionId}.pdf
└── knowledge-docs/
    └── {workspaceId}/
        └── {filename}
```

Files are served via the auth-protected `/api/files/*` Express static route.

---

## Key Technical Details

| Aspect | Detail |
|---|---|
| Embedding model | `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions) |
| LLM | `Qwen/Qwen2.5-72B-Instruct:novita` via HuggingFace Router API |
| Vector search | pgvector cosine distance (`<=>` operator) |
| Search threshold | 0.65 similarity for knowledge search, 0.7 for RAG chat |
| Password hashing | bcrypt with 12 salt rounds |
| JWT expiry | 7 days |
| Voice AI | ElevenLabs Conversational AI via signed URL (server-side key) |

---

## Security Middleware

The Express backend applies the following security layers (in order):

1. **Helmet** — Secure HTTP headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)
2. **CORS** — Restricted to `FRONTEND_URL` origin
3. **Auth rate limiting** — 20 requests per 15 min on `/api/auth/login` and `/api/auth/register`
4. **requireAuth** — JWT verification on all `/api/*` routes (except login/register)
5. **Workspace isolation** — All data queries filtered by `workspaceId` from the JWT
6. **Employee IDOR protection** — GET/PUT employee endpoints verify workspace membership
7. **Chat/Session IDOR protection** — Chat and history endpoints verify session belongs to user's workspace via `authorizeSession()`
8. **Global error handler** — Catches unhandled errors, returns 500 without stack traces

---

## Logging

Structured logging via `backend/src/utils/logger.ts`:

| Function | Level | Use |
|---|---|---|
| `log(msg, data?)` | INFO | Successful operations, key events |
| `logDebug(msg, data?)` | DEBUG | Verbose tracing (hidden unless `LOG_LEVEL=debug`) |
| `logWarn(msg, data?)` | WARN | Non-fatal issues |
| `logError(msg, error?)` | ERROR | Failures, caught exceptions |

All route handlers include both success and error logging. Output format is JSON when `LOG_FORMAT=json`, otherwise plain text with ISO timestamps.

---

## Testing

115 automated tests (vitest) across backend and frontend:

- **Backend (93 tests):** Auth middleware, JWT tokens, route validation, text chunking, report storage, employee authorization, chat IDOR protection, knowledge CRUD, analytics endpoints, session lifecycle, integration tests (health, helmet headers, CORS, protected routes)
- **Frontend (22 tests):** API client, auth token management, `cn()` utility, `useAuth` hook lifecycle

```bash
cd backend && npm test    # 93 tests
cd frontend && npm test   # 22 tests
```
