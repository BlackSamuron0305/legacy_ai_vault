# 🧠 Legacy AI Vault

> **Curserxthinc! Hackathon** — März 2026

---

## 💡 Das Problem

Erfahrene Mitarbeiter verlassen Unternehmen — und nehmen ihr Wissen mit. Jahrzehntelange Expertise, implizites "Gewusst wie", Tricks und Workarounds gehen unwiederbringlich verloren. Schriftliche Dokumentation wird selten gemacht, weil sie mühsam und zeitaufwändig ist.

## 🎯 Unsere Lösung

**Legacy AI Vault** ist ein Voice-to-Voice Wissensextraktor. Ein KI-Interviewer führt ein mündliches Gespräch mit dem Experten, stellt personalisierte und jobspezifische Fragen, bohrt gezielt nach und extrahiert so implizites Wissen — strukturiert und durchsuchbar.

### Warum Voice?

- **Niedrige Hürde:** Reden ist einfacher als Schreiben. Experten teilen mündlich deutlich mehr und detaillierter.
- **Gezielte Extraktion:** Die KI erkennt Wissenslücken und stellt intelligente Rückfragen.
- **Skalierbar:** Ein Interview dauert Minuten, nicht Tage.

### Der Mehrwert

| Für wen? | Was bringt's? |
|---|---|
| **Unternehmen** | Expertise bleibt erhalten, auch wenn der Mitarbeiter geht |
| **Neue Mitarbeiter** | Können über einen Chatbot auf das gesammelte Wissen zugreifen |
| **Experten** | Ihr Lebenswerk wird gewürdigt und bewahrt |

---

## 🏗️ Architektur & Tech-Stack

```
┌─────────────────────────────────────────────────────┐
│                    LOVABLE (Frontend)                │
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ Interview │  │  Knowledge   │  │   Chatbot     │ │
│  │ Station   │  │  Cards View  │  │   (Abruf)     │ │
│  └─────┬─────┘  └──────┬───────┘  └───────┬───────┘ │
└────────┼───────────────┼───────────────────┼────────┘
         │               │                   │
┌────────▼───────────────▼───────────────────▼────────┐
│              CURSOR / BACKEND (The Brain)            │
│                                                     │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────┐ │
│  │ Transkript-  │  │ Knowledge  │  │ Vektor-DB   │ │
│  │ Verarbeitung │  │ Structurer │  │ (Supabase)  │ │
│  └──────────────┘  └────────────┘  └─────────────┘ │
└────────┬────────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────┐
│           ELEVENLABS (Conversational AI)             │
│                                                     │
│  Voice-to-Voice Dialog · System Prompt · Rückfragen │
└─────────────────────────────────────────────────────┘
```

### Tech-Stack im Detail

| Tool | Rolle | Was genau? |
|---|---|---|
| **ElevenLabs** | 🎙️ The Voice | Conversational AI Agent — führt das Interview per Voice-to-Voice. System-Prompt definiert die Interviewer-Persönlichkeit und das Fachgebiet |
| **Lovable** | 🖥️ The Vault UI | Frontend: Interview-Station mit "Wissen weitergeben"-Button, Echtzeit-Knowledge-Cards, Waveform-Animation während des Gesprächs |
| **Cursor** | 🧠 The Brain | Backend-Logik: Transkript-Verarbeitung, Strukturierung in JSON/Vektor-Daten, Suchfunktion für späteren Chatbot-Abruf |
| **Supabase** | 💾 The Memory | Datenbank für strukturierte Knowledge-Einträge + Vektor-Embeddings für semantische Suche |

---

## 🚀 Implementierungsplan (20-Stunden-Sprint)

### Phase 1: Foundation (Stunden 1–4)

- [ ] **ElevenLabs Conversational AI Agent** einrichten
  - System-Prompt schreiben: "Du bist ein erfahrener Wissens-Interviewer. Dein Ziel ist es, implizites Fachwissen zu extrahieren..."
  - Interviewer-Persönlichkeit definieren (freundlich, geduldig, neugierig)
  - Rückfrage-Logik testen ("Kannst du das genauer erklären?", "Was passiert wenn...?")
- [ ] **Supabase** Projekt aufsetzen
  - Tabelle `interviews` (id, expert_name, department, date, transcript, status)
  - Tabelle `knowledge_cards` (id, interview_id, topic, content, tags, embedding)
- [ ] **Lovable** Projekt initialisieren — Grundstruktur der App

### Phase 2: Core Features (Stunden 5–12)

- [ ] **Interview-Station** (Lovable)
  - Großer "Wissen weitergeben" Button
  - Formular: Name, Abteilung, Fachgebiet (damit System-Prompt personalisiert wird)
  - Audio-Waveform-Animation während des Gesprächs
  - Live-Transkript-Anzeige (optional)
