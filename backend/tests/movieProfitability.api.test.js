import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import User from "../src/models/User.js";
import Studio from "../src/models/Studio.js";
import Movie from "../src/models/Movie.js";
import env from "../src/config/envConfig.js";

let mongod;
let server;
let baseUrl;
let ownerToken;
let otherToken;
let ownerStudio;
let movie;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());

  const owner = await User.create({
    username: "profitability_owner",
    email: "profitability-owner@example.com",
    password: "Password123!",
  });
  ownerStudio = await Studio.create({
    owner: owner._id,
    name: "Owner Pictures",
    money: 10000000,
  });
  ownerToken = jwt.sign(
    { userId: owner._id },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );

  const other = await User.create({
    username: "profitability_other",
    email: "profitability-other@example.com",
    password: "Password123!",
  });
  const otherStudio = await Studio.create({
    owner: other._id,
    name: "Other Pictures",
    money: 10000000,
  });
  otherToken = jwt.sign(
    { userId: other._id },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );

  movie = await Movie.create({
    title: "Profitability Test Movie",
    studioId: ownerStudio._id,
    scriptId: "script-profitability",
    directorId: "director-profitability",
    leadActorId: "actor-profitability",
    crewTeamId: "crew-profitability",
    createdWeek: 1,
    releaseWeek: 4,
    status: "RELEASED",
    budget: 100000000,
    marketingBudget: 20000000,
    budgetBreakdown: {
      scriptCost: 10000000,
      directorCost: 20000000,
      leadActorCost: 20000000,
      supportingActorCost: 10000000,
      crewCost: 15000000,
      soundtrackCost: 5000000,
      marketingCost: 20000000,
    },
    worldwideGross: 150000000,
    boxOffice: 150000000,
    merchandiseRevenue: 10000000,
    soundtrackRevenue: 5000000,
    cinemaMarketRevenue: [
      {
        marketId: "north-america",
        marketName: "North America",
        grossINR: 30000000,
        localizationCost: 2000000,
      },
    ],
  });

  await Movie.create({
    title: "Other Studio Movie",
    studioId: otherStudio._id,
    scriptId: "script-other",
    directorId: "director-other",
    leadActorId: "actor-other",
    crewTeamId: "crew-other",
    createdWeek: 1,
    status: "RELEASED",
    budget: 1000000,
    worldwideGross: 2000000,
  });

  const { default: app } = await import("../src/app.js");
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const get = (path, token) =>
  fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

test("GET /api/analytics/movies/:movieId/profitability returns canonical analytics", async () => {
  const response = await get(
    `/api/analytics/movies/${movie._id}/profitability`,
    ownerToken
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.movie.title, "Profitability Test Movie");

  const profitability = body.data.profitability;
  assert.equal(profitability.profitabilityStatus, "PROFITABLE");
  assert.equal(profitability.revenue.total, 165000000);
  assert.equal(profitability.revenue.reRelease, 0);
  assert.equal(profitability.expenses.production, 80000000);
  assert.equal(profitability.expenses.marketing, 20000000);
  assert.equal(profitability.expenses.localization, 2000000);
  assert.equal(profitability.expenses.total, 102000000);
  assert.equal(profitability.netProfit, 63000000);
  assert.equal(profitability.roiPercent, 61.76);
  assert.equal(profitability.profitMargin, 38.18);
  assert.equal(profitability.hasFinancialRecords, true);
});

test("GET /api/analytics/movies/:movieId/profitability is scoped to the studio owner", async () => {
  const response = await get(
    `/api/analytics/movies/${movie._id}/profitability`,
    otherToken
  );
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(body.message, "Movie not found");
});

test("GET /api/analytics/movies/:movieId/profitability returns 404 for unknown movies", async () => {
  const response = await get(
    `/api/analytics/movies/${new mongoose.Types.ObjectId()}/profitability`,
    ownerToken
  );

  assert.equal(response.status, 404);
});

test("GET /api/analytics/movies/:movieId/profitability returns 404 for malformed ids", async () => {
  const response = await get(
    "/api/analytics/movies/not-an-object-id/profitability",
    ownerToken
  );

  assert.equal(response.status, 404);
});

test("GET /api/analytics/movies/:movieId/profitability requires authentication", async () => {
  const response = await get(
    `/api/analytics/movies/${movie._id}/profitability`
  );

  assert.equal(response.status, 401);
});

test("GET /api/analytics/movies exposes canonical profitability fields", async () => {
  const response = await get("/api/analytics/movies?limit=10", ownerToken);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.movies.length >= 1);

  const report = body.data.movies.find(
    (item) => String(item._id) === String(movie._id)
  );
  assert.ok(report);
  assert.equal(report.profitabilityStatus, "PROFITABLE");
  assert.equal(report.profitabilityLabel, "Profitable");
  assert.equal(report.productionExpenses, 80000000);
  assert.equal(report.marketingExpenses, 20000000);
  assert.equal(report.localizationExpenses, 2000000);
  assert.equal(report.actualCost, 102000000);
  assert.equal(report.totalRevenue, 165000000);
  assert.equal(report.netProfit, 63000000);
  assert.equal(report.roi, 61.76);
});
