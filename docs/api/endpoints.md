# API Endpoints Reference

## Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user and create studio |
| POST | `/api/auth/login` | No | Login with email and password |
| POST | `/api/auth/refresh` | Cookie | Refresh access token using refresh token cookie |
| POST | `/api/auth/logout` | No | Clear refresh token cookie |
| GET | `/api/auth/me` | JWT | Get current authenticated user profile |
| GET | `/api/auth/diagnostics` | JWT | Get auth diagnostics (auth events summary) |

## Studio Management (`/api/studios`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/studios/profile` | JWT | Get studio profile |
| PUT | `/api/studios/profile` | JWT | Update studio name |
| GET | `/api/studios/loans` | JWT | List active loans |
| POST | `/api/studios/loans/take` | JWT | Take a new loan |

## Movie Management (`/api/movies`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/movies` | JWT | Create a new movie |
| GET | `/api/movies/active` | JWT | List active (in-production) movies |
| GET | `/api/movies/released` | JWT | List released movies |
| GET | `/api/movies/generate-title` | JWT | Generate a random movie title |
| GET | `/api/movies/:id` | JWT | Get movie details |
| POST | `/api/movies/:id/release` | JWT | Release a movie that is ready |
| GET | `/api/movies/:id/tracking` | JWT | Get box office analyst projections |

## Analytics (`/api/analytics`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/financials` | JWT | Get studio financial history and runway |
| GET | `/api/analytics/movies` | JWT | Get released movie performance reports |
| GET | `/api/analytics/movies/:movieId/profitability` | JWT | Get canonical movie-level profitability |
| GET | `/api/analytics/genres` | JWT | Get genre performance trends |
| GET | `/api/analytics/talent` | JWT | Get talent career trajectories |
| GET | `/api/analytics/rivals` | JWT | Compare the player studio with rivals |

### Movie Profitability (`GET /api/analytics/movies/:movieId/profitability`)

Returns the authenticated studio owner's movie with a canonical revenue,
expense, net-profit, ROI, and profitability breakdown. Movies owned by another
studio return `404`.

```json
{
  "success": true,
  "data": {
    "movie": {
      "_id": "...",
      "title": "Galactic Odyssey",
      "status": "RELEASED",
      "releaseType": "THEATRICAL"
    },
    "profitability": {
      "currency": "INR",
      "hasFinancialRecords": true,
      "revenue": {
        "boxOffice": 150000000,
        "merchandise": 10000000,
        "soundtrack": 5000000,
        "total": 165000000,
        "reRelease": 0,
        "cinemaMarkets": 0
      },
      "expenses": {
        "production": 80000000,
        "marketing": 20000000,
        "localization": 0,
        "total": 100000000,
        "productionCostSource": "budgetBreakdown"
      },
      "netProfit": 65000000,
      "roiPercent": 65,
      "profitMargin": 39.39,
      "profitabilityStatus": "PROFITABLE",
      "profitabilityLabel": "Profitable"
    }
  }
}
```

Calculation rules:

- Box office uses `worldwideGross`, falling back to `boxOffice`.
- Merchandise and soundtrack revenue are added once.
- Re-release revenue and regional cinema-market gross are already included in
  box office, so they are reported for reference but not counted again.
- Production expenses come from `budgetBreakdown` when available, including
  `soundtrackCost`, and fall back to `budget` for legacy records.
- Marketing expenses use the larger of `marketingBudget` and
  `budgetBreakdown.marketingCost` so post-greenlight campaigns are included.
- Localization/distribution costs from `cinemaMarketRevenue` are added as
  expenses.
- `profitabilityStatus` is `PROFITABLE` when net profit is positive, `LOSS` when
  negative, and `BREAK_EVEN` when revenue equals expenses or no financial
  records exist.

## Talent Marketplace

### Actors (`/api/actors`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/actors` | JWT | Browse marketplace actors |
| GET | `/api/actors/owned` | JWT | List contracted actors |
| GET | `/api/actors/:id/profile` | JWT | Get actor profile with career history |
| POST | `/api/actors/hire/:index` | JWT | Hire an actor from marketplace |
| POST | `/api/actors/fire/:index` | JWT | Fire a contracted actor |

