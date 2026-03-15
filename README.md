Note: The tool simplified the command to ` cat > /Users/luis/Documents/Curserxthinc/legacy_ai_vault/README.md << 'ENDOFFILE'
# LegacyAI Vault

> Knowledge capture platform — KI-gestütztes Offboarding-Interview-System für Unternehmen

Enterprise SaaS-Plattform, die implizites Expertenwissen ausscheidender Mitarbeiter per Voice-AI-Interview extrahiert, strukturiert, in einer durchsuchbaren Wissensdatenbank speichert und per RAG-Chatbot abrufbar macht.

---

## Inhaltsverzeichnis

- [Tech-Stack](#tech-stack)
- [Systemarchitektur](#systemarchitektur)
- [Datenmodell](#datenmodell)
- [Backend — API-Routen](#backend--api-routen)
- [AI-Pipeline](#ai-pipeline)
- [ElevenLabs-Integration](#elevenlabs-integration)
- [Authentifizierung & Rollen](#authentifizierung--rollen)
- [Datenbankschema & Migrations-Workflow](#datenbankschema--migrations-workflow)
- [Frontend-Struktur](#frontend-struktur)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Entwicklung starten](#entwicklung-starten)

---

## Tech-Stack

### Frontend

| Technologie | Version | Zweck |
|---|---|---|
| React | 18.3 | UI-Framework |
| TypeScript | 5.3 | Typsicherheit |
| Vite | 6.x | Build-Tool, Dev-Server (Port 8080) |
| React Router v6 | 6.30 | Client-seitiges Routing (SPA) |
| TanStack Query | 5.x | Server-State-Management, Caching |
| shadcn/ui + Radix UI | — | Komponentenbibliothek (headless, vollständig angepasst) |
| Tailwind CSS | 3.x | Utility-first Styling |
| Framer Motion | 12.x | Animationen |
| React Hook Form | 7.x | Formularverwaltung |
| `@elevenlabs/react` | 0.14 | ElevenLabs React SDK (useConversation Hook) |

### Backend

| Technologie | Version | Zweck |
|---|---|---|
| Node.js + Express | 4.18 | HTTP-Server (Port 3001) |
| TypeScript | 5.3 | Typsicherheit |
| ts-node-dev | 2.x | Hot-Reload in Entwicklung |
| Drizzle ORM | 0.45.1 | Typsicherer Datenbankzugriff |
| drizzle-kit | 0.31.9 | Schema-Migrationen (push-basiert) |
| postgres | 3.4 | PostgreSQL-Treiber (raw, pooled) |
| `@supabase/supabase-js` | 2.x | Auth-Token-Validierung + Vector-RPC-Calls |

### Datenbank & Infrastruktur

| Technologie | Zweck |
|---|---|
| **Supabase (PostgreSQL)** | Primäre Datenbank, Auth, Row Level Security |
| **pgvector** | 1536-dim. Embedding-Vektoren in `knowledge_cards.embedding` |
| **Supabase Auth** | JWT-basierte Authentifizierung |
| **Supabase Storage** | Dokument-Uploads (PDF, DOCX) |

### Externe AI-Services

| Service | Zweck |
|---|---|
| **ElevenLabs Conversational AI** | Voice-to-Voice KI-Interviewer (Agent `agent_8901kkq04wagefmr6qtbvw8ab0z2`) |
| **Hugging Face Inference API** | LLM für Knowledge-Extraction (Extractor-Prompt) + RAG-Chatbot-Antworten |
| **Hugging Face Embeddings** | `sentence-transformers` → 1536-dim. Vektoren für semantische Suche |

---

## Systemarchitektur

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER  (React SPA, Port 8080)                                │
│                                                                 │
│  Landing / Marketing   App (auth-protected)                     │
│  ├── /                 ├── /app/dashboard                       │
│  ├── /pricing          ├── /app/employees                       │
│  ├── /blog             ├── /app/sessions                        │
│  └── /register         ├── /app/sessions/:id/interview  ←────┐  │
│                        ├── /app/sessions/:id/review           │  │
│                        ├── /app/knowledge                     │  │
│                        └── /app/analytics                     │  │
└──────────────────────────────────┬──────────────────────────┬─┘  │
                                   │ REST API                 │    │
                                   ▼                          │    │
┌──────────────────────────────────────────────────────┐      │    │
│  BACKEND  (Express, Port 3001)                       │      │    │
│                                                      │      │    │
│  requireAuth (Supabase JWT)                          │      │    │
│       │                                              │      │    │
│  ┌────▼──────────────────────────────────────────┐   │      │    │
│  │  API-Router                                   │   │      │    │
│  │  /api/auth        /api/employees              │   │      │    │
│  │  /api/sessions    /api/knowledge              │   │      │    │
│  │  /api/analytics   /api/chat                   │   │      │    │
│  │  /api/reports     /api/activity               │   │      │    │
│  └────────────────────┬──────────────────────────┘   │      │    │
│                       │                              │      │    │
│  ┌────────────────────▼──────────────────────────┐   │      │    │
│  │  Services                                     │   │      │    │
│  │  extraction.service  → HuggingFace LLM        │   │      │    │
│  │  embedding.service   → HuggingFace Embeddings │   │      │    │
│  │  chat.service        → HuggingFace + pgvector │   │      │    │
│  │  elevenlabs.service  → ElevenLabs REST API    │   │      │    │
│  └────────────────────┬──────────────────────────┘   │      │    │
│                       │                              │      │    │
│  ┌────────────────────▼──────────────────────────┐   │      │    │
│  │  Drizzle ORM   ←──── schema.ts (source of     │   │      │    │
│  │  postgres driver         truth für DB)        │   │      │    │
└──┼────────────────────┼──────────────────────────┘   │      │    │
   │                    │                              │      │    │
   ▼                    ▼                              │      │    │
┌──────────────────┐  ┌────────────────────────────┐  │      │    │
│  Supabase Auth   │  │  Supabase PostgreSQL        │  │      │    │
│  (JWT-Validier.) │  │  + pgvector Extension       │  │      │    │
│                  │  │  + RLS (service_role)        │  │      │    │
└──────────────────┘  └────────────────────────────┘  │      │    │
                                                       │      │    │
┌──────────────────────────────────────────────────────┘      │    │
│  ElevenLabs  (extern)                                        │    │
│  ├── GET /v1/convai/conversation/get-signed-url              │    │
│  │        ↑ aufgerufen von /api/sessions/:id/token           │    │
│  │                                                           │    │
│  └── WebSocket/WebRTC Widget  ←───────────────────────────────────┘
│       voice ↔ voice, direkt Browser ↔ ElevenLabs
└──────────────────────────────────────────────────────────────┘
```

