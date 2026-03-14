# 🏗️ Legacy AI Vault — Architektur & Umsetzungsplan

---

## 1. Systemübersicht

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BENUTZER                                    │
│                                                                     │
│   👨‍🔧 Experte                              👩‍💻 Neuer Mitarbeiter      │
│   (gibt Wissen weiter)                   (ruft Wissen ab)          │
└──────┬──────────────────────────────────────────┬───────────────────┘
       │                                          │
       ▼                                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Lovable / React)                       │
│                                                                      │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │  📋 Interview    │  │  🗂️ Knowledge    │  │  💬 Wissens-       │  │
│  │     Station      │  │     Vault        │  │     Chatbot        │  │
│  │                  │  │                  │  │                    │  │
│  │ • Fachgebiet     │  │ • Card-Übersicht │  │ • Frage eingeben   │  │
│  │   auswählen      │  │ • Filter & Suche │  │ • Voice oder Text  │  │
│  │ • Voice starten  │  │ • Experten-      │  │ • Quellen-         │  │
│  │ • Live-Cards     │  │   Profile        │  │   Verweis          │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────────┬──────────┘ │
└───────────┼─────────────────────┼───────────────────────┼────────────┘
            │                     │                       │
            ▼                     ▼                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    API-LAYER (Express / Next.js API Routes)          │
│                                                                      │
│  POST /interview/start     GET /knowledge/cards    POST /chat/ask   │
│  POST /interview/end       GET /knowledge/search   GET /chat/history│
│  WS   /interview/stream    GET /experts            POST /chat/voice │
└───────────┬─────────────────────┬───────────────────────┬────────────┘
            │                     │                       │
     ┌──────▼──────┐       ┌─────▼──────┐         ┌──────▼──────┐
     │ ELEVENLABS  │       │  SUPABASE  │         │   LLM API   │
     │ Convers. AI │       │            │         │  (OpenAI /   │
     │             │       │ • Postgres │         │   Claude)    │
     │ • Voice I/O │       │ • pgvector │         │             │
     │ • System    │       │ • Auth     │         │ • RAG-Query │
     │   Prompt    │       │ • Storage  │         │ • Extraction│
     │ • Rückfragen│       │            │         │             │
     └─────────────┘       └────────────┘         └─────────────┘