### Directors (`/api/directors`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/directors` | JWT | Browse marketplace directors |
| GET | `/api/directors/owned` | JWT | List contracted directors |
| GET | `/api/directors/projects` | JWT | List active directing projects |
| GET | `/api/directors/:id` | JWT | Get director profile |
| POST | `/api/directors/hire/:index` | JWT | Hire a director |
| POST | `/api/directors/fire/:index` | JWT | Fire a director |
| POST | `/api/directors/start-directing` | JWT | Start a new directing project |
| POST | `/api/directors/replace-director` | JWT | Replace a director on a project |

### Writers (`/api/writers`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/writers` | JWT | Browse marketplace writers |
| GET | `/api/writers/owned` | JWT | List contracted writers |
| GET | `/api/writers/:id/profile` | JWT | Get writer profile |
| POST | `/api/writers/hire/:index` | JWT | Hire a writer |
| POST | `/api/writers/fire/:index` | JWT | Fire a writer |
| POST | `/api/writers/start-writing` | JWT | Start a writing project |
| GET | `/api/writers/projects` | JWT | List active writing projects |
| POST | `/api/writers/replace-writer` | JWT | Replace a writer on a project |

### Crew (`/api/crew`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/crew` | JWT | Browse marketplace crew teams |
| GET | `/api/crew/owned` | JWT | List contracted crew teams |
| GET | `/api/crew/:id` | JWT | Get crew team profile |
| POST | `/api/crew/hire/:id` | JWT | Hire a crew team |
| POST | `/api/crew/fire/:id` | JWT | Fire a crew team |

## Script Marketplace (`/api/scripts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/scripts` | JWT | Browse available scripts |
| GET | `/api/scripts/owned` | JWT | List owned scripts |
| POST | `/api/scripts/buy/:index` | JWT | Purchase a script |
| POST | `/api/scripts/sell/:index` | JWT | Sell an owned script |

## Simulation (`/api/simulation`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/simulation/next-week` | JWT | Advance simulation by N weeks |
| GET | `/api/simulation/awards` | JWT | Get past awards data |
| GET | `/api/simulation/market-intelligence` | JWT | Get market intelligence data |

## News (`/api/news`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/news` | JWT | Get paginated news feed |
| GET | `/api/news/:id` | JWT | Get news article detail |

## Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | JWT | List notifications |
| GET | `/api/notifications/unread-count` | JWT | Get unread notification count |
| PATCH | `/api/notifications/:id/read` | JWT | Mark notification as read |
| PATCH | `/api/notifications/read-all` | JWT | Mark all notifications as read |
| DELETE | `/api/notifications/:id` | JWT | Delete a notification |
| DELETE | `/api/notifications` | JWT | Delete all notifications |

## Other Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/leaderboard` | JWT | Get global leaderboard |
| GET | `/api/franchises` | JWT | List franchises |
| POST | `/api/franchises` | JWT | Create a new franchise |
| GET | `/api/franchises/:id` | JWT | Get franchise details |
| GET | `/api/streaming/platforms` | JWT | List streaming platforms |
| POST | `/api/streaming/movies/:movieId/accept-deal` | JWT | Accept a streaming deal |
| GET | `/api/tv-shows` | JWT | List TV shows |
| POST | `/api/tv-shows` | JWT | Commission a TV show |
| GET | `/api/tv-shows/:id` | JWT | Get TV show details |
| GET | `/api/rival-studios` | JWT | List rival studios |
| POST | `/api/spy/:rivalId` | JWT | Purchase spy report on rival |
| GET | `/api/upgrades` | JWT | List available studio upgrades |
| POST | `/api/upgrades/buy` | JWT | Purchase a studio upgrade |
| POST | `/api/marketing/:id/campaign` | JWT | Add marketing campaign to movie |
| GET | `/api/reviews/:movieId` | JWT | Get review dashboard for a movie |
| POST | `/api/awards-campaign/lobby` | JWT | Start awards lobbying campaign |
| GET | `/api/merch` | JWT | Get merchandise stats |
| POST | `/api/merch/boost/:movieId` | JWT | Boost merchandise level for a movie |
| POST | `/api/academy/train` | JWT | Train talent at the academy |
