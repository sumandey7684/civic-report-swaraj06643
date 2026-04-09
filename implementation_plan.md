# Migrate from Supabase Auth to Neon PostgreSQL Auth

Replace the existing Supabase-based authentication system with direct Neon PostgreSQL database authentication using `pg` (node-postgres) on a backend Express server, and `bcryptjs` for password hashing.

## Background

The project currently uses **Supabase** for authentication (`supabase.auth.signInWithPassword`, `supabase.auth.signUp`, `supabase.auth.getUser`, etc.) and database queries (`supabase.from('profiles')`, `supabase.from('issues')`). The goal is to replace this entirely with a **Neon PostgreSQL** database using a direct connection string.

**Neon Connection String:** `postgresql://neondb_owner:npg_UbSm85aijtLJ@ep-plain-cell-anpq9926-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

## Proposed Architecture

```
Frontend (React/Vite) ←→ Backend (Express API) ←→ Neon PostgreSQL DB
                              ↑
                        JWT token auth
                        bcrypt password hashing
```

- **Backend**: Express.js API server with `pg` for Neon DB, `bcryptjs` for password hashing, `jsonwebtoken` for session tokens
- **Frontend**: Replace all `supabase` calls with `fetch()` calls to the backend API
- **Auth flow**: JWT-based with tokens stored in `localStorage`

---

## User Review Required

> [!IMPORTANT]
> **Breaking change**: All Supabase auth and database calls will be removed. The backend server must be running for the app to work.

> [!WARNING]
> The Supabase dependency (`@supabase/supabase-js`) will be removed from `package.json`. Make sure you don't need it for any other purpose.

---

## Proposed Changes

### 1. Database Setup (Neon)

#### [NEW] neon_schema.sql
SQL script to create the `users`, `profiles`, and `issues` tables on Neon:
- `users` table: `id SERIAL PRIMARY KEY`, `email`, `password_hash`, `role`, `created_at`
- `profiles` table: `user_id` (FK to users), `name`, `email`, `profile_photo`, `bio`, `notifications`, `phone`, `address`, `aadhaar_hash`
- `issues` table: Same schema as current `create_issues_table.sql` but referencing `users(id)` instead of Supabase `auth.users`
- `user_issue_rewards` table: Same as current

---

### 2. Backend API Server

#### [NEW] server/auth-server.js
New Express server with these endpoints:
- `POST /api/auth/signup` — register a new user (bcrypt hash password, insert into `users` + `profiles`)
- `POST /api/auth/login` — login (verify password with bcrypt, return JWT)
- `GET /api/auth/me` — get current user from JWT token
- `POST /api/auth/logout` — invalidate session (client-side token removal)
- `GET /api/profiles/:userId` — get profile data
- `PUT /api/profiles/:userId` — update profile
- `GET /api/issues` — list issues
- `POST /api/issues` — create issue
- `GET /api/issues/leaderboard` — leaderboard data

Uses environment variables for the Neon connection string.

#### [NEW] server/db.js
Neon PostgreSQL connection pool using `pg.Pool` with the provided connection string.

---

### 3. Frontend Integration Layer

#### [MODIFY] [.env](file:///d:/PROJECTS/civic-report/.env)
Replace Supabase env vars with:
- `VITE_API_URL=http://localhost:4000` (backend URL)

#### [NEW] src/lib/api.ts
Centralized API client that wraps `fetch()` calls to the backend:
- `api.auth.login(email, password)` 
- `api.auth.signup(userData)`
- `api.auth.me()` — uses stored JWT
- `api.auth.logout()`
- `api.profiles.get(userId)`
- `api.profiles.update(userId, data)`
- `api.issues.list()`
- `api.issues.create(data)`
- `api.issues.leaderboard()`

#### [DELETE] src/integrations/supabase/client.ts
Remove Supabase client — replaced by `src/lib/api.ts`

---

### 4. Auth Hook & Provider

#### [MODIFY] [useAuth.tsx](file:///d:/PROJECTS/civic-report/src/hooks/useAuth.tsx)
Rewrite to:
- Use the new `api.auth.me()` instead of `supabase.auth.getSession()`
- Store JWT in `localStorage`
- Remove `supabase.auth.onAuthStateChange`
- Keep the same exported interface (`user`, `profile`, `session`, `loading`, `isAdmin`, `signOut`)

---

### 5. Page Updates

#### [MODIFY] [Login.tsx](file:///d:/PROJECTS/civic-report/src/pages/Login.tsx)
- Replace `supabase.auth.signInWithPassword()` with `api.auth.login()`
- Replace signup simulation with `api.auth.signup()`

#### [MODIFY] [AdminLogin.tsx](file:///d:/PROJECTS/civic-report/src/pages/AdminLogin.tsx)
- Replace `supabase.from('profiles')` role check + `supabase.auth.signInWithPassword()` with `api.auth.login()` which returns the role

#### [MODIFY] [Account.tsx](file:///d:/PROJECTS/civic-report/src/pages/Account.tsx)
- Replace `supabase.auth.getUser()` with `api.auth.me()`
- Replace `supabase.from('profiles')` with `api.profiles.get()`
- Replace `supabase.auth.signOut()` with `api.auth.logout()`

#### [MODIFY] [SettingsPage.tsx](file:///d:/PROJECTS/civic-report/src/pages/SettingsPage.tsx)
- Replace all `supabase.auth.*` and `supabase.from('profiles')` calls with API calls
- Remove `supabase.storage` calls (photo upload will be handled differently later or kept simple)

#### [MODIFY] [ReportIssue.tsx](file:///d:/PROJECTS/civic-report/src/pages/ReportIssue.tsx)
- Replace `supabase.auth.getUser()` and `supabase.auth.onAuthStateChange()` with `api.auth.me()`
- Replace `supabase.from('issues')` with `api.issues.list()` and `api.issues.create()`
- Replace leaderboard queries with `api.issues.leaderboard()`

#### [MODIFY] [src/lib/issueRewards.ts](file:///d:/PROJECTS/civic-report/src/lib/issueRewards.ts)
- Replace Supabase queries with API calls

#### [MODIFY] [src/lib/otpApi.ts](file:///d:/PROJECTS/civic-report/src/lib/otpApi.ts)
- Remove the `supabase` import (it imports but doesn't use it)

---

### 6. Cleanup

- Remove `@supabase/supabase-js` from `package.json`
- Add `pg`, `bcryptjs`, `jsonwebtoken`, `cors` to server dependencies
- Update `.env` file

---

## Open Questions

> [!IMPORTANT]
> **Photo uploads**: The current system uses Supabase Storage for avatar uploads. With Neon, there's no built-in file storage. Should I:
> 1. Skip photo upload functionality for now (store URL only)?
> 2. Use local file storage on the server?

> [!NOTE]
> I'll keep the existing OTP flow (which already uses a custom backend at `localhost:4000`) — it doesn't depend on Supabase auth.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify no TypeScript/compilation errors after migration
- Start the backend server and verify all endpoints respond correctly

### Manual Verification
- Test signup flow → login flow → view account → report issue
- Verify JWT token persistence across page refreshes
- Test admin login role verification
