# Horizontal Scaling and Stateless Architecture Architecture Guide

## 1. Overview
Supporting a large concurrent player population (1,000+ active players) requires the backend API to scale horizontally across multiple instances (e.g., Kubernetes Pods, AWS ECS tasks, or Docker Compose replicas) without relying on process-local state.

---

## 2. Statelessness Audit & Findings

### A. Authentication & Sessions
- **Status**: Stateless.
- **Implementation**: Uses JWT (JSON Web Tokens) with asymmetric/symmetric secrets.
- **Scaling Benefit**: Any API replica can verify access and refresh tokens without cross-instance sticky sessions or in-memory session lookups.

### B. Rate Limiting Coordination
- **Status**: Distributed via MongoDB (`MongoRateLimitStore`) or Redis.
- **Finding**: Process-local `Map` or memory stores do not enforce accurate rate limits across multiple replicas.
- **Action**: In multi-instance clusters, `RATE_LIMIT_STORE=mongo` (or Redis) must be enabled to coordinate rate limit windows across all nodes.

### C. Simulation Locking & Concurrency
- **Status**: Atomic DB-level locking (`GameState.isSimulating` and `SimulationJob`).
- **Finding**: Running heavy weekly simulations inside an uncoordinated server instance can lead to duplicate executions if requests hit different replicas.
- **Action**: Concurrency is safeguarded through MongoDB atomic conditional queries (`findOneAndUpdate`) with stale lock expiration.

### D. File Uploads & Static Assets
- **Status**: Frontend static assets are served through CDNs (Cloudflare / CloudFront) or NGINX edge caches.
- **Finding**: No persistent user uploads are written directly to local server disk storage.

---

## 3. Recommended Production Cluster Settings
| Parameter | Value | Description |
|---|---|---|
| `REPLICA_COUNT` | 4 - 8 | Horizontal API pods |
| `DB_POOL_MAX` | 30 - 50 | Per-replica connection limit to avoid exhausting MongoDB pool |
| `SHUTDOWN_TIMEOUT_MS` | 15000 | Graceful shutdown draining period |
| `SESSION_STICKINESS` | Disabled | Standard round-robin load balancing |

---

## 4. Graceful Shutdown & Worker Draining Runbook
When scaling in or deploying zero-downtime rolling updates:
1. Load balancer removes the terminating pod from active health checks (`/api/health`).
2. Server process intercepts `SIGTERM` and stops accepting new incoming HTTP connections.
3. In-flight requests are allowed up to 15 seconds to complete.
4. Active database connections in the Mongoose connection pool are safely closed.