```

---

## 2. Komponenten im Detail

### 2.1 Frontend — Lovable (React/TypeScript)

Drei Hauptseiten, eine App:

```
src/
├── pages/
│   ├── InterviewPage.tsx        # Interview-Station
│   ├── VaultPage.tsx            # Knowledge Vault Dashboard
│   └── ChatPage.tsx             # Wissens-Chatbot
├── components/
│   ├── interview/
│   │   ├── StartForm.tsx        # Name, Abteilung, Fachgebiet
│   │   ├── VoiceRecorder.tsx    # ElevenLabs Widget einbetten
│   │   ├── Waveform.tsx         # Audio-Visualisierung
│   │   ├── LiveTranscript.tsx   # Echtzeit-Transkript
│   │   └── LiveCards.tsx        # Cards erscheinen während Interview
│   ├── vault/
│   │   ├── KnowledgeCard.tsx    # Einzelne Wissens-Karte
│   │   ├── CardGrid.tsx         # Karten-Raster mit Filter
│   │   ├── ExpertProfile.tsx    # Profil eines Experten
│   │   └── SearchBar.tsx        # Volltextsuche + Tag-Filter
│   ├── chat/
│   │   ├── ChatWindow.tsx       # Chat-Interface
│   │   ├── MessageBubble.tsx    # Einzelne Nachricht
│   │   └── SourceReference.tsx  # "Quelle: Hr. Müller, Interview vom..."
│   └── shared/
│       ├── Navigation.tsx       # Sidebar / Top-Nav
│       ├── AudioPlayer.tsx      # Ausschnitte abspielen
│       └── TagBadge.tsx         # Farbige Tags
├── hooks/
│   ├── useElevenLabs.ts         # ElevenLabs Conversational AI SDK
│   ├── useSupabase.ts           # Supabase Client
│   └── useChat.ts               # Chat-Logik mit Streaming
├── lib/
│   ├── supabase.ts              # Supabase Client Init
│   ├── api.ts                   # API-Calls ans Backend
│   └── types.ts                 # TypeScript Interfaces
└── App.tsx
```

### 2.2 Backend — Cursor (Node.js / TypeScript)

```
backend/
├── src/
│   ├── server.ts                    # Express Server Entry
│   ├── routes/
│   │   ├── interview.routes.ts      # Interview Start/Stop/Stream
│   │   ├── knowledge.routes.ts      # Knowledge Cards CRUD
│   │   └── chat.routes.ts           # Chatbot Endpoint
│   ├── services/
│   │   ├── elevenlabs.service.ts    # ElevenLabs API Wrapper
│   │   ├── extraction.service.ts    # Transkript → Knowledge Cards
│   │   ├── embedding.service.ts     # Text → Vektor-Embeddings
│   │   └── chat.service.ts          # RAG: Suche + Antwort-Generierung
│   ├── prompts/
│   │   ├── interviewer.ts           # System-Prompt für den Interviewer
│   │   ├── extractor.ts             # Prompt: "Extrahiere Wissen aus..."
│   │   └── chatbot.ts               # Prompt: "Beantworte basierend auf..."
│   ├── db/
│   │   ├── supabase.ts              # Supabase Client
│   │   └── migrations/
│   │       └── 001_init.sql         # Tabellen + pgvector
│   └── utils/
│       ├── chunker.ts               # Text in Chunks aufteilen
│       └── logger.ts                # Logging
├── package.json
└── tsconfig.json
```

### 2.3 ElevenLabs — Conversational AI Agent

Kein eigener Code nötig — Konfiguration im ElevenLabs Dashboard:

```yaml
Agent: "Knowledge Interviewer"
Voice: "Rachel" (oder deutsche Stimme)
Language: Deutsch

System Prompt: |
  Du bist ein erfahrener Wissensmanagement-Interviewer.
  Dein Ziel: Implizites Fachwissen eines Experten extrahieren.

  REGELN:
  - Stelle offene Fragen ("Erzähl mir von...")
  - Bohre nach bei vagen Antworten ("Was genau passiert dann?")
  - Frage nach Ausnahmen ("Und was wenn das NICHT funktioniert?")
  - Frage nach Erfahrungswissen ("Gab es mal eine Situation wo...")
  - Fasse zusammen und lass bestätigen ("Also du meinst, dass...")
  - Bleib beim Fachgebiet: {{fachgebiet}}
  - Sprich den Experten mit Namen an: {{name}}
  - Halte Antworten kurz (2-3 Sätze), damit der Experte redet

  ABLAUF:
  1. Begrüßung + kurze Erklärung was passiert
  2. Einstiegsfrage zum Fachgebiet
  3. 5-8 Vertiefungsfragen mit Rückfragen
  4. Zusammenfassung + "Gibt es noch etwas Wichtiges?"
  5. Verabschiedung + Dank

First Message: |
  Hallo {{name}}! Schön, dass du dir die Zeit nimmst.
  Ich würde gerne mehr über dein Wissen im Bereich {{fachgebiet}} erfahren.
  Erzähl mir doch mal, was die wichtigsten Dinge sind, die ein Neuer
  in deinem Bereich wissen sollte?
```

### 2.4 Datenbank — Supabase (PostgreSQL + pgvector)

```sql
-- Aktiviere Vektor-Erweiterung
CREATE EXTENSION IF NOT EXISTS vector;

-- Experten-Profile
CREATE TABLE experts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    specialization TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interviews
CREATE TABLE interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID REFERENCES experts(id),
    transcript TEXT,
    summary TEXT,
    duration_seconds INTEGER,
    status TEXT DEFAULT 'in_progress',  -- in_progress | processing | completed
    elevenlabs_conversation_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Cards (das Herzstück)
