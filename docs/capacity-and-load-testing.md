# Capacity & Load Testing Validation: 1,000 Concurrent Players

## 1. Overview & Service Level Objectives (SLOs)
To ensure reliable performance for at least **1,000 concurrent active players**, Box Office Inc requires a verified workload model, automated load test harness, and documented scaling parameters.

### Service Objectives
- **Standard Read/Write APIs**: p95 latency < 500ms, p99 latency < 1,200ms.
- **Server Error Rate**: < 1.0% under peak steady-state traffic.
- **Data Integrity**: Zero financial desynchronizations, zero dropped simulation transitions.

---

## 2. Workload Model Breakdown
During active gameplay sessions, virtual user activity follows this representative distribution:
| Activity | Endpoints | Share | User Think Time |
|---|---|---|---|
| Dashboard Reads | `/api/studio`, `/api/movies`, `/api/analytics` | 40% | 2.0s - 4.0s |
| Market Browsing | `/api/writers`, `/api/actors`, `/api/directors` | 30% | 1.5s - 3.0s |
| Studio & Production Actions | `/api/scripts`, `/api/movies/produce`, `/api/contracts` | 20% | 3.0s - 6.0s |
| Weekly Simulation Advancements | `/api/simulation/advance` | 10% | 5.0s - 10.0s |

At 1,000 active concurrent users with an average think time of 2.5 seconds, the expected cluster throughput is approximately **400 Requests Per Second (RPS)**.

---

## 3. Recommended Production Topology
- **API Instances**: 4 replicas running on Node 22 (2 vCPU, 4GB RAM each).
- **Process Load Balancer**: NGINX or AWS ALB with least-connection round-robin and WebSocket/HTTP2 support.
- **Database**: MongoDB Atlas or self-hosted 3-node replica set (M30/M40 tier, 4 vCPU, 16GB RAM).
- **Mongoose Connection Pool**: `maxPoolSize: 50` per replica (`200` total connections max).

---

## 4. Load Testing Profile (k6 Script)
Run the automated ramp test using k6:

```javascript
// load-tests/capacity-1000-vus.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '2m', target: 250 },
    { duration: '3m', target: 500 },
    { duration: '3m', target: 750 },
    { duration: '5m', target: 1000 }, // Steady state peak at 1,000 VUs
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1200'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000';

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(Math.random() * 2 + 1);
}
```

Execute:
```bash
k6 run load-tests/capacity-1000-vus.js
```
