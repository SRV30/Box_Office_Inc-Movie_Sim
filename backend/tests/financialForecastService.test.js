import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import GameState from "../src/models/GameState.js";
import Movie from "../src/models/Movie.js";
import Studio from "../src/models/Studio.js";
import { getFinancialForecast } from "../src/services/analytics/financialForecastService.js";

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("loads forecast data without mutating studio, movies, or game state", async () => {
  const userId = new mongoose.Types.ObjectId();
  const studio = await Studio.create({
    owner: userId,
    name: "Forecast Pictures",
    money: 500000,
    fanClub: { weeklyBudget: 100 },
    loans: [
      {
        amount: 10000,
        interestRate: 0.12,
        weeklyRepayment: 500,
        weeksRemaining: 4,
        takenWeek: 1,
      },
    ],
  });
  const gameState = await GameState.create({
    user: userId,
    currentWeek: 10,
    ownedWriters: [{ id: "writer-1", salary: 1000 }],
    streamingPlatforms: [{ id: "platform-1", popularity: 100 }],
  });

  await Movie.create([
    {
      studioId: studio._id,
      scriptId: "script-1",
      directorId: "director-1",
      leadActorId: "actor-1",
      crewTeamId: "crew-1",
      createdWeek: 1,
      title: "Released Feature",
      status: "RELEASED",
      releaseWeek: 5,
      boxOffice: 200000000,
      hype: 80,
      verdict: "HIT",
      streamingDeal: {
        platformId: "platform-1",
        dealValue: 1000000,
        exclusiveWeeks: 52,
        status: "ACCEPTED",
      },
    },
    {
      studioId: studio._id,
      scriptId: "script-2",
      directorId: "director-1",
      leadActorId: "actor-1",
      crewTeamId: "crew-1",
      createdWeek: 2,
      title: "Scheduled Feature",
      status: "READY_FOR_RELEASE",
      scheduledReleaseWeek: 12,
      budget: 50000000,
      marketingBudget: 10000000,
      quality: 80,
      hype: 80,
    },
    {
      studioId: studio._id,
      scriptId: "script-3",
      directorId: "director-1",
      leadActorId: "actor-1",
      crewTeamId: "crew-1",
      createdWeek: 3,
      title: "Far Future Feature",
      status: "READY_FOR_RELEASE",
      scheduledReleaseWeek: 20,
      budget: 50000000,
      marketingBudget: 10000000,
      quality: 80,
      hype: 80,
    },
  ]);

  const studioBefore = await Studio.findById(studio._id).lean();
  const gameStateBefore = await GameState.findById(gameState._id).lean();
  const moviesBefore = await Movie.find({ studioId: studio._id }).sort({ title: 1 }).lean();

  const result = await getFinancialForecast(userId, {
    weeks: 4,
    lowBalanceThreshold: 0,
    oneTimeExpense: 100000,
    weeklyExpense: 5000,
    scenarioWeeks: 2,
  });

  assert.equal(result.current.cashOnHand, 500000);
  assert.equal(result.base.cashFlow.length, 4);
  assert.equal(result.base.scheduledReleases.length, 1);
  assert.equal(result.base.scheduledReleases[0].title, "Scheduled Feature");
  assert.equal(result.scenario.cashFlow[0].scenarioExpenses, 105000);
  assert.equal(result.scenario.cashFlow[1].scenarioExpenses, 5000);
  assert.equal(result.scenario.cashFlow[2].scenarioExpenses, 0);

  const studioAfter = await Studio.findById(studio._id).lean();
  const gameStateAfter = await GameState.findById(gameState._id).lean();
  const moviesAfter = await Movie.find({ studioId: studio._id }).sort({ title: 1 }).lean();

  assert.deepEqual(studioAfter, studioBefore);
  assert.deepEqual(gameStateAfter, gameStateBefore);
  assert.deepEqual(moviesAfter, moviesBefore);
});