- [ ] **ElevenLabs ↔ Backend Integration** (Cursor)
  - Webhook/API: Nach Interview → Transkript empfangen
  - Transkript-Parser: Rohtext → strukturierte Knowledge-Cards
  - Prompt an LLM: "Extrahiere die 5 wichtigsten Erkenntnisse aus diesem Interview..."
- [ ] **Knowledge-Cards Generierung** (Cursor)
  - Automatische Tag-Vergabe
  - Zusammenfassung pro Themenblock
  - Speicherung in Supabase

### Phase 3: Vault & Abruf (Stunden 13–17)

- [ ] **Knowledge Vault Dashboard** (Lovable)
  - Übersicht aller Interviews mit Experten-Profilen
  - Knowledge-Cards als durchsuchbare Karten-Ansicht
  - Filter nach Abteilung, Tags, Experte
- [ ] **Chatbot-Abruf** (Cursor + Supabase)
  - Vektor-Embeddings erstellen für alle Knowledge-Cards
  - Einfacher Chatbot: "Was weiß Herr Müller über Turbine X bei Überhitzung?"
  - RAG (Retrieval Augmented Generation) mit Supabase Vector

### Phase 4: Polish & Demo (Stunden 18–20)

- [ ] **Demo-Szenario** vorbereiten
  - Ein 3-Minuten-Interview aufnehmen (echt oder simuliert)
  - Knowledge-Cards daraus live zeigen
  - Chatbot-Abfrage vorführen
- [ ] **UI Polish** — Animationen, Farben, Branding
- [ ] **Präsentation** vorbereiten — Storytelling: "Wir retten das Lebenswerk von Mitarbeitern"

---

## 🎤 Demo-Flow (für die Präsentation)

```
1. Experte klickt "Wissen weitergeben"
2. Gibt Name + Fachgebiet ein (z.B. "Turbinen-Technik")
3. KI-Interviewer startet Gespräch per Voice:
   🤖 "Hallo! Erzähl mir, was die häufigsten Probleme bei Turbine X sind..."
   👨‍🔧 "Naja, wenn die Temperatur über 400 Grad steigt, muss man..."
   🤖 "Interessant! Und was genau passiert, wenn man das nicht rechtzeitig macht?"
4. Nach dem Gespräch: Knowledge-Cards erscheinen automatisch
5. Neuer Mitarbeiter fragt den Chatbot:
   💬 "Was mache ich bei Überhitzung der Turbine X?"
   🤖 "Laut Herrn Müller: Bei Temperaturen über 400°..."
```

---

## ⚡ Token-Spar-Strategie

| Ressource | Strategie |
|---|---|
| **ElevenLabs** | Flash-Modelle nutzen (50% günstiger). Tests kurz halten. 2.000–5.000 Zeichen für die Live-Demo aufsparen |
| **Lovable** | Änderungen bündeln (1 Prompt = mehrere Änderungen). Kein Credit für CSS-Kleinkram verschwenden |
| **Cursor** | Gemini 2.0 Flash für Standard-Code. Große Modelle nur für komplexe Logik |
| **Notfall** | Für die Demo: Hardcoded-Antworten einbauen, die KI simulieren. Spart 100% Tokens für den Jury-Moment |

---

## 📁 Geplante Projektstruktur

```
legacy_ai_vault/
├── frontend/              # Lovable-generierte App
│   ├── src/
│   │   ├── components/
│   │   │   ├── InterviewStation.tsx
│   │   │   ├── KnowledgeCards.tsx
│   │   │   ├── VaultDashboard.tsx
│   │   │   └── Chatbot.tsx
│   │   └── App.tsx
│   └── package.json
├── backend/               # Cursor-generiert
│   ├── src/
│   │   ├── elevenlabs/    # ElevenLabs API Integration
│   │   ├── processing/    # Transkript → Knowledge-Cards
│   │   ├── database/      # Supabase Client
│   │   └── chatbot/       # RAG-basierter Wissens-Chatbot
│   └── package.json
├── prompts/               # System-Prompts für ElevenLabs
│   ├── interviewer.md     # Interviewer-Persönlichkeit
│   └── extractor.md       # Knowledge-Extraction Prompt
└── README.md
```

---

## 🏆 Warum dieses Projekt gewinnt

1. **Storytelling:** Wir retten das Lebenswerk von Mitarbeitern — das zieht emotional.
2. **Innovation:** Kein weiteres Ticketsystem. Ein aktiver Wissens-Extraktor, der nachbohrt.
3. **Tech-Synergie:** ElevenLabs ist nicht Gimmick, sondern Kerntechnologie.
4. **Demo-Effekt:** Ein 3-Minuten-Live-Interview wirkt sofort magisch.

---

## 👥 Team

**Event:** Curserxthinc! Hackathon
**Datum:** März 2026
**Team:** Luraxx

## Lizenz

MIT
