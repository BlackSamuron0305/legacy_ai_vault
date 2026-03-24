# LegacyAI Vault

> Knowledge capture platform — AI-powered offboarding interview system for enterprises

Enterprise SaaS platform that extracts implicit expert knowledge from departing employees via voice-AI interviews, structures it into searchable knowledge cards, stores it in a vector database, and makes it accessible through a RAG chatbot.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Backend — API Routes](#backend--api-routes)
- [AI Pipeline](#ai-pipeline)
- [ElevenLabs Integration](#elevenlabs-integration)
- [Authentication & Roles](#authentication--roles)
- [Database Schema & Migration Workflow](#database-schema--migration-workflow)
- [Frontend Structure](#frontend-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI Framework |
| TypeScript | 5.8 | Type safety |
| Vite | 6.x | Build tool, dev server (Port 8080) |
| React Router v6 | 6.30 | Client-side routing (SPA) |
| TanStack Query | 5.x | Server-state management, caching |
| shadcn/ui + Radix UI | — | Component library (headless, fully customized) |
| Tailwind CSS | 3.x | Utility-first styling |
| Framer Motion | 12.x | Animations |
| React Hook Form | 7.x | Form management |
| `@elevenlabs/react` | 0.14 | ElevenLabs React SDK (useConversation hook) |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | 4.18 | HTTP server (Port 3001) |
| TypeScript | 5.3 | Type safety |
| ts-node-dev | 2.x | Hot-reload in development |
| Drizzle ORM | 0.45.1 | Type-safe database access |
| drizzle-kit | 0.31.9 | Schema migrations (push-based) |
| postgres | 3.4 | PostgreSQL driver (raw, pooled) |
| bcrypt | 6.x | Password hashing (12 rounds) |
| jsonwebtoken | 9.x | JWT auth token generation & verification |

### AI Service (Python)

| Technology | Version | Purpose |
|---|---|---|
| Flask | 3.0 | Microservice HTTP server (Port 5000) |
| gunicorn | — | Production WSGI server |
| ElevenLabs SDK | — | Agent management, voice processing |

### Database & Infrastructure

| Technology | Purpose |
|---|---|
| **PostgreSQL 16** (pgvector/pgvector:pg16) | Primary database via Docker |
| **pgvector** | 384-dim embedding vectors in `knowledge_cards.embedding` |
| **Local JWT auth** | bcrypt password hashing + JWT token-based authentication |
| **Local filesystem** | Document uploads and report storage at `UPLOADS_DIR/` |
| **Docker Compose** | Orchestrates 4 services: postgres, backend, frontend, ai-service |

### External AI Services

| Service | Purpose |
|---|---|
| **ElevenLabs Conversational AI** | Voice-to-voice AI interviewer (Agent `agent_8901kkq04wagefmr6qtbvw8ab0z2`) |
| **HuggingFace Inference API** | LLM for knowledge extraction + RAG chatbot (Qwen/Qwen2.5-72B-Instruct) |
| **HuggingFace Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` → 384-dim vectors for semantic search |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER  (React SPA, Port 8080)                                │
│                                                                 │
│  Landing / Marketing   App (auth-protected)                     │
│  ├── /                 ├── /app/dashboard                       │
│  ├── /pricing          ├── /app/employees                       │
│  ├── /blog             ├── /app/sessions                        │
│  └── /register         ├── /app/sessions/:id/interview          │
│                        ├── /app/sessions/:id/review             │
│                        ├── /app/knowledge                       │
│                        └── /app/analytics                       │
└──────────────────────────────────────┬──────────────────────────┘
                                       │ REST API
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND  (Express, Port 3001)                                   │
│                                                                  │
│  requireAuth (JWT verification via jsonwebtoken)                 │
│       │                                                          │
│  ┌────▼──────────────────────────────────────────────────────┐   │
│  │  API Router                                               │   │
│  │  /api/auth        /api/employees     /api/settings        │   │
│  │  /api/sessions    /api/knowledge     /api/admin           │   │
│  │  /api/analytics   /api/chat          /api/files (static)  │   │
│  │  /api/reports     /api/activity                           │   │
│  └────────────────────┬──────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼──────────────────────────────────────┐   │
│  │  Services                                                 │   │
│  │  extraction.service  → HuggingFace LLM                    │   │
│  │  embedding.service   → HuggingFace Embeddings (384-dim)   │   │
│  │  chat.service        → HuggingFace + pgvector RAG         │   │
│  │  hf.service          → HuggingFace API wrapper            │   │
│  │  elevenlabs.service  → ElevenLabs REST API                │   │
│  │  report-storage      → Local filesystem (UPLOADS_DIR/)    │   │
│  └────────────────────┬──────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼──────────────────────────────────────┐   │
│  │  Drizzle ORM ←── schema.ts (single source of truth)       │   │
│  │  postgres driver → DATABASE_URL                           │   │
│  └────────────────────┬──────────────────────────────────────┘   │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│  PostgreSQL 16 + pgvector  (Docker, Port 5432)                   │
│  ├── 13 tables (workspaces, users, employees, sessions, ...)    │
│  ├── vector(384) embeddings on knowledge_cards                   │
│  └── SQL functions: search_knowledge, search_knowledge_by_cat.  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  AI Service  (Flask, Port 5000)                                  │
│  ├── Classification pipeline                                     │
│  ├── Report generation                                           │
│  └── ElevenLabs agent management                                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  ElevenLabs  (external)                                          │
│  ├── GET /v1/convai/conversation/get-signed-url                  │
│  └── WebSocket/WebRTC voice — direct Browser ↔ ElevenLabs       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Model

13 tables, all defined in `backend/src/db/schema.ts`. Drizzle is the **single source of truth**.

```
workspaces          (id, name, company_name, domain, industry)
    │
    ├── users       (id, email, password_hash, full_name, role, workspace_id)
    │
    ├── employees   (id, workspace_id, name, role, department, exit_date,
    │                session_status, transcript_status, coverage_score, risk_level)
    │
    ├── sessions    (id, workspace_id, employee_id, status, transcript,
    │                elevenlabs_conversation_id, report_html_path, ...)
    │   │
    │   ├── transcript_segments  (id, session_id, timestamp, speaker, text, order_index)
    │   │
    │   └── knowledge_cards      (id, session_id, employee_id, topic, content,
    │                             category, tags[], importance, confidence,
    │                             embedding vector(384),  ← pgvector
    │                             document_id, source)
    │
    ├── documents   (id, workspace_id, uploaded_by, filename, mime_type,
    │                storage_path, category, status)
    │
    ├── knowledge_categories  (id, workspace_id, name, icon, status)
    ├── reports               (id, workspace_id, session_id, employee_id, title, content)
    ├── chat_messages         (id, session_id, role, content, sources[])
    ├── activities            (id, workspace_id, type, message)
    ├── api_keys              (id, workspace_id, ...)
    └── workspace_settings    (id, workspace_id, ...)
```

### Role Hierarchy (users.role)

```
admin      → Platform admin (internal)
owner      → Workspace creator (company owner)
member     → Regular employee
reviewer   → Can approve transcripts
viewer     → Read-only
```

---

## Backend — API Routes

All routes under `/api/` are protected by `requireAuth` (exceptions: `POST /api/auth/register`, `POST /api/auth/login`).

### Auth (`/api/auth`)
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create user with bcrypt password hash + workspace (auto-join by domain or create new) |
| POST | `/login` | Verify password with bcrypt → return JWT access token |
| POST | `/logout` | No-op (JWT is stateless, client discards token) |
| GET | `/me` | Current user + workspace (requires auth) |
| PUT | `/profile` | Update user profile |
| POST | `/join-company` | Join existing workspace by invite code |

### Sessions (`/api/sessions`)
| Method | Path | Description |
|---|---|---|
| GET | `/` | All sessions for workspace (with Employee join) |
| POST | `/` | Create new session (with or without employeeId) |
| GET | `/:id` | Session detail |
| POST | `/:id/start` | Status → `in_progress`, update employee status |
| GET | `/:id/token` | **Signed URL from ElevenLabs API** (xi-api-key server-side) |
| POST | `/:id/end` | End session, trigger AI processing |
| POST | `/:id/pause` | Pause an in-progress interview |
| POST | `/:id/resume` | Resume a paused interview |
| GET | `/:id/transcript` | Transcript + segments |
| PUT | `/:id/transcript` | Replace/update all transcript segments |
| PUT | `/:id/transcript/approve` | Approve transcript, update session status |
| GET | `/:id/transcript/live` | SSE stream for real-time transcript segments |
| POST | `/:id/transcript/segment` | Add a real-time transcript segment (atomic ordering) |
| GET | `/:id/topics` | Extracted topics and knowledge cards |
| POST | `/:id/reprocess` | Reprocess transcript and regenerate report |
| GET | `/:id/processing` | Processing status polling |
| GET | `/:id/classification` | Classify report, extract knowledge cards |

### Knowledge (`/api/knowledge`)
| Method | Path | Description |
|---|---|---|
| GET | `/categories` | All knowledge categories |
| GET | `/cards` | All knowledge cards (filterable) |
| POST | `/cards` | Manually create knowledge card |
| GET | `/search` | Semantic vector search via pgvector SQL functions |
| POST | `/:categoryName/chat` | AI chat about a specific category |
| POST | `/documents/upload` | Upload document (stored locally) |

### Other Routes
| Route | Description |
|---|---|
| `/api/analytics/coverage` | Department coverage metrics |
| `/api/analytics/gaps` | Employees with low coverage + risk level |
| `/api/analytics/summary` | Dashboard KPIs |
| `/api/chat/ask` | RAG chatbot: question → embedding → pgvector → LLM (workspace-authorized) |
| `/api/chat/history/:sessionId` | Chat history (workspace-authorized) |
| `/api/reports` | Report CRUD |
| `/api/employees` | Employee CRUD (workspace-authorized) |
| `/api/activity` | Activity feed |
| `/api/admin/team` | Team members list |
| `/api/admin/api-keys` | API key CRUD |
| `/api/admin/companies` | Company management (owner/admin only) |
| `/api/settings` | Workspace settings GET/PUT |
| `/api/files/*` | Static file serving for uploads (auth-protected) |

---

## AI Pipeline

### 1. Interview Phase (ElevenLabs)

```
User opens /app/sessions/:id/interview
  │
  ├─ Frontend: api.startSession(id)  →  POST /api/sessions/:id/start
  │                                      (Status → in_progress)
  │
  ├─ Frontend: api.getSessionToken(id) →  GET /api/sessions/:id/token
  │   Backend: GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url
  │            Header: xi-api-key (server-side, never in browser)
  │            → signed_url returned
  │
  └─ Frontend: useConversation().startSession({ signedUrl })
               WebSocket/WebRTC connection to ElevenLabs
               Voice-to-voice runs directly Browser ↔ ElevenLabs
```

### 2. Post-Interview Processing

```
User clicks "End & Process"
  │
  └─ POST /api/sessions/:id/end  { transcript, duration }
      │
      ├─ elevenlabs.getLatestConversationId(agentId)
      │   → ElevenLabs REST: GET /v1/convai/conversations
      │
      ├─ elevenlabs.getConversationTranscript(conversationId)
      │   → ElevenLabs REST: GET /v1/convai/conversations/:id
      │
      └─ extraction.extractKnowledge(sessionId, employeeId, transcript)
          │
          ├─ HuggingFace LLM (createHfChatCompletion)
          │   Prompt: EXTRACTOR_PROMPT  →  JSON { cards: [...] }
          │   Extracts: topic, content, tags[], importance, confidence
          │
          ├─ Transcript parsed into transcript_segments
          │   Format: [HH:MM:SS] AI/Employee: Text
          │
          └─ For each Knowledge Card:
               embedding.createEmbedding(topic + content)
               → HuggingFace sentence-transformers (384-dim)
               → INSERT INTO knowledge_cards (with embedding)
```

### 3. RAG Chatbot

```
User asks question in /app/knowledge (Chatbot)
  │
  └─ POST /api/chat/ask  { question }
      │
      ├─ embedding.createEmbedding(question)  →  vector(384)
      │
      ├─ db.execute(sql`SELECT * FROM search_knowledge(...)`)
      │   → pgvector: cosine similarity against all knowledge_cards.embedding
      │   → returns top-5 most similar cards (with expert_name, department)
      │
      └─ HuggingFace LLM (createHfChatCompletion)
            System: buildChatbotPrompt(context)
            User: question
            → Answer with source references
```

---

## ElevenLabs Integration

### Agent Configuration

- **Agent ID:** `agent_8901kkq04wagefmr6qtbvw8ab0z2`
- **Frontend SDK:** `@elevenlabs/react` useConversation hook
- **System Prompt:** `backend/src/prompts/interviewer.ts`

### Signed URL Flow (Security)

The ElevenLabs API key is **never** sent to the browser. The backend fetches the signed URL and returns only the temporary URL:

```
Frontend  →  GET /api/sessions/:id/token  →  Backend
Backend   →  GET api.elevenlabs.io/v1/convai/conversation/get-signed-url
             (xi-api-key in server header)
Backend   →  { signed_url: "wss://..." }  →  Frontend
Frontend  →  useConversation().startSession({ signedUrl })
```

---

## Authentication & Roles

```
POST /api/auth/register
  │
  ├─ bcrypt.hash(password, 12)  →  password_hash stored in users table
  │
  ├─ Domain matching:
  │   email == *@acme.com  +  workspace with domain='acme.com' exists?
  │   YES → Join workspace (role: 'member')
  │   NO  → Create new workspace (role: 'owner')
  │
  └─ db.insert(users)  { id = auto-generated UUID, workspaceId, role }
     → Returns JWT access token (7-day expiry)


Every API request:
  Authorization: Bearer <jwt>
    │
    └─ requireAuth middleware:
        jwt.verify(token, JWT_SECRET)
        → req.userId = payload.sub
        → All queries are workspace-filtered
```

---

## Database Schema & Migration Workflow

The schema in `backend/src/db/schema.ts` is the single source of truth.

```bash
# Deploy schema changes:
cd backend
npm run db:push
# = npx drizzle-kit push --force && npx tsx src/db/enable-rls.ts

# Only recreate indexes + search functions:
npm run db:setup
```

**What does `enable-rls.ts` do?**
`drizzle-kit push` may reset custom SQL objects. The script `src/db/enable-rls.ts` runs after push and:
- Creates the `vector` extension (`CREATE EXTENSION IF NOT EXISTS vector`)
- Creates 5 indexes (workspace_id, status, document_id, source, category)
- Creates pgvector search functions `search_knowledge` and `search_knowledge_by_category`

### pgvector Search Functions

```sql
-- Global semantic search:
search_knowledge(query_embedding vector(384), match_threshold float, match_count int)
  → id, topic, content, importance, similarity, expert_name, expert_department

-- Category-filtered search:
search_knowledge_by_category(query_embedding vector(384), category_filter text,
                              match_threshold float, match_count int)
```

---

## Frontend Structure

```
frontend/src/
├── main.tsx                  # App entry point
├── App.tsx                   # Router setup (public + app/*)
├── lib/
│   ├── api.ts                # Central API client (all fetch calls, auth header)
│   └── utils.ts              # cn() + helpers
├── hooks/
│   ├── useAuth.tsx           # Auth state (login, register, user object)
│   ├── useApi.ts             # TanStack Query wrapper
│   └── useSettings.ts        # Workspace settings hook
├── pages/
│   ├── Landing.tsx           # Marketing landing page
│   ├── Dashboard.tsx         # App dashboard
│   ├── Employees.tsx         # Employee list
│   ├── EmployeeDetail.tsx    # Employee detail with sessions
│   ├── Sessions.tsx          # All interview sessions
│   ├── SessionDetail.tsx     # Session detail (start, review, classification)
│   ├── Interview.tsx         # Live interview (ElevenLabs useConversation)
│   ├── ProcessingStatus.tsx  # Post-interview AI processing status
│   ├── TranscriptReview.tsx  # Transcript review + approval
│   ├── KnowledgeBase.tsx     # Knowledge cards + RAG chatbot
│   ├── Analytics.tsx         # Coverage, gaps, KPIs
│   ├── Reports.tsx           # Report overview
│   └── Settings.tsx          # Workspace settings
├── components/
│   ├── layout/               # AppLayout, AppSidebar, TopNav
│   ├── common/               # StatCard, StatusBadge
│   ├── shared/               # CostSimulation (landing page)
│   └── ui/                   # shadcn/ui components
└── test/
    ├── api.test.ts
    ├── utils.test.ts
    └── useAuth.test.tsx
```

### Design System

- **Corners:** No `rounded-*` classes in app pages — sharp edges throughout
- **Typography:** `text-[13px]` for body, `font-medium` / `font-semibold`
- **Avatars:** `w-7 h-7 bg-foreground text-background` — inverted square initials
- **Color scheme:** Monochrome black/white with `border-border` — editorial, no colors

---

## Environment Variables

### Root `.env` (shared by all services)

```env
# PostgreSQL
POSTGRES_PASSWORD=vault_secret
DATABASE_URL=postgresql://vault:vault_secret@localhost:5432/legacy_ai_vault

# Authentication
JWT_SECRET=change-me-to-a-random-64-char-string

# ElevenLabs
ELEVENLABS_API_KEY=xi_...
ELEVENLABS_AGENT_ID=agent_8901kkq04wagefmr6qtbvw8ab0z2

# HuggingFace (LLM + Embeddings)
HUGGINGFACE_API_TOKEN=hf_...

# Server
PORT=3001
FRONTEND_URL=http://localhost:8080
AI_SERVICE_URL=http://localhost:5000

# Storage
UPLOADS_DIR=./uploads
```

### Frontend

No `.env` needed — the API endpoint is configured via `VITE_API_URL` (defaults to `http://localhost:3001` in dev). For Docker/production: set via environment or `vercel.json` rewrites.

---

## Getting Started

### With Docker (recommended)

```bash
cp .env.example .env
# Edit .env with your API keys (HUGGINGFACE_API_TOKEN, ELEVENLABS_*, JWT_SECRET)

docker compose up --build
# PostgreSQL starts first (with health check)
# Backend waits for healthy postgres, then starts on :3001
# Frontend on :8080, AI service on :5000
```

Initialize the database (first time only):
```bash
docker compose exec backend npx drizzle-kit push --force
docker compose exec backend npx tsx src/db/enable-rls.ts
```

### Local Development

**Prerequisites:** Node.js 20+, Python 3.9+, PostgreSQL 16 with pgvector

```bash
# Backend
cd backend
npm install
npm run dev            # Port 3001, hot-reload via ts-node-dev

# Frontend
cd frontend
npm install
npm run dev            # Port 5173 (Vite dev server)

# AI Service
cd ai_service
pip install -r requirements.txt
python app.py          # Port 5000

# Database
npm run db:push        # Push schema + create indexes & functions
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:push` | Push schema to Postgres + create indexes & search functions |
| `npm run db:setup` | Only recreate indexes + search functions |
| `npm run db:generate` | Generate Drizzle migration files |

---

## Key Architecture Decisions

| Decision | Reasoning |
|---|---|
| Drizzle ORM over Prisma | Direct SQL access, better for pgvector custom types, no schema drift |
| Local PostgreSQL via Docker | Full control over database, no external dependency, pgvector pre-installed |
| bcrypt + JWT over managed auth | Self-contained deployment, no vendor lock-in, simpler Docker setup |
| Local filesystem for uploads | No external storage dependency, Docker volume for persistence |
| HuggingFace over OpenAI | Cost-effective inference via Router API, open models (Qwen/Qwen2.5-72B) |
| Backend as auth proxy for ElevenLabs | API key never in browser — signed URL fetched server-side |
| Push migrations over generate | Rapid development — `drizzle-kit push --force` directly against Postgres |
| `hf.service.ts` as HF wrapper | Single point of configuration for all HuggingFace API calls |

---

## Testing

115 automated tests across backend and frontend.

### Backend (93 tests)

```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

| Test File | Tests | Scope |
|---|---|---|
| `auth.test.ts` | 7 | JWT token creation, requireAuth middleware |
| `logger.test.ts` | 5 | Logger functions, Error handling, JSON mode |
| `auth.routes.test.ts` | 10 | Register/login validation, auth endpoints |
| `chunker.test.ts` | 8 | Text chunking with sentence boundary detection |
| `report-storage.test.ts` | 4 | Report upload (HTML/PDF), download URL generation |
| `employee.routes.test.ts` | 6 | Employee CRUD, workspace authorization |
| `chat.routes.test.ts` | 6 | Chat ask + history, workspace IDOR protection |
| `analytics.routes.test.ts` | 6 | Coverage, gaps, summary endpoints |
| `knowledge.routes.test.ts` | 14 | Knowledge CRUD, search, document upload |
| `session.routes.test.ts` | 12 | Session lifecycle, start/end/pause/resume |
| `integration.test.ts` | 15 | Health endpoint, helmet headers, CORS, protected routes, 404 handling |

### Frontend (22 tests)

```bash
cd frontend
npm test
```

| Test File | Tests | Scope |
|---|---|---|
| `api.test.ts` | 9 | API client, auth token management, request headers |
| `utils.test.ts` | 7 | `cn()` utility, Tailwind class merging |
| `useAuth.test.tsx` | 6 | Auth hook, provider, token lifecycle |

---

## Security

| Measure | Detail |
|---|---|
| **Helmet** | Sets secure HTTP headers (CSP, HSTS, X-Content-Type-Options, etc.) |
| **Auth rate limiting** | 20 requests per 15 minutes on `/api/auth/login` and `/api/auth/register` |
| **Password validation** | Minimum 8 characters required |
| **bcrypt hashing** | 12 salt rounds for password storage |
| **JWT auth** | 7-day expiry, server-side verification on every request |
| **Workspace isolation** | All queries filtered by `workspaceId` — users cannot access other workspaces |
| **Admin authorization** | Inline role check (`admin`/`owner`) on admin endpoints |
| **Employee IDOR protection** | GET/PUT employee endpoints verify workspace membership |
| **Chat/Session IDOR protection** | Chat and history endpoints verify session belongs to user's workspace via `authorizeSession()` |
| **Server-side API keys** | ElevenLabs key never sent to browser — signed URL proxy pattern |
| **Structured logging** | All route handlers log success/error via `log()`/`logError()` for audit trails |
| **Global error handler** | Catches unhandled errors, prevents stack trace leakage |

---