CREATE TABLE knowledge_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id),
    expert_id UUID REFERENCES experts(id),
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    importance TEXT DEFAULT 'normal',  -- low | normal | high | critical
    embedding VECTOR(1536),           -- OpenAI ada-002 Embeddings
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat-Verlauf
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID,
    role TEXT NOT NULL,               -- user | assistant
    content TEXT NOT NULL,
    sources UUID[] DEFAULT '{}',      -- Referenzen auf knowledge_cards
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    expert_name TEXT,
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
        e.name AS expert_name,
        1 - (kc.embedding <=> query_embedding) AS similarity
    FROM knowledge_cards kc
    JOIN experts e ON kc.expert_id = e.id
    WHERE 1 - (kc.embedding <=> query_embedding) > match_threshold
    ORDER BY kc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Index für schnelle Vektor-Suche
CREATE INDEX ON knowledge_cards
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## 3. Datenflüsse

### 3.1 Interview-Flow (Wissen aufnehmen)

```
Experte                Frontend              Backend              ElevenLabs          Supabase
  │                       │                     │                     │                  │
  │  Klickt "Start"       │                     │                     │                  │
  │──────────────────────▶│                     │                     │                  │
  │                       │  POST /interview    │                     │                  │
  │                       │  {name, fachgebiet} │                     │                  │
  │                       │────────────────────▶│                     │                  │
  │                       │                     │  Create Conversation│                  │
  │                       │                     │────────────────────▶│                  │
  │                       │                     │  INSERT expert +    │                  │
  │                       │                     │  interview          │                  │
  │                       │                     │─────────────────────────────────────── ▶│
  │                       │                     │                     │                  │
  │                       │  WebSocket: Audio Stream                  │                  │
  │  ◄─────────────────── │ ◄────────────────────────────────────────▶│                  │
  │  Spricht mit KI       │                     │                     │                  │
  │  (5-15 Minuten)       │                     │                     │                  │
  │                       │                     │                     │                  │
  │  Klickt "Fertig"      │                     │                     │                  │
  │──────────────────────▶│  POST /interview/end│                     │                  │
  │                       │────────────────────▶│                     │                  │
  │                       │                     │  GET transcript     │                  │
  │                       │                     │────────────────────▶│                  │
  │                       │                     │                     │                  │
  │                       │                     │  LLM: Extrahiere    │                  │
  │                       │                     │  Knowledge Cards    │                  │
  │                       │                     │──────┐              │                  │
  │                       │                     │      │ processing   │                  │
  │                       │                     │◄─────┘              │                  │
  │                       │                     │                     │                  │
  │                       │                     │  INSERT cards +     │                  │
  │                       │                     │  embeddings         │                  │
  │                       │                     │─────────────────────────────────────── ▶│
  │                       │  Knowledge Cards    │                     │                  │
  │                       │◄────────────────────│                     │                  │
  │  Sieht seine Cards    │                     │                     │                  │
  │◄──────────────────────│                     │                     │                  │
```

### 3.2 Chat-Flow (Wissen abrufen)

```
Mitarbeiter           Frontend              Backend              LLM (OpenAI)        Supabase
  │                       │                     │                     │                  │
  │  "Was tun bei         │                     │                     │                  │
  │   Überhitzung?"       │                     │                     │                  │
  │──────────────────────▶│                     │                     │                  │
  │                       │  POST /chat/ask     │                     │                  │
  │                       │  {question}         │                     │                  │
  │                       │────────────────────▶│                     │                  │
  │                       │                     │  Embed question     │                  │
  │                       │                     │────────────────────▶│                  │
  │                       │                     │◄────────────────────│                  │
  │                       │                     │                     │                  │
  │                       │                     │  search_knowledge() │                  │
  │                       │                     │─────────────────────────────────────── ▶│
  │                       │                     │  Top 5 Cards        │                  │
  │                       │                     │◄──────────────────────────────────────  │
  │                       │                     │                     │                  │
  │                       │                     │  "Beantworte mit    │                  │
  │                       │                     │   diesen Quellen:"  │                  │
  │                       │                     │────────────────────▶│                  │
  │                       │                     │  Antwort + Quellen  │                  │
  │                       │                     │◄────────────────────│                  │
  │                       │                     │                     │                  │
  │                       │  {answer, sources}  │                     │                  │
  │                       │◄────────────────────│                     │                  │
  │  Sieht Antwort mit    │                     │                     │                  │
  │  Quellen-Verweis      │                     │                     │                  │
  │◄──────────────────────│                     │                     │                  │
```

