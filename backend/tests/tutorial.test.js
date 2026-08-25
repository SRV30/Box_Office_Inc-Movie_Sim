import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import TutorialService, { TUTORIAL_STEPS } from "../src/services/tutorial/tutorialService.js";
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

test("Tutorial & Contextual Guidance - getTutorialState initializes new state", async () => {
  const userId = new mongoose.Types.ObjectId();

  await GameState.create({
    user: userId,
    studioName: "Starling Studios",
  });

  const state = await TutorialService.getTutorialState(userId);
  assert.equal(state.isActive, true);
  assert.equal(state.currentStep, 0);
  assert.equal(state.currentStepId, "WELCOME_STUDIO");
  assert.equal(state.allSteps.length, TUTORIAL_STEPS.length);
  assert.equal(state.isCompleted, false);
  assert.equal(state.isSkipped, false);
});

test("Tutorial & Contextual Guidance - advanceTutorial progresses steps sequentially", async () => {
  const userId = new mongoose.Types.ObjectId();

  await GameState.create({
    user: userId,
    studioName: "Paramount Test",
  });

  const step1 = await TutorialService.advanceTutorial(userId, { stepId: "WELCOME_STUDIO" });
  assert.equal(step1.currentStep, 1);
  assert.equal(step1.currentStepId, "SCOUT_SCRIPT");
  assert.ok(step1.completedSteps.includes("WELCOME_STUDIO"));

  const step2 = await TutorialService.advanceTutorial(userId, { stepId: "SCOUT_SCRIPT" });
  assert.equal(step2.currentStep, 2);
  assert.equal(step2.currentStepId, "HIRE_DIRECTOR");
});

test("Tutorial & Contextual Guidance - skipTutorial marks tutorial as skipped", async () => {
  const userId = new mongoose.Types.ObjectId();

  await GameState.create({
    user: userId,
    studioName: "Skipper Studios",
  });

  const state = await TutorialService.skipTutorial(userId);
  assert.equal(state.isActive, false);
  assert.equal(state.isSkipped, true);
});

test("Tutorial & Contextual Guidance - replayTutorial resets progress and increments replay count", async () => {
  const userId = new mongoose.Types.ObjectId();

  await GameState.create({
    user: userId,
    studioName: "Replay Studios",
  });

  await TutorialService.advanceTutorial(userId, { stepId: "WELCOME_STUDIO" });
  await TutorialService.advanceTutorial(userId, { stepId: "SCOUT_SCRIPT" });

  const replayed = await TutorialService.replayTutorial(userId);
  assert.equal(replayed.currentStep, 0);
  assert.equal(replayed.currentStepId, "WELCOME_STUDIO");
  assert.equal(replayed.completedSteps.length, 0);
  assert.equal(replayed.replayCount, 1);
  assert.equal(replayed.isActive, true);
});

test("Tutorial & Contextual Guidance - dismissTooltip saves dismissed tooltips", async () => {
  const userId = new mongoose.Types.ObjectId();

  await GameState.create({
    user: userId,
    studioName: "Tooltip Studios",
  });

  const res = await TutorialService.dismissTooltip(userId, "METRIC_ROI_EXPLAINED");
  assert.equal(res.success, true);
  assert.ok(res.dismissedTooltips.includes("METRIC_ROI_EXPLAINED"));

  const state = await TutorialService.getTutorialState(userId);
  assert.ok(state.dismissedTooltips.includes("METRIC_ROI_EXPLAINED"));
});