---

## Datenmodell

13 Tabellen, alle in `backend/src/db/schema.ts` definiert. Drizzle ist **Single Source of Truth**.

```
workspaces          (id, name, company_name, domain, industry)
    │
    ├── users       (id=supabase_auth_id, email, full_name, role, workspace_id)
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
    │                             embedding vector(1536),  ← pgvector
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

### Rollen-Hierarchie (users.role)

```
admin      → Plattform-Admin (Luigi-intern)
owner      → Workspace-Ersteller (Unternehmens-Owner)
member     → regulärer Mitarbeiter
reviewer   → kann Transkripte freigeben
viewer     → read-only
```

---

## Backend — API-Routen

Alle Routen unter `/api/` sind durch `requireAuth` geschützt (einzige Ausnahme: `POST /api/auth/register`, `POST /api/auth/login`).

### Auth (`/api/auth`)
| Method | Pfad | Beschreibung |
|---|---|---|
| POST | `/register` | Supabase Auth User erstellen + Workspace anlegen oder beitreten (domain-matching) |
| POST | `/login` | Supabase signInWithPassword → JWT zurück |
| GET | `/me` | Aktueller User + Workspace |

### Sessions (`/api/sessions`)
| Method | Pfad | Beschreibung |
|---|---|---|
| GET | `/` | Alle Sessions des Workspaces (mit Employee-Join) |
| POST | `/` | Neue Session erstellen (mit oder ohne employeeId) |
| GET | `/:id` | Session-Detail |
| POST | `/:id/start` | Status → `in_progress`, Employee-Status aktualisieren |
| GET | `/:id/token` | **Signed URL von ElevenLabs API** holen (xi-api-key server-seitig) |
| POST | `/:id/end` | Session beenden, AI-Processing triggern |
| GET | `/:id/transcript` | Transkript + Segmente abrufen |
| PUT | `/:id/transcript/approve` | Transkript freigeben |
| GET | `/:id/processing` | Processing-Status polling |
| GET | `/:id/classification` | Knowledge-Cards der Session |

### Knowledge (`/api/knowledge`)
| Method | Pfad | Beschreibung |
|---|---|---|
| GET | `/categories` | Alle Knowledge-Kategorien |
| GET | `/cards` | Alle Knowledge-Cards (filterbar) |
| POST | `/cards` | Knowledge-Card manuell erstellen |
| GET | `/search` | Semantische Suche via Supabase pgvector RPC |

### Weitere
| Route | Beschreibung |
|---|---|
| `/api/analytics/coverage` | Department-Coverage-Metriken |
| `/api/analytics/gaps` | Mitarbeiter mit geringer Coverage + Risk-Level |
| `/api/analytics/summary` | Dashboard-KPIs |
| `/api/chat/ask` | RAG-Chatbot: Frage → Embedding → pgvector → LLM |
| `/api/chat/history/:sessionId` | Chat-Verlauf |
| `/api/reports` | Report-CRUD |
| `/api/employees` | Employee-CRUD |
| `/api/activity` | Activity-Feed |

---

## AI-Pipeline

### 1. Interview-Phase (ElevenLabs)

```
User öffnet /app/sessions/:id/interview
  │
  ├─ Frontend: api.startSession(id)  →  POST /api/sessions/:id/start
  │                                      (Status → in_progress)
  │
  ├─ Frontend: api.getSessionToken(id) →  GET /api/sessions/:id/token
  │   Backend: GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url
  │            Header: xi-api-key (server-seitig, nie im Browser)
  │            → signed_url zurück
  │
  └─ Frontend: useConversation().startSession({ signedUrl })
               WebSocket/WebRTC Verbindung zu ElevenLabs
               Voice-to-Voice läuft direkt Browser ↔ ElevenLabs
```

### 2. Post-Interview-Processing

```
User klickt "End & Process"
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
          │   Extrahiert: topic, content, tags[], importance, confidence
          │
          ├─ Transkript in transcript_segments parsen
          │   Format: [HH:MM:SS] AI/Employee: Text
          │
          └─ Für jede Knowledge-Card:
               embedding.createEmbedding(topic + content)
               → HuggingFace sentence-transformers
               → vector(1536)
               → INSERT INTO knowledge_cards
```

### 3. RAG-Chatbot

```
User stellt Frage in /app/knowledge (Chatbot)
  │
  └─ POST /api/chat/ask  { question }
      │
      ├─ embedding.createEmbedding(question)  →  vector(1536)
      │
      ├─ supabase.rpc('search_knowledge', {
      │     query_embedding, match_threshold: 0.65, match_count: 5
      │   })
      │   → pgvector: cosine similarity gegen alle knowledge_cards.embedding
      │   → gibt top-5 ähnlichste Cards zurück (mit expert_name, department)
      │
      └─ HuggingFace LLM (createHfChatCompletion)
            System: buildChatbotPrompt(context)
            User: question
            → Antwort mit Quellen-Referenzen
```

---

## ElevenLabs-Integration

### Agent-Konfiguration

- **Agent ID:** `agent_8901kkq04wagefmr6qtbvw8ab0z2`
- **Widget Script:** `https://unpkg.com/@elevenlabs/convai-widget-embed`
- **System Prompt:** `backend/src/prompts/interviewer.ts`

Der Interviewer-Prompt unterstützt dynamische Variablen via Template-Replacement:
```
{{name}}      → Mitarbeitername aus der Session
{{fachgebiet}} → Rolle/Spezialisierung des Mitarbeiters
```

### Signed URL Flow (Sicherheit)

Der ElevenLabs API-Key wird **niemals** an den Browser weitergegeben. Das Backend holt die Signed URL und gibt nur diese temporäre URL zurück:

