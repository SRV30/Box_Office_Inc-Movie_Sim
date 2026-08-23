import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let mongod;
let server;
let baseUrl;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);

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

const registerUser = async (username, email) => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      email,
      password: "password123",
      studioName: `${username} Studios`,
    }),
  });
  return res.json();
};

test("Merchandise API - GET stats and POST boost level", async () => {
  // 1. Register a user
  const registerResult = await registerUser("merch_tycoon", "merch@example.com");
  const { token, studio } = registerResult;
  assert.ok(token);
  assert.ok(studio);

  // Get User ID from mongoose
  const dbStudio = await mongoose.connection.db.collection("studios").findOne({ _id: new mongoose.Types.ObjectId(studio.id || studio._id) });
  assert.ok(dbStudio);
  const userId = dbStudio.owner;

  // Update GameState for user (already created automatically during registration)
  const GameState = mongoose.model("GameState");
  const gameState = await GameState.findOneAndUpdate(
    { user: userId },
    { currentWeek: 10 },
    { new: true, upsert: true }
  );

  // Create a movie for this studio
  const Movie = mongoose.model("Movie");
  const movie = await Movie.create({
    title: "The Merch Movie",
    studioId: dbStudio._id,
    scriptId: "throwaway-script",
    directorId: "throwaway-director",
    leadActorId: "throwaway-actor",
    crewTeamId: "throwaway-crew",
    status: "RELEASED",
    boxOffice: 50000000,
    verdict: "HIT",
    hype: 80,
    createdWeek: 1,
    releaseWeek: 5,
    merchandiseLevel: 1,
    merchandiseRevenue: 15000,
  });

  // 2. Fetch Merchandise Stats
  const getStatsRes = await fetch(`${baseUrl}/api/merch`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(getStatsRes.status, 200);

  const stats = await getStatsRes.json();
  assert.ok(stats.activeMovies);
  assert.strictEqual(stats.activeMovies.length, 1);
  assert.strictEqual(stats.activeMovies[0].title, "The Merch Movie");
  assert.strictEqual(stats.activeMovies[0].merchandiseLevel, 1);
  assert.strictEqual(stats.activeMovies[0].merchandiseRevenue, 15000);

  // 3. Boost Merchandise Level
  const boostRes = await fetch(`${baseUrl}/api/merch/boost/${movie._id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(boostRes.status, 200);

  const boostData = await boostRes.json();
  assert.strictEqual(boostData.movie.merchandiseLevel, 2);

  // Verify DB updates
  const updatedMovie = await Movie.findById(movie._id);
  assert.strictEqual(updatedMovie.merchandiseLevel, 2);

  const updatedStudio = await mongoose.connection.db.collection("studios").findOne({ _id: dbStudio._id });
  assert.strictEqual(updatedStudio.money, dbStudio.money - 2500000);
});
