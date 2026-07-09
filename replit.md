# SakhiPath

AI-powered career empowerment platform for women in STEM — helping users navigate career transitions with AI mentorship, scholarship discovery, financial literacy guidance, and personalized career coaching.

## Run & Operate

- `pnpm --filter @workspace/sakhipath run dev` — run the React frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React 19, Vite, Tailwind CSS, Wouter (routing), Framer Motion, React Query, Firebase SDK
- **Backend**: Express 5, Node.js 20
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Google Gemini API (`gemini-2.5-flash`) — server-side only via `artifacts/api-server`
- **Auth**: Firebase Authentication (email/password + Google)
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- **Build**: esbuild (API server CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schemas (scholarships, learning, mentors, conversations, activity)
- `artifacts/api-server/src/services/gemini.ts` — all Gemini AI logic (never called from frontend)
- `artifacts/api-server/src/routes/` — Express route handlers (ai, scholarships, learning, mentors, dashboard)
- `artifacts/sakhipath/src/lib/firebase.ts` — Firebase initialization from env vars
- `artifacts/sakhipath/src/contexts/AuthContext.tsx` — Firebase auth state management
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not hand-edit)

## Environment Variables (Replit Secrets)

| Secret | Usage |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web SDK config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `GEMINI_API_KEY` | Google Gemini API — **server-side only, never in frontend** |
| `DATABASE_URL` | PostgreSQL connection string (managed by Replit) |

Add these via Replit Secrets (not `.env` files). Firebase credentials go to Firebase Console → Project Settings → General → Your apps → Web app config. Gemini key: https://aistudio.google.com/app/apikey

## Architecture

```
User Browser
    ↓ HTTPS
Firebase Auth  (client-side SDK)
    ↓ uid
React Frontend (artifacts/sakhipath)
    ↓ HTTP /api/*
Express API Server (artifacts/api-server)
    ↓
Gemini API  ←  GEMINI_API_KEY (server env only)
    ↓
PostgreSQL (Drizzle ORM)
    ↓
Response → Frontend
```

**Gemini is NEVER called from the frontend.** All AI requests go through `/api/ai/*` routes which call Gemini server-side and return sanitized responses.

## Features

1. **AI Career Mentor** — Chat with Gemini-powered mentor, conversation history saved to DB
2. **Resume Analyzer** — Paste/upload resume text → AI score + strengths/weaknesses/improvements
3. **Career Confidence Dashboard** — Computed score from learning, mentoring, AI engagement, profile
4. **Scholarship Finder** — 10 seeded Indian/international scholarships + AI recommendations
5. **Financial Literacy** — Gemini-powered explanations of SIP, 80C, personal finance
6. **Mentor Directory** — 8 seeded mentors, request sessions, track status
7. **Learning Hub** — 6 seeded modules with quizzes, progress tracking, and badges

## Database Collections (PostgreSQL)

- `scholarships` — scholarship listings
- `learning_modules` — structured learning content with embedded quizzes
- `quiz_results` — user quiz completions, scores, pass/fail
- `mentors` — mentor profiles
- `mentor_requests` — session requests with status tracking
- `conversations` — saved AI chat sessions
- `activity_logs` — user activity feed

## Gotchas

- After any OpenAPI spec change, run codegen before touching frontend code
- API server uses esbuild bundle — change `zod` import (not `zod/v4`) in route files
- Firebase VITE_ prefixed env vars are public (client-safe); `GEMINI_API_KEY` is server-only
- `pnpm --filter @workspace/db run push` applies schema to dev DB only; production managed by Replit publish flow
- The `info.title` in `openapi.yaml` must stay `Api` — it controls generated file names

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
