# Movie Syndication & Television Licensing Engine

## Overview
The Movie Syndication & Television Licensing module empowers movie studios to monetize catalog films through long-term television broadcast network agreements, cable packages, and recurring weekly royalty cashflows.

## Core Simulation Metrics & Mechanics

### 1. Valuation & Royalty Engine (`calculateSyndicationValuation`)
- **Upfront Bonus**: Derived from historical worldwide box office gross and critical quality scores: `Math.round(boxOffice * 0.05 + rating * 2500)` (Minimum ₹50,000).
- **Weekly Royalty**: Continuous cash flow stream: `Math.round((upfrontBonus / 12) * (0.8 + rating / 100))` (Minimum ₹5,000/week).
- **Contract Duration**:
  - `rating > 80`: 52 weeks (1 full simulation year).
  - `rating > 50`: 26 weeks.
  - Standard catalog: 12 weeks.

### 2. Turn Cycle Royalty Processing (`processWeeklySyndicationDeals`)
- Active contracts disburse weekly royalty yields directly into studio balance reserves.
- Decrements remaining contract terms and automatically transitions expired deals to `EXPIRED`.

## API Endpoints

- `GET /api/syndication/deals`: Retrieves all current and historical licensing deals signed by the studio.
- `GET /api/syndication/valuation/:movieId`: Calculates predictive upfront bonus and weekly royalty estimates for a catalog movie.
- `POST /api/syndication/deals`: Finalizes and executes a syndication licensing contract with upfront bonus disbursement.

## Frontend UI Integration
- Accessible at `/studio/syndication` (`SyndicationManager.jsx`).
- Features real-time catalog valuation preview modals, network package selection, and status trackers.
