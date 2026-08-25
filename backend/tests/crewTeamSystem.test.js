import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import CrewTeamEngine from "../src/services/crew/crewTeamEngine.js";
import GameState from "../src/models/GameState.js";

let mongod;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("Crew Team System - calculateProductionImpact computes quality and delay risk", () => {
  const eliteCrew = {
    technicalQuality: 90,
    vfxQuality: 85,
    creativity: 80,
    reliability: 95,
    morale: 100,
  };

  const impact = CrewTeamEngine.calculateProductionImpact(eliteCrew);
  assert.ok(impact.qualityScoreModifier >= 10, "Elite crew should provide high quality modifier");
  assert.ok(impact.delayRiskPercent <= 10, "High reliability should minimize delay risk");
  assert.ok(impact.budgetEfficiency >= 1.0, "High reliability should enhance budget efficiency");
});

test("Crew Team System - checkConflictAndOverbooking detects busy state", () => {
  const busyCrew = {
    status: "BUSY",
    busyUntilWeek: 12,
  };

  const checkWeek10 = CrewTeamEngine.checkConflictAndOverbooking(busyCrew, 10);
  assert.equal(checkWeek10.isAvailable, false);
  assert.equal(checkWeek10.remainingBusyWeeks, 2);

  const checkWeek13 = CrewTeamEngine.checkConflictAndOverbooking(busyCrew, 13);
  assert.equal(checkWeek13.isAvailable, true);
});

test("Crew Team System - assignCrewToMovie updates crew busy status", async () => {
  const userId = new mongoose.Types.ObjectId();

  await GameState.create({
    user: userId,
    currentWeek: 5,
    ownedCrewTeams: [
      {
        id: "crew_alpha",
        name: "Vanguard Production Unit",
        technicalQuality: 75,
        reliability: 80,
        status: "AVAILABLE",
      },
    ],
  });

  const assigned = await CrewTeamEngine.assignCrewToMovie(userId, "crew_alpha", 4);
  assert.equal(assigned.status, "BUSY");
  assert.equal(assigned.busyUntilWeek, 9);
});

test("Crew Team System - processWeeklyCrewTick recovers morale and increases skill on wrap", async () => {
  const userId = new mongoose.Types.ObjectId();

  await GameState.create({
    user: userId,
    currentWeek: 9,
    ownedCrewTeams: [
      {
        id: "crew_beta",
        name: "CineCraft Unit",
        technicalQuality: 60,
        reliability: 60,
        status: "BUSY",
        busyUntilWeek: 9,
        morale: 90,
      },
    ],
  });

  const result = await CrewTeamEngine.processWeeklyCrewTick(userId, 9);
  assert.equal(result.processed, 1);

  const updatedState = await GameState.findOne({ user: userId });
  const crew = updatedState.ownedCrewTeams[0];
  assert.equal(crew.status, "AVAILABLE");
  assert.equal(crew.technicalQuality, 61);
  assert.equal(crew.reliability, 61);
});
