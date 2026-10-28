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

### 1. Four-Pillar Jury Deliberation (`generateFestivalDeliberation`)
- Evaluates four separate artistic pillars: direction, screenplay, performances, and thematic depth.
- Each pillar is weighted according to the target festival profile (Cannes leans auteur-driven, Sundance favors originality, TIFF rewards audience pull, Venice emphasizes visual craft).
- The deliberation produces a total score in the 0-100 band, a standing ovation duration, and a consensus quote for the lobby wall or press scrum.
- Formula summary:
  - `direction = 0.45*quality + 0.35*criticScore + 0.20*hype`
  - `screenplay = 0.55*criticScore + 0.25*quality + 0.20*audienceScore`
  - `performances = 0.45*audienceScore + 0.30*quality + 0.25*hype`
  - `thematicDepth = 0.40*criticScore + 0.25*hype + 0.35*quality`
  - `totalScore = direction*weightDirection + screenplay*weightScreenplay + performances*weightPerformances + thematicDepth*weightThematicDepth`

### 2. Distributor Market Acquisition (`generateDistributorBids`)
- High jury scores trigger competitive distributor bidding wars.
- Each bidder offers a total package amount and a smaller advance payment.
- Bids are sorted by amount and stored under each festival submission for quick signing via the UI.

### 3. Trophy Room Laurels (`getFestivalLaurels`)
- Any submission with a non-`NONE` award is stored as a laurels record.
- The Trophy Room surfaces these records under a dedicated Festival Laurels tab with the film title, festival name, award title, and jury quote.

## API Endpoints

- `POST /api/festivals/submit`: Enters a completed studio feature into the selected festival jury competition.
- `GET /api/festivals/active`: Lists all festival submissions for the current studio, including deliberation and bid metadata.
- `GET /api/festivals/laurels`: Lists all won festival awards and laurels for the studio trophy room.
- `POST /api/festivals/withdraw`: Withdraws a submission prior to jury screening.
- `POST /api/festivals/accept-deal`: Signs a distributor bid, records the deal, and credits the advance to studio treasury.

## Frontend UI Integration
- Accessible at `/studio/festivals` (`FestivalCircuit.jsx`).
- Shows 4-pillar score bars, standing ovation badges, jury quotes, and distributor bidding cards with sign-deal actions.
- Accessible at `/studio/trophy-room` (`TrophyRoom.jsx`) under the Festival Laurels tab.
