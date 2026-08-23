import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { processWriterPayroll } from "../src/services/simulation/engines/payrollEngine.js";
import { processWeeklyTick } from "../src/services/simulation/engines/tickEngine.js";
import { runWeeklySimulation } from "../src/services/simulation/runWeeklySimulation.js";

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("Financial History - Weekly payroll and expenses tracking", async (t) => {
  await t.test("processWriterPayroll returns exact amount paid and floors correctly", () => {
    const gameState = {
      ownedWriters: [{ salary: 5000, totalEarnings: 0 }],
      ownedDirectors: [{ salary: 15000, totalEarnings: 0 }],
      ownedActors: [{ salary: 25000, totalEarnings: 0 }],
      ownedCrewTeams: [{ salary: 10000, totalEarnings: 0 }],
    };
    const studio = { money: 100000 };

    const paid = processWriterPayroll(gameState, studio);
    assert.strictEqual(paid, 55000);
    assert.strictEqual(studio.money, 45000);
  });

  await t.test("processWeeklyTick returns financialSummary including payroll", async () => {
    const gameState = {
      currentWeek: 1,
      ownedWriters: [{ salary: 2000, totalEarnings: 0 }],
      ownedDirectors: [],
      ownedActors: [],
      ownedCrewTeams: [],
      activeMovies: [],
      activeWritingProjects: [],
      activeDirectorProjects: [],
      rivalStudios: [],
      marketTrends: { activeTrends: [] },
    };
    const studio = { money: 50000, prestige: 10, fans: 100 };

    const tickResult = await processWeeklyTick(gameState, studio);
    assert.ok(tickResult.financialSummary);
    assert.strictEqual(tickResult.financialSummary.payroll, 2000);
    assert.strictEqual(tickResult.financialSummary.movieCosts, 0);
    assert.strictEqual(tickResult.financialSummary.marketingCosts, 0);
  });

  await t.test("runWeeklySimulation returns financialSummary", async () => {
    const gameState = {
      currentWeek: 2,
      ownedWriters: [{ salary: 3500, totalEarnings: 0 }],
      ownedDirectors: [],
      ownedActors: [],
      ownedCrewTeams: [],
      activeMovies: [],
      activeWritingProjects: [],
      activeDirectorProjects: [],
      rivalStudios: [],
      marketTrends: { activeTrends: [] },
    };
    const studio = { money: 60000, prestige: 10, fans: 100 };

    const simResult = await runWeeklySimulation(gameState, studio);
    assert.ok(simResult.financialSummary);
    assert.strictEqual(simResult.financialSummary.payroll, 3500);
  });
});
