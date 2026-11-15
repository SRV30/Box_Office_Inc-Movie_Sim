import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import SimulationJob from "../src/models/SimulationJob.js";

test("SimulationJob model initializes with valid schema and default status", () => {
  const job = new SimulationJob({
    jobId: "test-sim-job-123",
    userId: "507f1f77bcf86cd799439011",
    studioId: "507f191e810c19729de860ea",
    targetWeek: 5,
  });

  assert.strictEqual(job.jobId, "test-sim-job-123");
  assert.strictEqual(job.targetWeek, 5);
  assert.strictEqual(job.status, "QUEUED");
  assert.strictEqual(job.retryCount, 0);
  assert.strictEqual(job.maxRetries, 3);
});
