# Studio Real Estate & VFX Facility Infrastructure System

## Overview
The Studio Facility Infrastructure module allows movie studios to acquire physical real estate, construct advanced soundstages, build LED virtual production volumes, establish post-production sound facilities, and lease idle assets for recurring weekly revenue.

## Facility Categories & Capabilities

1. **SOUNDSTAGE_COMPLEX**: Large-scale multi-acre production stages that improve physical shooting quality and production bandwidth (Base Cost: ₹500,000).
2. **VFX_VIRTUAL_PRODUCTION_LED**: High-end LED Volume wall enabling real-time in-camera visual effects and CGI quality bonuses (Base Cost: ₹1,200,000).
3. **POST_PRODUCTION_SUITE**: Dolby Atmos audio mastering, color-grading, and editorial suites (Base Cost: ₹350,000).
4. **BACKLOT_SET**: Modular historical, fantasy, and urban sets reducing location shooting overhead (Base Cost: ₹450,000).

## Simulation Mechanics & Upgrade Formulas

### 1. Upgrade Tier Progression (`calculateFacilityUpgrade`)
- Facilities scale from **Tier 1** up to **Tier 5**.
- **Quality Boost**: `nextTier * 4 pts` per facility.
- **Weekly Maintenance Overhead**: `cost * 1%` deducted weekly.
- **Third-Party Rental Yield**: `maintenanceCost * 1.5` per week when leased out.

### 2. Weekly Simulation Cycle (`processWeeklyFacilities`)
- Aggregates ongoing facility maintenance across all owned infrastructure.
- Credits leasing income for facilities set to `isRentedToThirdParty: true`.

## API Endpoints

- `GET /api/facilities/list`: Fetches all facility assets owned by the studio.
- `POST /api/facilities/build`: Commissions new facility construction or tier upgrades.
- `POST /api/facilities/rental`: Toggles third-party leasing mode on or off.

## Frontend UI Integration
- Accessible at `/studio/facilities` (`FacilityManager.jsx`).
- Connected directly into the primary studio sidebar navigation.
