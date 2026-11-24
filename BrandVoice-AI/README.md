# BrandVoice AI

**Consistent Marketing Content Assistant** — A production-quality Generative AI SaaS that helps companies maintain brand identity across all marketing channels.

## Architecture

```
brandvoice-ai/
├── apps/
│   ├── frontend/          # React 18 + Vite + Tailwind CSS (port 5173)
│   └── backend/           # Express + TypeScript + Prisma (port 5000)
│       ├── prisma/        # Schema + migrations
│       └── src/
│           ├── controllers/   # Route handlers (auth, brand, content, consistency, memory, analytics, campaign)
│           ├── services/      # AI (LangChain, LangGraph), crawling (Firecrawl), embeddings, consistency
│           ├── middleware/     # Authentication, error handling
│           ├── lib/           # Prisma client, password, brand access, URL safety, embedding math
│           ├── routes/        # Express route definitions
│           └── __tests__/     # Vitest unit tests
├── packages/
│   └── shared/            # Shared TypeScript types & API response interfaces
├── docker/
│   └── postgres/          # PostgreSQL init script (pgvector extension + vector columns)
├── docker-compose.yml     # PostgreSQL 16 (pgvector) + Redis 7
└── .env.example           # Environment variable template
```

## Tech Stack

| Layer         | Technology |
|---------------|------------|
| Frontend      | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, TanStack Query, Axios |
| Backend       | Node.js, Express 4, TypeScript, Prisma ORM, Zod validation |
| Database      | PostgreSQL 16 + pgvector, Redis 7 |
| AI (Primary)  | Groq (Llama 3.3 70B) via LangChain |
| AI (Fallback) | Google Gemini 1.5 Flash via LangChain |
| Orchestration | LangGraph (StateGraph: memory → generate → evaluate) |
| Embeddings    | OpenAI text-embedding-3-small → Gemini → local hash fallback |
| Crawling      | Firecrawl |
| Observability | Langfuse |
| Dev Tools     | pnpm workspaces, Docker Compose, Vitest |

---

## Quick Start (Windows)

### Prerequisites

