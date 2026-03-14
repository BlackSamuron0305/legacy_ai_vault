# Migration & Integration Plan

## 1. Backend Strategy: Hybrid Approach (Recommended)
**Decision:** Do NOT rewrite the main backend in Python. Keep the existing TypeScript/Node.js backend.
**Reasoning:** 
- The TS backend (Express) already handles Authentication, Database (Drizzle ORM), Permission checks, and CRUD operations effectively. Rewriting this in Python would be a significant effort with high regression risk.
- Python is superior for the AI components (Hugging Face, manipulating tensors/embeddings, complex text processing). 
- **Solution:** Use a **Microservices Architecture**. The TS Backend acts as the primary API Gateway and State Manager, while the Python Service acts as the specialized AI Worker.

## 2. Integration Architecture
### Flow
1. **Frontend (React)** -> Calls **TS Backend** for:
   - User Auth
   - Starting Sessions (TS Backend calls Python Service to get Signed URL)
   - Saving/Loading History
2. **TS Backend** -> Calls **Python Service** (Cluster Internal) for:
   - `POST /api/start-session` (Get ElevenLabs Signed URL)
   - `POST /api/process-transcript` (Send transcript for HF analysis)
   - `POST /api/generate-insights` (Future RAG/Embedding tasks)
3. **Python Service** -> External APIs:
   - ElevenLabs API
   - Hugging Face Inference API

### Code Changes Required
- **TS Backend (`backend/`)**:
  - Update `src/services/elevenlabs.service.ts` to call the Python Service instead of the ElevenLabs SDK directly (or keep SDK for simple things, but move complex logic to Python).
  - Update `src/services/extraction.service.ts` to call `POST http://ai-service:5000/api/process-transcript`.
  - Add `AI_SERVICE_URL` to `.env`.

- **Python Service (`backend/ai_service/`)**:
  - Ensure API endpoints match what TS Backend needs.
  - (Already largely done: `/api/start-session`, `/api/process-transcript`).

## 3. Docker & Deployment (Coolify)
We will use a single `docker-compose.yml` to orchestrate the stack.

### Services
1. **`frontend`**: Built with Vite, served via Nginx (or simple Node serve for simplicity in Coolify).
   - Port: 80 (exposed)
2. **`backend`**: The Node.js/TS API.
   - Port: 3001 (internal, exposed if needed for dev)
3. **`ai-service`**: The Python Flask app.
   - Port: 5000 (internal)
4. **`db`**: Postgres (or use external Supabase/Neon/Coolify-managed DB).

### Action Plan
1. Create `Dockerfile` for `backend/` (Node).
2. Create `Dockerfile` for `backend/ai_service/` (Python).
3. Create `Dockerfile` for `frontend/` (React+Nginx).
4. Create `docker-compose.yml` at project root.
5. Update TS Backend to use `AI_SERVICE_URL`.

## 4. Next Steps
1. **Dockerize**: Create the docker files.
2. **Connect**: Modify TS Backend `elevenlabs.service.ts` to fetch signed URL from Python Service.
3. **Test**: Use `docker compose up` to verify communication.