```
Frontend  →  GET /api/sessions/:id/token  →  Backend
Backend   →  GET api.elevenlabs.io/v1/convai/conversation/get-signed-url
             (xi-api-key im Server-Header)
Backend   →  { signed_url: "wss://..." }  →  Frontend
Frontend  →  useConversation().startSession({ signedUrl })
```

### Dynamischer Prompt-Override (ausstehend)

Voraussetzung: Im ElevenLabs Dashboard "Allow prompt overrides" aktivieren.

```ts
const conversation = useConversation({
  overrides: {
    agent: {
      prompt: { prompt: buildInterviewerPrompt(employeeName, employeeRole) },
      firstMessage: buildFirstMessage(employeeName, employeeRole),
      language: 'de',
    }
  }
});
```

---

## Authentifizierung & Rollen

```
POST /api/auth/register
  │
  ├─ supabase.auth.admin.createUser()  →  Supabase Auth User
  │
  ├─ Domain-Matching:
  │   email == *@acme.com  +  Workspace mit domain='acme.com' existiert?
  │   JA  → Workspace beitreten (role: 'member')
  │   NEIN → neuen Workspace erstellen (role: 'owner')
  │
  └─ db.insert(users)  { id = supabase_auth_id, workspaceId, role }


Jeder API-Request:
  Authorization: Bearer <supabase_jwt>
    │
    └─ requireAuth middleware:
        supabase.auth.getUser(token)
        → req.userId = user.id
        → alle Queries werden automatisch workspace-gefiltert
```

---

## Datenbankschema & Migrations-Workflow

Das Schema in `backend/src/db/schema.ts` ist der einzige Stand der Wahrheit.

```bash
# Schema-Änderung deployen:
cd backend
npm run db:push
# = npx drizzle-kit push --force && npx tsx src/db/enable-rls.ts

# Nur RLS neu aktivieren (nach manuellem DB-Eingriff):
npm run db:rls
```

**Warum `enable-rls.ts`?**  
`drizzle-kit push` setzt RLS bei jedem Push zurück. Das Script `src/db/enable-rls.ts` wird deshalb automatisch danach ausgeführt und:
- Aktiviert RLS auf allen 13 Tabellen
- Erstellt `service_role` + `postgres` Full-Access-Policies
- Erstellt 5 Indizes (workspace_id, status, document_id etc.)
- Erstellt die pgvector-Suchfunktionen `search_knowledge` und `search_knowledge_by_category`

### pgvector-Suchfunktionen

```sql
-- Globale semantische Suche:
search_knowledge(query_embedding vector, match_threshold float, match_count int)
  → id, topic, content, importance, similarity, expert_name, expert_department

-- Kategorie-gefilterte Suche:
search_knowledge_by_category(query_embedding vector, category_filter text,
                              match_threshold float, match_count int)
```

---

## Frontend-Struktur

```
frontend/src/
├── main.tsx                  # App-Einstiegspunkt
├── App.tsx                   # Router-Setup (public + app/*)
├── lib/
│   ├── api.ts                # Zentraler API-Client (alle fetch-Calls, Auth-Header)
│   └── utils.ts              # cn() + Hilfsfunktionen
├── hooks/
│   ├── useAuth.tsx           # Auth-State (Login, Register, User-Objekt)
│   ├── useApi.ts             # TanStack Query Wrapper
│   └── use-toast.ts          # Toast-Notifications
├── pages/
│   ├── Landing.tsx           # Marketing-Landing-Page (interaktive Transcript-Demo, Carousel)
│   ├── Dashboard.tsx         # App-Dashboard (aktuelle Sessions, Employees)
│   ├── Employees.tsx         # Mitarbeiterliste
│   ├── EmployeeDetail.tsx    # Mitarbeiter-Detail mit Sessions
│   ├── Sessions.tsx          # Alle Interview-Sessions
│   ├── SessionDetail.tsx     # Session-Detail (Start, Review, Classification)
│   ├── Interview.tsx         # Live-Interview (ElevenLabs Widget)
│   ├── ProcessingStatus.tsx  # Post-Interview AI-Processing-Status
│   ├── TranscriptReview.tsx  # Transkript reviewen + freigeben
│   ├── KnowledgeBase.tsx     # Knowledge-Cards + RAG-Chatbot
│   ├── Analytics.tsx         # Coverage, Gaps, KPIs
│   ├── Reports.tsx           # Report-Übersicht
│   └── Settings.tsx          # Workspace-Einstellungen
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx     # App-Shell (Sidebar + TopNav)
│   │   ├── AppSidebar.tsx    # Navigations-Sidebar
│   │   └── TopNav.tsx        # Obere Leiste
│   ├── common/
│   │   ├── StatCard.tsx      # KPI-Karte
│   │   └── StatusBadge.tsx   # Status-Badge (session_status, risk_level etc.)
│   ├── shared/
│   │   └── CostSimulation.tsx  # Interaktiver Kostenvergleich (Landing)
│   └── ui/                   # shadcn/ui Komponenten (button, card, dialog, ...)
└── data/
    └── mockData.ts           # Demo-Mode Daten
```

### Design-System

- **Schärfe:** Keine `rounded-*` Klassen in App-Seiten — kompromisslos eckig
- **Typografie:** `text-[13px]` für Body, `font-medium` / `font-semibold`
- **Avatare:** `w-7 h-7 bg-foreground text-background` — invertierte quadratische Initialen
- **Farbschema:** Monochrom Schwarz/Weiß mit `border-border` — editorial, kein Buntes

---

## Umgebungsvariablen

### Backend (`backend/.env`)

```env
# Supabase Pooler (IPv4, Session Mode)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres

# Supabase JS Client (für Auth + Vector-RPC)
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# ElevenLabs
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=agent_8901kkq04wagefmr6qtbvw8ab0z2

# HuggingFace (LLM + Embeddings)
HUGGINGFACE_API_TOKEN=hf_...

# Server
PORT=3001
FRONTEND_URL=http://localhost:8080
```

### Frontend

Kein `.env` nötig — der API-Endpunkt ist in `src/lib/api.ts` auf `http://localhost:3001` hardcodiert (Dev). Für Production: `VITE_API_URL` via Vite.

---

## Entwicklung starten

### Voraussetzungen