1. **Node.js 18+** — [nodejs.org](https://nodejs.org) (LTS recommended)
2. **pnpm** — Install globally: `npm install -g pnpm`
3. **Docker Desktop** — [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL + Redis)

### Step 1: Install Dependencies

Open a terminal in the project root (`brandvoice-ai/`):

```powershell
cd brandvoice-ai
pnpm install
```

### Step 2: Configure Environment Variables

The backend `.env` file is at `apps/backend/.env`. If it doesn't exist, create it:

```powershell
copy .env.example apps\backend\.env
```

Open `apps/backend/.env` and fill in your **API keys**:

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `GROQ_API_KEY` | ✅ Yes | [console.groq.com](https://console.groq.com) (free tier) |
| `GOOGLE_AI_API_KEY` | ✅ Yes | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `FIRECRAWL_API_KEY` | Optional | [firecrawl.dev](https://www.firecrawl.dev) (for website crawling) |
| `OPENAI_API_KEY` | Optional | For higher-quality embeddings (fallback works without it) |
| `LANGFUSE_PUBLIC_KEY` | Optional | [langfuse.com](https://langfuse.com) (tracing/observability) |
| `LANGFUSE_SECRET_KEY` | Optional | Same as above |

> **Note:** The database URL, Redis URL, JWT secret, and other settings have working defaults for local development. You only need to change them for production.

### Step 3: Start Docker Containers (Database + Cache)

Make sure Docker Desktop is running, then:

```powershell
docker compose up -d
```

Verify they're healthy:

```powershell
docker compose ps
```

You should see `brandvoice-postgres` and `brandvoice-redis` both running and healthy.

### Step 4: Generate Prisma Client & Run Migrations

```powershell
cd apps/backend
npx prisma generate
npx prisma migrate deploy
```

Then apply the pgvector columns (only needed once, after first migration):

```powershell
docker exec -i brandvoice-postgres psql -U brandvoice -d brandvoice -f /docker-entrypoint-initdb.d/init.sql
```

Return to the project root:

```powershell
cd ..\..
```

### Step 5: Start the Application

You need **two terminal windows**:

**Terminal 1 — Backend API:**

```powershell
cd brandvoice-ai\apps\backend
npx tsx src/index.ts
```

You'll see:
```
🚀 BrandVoice AI API listening on http://localhost:5000
📊 Environment: development
🔗 Health: http://localhost:5000/health
```

**Terminal 2 — Frontend Dev Server:**

```powershell
cd brandvoice-ai\apps\frontend
npx vite
```

You'll see:
```
VITE v5.x.x ready in Xms
➜ Local: http://localhost:5173/
```

### Step 6: Open the Application

Open your browser and go to:

**👉 http://localhost:5173**

1. **Register** a new account (name, email, password with 8+ chars including a letter and number)
2. **Complete onboarding** — enter your brand info and optionally crawl your website
3. **Generate content** from the Content Studio
4. **Check consistency** in the Consistency Checker
5. **Review analytics** on the Dashboard

### Verify Backend Health

Visit http://localhost:5000/health — you should see:

```json
{
  "success": true,
  "message": "BrandVoice AI API is running",
  "version": "1.0.0",
  "database": "connected"
}
```

---

## Running Tests

```powershell
cd apps/backend
npx vitest run
```

This runs 27 unit tests across 4 test suites:
- `password.test.ts` — Password validation rules
- `auth.test.ts` — Registration, login, logout
- `content.test.ts` — CRUD operations, version tracking
- `consistency.test.ts` — Consistency evaluation, history, improvement

---

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (creates user + org + brand) |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout (clears cookie) |
| GET | `/api/auth/me` | Get current user session |
| PATCH | `/api/auth/profile` | Update user profile |
| PATCH | `/api/auth/password` | Change password |

### Brand Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/brands` | List user's brands |
| POST | `/api/brands` | Create brand |
| GET | `/api/brands/:id` | Get brand details |
| PATCH | `/api/brands/:id` | Update brand |
| POST | `/api/brands/:id/crawl` | Crawl brand website (Firecrawl) |
| PUT | `/api/brands/:id/guidelines` | Update brand guidelines |
| PUT | `/api/brands/:id/preferences` | Update brand voice preferences |

### Content
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/content/generate` | Generate content (LangGraph workflow) |
| GET | `/api/content` | List content (paginated, filterable) |
| GET | `/api/content/:id` | Get content by ID |
| PUT | `/api/content/:id` | Update content (creates version) |
| DELETE | `/api/content/:id` | Delete content |
| PATCH | `/api/content/:id/status` | Approve/reject/archive |
| GET | `/api/content/:id/versions` | Get version history |

### Consistency
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/consistency/check` | Evaluate content consistency |
| POST | `/api/consistency/improve` | AI-powered content improvement |
| GET | `/api/consistency/history` | Past consistency reports |

### Brand Memory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/memory` | List memory records |
| POST | `/api/memory/search` | Semantic search across memories |
| POST | `/api/memory` | Create memory record |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/trends` | Content generation trends |

### Campaigns
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign |
| PATCH | `/api/campaigns/:id` | Update campaign |

---

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Architecture & project setup | ✅ Complete |
| 2 | Premium frontend UI | ✅ Complete |
| 3 | Authentication & database | ✅ Complete |
| 4 | Brand onboarding & Firecrawl | ✅ Complete |
| 5 | AI content generation | ✅ Complete |
| 6 | Brand memory & pgvector | ✅ Complete |
| 7 | Brand consistency checker | ✅ Complete |
| 8 | LangGraph orchestration | ✅ Complete |
| 9 | Analytics & content management | ✅ Complete |
| 10 | Testing & deployment | ✅ Complete |

---

## Available Scripts

```powershell
# From workspace root
pnpm install          # Install all dependencies
docker compose up -d  # Start PostgreSQL + Redis
docker compose down   # Stop containers

# From apps/backend
npx prisma generate   # Generate Prisma client
npx prisma migrate deploy  # Run migrations (production)
npx prisma migrate dev     # Create + run migrations (dev)
npx prisma studio     # Open Prisma Studio GUI
npx tsx src/index.ts  # Start backend server
npx vitest run        # Run unit tests
npx tsc --noEmit      # TypeScript check

# From apps/frontend
npx vite              # Start dev server
npx vite build        # Production build
```

## Troubleshooting

### "Cannot connect to database"
- Ensure Docker Desktop is running
- Run `docker compose ps` — both containers should be `Up (healthy)`
- Check `DATABASE_URL` in `apps/backend/.env`

### "GROQ_API_KEY not set" or AI errors
- Open `apps/backend/.env` and add your Groq API key from [console.groq.com](https://console.groq.com)
- The system falls back to Gemini if Groq fails, so also set `GOOGLE_AI_API_KEY`

### "Port 5000 already in use"
- Change `PORT` in `apps/backend/.env`
- Or kill the existing process: `npx kill-port 5000`

### Frontend can't reach backend
- The Vite dev server proxies `/api` → `http://localhost:5000`
- Ensure the backend is running on port 5000

### pnpm not found
- Install globally: `npm install -g pnpm`

---

## License

MIT
