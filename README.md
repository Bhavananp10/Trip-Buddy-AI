# ✈️ TripBuddy AI

**A multi-agent AI travel planner that turns a single sentence into a complete, budget-aware itinerary — built with LangGraph, FastAPI, and Groq.**

Ask for a trip in plain English (*"Plan a 5 day trip from Delhi to Vizag for 4 people with ₹50,000 budget"*) and four specialized AI agents collaborate — searching real flights, comparing hotels, building a day-by-day plan, and writing up a final recommendation — all orchestrated as a stateful graph with persistent conversation memory.

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-1C3C3C)](https://www.langchain.com/langgraph)
[![Groq](https://img.shields.io/badge/LLM-Groq%20gpt--oss--120b-F55036)](https://groq.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Checkpointing-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 🎥 Demo

> _Add a short demo video/GIF here — e.g. record with [ScreenToGif](https://www.screentogif.com/) or Loom and drop the file at `docs/assets/demo.mp4` (or embed a hosted link)._

```
docs/assets/demo.mp4   <-- place your demo video/gif here and update this section
```

---

## 📐 Architecture

> _Save the architecture diagram image at `docs/assets/architecture.png` — once added, it will render below on GitHub._

```
docs/assets/architecture.png   <-- place the architecture diagram here
```

**How a request flows through the system:**

1. **Frontend (FastAPI + Jinja2 + vanilla JS)** — the user types a trip request into a chat-style UI (`templates/index.html`, `static/script.js`, `static/style.css`) which POSTs it to the backend.
2. **Backend API layer (`app.py`)** — a FastAPI app validates the request, manages a `thread_id` for conversation continuity, and invokes the LangGraph workflow.
3. **Orchestration layer (`backend.py`, LangGraph)** — a `StateGraph` runs four agents in sequence, each reading from and writing to one **shared `TravelState`**:
   - **Flight Agent** — resolves cities/countries to IATA codes and queries the AviationStack API for live flight data.
   - **Hotel Agent** — uses the Tavily Search API to pull up-to-date hotel and travel information.
   - **Itinerary Agent** — an LLM call (Groq `openai/gpt-oss-120b`) synthesizes flight + hotel data into a practical, budget-aware day-by-day plan.
   - **Final Response Agent** — a second LLM call formats everything into a polished, structured answer (trip summary, flights, hotels, itinerary, budget, recommendations).
4. **Tools & external services** — `tools/flight_tool.py` (AviationStack + `airportsdata`/`pycountry` for location resolution) and `tools/tavily_tool.py` (Tavily Search).
5. **Persistence layer** — a `PostgresSaver` checkpointer persists the full graph state after every node, so conversations survive restarts and support multi-turn follow-ups via `thread_id`.
6. **Observability** — LangSmith tracing (enabled via environment variables) captures every run, LLM call, and tool invocation for debugging and performance monitoring.
7. **Deployment** — containerized with Docker and deployed to Render, backed by a managed Render PostgreSQL instance.

---

## ✨ Key Features

- 🧠 **True multi-agent orchestration** — not a single mega-prompt; four purpose-built agents each own one responsibility and pass structured state forward via LangGraph.
- 💾 **Persistent, resumable conversations** — every session is checkpointed to PostgreSQL, enabling stateful multi-turn planning (e.g. "actually make it 7 days" in a follow-up message).
- 🛫 **Real flight data** — live lookups against the AviationStack API with automatic city/country → IATA airport code resolution.
- 🏨 **Real-time hotel & travel info** — powered by Tavily's search API instead of stale/static data.
- 📊 **Full observability** — LangSmith traces every agent step, LLM call, and token count (`llm_calls` is returned in every API response).
- 🐳 **Production-ready deployment** — Dockerized FastAPI service, deployed on Render with a managed PostgreSQL database.
- 🎨 **Clean, responsive chat UI** — no frontend framework overhead; a lightweight HTML/CSS/JS interface talking to a JSON API.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Orchestration | [LangGraph](https://www.langchain.com/langgraph) (stateful multi-agent graph) |
| LLM | [Groq](https://groq.com/) — `openai/gpt-oss-120b` via `langchain-groq` |
| Backend API | [FastAPI](https://fastapi.tiangolo.com/) + Uvicorn |
| Frontend | Jinja2 templates + vanilla HTML/CSS/JS |
| Flight data | [AviationStack API](https://aviationstack.com/) |
| Hotel/travel search | [Tavily Search API](https://tavily.com/) |
| Persistence | PostgreSQL (`langgraph-checkpoint-postgres`) |
| Observability | [LangSmith](https://smith.langchain.com/) |
| Containerization | Docker |
| Deployment | [Render](https://render.com/) (Web Service + Managed PostgreSQL) |

---

## 📂 Project Structure

```
Trip-Buddy-AI/
├── app.py                  # FastAPI app: routes, request/response handling
├── backend.py               # LangGraph workflow: agents, shared state, PostgreSQL checkpointer
├── tools/
│   ├── flight_tool.py        # AviationStack integration + IATA/country resolution
│   └── tavily_tool.py         # Tavily search integration
├── templates/
│   └── index.html            # Chat UI
├── static/
│   ├── style.css
│   └── script.js
├── test.py                  # Simple CLI test harness for the agent pipeline
├── Dockerfile
├── requirements.txt
└── docs/assets/              # (add) architecture diagram + demo video
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- A PostgreSQL database (local, or a free [Render PostgreSQL](https://render.com/docs/databases) instance)
- API keys: [Groq](https://console.groq.com/), [AviationStack](https://aviationstack.com/), [Tavily](https://tavily.com/), and optionally [LangSmith](https://smith.langchain.com/)

### 1. Clone & set up a virtual environment

```bash
git clone https://github.com/Bhavananp10/Trip-Buddy-AI.git
cd Trip-Buddy-AI

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
AVIATIONSTACK_API_KEY=your_aviationstack_api_key
TAVILY_API_KEY=your_tavily_api_key
DATABASE_URL=postgresql://user:password@host:port/dbname
DEFAULT_ORIGIN_IATA=INDIA

# Optional — LangSmith tracing
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_PROJECT=trip-buddy-ai
```

### 3. Run locally

```bash
uvicorn app:app --reload
```

Visit **http://127.0.0.1:8000** and start planning a trip.

Or test the agent pipeline directly from the terminal:

```bash
python test.py
```

### 4. Run with Docker

```bash
docker build -t trip-buddy-ai .
docker run -p 8000:8000 --env-file .env trip-buddy-ai
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the chat UI |
| `POST` | `/api/travel` | Runs the multi-agent workflow for a travel request |
| `GET` | `/health` | Health check |

**`POST /api/travel`** request body:

```json
{
  "message": "Plan a 5 day trip from Delhi to Vizag for 4 people with ₹50,000 budget",
  "thread_id": "optional-existing-thread-id"
}
```

**Response:**

```json
{
  "success": true,
  "thread_id": "user_xxxxxxxx",
  "answer": "Full formatted itinerary...",
  "flight_results": "...",
  "hotel_results": "...",
  "itinerary": "...",
  "llm_calls": 2
}
```

Pass the returned `thread_id` back on the next request to continue the same conversation with full context.

---

## ☁️ Deployment

The app ships as a single Docker image and is deployed on **Render**:

1. Push to GitHub.
2. Create a Render **Web Service** from the repo (Render auto-detects the `Dockerfile`).
3. Provision a **Render PostgreSQL** instance and set `DATABASE_URL` (plus the other secrets) as environment variables on the service.
4. Render builds the image and exposes the app — LangGraph's `PostgresSaver` initializes its checkpoint tables automatically on first boot.

---

## 🗺️ Roadmap

- [ ] Streaming responses (token-by-token) instead of a single blocking call
- [ ] Real-time flight pricing once available from the data provider
- [ ] User accounts and saved trip history beyond the checkpoint thread
- [ ] Multi-city itinerary support
- [ ] Automated test suite (pytest) covering agents and tools

---

## 📄 License

This project is available for personal and educational use. Add a license file (e.g. MIT) if you intend to open-source it formally.

---

## 👤 Author

**Bhavana** — [GitHub](https://github.com/Bhavananp10)