- Node.js 20+
- Supabase-Projekt mit pgvector-Extension
- ElevenLabs-Account mit konfiguriertem Agent
- HuggingFace API Token

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Variablen eintragen
npm run dev            # Port 3001, hot-reload via ts-node-dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # Port 8080
```

### Datenbank initialisieren

```bash
cd backend
npm run db:push        # Schema pushen + RLS aktivieren
```

### Scripts

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Development-Server starten |
| `npm run build` | TypeScript kompilieren |
| `npm run db:push` | Schema nach Supabase pushen + RLS aktivieren |
| `npm run db:rls` | Nur RLS + Policies + Suchfunktionen neu erstellen |

---

## Wichtige Architekturentscheidungen

| Entscheidung | Begründung |
|---|---|
| Drizzle ORM statt Prisma | Direkter SQL-Zugriff, besser für pgvector custom types, kein Schema-Drift |
| Zwei DB-Clients (postgres + supabase-js) | `postgres`-Treiber für alle CRUD-Ops; `supabase-js` exklusiv für `auth.getUser()` + pgvector-RPCs |
| Backend als Auth-Proxy für ElevenLabs | API-Key nie im Browser — signed URL server-seitig geholt |
| RLS mit service_role | Backend nutzt `service_role`, umgeht RLS bewusst — RLS ist Sicherheitsnetz für direkte DB-Zugriffe |
| Push-Migrationen statt Generate | Hackathon-tempo — `drizzle-kit push --force` direkt gegen Supabase, kein Migration-File-Management |

---

**Repository:** [github.com/Luraxx/legacy_ai_vault](https://github.com/Luraxx/legacy_ai_vault)
ENDOFFILE`, and this is the output of running that command instead:
luis@172-10-175-59 legacy_ai_vault %  cat > /Users/luis/Documents/Curserxthinc/legacy_ai_vault/README.m
d << 'ENDOFFILE'
heredoc> # LegacyAI Vault
heredoc> 
heredoc> > Knowledge capture platform — KI-gestütztes Offboarding-Interview-System für Unternehmen
heredoc> 
heredoc> Enterprise SaaS-Plattform, die implizites Expertenwissen ausscheidender Mitarbeiter per Voice-
AI-Interview extrahiert, strukturiert, in einer durchsuchbaren Wissensdatenbank speichert und per RAG-C
hatbot abrufbar macht.
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## Inhaltsverzeichnis
heredoc> 
heredoc> - [Tech-Stack](#tech-stack)
heredoc> - [Systemarchitektur](#systemarchitektur)
heredoc> - [Datenmodell](#datenmodell)
heredoc> - [Backend — API-Routen](#backend--api-routen)
heredoc> - [AI-Pipeline](#ai-pipeline)
heredoc> - [ElevenLabs-Integration](#elevenlabs-integration)
heredoc> - [Authentifizierung & Rollen](#authentifizierung--rollen)
heredoc> - [Datenbankschema & Migrations-Workflow](#datenbankschema--migrations-workflow)
heredoc> - [Frontend-Struktur](#frontend-struktur)
heredoc> - [Umgebungsvariablen](#umgebungsvariablen)
heredoc> - [Entwicklung starten](#entwicklung-starten)
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## Tech-Stack
heredoc> 
heredoc> ### Frontend
heredoc> 
heredoc> | Technologie | Version | Zweck |
heredoc> |---|---|---|
heredoc> | React | 18.3 | UI-Framework |
heredoc> | TypeScript | 5.3 | Typsicherheit |
heredoc> | Vite | 6.x | Build-Tool, Dev-Server (Port 8080) |
heredoc> | React Router v6 | 6.30 | Client-seitiges Routing (SPA) |
heredoc> | TanStack Query | 5.x | Server-State-Management, Caching |
heredoc> | shadcn/ui + Radix UI | — | Komponentenbibliothek (headless, vollständig angepasst) |
heredoc> | Tailwind CSS | 3.x | Utility-first Styling |
heredoc> | Framer Motion | 12.x | Animationen |
heredoc> | React Hook Form | 7.x | Formularverwaltung |
heredoc> | `@elevenlabs/react` | 0.14 | ElevenLabs React SDK (useConversation Hook) |
heredoc> 
heredoc> ### Backend
heredoc> 
heredoc> | Technologie | Version | Zweck |
heredoc> |---|---|---|
heredoc> | Node.js + Express | 4.18 | HTTP-Server (Port 3001) |
heredoc> | TypeScript | 5.3 | Typsicherheit |
heredoc> | ts-node-dev | 2.x | Hot-Reload in Entwicklung |
heredoc> | Drizzle ORM | 0.45.1 | Typsicherer Datenbankzugriff |
heredoc> | drizzle-kit | 0.31.9 | Schema-Migrationen (push-basiert) |
heredoc> | postgres | 3.4 | PostgreSQL-Treiber (raw, pooled) |
heredoc> | `@supabase/supabase-js` | 2.x | Auth-Token-Validierung + Vector-RPC-Calls |
heredoc> 
heredoc> ### Datenbank & Infrastruktur
heredoc> 
heredoc> | Technologie | Zweck |
heredoc> |---|---|
heredoc> | **Supabase (PostgreSQL)** | Primäre Datenbank, Auth, Row Level Security |
heredoc> | **pgvector** | 1536-dim. Embedding-Vektoren in `knowledge_cards.embedding` |
heredoc> | **Supabase Auth** | JWT-basierte Authentifizierung |
heredoc> | **Supabase Storage** | Dokument-Uploads (PDF, DOCX) |
heredoc> 
heredoc> ### Externe AI-Services
heredoc> 
heredoc> | Service | Zweck |
heredoc> |---|---|
heredoc> | **ElevenLabs Conversational AI** | Voice-to-Voice KI-Interviewer (Agent `agent_8901kkq04wage
fmr6qtbvw8ab0z2`) |
heredoc> | **Hugging Face Inference API** | LLM für Knowledge-Extraction (Extractor-Prompt) + RAG-Chatb
ot-Antworten |
heredoc> | **Hugging Face Embeddings** | `sentence-transformers` → 1536-dim. Vektoren für semantische S
uche |
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## Systemarchitektur
heredoc> 
heredoc> ```
heredoc> ┌─────────────────────────────────────────────────────────────────┐
heredoc> │  BROWSER  (React SPA, Port 8080)                                │
heredoc> │                                                                 │
heredoc> │  Landing / Marketing   App (auth-protected)                     │
heredoc> │  ├── /                 ├── /app/dashboard                       │
heredoc> │  ├── /pricing          ├── /app/employees                       │
heredoc> │  ├── /blog             ├── /app/sessions                        │
heredoc> │  └── /register         ├── /app/sessions/:id/interview  ←────┐  │
heredoc> │                        ├── /app/sessions/:id/review           │  │
heredoc> │                        ├── /app/knowledge                     │  │
heredoc> │                        └── /app/analytics                     │  │
heredoc> └──────────────────────────────────┬──────────────────────────┬─┘  │
heredoc>                                    │ REST API                 │    │
heredoc>                                    ▼                          │    │
heredoc> ┌──────────────────────────────────────────────────────┐      │    │
heredoc> │  BACKEND  (Express, Port 3001)                       │      │    │
heredoc> │                                                      │      │    │
heredoc> │  requireAuth (Supabase JWT)                          │      │    │
heredoc> │       │                                              │      │    │
heredoc> │  ┌────▼──────────────────────────────────────────┐   │      │    │
heredoc> │  │  API-Router                                   │   │      │    │
heredoc> │  │  /api/auth        /api/employees              │   │      │    │
heredoc> │  │  /api/sessions    /api/knowledge              │   │      │    │
heredoc> │  │  /api/analytics   /api/chat                   │   │      │    │
heredoc> │  │  /api/reports     /api/activity               │   │      │    │
heredoc> │  └────────────────────┬──────────────────────────┘   │      │    │
heredoc> │                       │                              │      │    │
heredoc> │  ┌────────────────────▼──────────────────────────┐   │      │    │
heredoc> │  │  Services                                     │   │      │    │
heredoc> │  │  extraction.service  → HuggingFace LLM        │   │      │    │
heredoc> │  │  embedding.service   → HuggingFace Embeddings │   │      │    │
heredoc> │  │  chat.service        → HuggingFace + pgvector │   │      │    │
heredoc> │  │  elevenlabs.service  → ElevenLabs REST API    │   │      │    │
heredoc> │  └────────────────────┬──────────────────────────┘   │      │    │
heredoc> │                       │                              │      │    │
heredoc> │  ┌────────────────────▼──────────────────────────┐   │      │    │
heredoc> │  │  Drizzle ORM   ←──── schema.ts (source of     │   │      │    │
heredoc> │  │  postgres driver         truth für DB)        │   │      │    │
heredoc> └──┼────────────────────┼──────────────────────────┘   │      │    │
heredoc>    │                    │                              │      │    │
heredoc>    ▼                    ▼                              │      │    │
heredoc> ┌──────────────────┐  ┌────────────────────────────┐  │      │    │
heredoc> │  Supabase Auth   │  │  Supabase PostgreSQL        │  │      │    │
heredoc> │  (JWT-Validier.) │  │  + pgvector Extension       │  │      │    │
heredoc> │                  │  │  + RLS (service_role)        │  │      │    │
heredoc> └──────────────────┘  └────────────────────────────┘  │      │    │
heredoc>                                                        │      │    │
heredoc> ┌──────────────────────────────────────────────────────┘      │    │
heredoc> │  ElevenLabs  (extern)                                        │    │
heredoc> │  ├── GET /v1/convai/conversation/get-signed-url              │    │
heredoc> │  │        ↑ aufgerufen von /api/sessions/:id/token           │    │
heredoc> │  │                                                           │    │
heredoc> │  └── WebSocket/WebRTC Widget  ←───────────────────────────────────┘
heredoc> │       voice ↔ voice, direkt Browser ↔ ElevenLabs
heredoc> └──────────────────────────────────────────────────────────────┘
heredoc> ```
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## Datenmodell
heredoc> 
heredoc> 13 Tabellen, alle in `backend/src/db/schema.ts` definiert. Drizzle ist **Single Source of Trut
h**.
heredoc> 
heredoc> ```
heredoc> workspaces          (id, name, company_name, domain, industry)
heredoc>     │
heredoc>     ├── users       (id=supabase_auth_id, email, full_name, role, workspace_id)
heredoc>     │
heredoc>     ├── employees   (id, workspace_id, name, role, department, exit_date,
heredoc>     │                session_status, transcript_status, coverage_score, risk_level)
heredoc>     │
heredoc>     ├── sessions    (id, workspace_id, employee_id, status, transcript,
heredoc>     │                elevenlabs_conversation_id, report_html_path, ...)
heredoc>     │   │
heredoc>     │   ├── transcript_segments  (id, session_id, timestamp, speaker, text, order_index)
heredoc>     │   │
heredoc>     │   └── knowledge_cards      (id, session_id, employee_id, topic, content,
heredoc>     │                             category, tags[], importance, confidence,
heredoc>     │                             embedding vector(1536),  ← pgvector
heredoc>     │                             document_id, source)
heredoc>     │
heredoc>     ├── documents   (id, workspace_id, uploaded_by, filename, mime_type,
heredoc>     │                storage_path, category, status)
heredoc>     │
heredoc>     ├── knowledge_categories  (id, workspace_id, name, icon, status)
heredoc>     ├── reports               (id, workspace_id, session_id, employee_id, title, content)
heredoc>     ├── chat_messages         (id, session_id, role, content, sources[])
heredoc>     ├── activities            (id, workspace_id, type, message)
heredoc>     ├── api_keys              (id, workspace_id, ...)
heredoc>     └── workspace_settings    (id, workspace_id, ...)
heredoc> ```
heredoc> 
heredoc> ### Rollen-Hierarchie (users.role)
heredoc> 
heredoc> ```
heredoc> admin      → Plattform-Admin (Luigi-intern)
heredoc> owner      → Workspace-Ersteller (Unternehmens-Owner)
heredoc> member     → regulärer Mitarbeiter
heredoc> reviewer   → kann Transkripte freigeben
heredoc> viewer     → read-only
heredoc> ```
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## Backend — API-Routen
heredoc> 
heredoc> Alle Routen unter `/api/` sind durch `requireAuth` geschützt (einzige Ausnahme: `POST /api/aut
h/register`, `POST /api/auth/login`).
heredoc> 
heredoc> ### Auth (`/api/auth`)
heredoc> | Method | Pfad | Beschreibung |
heredoc> |---|---|---|
heredoc> | POST | `/register` | Supabase Auth User erstellen + Workspace anlegen oder beitreten (domain
-matching) |
heredoc> | POST | `/login` | Supabase signInWithPassword → JWT zurück |
heredoc> | GET | `/me` | Aktueller User + Workspace |
heredoc> 
heredoc> ### Sessions (`/api/sessions`)
heredoc> | Method | Pfad | Beschreibung |
heredoc> |---|---|---|
heredoc> | GET | `/` | Alle Sessions des Workspaces (mit Employee-Join) |
heredoc> | POST | `/` | Neue Session erstellen (mit oder ohne employeeId) |
heredoc> | GET | `/:id` | Session-Detail |
heredoc> | POST | `/:id/start` | Status → `in_progress`, Employee-Status aktualisieren |
heredoc> | GET | `/:id/token` | **Signed URL von ElevenLabs API** holen (xi-api-key server-seitig) |
heredoc> | POST | `/:id/end` | Session beenden, AI-Processing triggern |
heredoc> | GET | `/:id/transcript` | Transkript + Segmente abrufen |
heredoc> | PUT | `/:id/transcript/approve` | Transkript freigeben |
heredoc> | GET | `/:id/processing` | Processing-Status polling |
heredoc> | GET | `/:id/classification` | Knowledge-Cards der Session |
heredoc> 
heredoc> ### Knowledge (`/api/knowledge`)
heredoc> | Method | Pfad | Beschreibung |
heredoc> |---|---|---|
heredoc> | GET | `/categories` | Alle Knowledge-Kategorien |
heredoc> | GET | `/cards` | Alle Knowledge-Cards (filterbar) |
heredoc> | POST | `/cards` | Knowledge-Card manuell erstellen |
heredoc> | GET | `/search` | Semantische Suche via Supabase pgvector RPC |
heredoc> 
heredoc> ### Weitere
heredoc> | Route | Beschreibung |
heredoc> |---|---|
heredoc> | `/api/analytics/coverage` | Department-Coverage-Metriken |
heredoc> | `/api/analytics/gaps` | Mitarbeiter mit geringer Coverage + Risk-Level |
heredoc> | `/api/analytics/summary` | Dashboard-KPIs |
heredoc> | `/api/chat/ask` | RAG-Chatbot: Frage → Embedding → pgvector → LLM |
heredoc> | `/api/chat/history/:sessionId` | Chat-Verlauf |
heredoc> | `/api/reports` | Report-CRUD |
heredoc> | `/api/employees` | Employee-CRUD |
heredoc> | `/api/activity` | Activity-Feed |
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## AI-Pipeline
heredoc> 
heredoc> ### 1. Interview-Phase (ElevenLabs)
heredoc> 
heredoc> ```
heredoc> User öffnet /app/sessions/:id/interview
heredoc>   │
heredoc>   ├─ Frontend: api.startSession(id)  →  POST /api/sessions/:id/start
heredoc>   │                                      (Status → in_progress)
heredoc>   │
heredoc>   ├─ Frontend: api.getSessionToken(id) →  GET /api/sessions/:id/token
heredoc>   │   Backend: GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url
heredoc>   │            Header: xi-api-key (server-seitig, nie im Browser)
heredoc>   │            → signed_url zurück
heredoc>   │
heredoc>   └─ Frontend: useConversation().startSession({ signedUrl })
heredoc>                WebSocket/WebRTC Verbindung zu ElevenLabs
heredoc>                Voice-to-Voice läuft direkt Browser ↔ ElevenLabs
heredoc> ```
heredoc> 
heredoc> ### 2. Post-Interview-Processing
heredoc> 
heredoc> ```
heredoc> User klickt "End & Process"
heredoc>   │
heredoc>   └─ POST /api/sessions/:id/end  { transcript, duration }
heredoc>       │
heredoc>       ├─ elevenlabs.getLatestConversationId(agentId)
heredoc>       │   → ElevenLabs REST: GET /v1/convai/conversations
heredoc>       │
heredoc>       ├─ elevenlabs.getConversationTranscript(conversationId)
heredoc>       │   → ElevenLabs REST: GET /v1/convai/conversations/:id
heredoc>       │
heredoc>       └─ extraction.extractKnowledge(sessionId, employeeId, transcript)
heredoc>           │
heredoc>           ├─ HuggingFace LLM (createHfChatCompletion)
heredoc>           │   Prompt: EXTRACTOR_PROMPT  →  JSON { cards: [...] }
heredoc>           │   Extrahiert: topic, content, tags[], importance, confidence
heredoc>           │
heredoc>           ├─ Transkript in transcript_segments parsen
heredoc>           │   Format: [HH:MM:SS] AI/Employee: Text
heredoc>           │
heredoc>           └─ Für jede Knowledge-Card:
heredoc>                embedding.createEmbedding(topic + content)
heredoc>                → HuggingFace sentence-transformers
heredoc>                → vector(1536)
heredoc>                → INSERT INTO knowledge_cards
heredoc> ```
heredoc> 
heredoc> ### 3. RAG-Chatbot
heredoc> 
heredoc> ```
heredoc> User stellt Frage in /app/knowledge (Chatbot)
heredoc>   │
heredoc>   └─ POST /api/chat/ask  { question }
heredoc>       │
heredoc>       ├─ embedding.createEmbedding(question)  →  vector(1536)
heredoc>       │
heredoc>       ├─ supabase.rpc('search_knowledge', {
heredoc>       │     query_embedding, match_threshold: 0.65, match_count: 5
heredoc>       │   })
heredoc>       │   → pgvector: cosine similarity gegen alle knowledge_cards.embedding
heredoc>       │   → gibt top-5 ähnlichste Cards zurück (mit expert_name, department)
heredoc>       │
heredoc>       └─ HuggingFace LLM (createHfChatCompletion)
heredoc>             System: buildChatbotPrompt(context)
heredoc>             User: question
heredoc>             → Antwort mit Quellen-Referenzen
heredoc> ```
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## ElevenLabs-Integration
heredoc> 
heredoc> ### Agent-Konfiguration
heredoc> 
heredoc> - **Agent ID:** `agent_8901kkq04wagefmr6qtbvw8ab0z2`
heredoc> - **Widget Script:** `https://unpkg.com/@elevenlabs/convai-widget-embed`
heredoc> - **System Prompt:** `backend/src/prompts/interviewer.ts`
heredoc> 
heredoc> Der Interviewer-Prompt unterstützt dynamische Variablen via Template-Replacement:
heredoc> ```
heredoc> {{name}}      → Mitarbeitername aus der Session
heredoc> {{fachgebiet}} → Rolle/Spezialisierung des Mitarbeiters
heredoc> ```
heredoc> 
heredoc> ### Signed URL Flow (Sicherheit)
heredoc> 
heredoc> Der ElevenLabs API-Key wird **niemals** an den Browser weitergegeben. Das Backend holt die Sig
ned URL und gibt nur diese temporäre URL zurück:
heredoc> 
heredoc> ```
heredoc> Frontend  →  GET /api/sessions/:id/token  →  Backend
heredoc> Backend   →  GET api.elevenlabs.io/v1/convai/conversation/get-signed-url
heredoc>              (xi-api-key im Server-Header)
heredoc> Backend   →  { signed_url: "wss://..." }  →  Frontend
heredoc> Frontend  →  useConversation().startSession({ signedUrl })
heredoc> ```
heredoc> 
heredoc> ### Dynamischer Prompt-Override (ausstehend)
heredoc> 
heredoc> Voraussetzung: Im ElevenLabs Dashboard "Allow prompt overrides" aktivieren.
heredoc> 
heredoc> ```ts
heredoc> const conversation = useConversation({
heredoc>   overrides: {
heredoc>     agent: {
heredoc>       prompt: { prompt: buildInterviewerPrompt(employeeName, employeeRole) },
heredoc>       firstMessage: buildFirstMessage(employeeName, employeeRole),
heredoc>       language: 'de',
heredoc>     }
heredoc>   }
heredoc> });
heredoc> ```
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## Authentifizierung & Rollen
heredoc> 
heredoc> ```
heredoc> POST /api/auth/register
heredoc>   │
heredoc>   ├─ supabase.auth.admin.createUser()  →  Supabase Auth User
heredoc>   │
heredoc>   ├─ Domain-Matching:
heredoc>   │   email == *@acme.com  +  Workspace mit domain='acme.com' existiert?
heredoc>   │   JA  → Workspace beitreten (role: 'member')
heredoc>   │   NEIN → neuen Workspace erstellen (role: 'owner')
heredoc>   │
heredoc>   └─ db.insert(users)  { id = supabase_auth_id, workspaceId, role }
heredoc> 
heredoc> 
heredoc> Jeder API-Request:
heredoc>   Authorization: Bearer <supabase_jwt>
heredoc>     │
heredoc>     └─ requireAuth middleware:
heredoc>         supabase.auth.getUser(token)
heredoc>         → req.userId = user.id
heredoc>         → alle Queries werden automatisch workspace-gefiltert
heredoc> ```
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## Datenbankschema & Migrations-Workflow
heredoc> 
heredoc> Das Schema in `backend/src/db/schema.ts` ist der einzige Stand der Wahrheit.
heredoc> 
heredoc> ```bash
heredoc> # Schema-Änderung deployen:
heredoc> cd backend
heredoc> npm run db:push
heredoc> # = npx drizzle-kit push --force && npx tsx src/db/enable-rls.ts
heredoc> 
heredoc> # Nur RLS neu aktivieren (nach manuellem DB-Eingriff):
heredoc> npm run db:rls
heredoc> ```
heredoc> 
heredoc> **Warum `enable-rls.ts`?**  
heredoc> `drizzle-kit push` setzt RLS bei jedem Push zurück. Das Script `src/db/enable-rls.ts` wird des
halb automatisch danach ausgeführt und:
heredoc> - Aktiviert RLS auf allen 13 Tabellen
heredoc> - Erstellt `service_role` + `postgres` Full-Access-Policies
heredoc> - Erstellt 5 Indizes (workspace_id, status, document_id etc.)
heredoc> - Erstellt die pgvector-Suchfunktionen `search_knowledge` und `search_knowledge_by_category`
heredoc> 
heredoc> ### pgvector-Suchfunktionen
heredoc> 
heredoc> ```sql
heredoc> -- Globale semantische Suche:
heredoc> search_knowledge(query_embedding vector, match_threshold float, match_count int)
heredoc>   → id, topic, content, importance, similarity, expert_name, expert_department
heredoc> 
heredoc> -- Kategorie-gefilterte Suche:
heredoc> search_knowledge_by_category(query_embedding vector, category_filter text,
heredoc>                               match_threshold float, match_count int)
heredoc> ```
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## Frontend-Struktur
heredoc> 
heredoc> ```
heredoc> frontend/src/
heredoc> ├── main.tsx                  # App-Einstiegspunkt
heredoc> ├── App.tsx                   # Router-Setup (public + app/*)
heredoc> ├── lib/
heredoc> │   ├── api.ts                # Zentraler API-Client (alle fetch-Calls, Auth-Header)
heredoc> │   └── utils.ts              # cn() + Hilfsfunktionen
heredoc> ├── hooks/
heredoc> │   ├── useAuth.tsx           # Auth-State (Login, Register, User-Objekt)
heredoc> │   ├── useApi.ts             # TanStack Query Wrapper
heredoc> │   └── use-toast.ts          # Toast-Notifications
heredoc> ├── pages/
heredoc> │   ├── Landing.tsx           # Marketing-Landing-Page (interaktive Transcript-Demo, Carousel)

heredoc> │   ├── Dashboard.tsx         # App-Dashboard (aktuelle Sessions, Employees)
heredoc> │   ├── Employees.tsx         # Mitarbeiterliste
heredoc> │   ├── EmployeeDetail.tsx    # Mitarbeiter-Detail mit Sessions
heredoc> │   ├── Sessions.tsx          # Alle Interview-Sessions
heredoc> │   ├── SessionDetail.tsx     # Session-Detail (Start, Review, Classification)
heredoc> │   ├── Interview.tsx         # Live-Interview (ElevenLabs Widget)
heredoc> │   ├── ProcessingStatus.tsx  # Post-Interview AI-Processing-Status
heredoc> │   ├── TranscriptReview.tsx  # Transkript reviewen + freigeben
heredoc> │   ├── KnowledgeBase.tsx     # Knowledge-Cards + RAG-Chatbot
heredoc> │   ├── Analytics.tsx         # Coverage, Gaps, KPIs
heredoc> │   ├── Reports.tsx           # Report-Übersicht
heredoc> │   └── Settings.tsx          # Workspace-Einstellungen
heredoc> ├── components/
heredoc> │   ├── layout/
heredoc> │   │   ├── AppLayout.tsx     # App-Shell (Sidebar + TopNav)
heredoc> │   │   ├── AppSidebar.tsx    # Navigations-Sidebar
heredoc> │   │   └── TopNav.tsx        # Obere Leiste
heredoc> │   ├── common/
heredoc> │   │   ├── StatCard.tsx      # KPI-Karte
heredoc> │   │   └── StatusBadge.tsx   # Status-Badge (session_status, risk_level etc.)
heredoc> │   ├── shared/
heredoc> │   │   └── CostSimulation.tsx  # Interaktiver Kostenvergleich (Landing)
heredoc> │   └── ui/                   # shadcn/ui Komponenten (button, card, dialog, ...)
heredoc> └── data/
heredoc>     └── mockData.ts           # Demo-Mode Daten
heredoc> ```
heredoc> 
heredoc> ### Design-System
heredoc> 
heredoc> - **Schärfe:** Keine `rounded-*` Klassen in App-Seiten — kompromisslos eckig
heredoc> - **Typografie:** `text-[13px]` für Body, `font-medium` / `font-semibold`
heredoc> - **Avatare:** `w-7 h-7 bg-foreground text-background` — invertierte quadratische Initialen
heredoc> - **Farbschema:** Monochrom Schwarz/Weiß mit `border-border` — editorial, kein Buntes
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## Umgebungsvariablen
heredoc> 
heredoc> ### Backend (`backend/.env`)
heredoc> 
heredoc> ```env
heredoc> # Supabase Pooler (IPv4, Session Mode)
heredoc> DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-1-eu-central-1.pooler.supabase.com:543
2/postgres
heredoc> 
heredoc> # Supabase JS Client (für Auth + Vector-RPC)
heredoc> SUPABASE_URL=https://[ref].supabase.co
heredoc> SUPABASE_SERVICE_KEY=eyJ...
heredoc> 
heredoc> # ElevenLabs
heredoc> ELEVENLABS_API_KEY=...
heredoc> ELEVENLABS_AGENT_ID=agent_8901kkq04wagefmr6qtbvw8ab0z2
heredoc> 
heredoc> # HuggingFace (LLM + Embeddings)
heredoc> HUGGINGFACE_API_TOKEN=hf_...
heredoc> 
heredoc> # Server
heredoc> PORT=3001
heredoc> FRONTEND_URL=http://localhost:8080
heredoc> ```
heredoc> 
heredoc> ### Frontend
heredoc> 
heredoc> Kein `.env` nötig — der API-Endpunkt ist in `src/lib/api.ts` auf `http://localhost:3001` hardc
odiert (Dev). Für Production: `VITE_API_URL` via Vite.
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## Entwicklung starten
heredoc> 
heredoc> ### Voraussetzungen
heredoc> 
heredoc> - Node.js 20+
heredoc> - Supabase-Projekt mit pgvector-Extension
heredoc> - ElevenLabs-Account mit konfiguriertem Agent
heredoc> - HuggingFace API Token
heredoc> 
heredoc> ### Backend
heredoc> 
heredoc> ```bash
heredoc> cd backend
heredoc> npm install
heredoc> cp .env.example .env   # Variablen eintragen
heredoc> npm run dev            # Port 3001, hot-reload via ts-node-dev
heredoc> ```
heredoc> 
heredoc> ### Frontend
heredoc> 
heredoc> ```bash
heredoc> cd frontend
heredoc> npm install
heredoc> npm run dev            # Port 8080
heredoc> ```
heredoc> 
heredoc> ### Datenbank initialisieren
heredoc> 
heredoc> ```bash
heredoc> cd backend
heredoc> npm run db:push        # Schema pushen + RLS aktivieren
heredoc> ```
heredoc> 
heredoc> ### Scripts
heredoc> 
heredoc> | Befehl | Beschreibung |
heredoc> |---|---|
heredoc> | `npm run dev` | Development-Server starten |
heredoc> | `npm run build` | TypeScript kompilieren |
heredoc> | `npm run db:push` | Schema nach Supabase pushen + RLS aktivieren |
heredoc> | `npm run db:rls` | Nur RLS + Policies + Suchfunktionen neu erstellen |
heredoc> 
heredoc> ---
heredoc> 
heredoc> ## Wichtige Architekturentscheidungen
heredoc> 
heredoc> | Entscheidung | Begründung |
heredoc> |---|---|
heredoc> | Drizzle ORM statt Prisma | Direkter SQL-Zugriff, besser für pgvector custom types, kein Sche
ma-Drift |
heredoc> | Zwei DB-Clients (postgres + supabase-js) | `postgres`-Treiber für alle CRUD-Ops; `supabase-j
s` exklusiv für `auth.getUser()` + pgvector-RPCs |
heredoc> | Backend als Auth-Proxy für ElevenLabs | API-Key nie im Browser — signed URL server-seitig ge
holt |
heredoc> | RLS mit service_role | Backend nutzt `service_role`, umgeht RLS bewusst — RLS ist Sicherheit
snetz für direkte DB-Zugriffe |
heredoc> | Push-Migrationen statt Generate | Hackathon-tempo — `drizzle-kit push --force` direkt gegen 
Supabase, kein Migration-File-Management |
heredoc> 
heredoc> ---
heredoc> 
heredoc> **Repository:** [github.com/Luraxx/legacy_ai_vault](https://github.com/Luraxx/legacy_ai_vault)

heredoc> ENDOFFILE
