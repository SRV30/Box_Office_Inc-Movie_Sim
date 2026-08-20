# Cinematic Universe Continuity & Franchise Ecosystem Synergy Architecture

## Overview
The Cinematic Universe Continuity & Franchise Ecosystem engine provides a complete simulation framework for managing interconnected cinematic universes, spin-off franchises, team-up crossovers, audience fatigue mitigation, and lore continuity.

## Core Simulation Metrics & Mechanics

### 1. Universe Fatigue Engine (`calculateUniverseFatigue`)
- Tracks consecutive releases per calendar year within the same shared universe.
- Up to 2 releases per year operate at peak audience engagement (0% fatigue, 1.0x decay multiplier).
- Excess releases over 2 induce audience franchise fatigue (`excess * 25%`), triggering revenue decay penalties (`decayMultiplier = 1.0 - fatigueScore * 0.004`).

### 2. Crossover Hype Multiplier (`calculateCrossoverHype`)
- Dynamic event multipliers for movies that intersect multiple sub-franchise character rosters or storylines.
- Multiplier scales with sub-franchise breadth and narrative consistency: `1.0 + (count - 1) * 0.15 * (loreConsistency / 100)`.

### 3. Lore Consistency Tracking (`evaluateLoreConsistency`)
- Evaluates scriptwriting team continuity across sequels and spin-offs.
- Retaining key creative writers adds `+5` points to lore consistency (capped at 100).
- Discontinuous writer replacements incur a `-15` point narrative consistency penalty.

### 4. Franchise Synergy Computation (`calculateUniverseSynergy`)
- Combines installment momentum, critical pedigree averages, and fatigue decay to compute net box office multipliers between `0.5x` and `2.5x`.

## API Endpoints

- `GET /api/franchises/universe-synergy/:franchiseId`: Fetches real-time synergy metrics, fatigue score, decay factor, and lore consistency.
- `POST /api/franchises/:id/spinoff`: Greenlights a spin-off franchise inheriting 30% parent fanbase multiplier.
- `POST /api/franchises/crossover`: Merges two existing studio franchises into an interconnected crossover event.

## Frontend UI Integration
- `UniverseManager.jsx`: Renders real-time synergy meters, fanbase bonuses, crossover boosts, and color-coded audience fatigue indicators within the Studio Franchise Detail command center.
