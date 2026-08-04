# Film Distribution Territory Licensing & International Sales

## Overview
The International Territory Licensing module allows movie studios to negotiate distribution rights across key international regions (Europe, Asia-Pacific, Latin America, Middle East/Africa).

## Licensing Deal Models
1. **Minimum Guarantee (MG)**: High guaranteed upfront payment to the studio with lower backend box office royalty percentages (15%).
2. **Revenue Share**: Lower upfront payment, but higher backend international box office revenue participation (55%).
3. **Localization Costs**: Studios fund dubbing and subtitling expenses for local market releases.

## API Endpoints
- `GET /api/territories/deals`: Fetch active international distribution contracts.
- `GET /api/territories/offer`: Calculate regional distribution offer metrics.
- `POST /api/territories/sign`: Execute an international territory licensing deal.
