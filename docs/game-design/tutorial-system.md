# Studio Director Onboarding & Tutorial System

## Overview
The Studio Director Onboarding system introduces new players to the core gameplay loops of Box Office Inc. It guides them sequentially through film ideation, script acquisition, creative packaging, physical production, marketing blitzes, and box office release.

---

## Onboarding Milestones

1. **WELCOME_STUDIO (`/`)**: Player reviews studio cash reserves, weekly payroll overhead, and studio reputation meters.
2. **SCOUT_SCRIPT (`/scripts`)**: Acquiring an initial screenplay with high genre compatibility and commercial viability.
3. **HIRE_DIRECTOR (`/directors`)**: Recruiting a director with matching genre expertise to maximize production synergy.
4. **CAST_ACTORS (`/actors`)**: Contracting lead actors and supporting talent within budget constraints.
5. **ASSEMBLE_CREW (`/crew`)**: Contracting crew teams to avoid production delays and budget overruns.
6. **GREENLIGHT_PRODUCTION (`/movies/create`)**: Allocating production budget and entering the pre-production pipeline.
7. **MARKETING_CAMPAIGN (`/marketing`)**: Funding promotional campaigns (trailers, social media hype, billboards) to generate audience anticipation.
8. **THEATRICAL_RELEASE (`/movies/ready`)**: Launching the theatrical debut, analyzing opening weekend grosses and review reception.
9. **STUDIO_EXPANSION (`/studio/upgrades`)**: Reinvesting box office profits into permanent studio infrastructure and talent academies.

---

## Technical Architecture

### Backend Services
- **Service:** `tutorialService.js` stores progress within `GameState.tutorial` and computes dynamic metrics.
- **Controller:** `tutorialController.js` handles advance, skip, replay, and tooltip dismissal.
- **Route:** `/api/tutorial` mounted with rate limiting and authentication middleware.

### Frontend Components
- **Context:** `TutorialContext.jsx` manages global tutorial state, drawer visibility, and backend synchronization.
- **Overlay:** `TutorialGuideOverlay.jsx` provides floating guidance with progress percentage and quick-action links.
- **Drawer:** `TutorialStepDrawer.jsx` provides an accessible roadmap timeline showing all milestones, completed checkmarks, and deep links.
