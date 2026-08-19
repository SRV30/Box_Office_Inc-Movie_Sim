# Film Festival Circuit & Prestige Jury Engine Architecture

## Overview
The Film Festival Circuit Engine simulates premiere film festival competition (Cannes, Venice, TIFF, Sundance), jury reaction scoring, award bestowals, critic hype multipliers, and film market distributor acquisition buyouts.

## Supported Festivals & Prestige Weighting

1. **Cannes Film Festival (`CANNES`)**:
   - Focus: Auteur artistic quality & critical prestige.
   - Top Honor: `PALME_D_OR` (+1000 Prestige, +35% Critic Hype Boost).
   - Entry Fee: ₹500,000.
2. **Venice International Film Festival (`VENICE`)**:
   - Focus: High cinematic pedigree & visionary storytelling.
   - Top Honor: `GOLDEN_LION` (+800 Prestige, +30% Critic Hype Boost).
   - Entry Fee: ₹400,000.
3. **Toronto International Film Festival (`TIFF`)**:
   - Focus: Audience popularity catalyst & awards-season momentum.
   - Top Honor: `PEOPLES_CHOICE` (+600 Prestige, +25% Critic Hype Boost).
   - Entry Fee: ₹300,000.
4. **Sundance Film Festival (`SUNDANCE`)**:
   - Focus: Independent vision, innovation, and breakout discoveries.
   - Top Honor: `GRAND_JURY_PRIZE` (+500 Prestige, +20% Critic Hype Boost).
   - Entry Fee: ₹250,000.

## Simulation Mechanics

### 1. Jury Score Calculation (`calculateFestivalJuryScore`)
- Evaluates script quality, directorial mastery, and critical reception tailored to individual festival jury preferences.
- High scores (`>= 85`) earn coveted festival awards (`AWARDED`).
- Low scores (`< 50`) result in festival rejection (`REJECTED`).

### 2. Distributor Market Acquisition (`calculateMarketDistributionOffer`)
- High jury scores at prestigious festivals generate distributor bidding wars.
- Provides immediate cash acquisition offers scaling with jury scores over 60: `Math.round(budget * (1.2 + (juryScore - 60) * 0.02))`.

## API Endpoints

- `POST /api/festivals/submit`: Enters a completed studio feature into the selected festival jury competition.
- `GET /api/festivals/active`: Lists all past and present festival submissions for the current studio.
- `POST /api/festivals/withdraw`: Withdraws a submission prior to jury screening.

## Frontend UI Integration
- Accessible at `/studio/festivals` (`FestivalCircuit.jsx`).
- Integrated into the global studio sidebar with festival selection modals and award showcase cards.
