# 🚀 Box Office Inc - V1 Release & Architecture Guide

**Release Version:** `v1.0.0-release`  
**Target Program:** ECSOC 2026 / ELUSOC 2026  
**Quality Gate Status:** Passed ✅

---

## 1. System Architecture & Component Mapping

```
                                +-----------------------------------+
                                |            Client Layer           |
                                | React 18 SPA + Vite + TailwindCSS |
                                | Redux Toolkit State Management    |
                                +-----------------+-----------------+
                                                  |
                                                  | REST API (JWT Authenticated)
                                                  |
                                +-----------------v-----------------+
                                |         Express API Gateway       |
                                | Rate Limiter + Zod Request Guards |
                                | Global Error & Exception Boundary |
                                +-----------------+-----------------+
                                                  |
             +------------------------------------+------------------------------------+
             |                                    |                                    |
+------------v------------+          +------------v------------+          +------------v------------+
|   Simulation Engine     |          |  Economy & Market Hub   |          | Talent & Career Engine  |
| - Weekly Tick Orchestr. |          | - Box Office Dynamics   |          | - Actors, Writers, Dir. |
| - Studio Growth & Fans  |          | - AI Competitor Rivals  |          | - Relationship Engine   |
| - Industry Leaderboards |          | - Syndication & Territ. |          | - Composers & Crews     |
+------------+------------+          +------------+------------+          +------------+------------+
             |                                    |                                    |
             +------------------------------------+------------------------------------+
                                                  |
                                +-----------------v-----------------+
                                |          Persistence Layer        |
                                | MongoDB Atlas Multi-Doc Transact. |
                                | Bounded GameState & Indexed Pools |
                                +-----------------------------------+
```

---

## 2. Environment Configuration Matrix

The following environment variables must be defined in `backend/.env` and `frontend/.env`:

### Backend Environment Variables (`backend/.env`)

| Variable | Type | Required | Default / Example | Purpose |
|---|---|---|---|---|
| `PORT` | Number | No | `5000` | Local HTTP server port |
| `NODE_ENV` | String | No | `development` / `production` | Execution mode |
| `MONGO_URI` | URI | **Yes** | `mongodb+srv://...` | MongoDB database connection string |
| `JWT_SECRET` | String | **Yes** | `min-32-char-random-secret` | HMAC key for signing access tokens |
| `JWT_REFRESH_SECRET`| String | **Yes** | `min-32-char-random-secret` | HMAC key for signing long-lived refresh tokens |
| `JWT_EXPIRES_IN` | String | No | `15m` | Access token lifespan |
| `JWT_REFRESH_EXPIRES_IN` | String | No | `7d` | Refresh token lifespan |
| `CLIENT_URL` | URL | No | `http://localhost:5173` | Allowed CORS origin for frontend |

### Frontend Environment Variables (`frontend/.env`)

| Variable | Type | Required | Default / Example | Purpose |
|---|---|---|---|---|
| `VITE_API_URL` | URL | No | `http://localhost:5000/api` | Backend API base URL endpoint |

---

## 3. Seed & Setup Instructions

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Running MongoDB instance (Local or Atlas Replica Set)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/SRV30/Box_Office_Inc-Movie_Sim.git
cd Box_Office_Inc-Movie_Sim

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

### Initializing the V1 Seed Market
Box Office Inc comes with an idempotent industry market seeder that generates:
- 10 Industry Giants + 89 AI Rival Studios
- 1,000 Market Actors
- 300 Market Directors
- 500 Screenwriters
- 300 Film Composers

To execute the seed script:
```bash
cd backend
node src/scripts/seedIndustryMarket.js
```

---

## 4. Quality Gate & Release Verification Checklist

- [x] **No Open P0/P1 Bugs:** All core engine formulas and state mutations pass strict assertion boundaries.
- [x] **Mutation Route Validation:** Critical mutation routes utilize validation middlewares and bounds checking.
- [x] **Transactional Integrity:** Multi-document operations (Facility construction, contract buyout, studio upgrades, bond issuance) execute within MongoDB transactions with rollback guarantees.
- [x] **Financial Ledger Reconciliation:** Expenses from talent payroll, production costs, and marketing strictly match `studio.financialHistory`.
- [x] **Bounded GameState:** Event history, scandal queues, and market collections are bounded to prevent document growth leaks.
- [x] **V1 Acceptance Suite:** 100% of end-to-end integration workflows pass (`backend/tests/v1AcceptanceSuite.test.js`).
- [x] **Production Build Cleanliness:** `frontend` builds cleanly with Vite bundle optimization and zero compiler errors.
- [x] **Linting & Code Standards:** ESLint configuration passes cleanly across all modules.

---

## 5. V1 Scope Summary & Known Non-V1 Boundaries

### In-Scope for V1:
- Core Movie Studio Lifecycle (Scripts, Talent Recruitment, Production, Post-Production, Test Screenings, Theatrical & Streaming Releases)
- Dynamic Box Office Algorithm with Review Aggregator and Audience Sentiment
- AI Rival Studio autonomous competition and market clash detection
- Talent Aging, Retirement, Awards Academy, and Milestone Hall of Fame
- Actor Relationship & Chemistry Network (Friendships, Rivalries, Romances, Mentorships, Breakups)
- Industry Leaderboards across Prestige, Revenue, Profit, Box-Office, Fanbase, and Awards
- Studio Upgrades, Facilities, Financing Bonds, PR Crisis Management, and Merchandising

### Out-of-Scope (Post-V1 Milestones):
- Live multi-user WebSocket streaming auctions
- 3D WebGL studio campus visual editor
- Real-time AI voice generation for script pitches
