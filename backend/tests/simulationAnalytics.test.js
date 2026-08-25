import "./helpers/testEnv.js";

import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import SimulationAnalyticsService from "../src/services/analytics/simulationAnalyticsService.js";
import GameState from "../src/models/GameState.js";
import Studio from "../src/models/Studio.js";
import Movie from "../src/models/Movie.js";
import RivalStudio from "../src/models/RivalStudio.js";

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

test("Simulation Analytics & Historical Reports - getFinancialAnalytics", async () => {
  const userId = new mongoose.Types.ObjectId();

  await Studio.create({
    owner: userId,
    name: "Apex Pictures",
    money: 5000000,
    prestige: 60,
    financialHistory: [
      {
        week: 1,
        revenue: 1000000,
        expenses: 500000,
      },
      {
        week: 2,
        revenue: 1500000,
        expenses: 400000,
      },
      {
        week: 3,
        revenue: 800000,
        expenses: 200000,
      },
    ],
  });

  await GameState.create({
    user: userId,
    studioName: "Apex Pictures",
    currentWeek: 4,
  });

  const result = await SimulationAnalyticsService.getFinancialAnalytics(userId, { page: 1, limit: 2 });
  assert.equal(result.summary.currentCash, 5000000);
  assert.equal(result.summary.totalRevenue, 3300000);
  assert.equal(result.summary.totalExpenses, 1100000);
  assert.equal(result.summary.netProfit, 2200000);
  assert.equal(result.financials.length, 2);
  assert.equal(result.pagination.total, 3);
  assert.equal(result.pagination.totalPages, 2);
});

test("Simulation Analytics & Historical Reports - getMoviePerformanceReports", async () => {
  const userId = new mongoose.Types.ObjectId();

  const studio = await Studio.create({
    owner: userId,
    name: "Apex Pictures 2",
    money: 5000000,
  });

  await GameState.create({
    user: userId,
    studioName: "Apex Pictures 2",
  });

  await Movie.create([
    {
      studioId: studio._id,
      scriptId: "script_1",
      directorId: "dir_1",
      leadActorId: "actor_1",
      crewTeamId: "crew_1",
      createdWeek: 1,
      title: "Galactic Odyssey",
      genre: "Sci-Fi",
      status: "RELEASED",
      budget: 50000000,
      boxOffice: 180000000,
      worldwideGross: 180000000,
      openingWeekend: 60000000,
      weeksInTheaters: 8,
      criticScore: 88,
      profit: 125000000,
      roi: 227.27,
    },
    {
      studioId: studio._id,
      scriptId: "script_2",
      directorId: "dir_2",
      leadActorId: "actor_2",
      crewTeamId: "crew_2",
      createdWeek: 2,
      title: "Night Train",
      genre: "Thriller",
      status: "RELEASED",
      budget: 10000000,
      boxOffice: 8000000,
      worldwideGross: 8000000,
      openingWeekend: 3000000,
      weeksInTheaters: 4,
      criticScore: 62,
      profit: -4000000,
      roi: -33.33,
    },
  ]);

  const result = await SimulationAnalyticsService.getMoviePerformanceReports(userId, { page: 1, limit: 10 });
  assert.equal(result.summary.totalMoviesReleased, 2);
  assert.equal(result.summary.totalBudget, 60000000);
  assert.equal(result.summary.totalGross, 188000000);
  assert.equal(result.movies.length, 2);
  assert.equal(result.summary.hitRatio, 50);
});

test("Simulation Analytics & Historical Reports - getGenreAnalytics", async () => {
  const userId = new mongoose.Types.ObjectId();

  const studio = await Studio.create({
    owner: userId,
    name: "Apex Pictures 3",
  });

  await GameState.create({
    user: userId,
    studioName: "Apex Pictures 3",
  });

  await Movie.create([
    {
      studioId: studio._id,
      scriptId: "script_1",
      directorId: "dir_1",
      leadActorId: "actor_1",
      crewTeamId: "crew_1",
      createdWeek: 1,
      title: "Galactic Odyssey",
      genre: "Sci-Fi",
      status: "RELEASED",
      budget: 50000000,
      boxOffice: 180000000,
      worldwideGross: 180000000,
      criticScore: 88,
    },
    {
      studioId: studio._id,
      scriptId: "script_2",
      directorId: "dir_2",
      leadActorId: "actor_2",
      crewTeamId: "crew_2",
      createdWeek: 2,
      title: "Night Train",
      genre: "Thriller",
      status: "RELEASED",
      budget: 10000000,
      boxOffice: 8000000,
      worldwideGross: 8000000,
      criticScore: 62,
    },
  ]);

  const result = await SimulationAnalyticsService.getGenreAnalytics(userId);
  assert.equal(result.totalGenresExplored, 2);
  assert.ok(result.topPerformingGenre);
  assert.equal(result.topPerformingGenre.genre, "Sci-Fi");
  assert.equal(result.topPerformingGenre.movieCount, 1);
});

test("Simulation Analytics & Historical Reports - getTalentCareerTrajectories", async () => {
  const userId = new mongoose.Types.ObjectId();

  await GameState.create({
    user: userId,
    studioName: "Apex Pictures 4",
    ownedActors: [
      {
        id: "actor_1",
        name: "Marcus Vance",
        age: 38,
        actingSkill: 85,
        popularity: 90,
        salary: 5000000,
        boxOfficeTotal: 180000000,
        totalEarnings: 180000000,
        movies: 1,
      },
    ],
  });

  const result = await SimulationAnalyticsService.getTalentCareerTrajectories(userId);
  assert.equal(result.rosterCount, 1);
  assert.equal(result.topStar.name, "Marcus Vance");
  assert.equal(result.topStar.lifetimeGross, 180000000);
});

test("Simulation Analytics & Historical Reports - getRivalComparisons", async () => {
  const userId = new mongoose.Types.ObjectId();

  const studio = await Studio.create({
    owner: userId,
    name: "Apex Pictures 5",
    money: 10000000,
    prestige: 50,
  });

  await GameState.create({
    user: userId,
    studioName: "Apex Pictures 5",
  });

  await Movie.create([
    {
      studioId: studio._id,
      scriptId: "script_1",
      directorId: "dir_1",
      leadActorId: "actor_1",
      crewTeamId: "crew_1",
      createdWeek: 1,
      title: "Hero Film",
      genre: "Action",
      status: "RELEASED",
      boxOffice: 100000000,
      worldwideGross: 100000000,
    },
  ]);

  await RivalStudio.deleteMany({});
  await RivalStudio.create({
    name: "Summit Pictures",
    budget: 10000000,
    reputation: 75,
    producedMovies: [
      {
        title: "Summit Blockbuster",
        genre: "Action",
        budget: 50000000,
        boxOffice: 250000000,
      },
    ],
  });

  const result = await SimulationAnalyticsService.getRivalComparisons(userId);
  assert.ok(result.rankings.length >= 2);
  assert.equal(result.playerRank, 2); // 250M (Summit) > 100M (Apex Pictures 5)
});
