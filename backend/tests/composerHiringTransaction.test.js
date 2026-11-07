import "./helpers/testEnv.js";

import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import Composer from "../src/models/Composer.js";
import Studio from "../src/models/Studio.js";
import User from "../src/models/User.js";
import { hireComposer, releaseComposerContract } from "../src/controllers/composerController.js";

let mongod;
let testUser;
let testStudio;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Studio.deleteMany({});
  await Composer.deleteMany({});

  testUser = await User.create({
    username: "testmaestro",
    email: "maestro@boxoffice.com",
    password: "hashedpassword123",
  });

  testStudio = await Studio.create({
    name: "Symphony Studios",
    owner: testUser._id,
    money: 500_000,
  });
});

test("hireComposer atomically deducts signing fee and updates contract status", async () => {
  const composer = await Composer.create({
    name: "Ludwig Scoring",
    age: 38,
    musicalTalent: 88,
    versatility: 82,
    popularity: 75,
    salary: 200_000, // 25% fee = 50,000
    genreExpertise: ["Sci-Fi", "Drama"],
    status: "AVAILABLE",
  });

  const req = {
    user: testUser,
    body: {
      composerId: composer._id.toString(),
      contractYears: 2,
    },
  };

  let responseData = null;
  let responseStatus = null;
  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await hireComposer(req, res, () => {});

  assert.equal(responseStatus, 200);
  assert.equal(responseData.success, true);
  assert.equal(responseData.data.status, "UNDER_CONTRACT");

  // Verify DB state
  const updatedStudio = await Studio.findById(testStudio._id);
  assert.equal(updatedStudio.money, 450_000); // 500k - 50k

  const updatedComposer = await Composer.findById(composer._id);
  assert.equal(updatedComposer.status, "UNDER_CONTRACT");
  assert.equal(updatedComposer.studio.toString(), testStudio._id.toString());
  assert.equal(updatedComposer.contractYears, 2);
});

test("hireComposer rejects and rolls back if studio has insufficient funds", async () => {
  testStudio.money = 10_000;
  await testStudio.save();

  const composer = await Composer.create({
    name: "Ennio Maestro",
    age: 50,
    salary: 200_000, // 25% fee = 50,000 > 10,000
    status: "AVAILABLE",
  });

  const req = {
    user: testUser,
    body: {
      composerId: composer._id.toString(),
      contractYears: 1,
    },
  };

  let responseStatus = null;
  let responseData = null;
  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await hireComposer(req, res, () => {});

  assert.equal(responseStatus, 400);
  assert.equal(responseData.success, false);
  assert.ok(responseData.message.includes("Insufficient"));

  // Check funds and composer remain unchanged
  const freshStudio = await Studio.findById(testStudio._id);
  assert.equal(freshStudio.money, 10_000);

  const freshComposer = await Composer.findById(composer._id);
  assert.equal(freshComposer.status, "AVAILABLE");
});

test("releaseComposerContract safely resets status to AVAILABLE within transaction", async () => {
  const composer = await Composer.create({
    name: "Alexandre Desplat",
    age: 42,
    salary: 150_000,
    status: "UNDER_CONTRACT",
    studio: testStudio._id,
    user: testUser._id,
    contractYears: 1,
  });

  const req = {
    user: testUser,
    params: {
      composerId: composer._id.toString(),
    },
  };

  let responseStatus = null;
  let responseData = null;
  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await releaseComposerContract(req, res, () => {});

  assert.equal(responseStatus, 200);
  assert.equal(responseData.success, true);

  const freshComposer = await Composer.findById(composer._id);
  assert.equal(freshComposer.status, "AVAILABLE");
  assert.equal(freshComposer.studio, null);
  assert.equal(freshComposer.contractYears, 0);
});