---

## 4. Kern-Prompts

### 4.1 Knowledge Extractor Prompt

```typescript
// backend/src/prompts/extractor.ts

export const EXTRACTOR_PROMPT = `
Du bist ein Wissensmanagement-Experte. Du erhältst ein Transkript eines
Interviews mit einem Fachexperten.

Deine Aufgabe: Extrahiere strukturierte Knowledge Cards.

Für jede Karte liefere:
- topic: Kurzer Titel (max 10 Wörter)
- content: Das Wissen in 2-5 klaren Sätzen. Schreibe so, dass ein
  Neuling es versteht. Behalte spezifische Zahlen, Namen, Schritte bei.
- tags: 2-5 relevante Tags
- importance: "low" | "normal" | "high" | "critical"

REGELN:
- Ignoriere Smalltalk und Füllwörter
- Trenne verschiedene Themen in separate Cards
- Behalte konkrete Details (Zahlen, Schritte, Werkzeuge)
- Markiere Sicherheitsrelevantes als "critical"
- Schreibe auf Deutsch

Antworte als JSON-Array:
[
  {
    "topic": "...",
    "content": "...",
    "tags": ["...", "..."],
    "importance": "..."
  }
]
`;
```

### 4.2 Chatbot RAG Prompt

```typescript
// backend/src/prompts/chatbot.ts

export const CHATBOT_PROMPT = `
Du bist der Wissens-Chatbot des Legacy AI Vault.
Du beantwortest Fragen basierend auf dem gesammelten Expertenwissen.

KONTEXT (relevante Knowledge Cards):
{{knowledge_cards}}

REGELN:
- Antworte NUR basierend auf den gegebenen Knowledge Cards
- Wenn du es nicht weißt, sag: "Dazu habe ich leider kein Wissen im Vault."
- Nenne immer die Quelle: "Laut [Experte], ..."
- Verwende einfache, klare Sprache
- Bei sicherheitskritischen Themen: Weise darauf hin, dass ein Fachmann
  hinzugezogen werden sollte
- Antworte auf Deutsch
`;
```

---

## 5. API-Endpunkte

### Interview API

| Method | Endpoint | Body | Beschreibung |
|--------|----------|------|-------------|
| `POST` | `/api/interview/start` | `{ name, department, specialization }` | Startet Interview, erstellt Expert + Interview in DB, gibt ElevenLabs Conversation-ID zurück |
| `POST` | `/api/interview/end` | `{ interview_id }` | Beendet Interview, holt Transkript, startet Extraction |
| `GET` | `/api/interview/:id/status` | — | Status des Interviews (in_progress, processing, completed) |
| `GET` | `/api/interview/:id/cards` | — | Knowledge Cards eines Interviews |

### Knowledge API

| Method | Endpoint | Query Params | Beschreibung |
|--------|----------|-------------|-------------|
| `GET` | `/api/knowledge/cards` | `?department=&tag=&expert=` | Alle Cards mit Filtern |
| `GET` | `/api/knowledge/search` | `?q=suchbegriff` | Volltextsuche |
| `GET` | `/api/experts` | — | Liste aller Experten |
| `GET` | `/api/experts/:id` | — | Experten-Profil + seine Cards |

### Chat API

| Method | Endpoint | Body | Beschreibung |
|--------|----------|------|-------------|
| `POST` | `/api/chat/ask` | `{ question, session_id? }` | Frage stellen, bekommt Antwort + Quellen |
| `GET` | `/api/chat/history/:session_id` | — | Chat-Verlauf einer Session |

---

## 6. Schritt-für-Schritt Umsetzung

### 🔴 Sprint 1: Setup & Grundgerüst (Stunden 1–3)

