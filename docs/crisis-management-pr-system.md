# Studio PR Crisis Management & Emergency Response System

## Overview
The Studio PR Crisis Management system simulates Hollywood scandals, media controversies, and reputation emergencies (actor scandals, script leaks, director walkouts, and public boycotts) that directly degrade studio prestige and box office sentiment.

## Core Simulation Metrics & Mechanics

### 1. Reputation Decay Simulation (`calculateWeeklyReputationImpact`)
- Every active scandal assesses a weekly prestige penalty against the studio (`reputationDamagePerWeek`).
- Accumulated penalties decrease studio prestige rating and audience goodwill until actively mitigated or resolved.

### 2. Strategy Mitigation Matrix (`evaluateCrisisResolution`)
Each PR resolution strategy features distinct financial costs and mitigation effectiveness:
- **`PUBLIC_APOLOGY`**: Cost ₹50,000 — 50% damage mitigation relief. Best for minor low-severity PR slips.
- **`PRESS_TOUR`**: Cost ₹100,000 — 70% damage mitigation relief. Effective charm offensive across major television and trade publications.
- **`SETTLEMENT_PAYOUT`**: Cost ₹250,000 — 90% damage mitigation relief. Swift confidential settlement ending legal exposure.
- **`LEGAL_ACTION`**: Cost ₹500,000 — 95% damage mitigation relief. Aggressive injunctions and lawsuits to suppress damaging claims.

## API Endpoints

- `GET /api/crisis/active`: Retrieves all active scandals and pending PR emergencies for the authenticated studio.
- `POST /api/crisis/resolve`: Dispatches a selected PR strategy with validation against studio cash reserves.

## Frontend UI Integration
- Accessible at `/studio/crisis` (`PRCrisisCenter.jsx`).
- Integrated into the global sidebar navigation with real-time incident counters and quick action deployment panels.
