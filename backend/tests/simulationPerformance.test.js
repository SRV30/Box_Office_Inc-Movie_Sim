import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import { runWeeklySimulation } from "../src/services/simulation/runWeeklySimulation.js";
import { generateRivalStudios } from "../src/services/simulation/engines/rivalStudioEngine.js";

let mongod;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("Simulation Performance: 52-Week Multi-Tick Benchmarking & Bounded Memory", async () => {
  const gameState = {
    currentWeek: 0,
    rivalStudiosInitialized: false,
    rivalStudios: [],
    ownedActors: [
      { id: "act-1", name: "Star One", age: 30, salary: 50000, popularity: 70 },
      { id: "act-2", name: "Star Two", age: 25, salary: 30000, popularity: 50 },
    ],
    ownedDirectors: [
      { id: "dir-1", name: "Director A", age: 40, salary: 60000, reputation: 65 },
    ],
    ownedWriters: [],
    marketWriters: [],
    activeWritingProjects: [],
    activeDirectorProjects: [],
    activeMovies: [],
    retiredActors: [],
    retiredDirectors: [],
    notifications: [],
    marketTrends: { activeTrends: [] },
  };

  const studio = {
    name: "Performance Benchmark Studios",
    money: 20000000,
    prestige: 50,
    fans: 50000,
    totalRevenue: 0,
  };

  generateRivalStudios(gameState);

  const initialHeap = process.memoryUsage().heapUsed;
  const tickDurations = [];

  // Simulate 1 full year (52 weeks)
  for (let w = 1; w <= 52; w += 1) {
    const result = await runWeeklySimulation(gameState, studio);
    assert.ok(result.telemetry);
    assert.ok(result.telemetry.durationMs >= 0);
    tickDurations.push(result.telemetry.durationMs);
  }

  const finalHeap = process.memoryUsage().heapUsed;
  const heapDeltaMB = (finalHeap - initialHeap) / (1024 * 1024);

  // Assert simulation advanced exactly 52 weeks
  assert.equal(gameState.currentWeek, 52);

  // Assert tick duration remains scalable under 250ms latency budget
  const avgDuration = tickDurations.reduce((a, b) => a + b, 0) / tickDurations.length;
  assert.ok(avgDuration < 250, `Average tick duration was ${avgDuration}ms, expected < 250ms`);

  // Assert heap growth is bounded (< 50MB for 52 ticks)
  assert.ok(heapDeltaMB < 50, `Heap growth was ${heapDeltaMB}MB, expected < 50MB`);
});