```bash
# 1. Supabase Projekt erstellen auf supabase.com
#    → SQL Editor → Migration ausführen (siehe Abschnitt 2.4)

# 2. ElevenLabs Agent erstellen
#    → Conversational AI → New Agent
#    → System Prompt einfügen (siehe Abschnitt 2.3)
#    → Deutsche Stimme auswählen
#    → Agent-ID notieren

# 3. Backend aufsetzen
mkdir backend && cd backend
npm init -y
npm install express cors dotenv @supabase/supabase-js openai @11labs/client
npm install -D typescript @types/express @types/node ts-node nodemon

# 4. Environment Variables
cat > .env << 'EOF'
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_AGENT_ID=agent_...
HUGGINGFACE_API_TOKEN=hf_...
PORT=3001
EOF

# 5. Frontend mit Lovable generieren
#    Prompt an Lovable:
#    "Erstelle eine React App mit 3 Seiten: Interview Station,
#     Knowledge Vault, Chatbot. Nutze shadcn/ui, Tailwind, React Router.
#     Dunkles Farbschema mit Blau-Akzenten."
```

### 🟡 Sprint 2: Interview-Station (Stunden 4–8)

**Backend:**
```typescript
// Minimalbeispiel: backend/src/routes/interview.routes.ts

import { Router } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

router.post('/start', async (req, res) => {
    const { name, department, specialization } = req.body;

    // Experte anlegen
    const { data: expert } = await supabase
        .from('experts')
        .insert({ name, department, specialization })
        .select()
        .single();

    // Interview anlegen
    const { data: interview } = await supabase
        .from('interviews')
        .insert({ expert_id: expert.id, status: 'in_progress' })
        .select()
        .single();

    // ElevenLabs Agent Config (dynamische Variablen)
    const agentConfig = {
        agent_id: process.env.ELEVENLABS_AGENT_ID,
        dynamic_variables: {
            name: name,
            fachgebiet: specialization
        }
    };

    res.json({
        interview_id: interview.id,
        expert_id: expert.id,
        agent_config: agentConfig
    });
});

export default router;
```

**Frontend (Lovable Prompt):**
```
Erstelle eine Interview-Station Seite:
- Formular oben: Name (Text), Abteilung (Dropdown), Fachgebiet (Text)
- Großer runder "Wissen weitergeben" Button (grün, pulsierend)
- Wenn gestartet: Audio-Waveform Animation (einfache CSS Bars)
- Darunter: Live erscheinende Knowledge Cards (Skeleton → Card)
- "Interview beenden" Button (rot)
- Nutze shadcn/ui Cards und Buttons
```

### 🟢 Sprint 3: Knowledge Extraction (Stunden 9–13)

**Backend — Kern-Logik:**
```typescript
// backend/src/services/extraction.service.ts

import OpenAI from 'openai';
import { supabase } from '../db/supabase';
import { EXTRACTOR_PROMPT } from '../prompts/extractor';

const openai = new OpenAI();

export async function extractKnowledge(interviewId: string) {
    // 1. Transkript holen
    const { data: interview } = await supabase
        .from('interviews')
        .select('*, experts(*)')
        .eq('id', interviewId)
        .single();

    // 2. LLM: Transkript → Knowledge Cards
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',  // Günstig + gut genug
        messages: [
            { role: 'system', content: EXTRACTOR_PROMPT },
            { role: 'user', content: `Transkript:\n${interview.transcript}` }
        ],
        response_format: { type: 'json_object' }
    });

    const cards = JSON.parse(completion.choices[0].message.content);

    // 3. Embeddings erstellen + in DB speichern
    for (const card of cards) {
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: `${card.topic}: ${card.content}`
        });

        await supabase.from('knowledge_cards').insert({
            interview_id: interviewId,
            expert_id: interview.expert_id,
            topic: card.topic,
            content: card.content,
            tags: card.tags,
            importance: card.importance,
            embedding: embeddingResponse.data[0].embedding
        });
    }

    // 4. Interview als completed markieren
    await supabase
        .from('interviews')
        .update({ status: 'completed' })
        .eq('id', interviewId);
}
```

### 🔵 Sprint 4: Vault Dashboard (Stunden 14–16)

