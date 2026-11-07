import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Movie from "../src/models/Movie.js";
import Studio from "../src/models/Studio.js";
import GameState from "../src/models/GameState.js";

let mongod;
let server;
let baseUrl;

before(async () => {
  mongod = await MongoMemoryServer.create();
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

const registerUser = async (username, email, studioName) => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      email,
      password: "password123",
      studioName,
    }),
  });
  return res.json();
};

test("Test Screenings & Reshoots API", async (t) => {
  const { token, studio, user } = await registerUser("test_screen_user", "screen@example.com", "Screening Studio");
  assert.ok(token);

  // Set up mock GameState talent busy status
  const gameState = await GameState.findOne({ user: user._id });
  gameState.ownedDirectors = [
    { id: "dir-1", name: "Spielberg", reliability: 90, creativity: 85, status: "BUSY", busyUntilWeek: 20 }
  ];
  gameState.ownedActors = [
    { id: "act-1", name: "DiCaprio", reliability: 80, actingSkill: 90, popularity: 95, status: "BUSY", busyUntilWeek: 20 }
  ];
  gameState.ownedCrewTeams = [
    { id: "crew-1", name: "Team A", reliability: 85, technicalQuality: 80, status: "BUSY", busyUntilWeek: 20 }
  ];
  gameState.ownedScripts = [
    { id: "scr-1", title: "Original Script", quality: 80, audienceAppeal: 85 }
  ];
  await gameState.save();

  // Create a mock movie in POST_PRODUCTION
  const movie = await Movie.create({
    title: "Post Prod Blockbuster",
    studioId: studio._id,
    scriptId: "scr-1",
    directorId: "dir-1",
    leadActorId: "act-1",
    crewTeamId: "crew-1",
    budget: 1000000,
    createdWeek: 1,
    status: "POST_PRODUCTION",
    quality: 75,
    weeksInStage: 2,
    remainingWeeks: 4,
  });
  assert.ok(movie._id);

  await t.test("POST /api/movies/:id/test-screening conducts a test screening", async () => {
    const res = await fetch(`${baseUrl}/api/movies/${movie._id}/test-screening`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    assert.strictEqual(res.status, 200);
    const result = await res.json();
    assert.strictEqual(result.success, true);
    assert.ok(result.projectedScore >= 0 && result.projectedScore <= 100);
    assert.strictEqual(result.movie.testScreeningScore, result.projectedScore);

    const updatedStudio = await Studio.findById(studio._id);
    // Deducted ₹50,000 cost: 10,000,000 - 50,000 = 9,950,000
    assert.strictEqual(updatedStudio.money, 9950000);
  });

  await t.test("POST /api/movies/:id/reshoots orders reshoots and updates variables", async () => {
    const res = await fetch(`${baseUrl}/api/movies/${movie._id}/reshoots`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    assert.strictEqual(res.status, 200);
    const result = await res.json();
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.movie.reshoots, 1);
    // Budget was 1,000,000. 15% is 150,000. Under minimum 200,000, so it should cost 200,000.
    assert.strictEqual(result.cost, 200000);

    const updatedStudio = await Studio.findById(studio._id);
    // 9,950,000 - 200,000 = 9,750,000
    assert.strictEqual(updatedStudio.money, 9750000);

    // Weeks in stage deferred by 2 (2 - 2 = 0)
    assert.strictEqual(result.movie.weeksInStage, 0);
    // Quality increased
    assert.ok(result.movie.quality > 75);

    // GameState talent extended by 2 weeks
    const updatedGameState = await GameState.findOne({ user: user._id });
    assert.strictEqual(updatedGameState.ownedDirectors[0].busyUntilWeek, 22);
    assert.strictEqual(updatedGameState.ownedActors[0].busyUntilWeek, 22);
    assert.strictEqual(updatedGameState.ownedCrewTeams[0].busyUntilWeek, 22);
  });

  await t.test("Rejects requests if movie is not in POST_PRODUCTION", async () => {
    // Update status to READY_FOR_RELEASE
    await Movie.findByIdAndUpdate(movie._id, { status: "READY_FOR_RELEASE" });

    const res = await fetch(`${baseUrl}/api/movies/${movie._id}/test-screening`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    assert.strictEqual(res.status, 400);
    const result = await res.json();
    assert.strictEqual(result.success, false);
  });

  await t.test("Rejects requests with 403 if movie belongs to another studio", async () => {
    const competitor = await registerUser("competitor_director", "rival@example.com", "Rival Studios");
    const competitorMovie = await Movie.create({
      title: "Competitor Film",
      studioId: competitor.studio._id,
      budget: 1000000,
      createdWeek: 1,
      status: "POST_PRODUCTION",
      quality: 70,
      weeksInStage: 1,
      remainingWeeks: 3,
    });

    const res = await fetch(`${baseUrl}/api/movies/${competitorMovie._id}/test-screening`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    assert.strictEqual(res.status, 403);
    const result = await res.json();
    assert.strictEqual(result.success, false);
    assert.ok(result.message.includes("Not authorized"));
  });
});