**Frontend (Lovable Prompt):**
```
Erstelle eine Knowledge Vault Seite:
- Oben: Suchleiste + Filter-Chips (Abteilung, Tags)
- Statistik-Leiste: "47 Knowledge Cards · 5 Experten · 3 Abteilungen"
- Karten-Grid (3 Spalten):
  Jede Karte hat: Thema (fett), Inhalt (2-3 Zeilen), Tags (farbige Badges),
  Experten-Name + Foto-Platzhalter, Wichtigkeit als farbiger Rand
  (grün=normal, orange=high, rot=critical)
- Klick auf Karte → Modal mit vollem Inhalt + Link zum Interview
- Linke Sidebar: Experten-Liste mit Anzahl Cards
```

### 🟣 Sprint 5: Chatbot (Stunden 17–19)

**Backend — RAG:**
```typescript
// backend/src/services/chat.service.ts

import OpenAI from 'openai';
import { supabase } from '../db/supabase';
import { CHATBOT_PROMPT } from '../prompts/chatbot';

const openai = new OpenAI();

export async function askQuestion(question: string, sessionId: string) {
    // 1. Frage → Embedding
    const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: question
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Ähnliche Knowledge Cards finden (Vektor-Suche)
    const { data: relevantCards } = await supabase.rpc('search_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5
    });

    // 3. Kontext zusammenbauen
    const context = relevantCards.map((card: any) =>
        `[Quelle: ${card.expert_name}]\nThema: ${card.topic}\n${card.content}`
    ).join('\n\n---\n\n');

    // 4. LLM antwortet mit Kontext
    const prompt = CHATBOT_PROMPT.replace('{{knowledge_cards}}', context);

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: question }
        ]
    });

    const answer = completion.choices[0].message.content;

    // 5. Chat-Nachricht speichern
    const sourceIds = relevantCards.map((c: any) => c.id);

    await supabase.from('chat_messages').insert([
        { session_id: sessionId, role: 'user', content: question },
        { session_id: sessionId, role: 'assistant', content: answer, sources: sourceIds }
    ]);

    return {
        answer,
        sources: relevantCards.map((c: any) => ({
            id: c.id,
            topic: c.topic,
            expert: c.expert_name,
            similarity: c.similarity
        }))
    };
}
```

### ⚡ Sprint 6: Polish & Demo (Stunde 20)

```
Checkliste:
□ Demo-Interview durchführen (3 Min, echtes Thema)
□ Prüfen: Cards erscheinen korrekt
□ Chatbot-Fragen testen
□ UI aufhübschen (Animationen, Loading States)
□ Fallback: Hardcoded Daten falls API ausfällt
□ Präsentation: 5 Folien max
□ "Wow"-Moment: Live-Interview vor der Jury (wenn genug Tokens)
```

---

## 7. Environment Variables

```bash
# .env (NICHT committen!)

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...          # Frontend
SUPABASE_SERVICE_KEY=eyJ...       # Backend (volle Rechte)

# ElevenLabs
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_AGENT_ID=agent_...

# Hugging Face (für Extraction + Embeddings + Chatbot)
HUGGINGFACE_API_TOKEN=hf_...

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
```

---

## 8. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| ElevenLabs Tokens leer | Hoch | Flash-Modelle nutzen. Für Demo: vorher aufgenommenes Audio abspielen |
| Interview-Qualität zu flach | Mittel | System-Prompt iterieren. Rückfrage-Logik verbessern |
| Vektor-Suche liefert falsches | Niedrig | Threshold anpassen. Mehr Cards = bessere Ergebnisse |
| Supabase Rate Limit | Niedrig | Batch-Inserts nutzen. Cache für häufige Queries |
| Demo-Fail vor Jury | Mittel | Hardcoded Fallback-Daten. Offline-Video als Backup |

---

## 9. Nach dem Hackathon (Roadmap)

- **v2:** Mehrsprachige Interviews (Englisch, Französisch)
- **v2:** Audio-Snippets in Knowledge Cards einbetten (O-Ton des Experten)
- **v2:** Automatische Follow-up Interviews ("Letztes Mal sagten Sie X, hat sich das geändert?")
- **v3:** Team-basierte Wissensgraphen (welches Wissen fehlt noch?)
- **v3:** Integration in bestehende Wikis (Confluence, Notion)
