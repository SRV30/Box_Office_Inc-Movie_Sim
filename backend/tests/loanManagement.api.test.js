import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import Studio from "../src/models/Studio.js";
import User from "../src/models/User.js";
import GameState from "../src/models/GameState.js";
import { repayLoanEarly, getLoans, takeLoan } from "../src/controllers/loanController.js";

let mongod;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
};

test("Loan Controller - early payoff workflow settles loan and updates balance", async () => {
  const user = await User.create({
    username: "loan_hero",
    email: "hero@example.com",
    password: "password123",
  });

  const studio = await Studio.create({
    name: "Hero Studios",
    owner: user._id,
    money: 2000000,
    loans: [
      {
        amount: 500000,
        interestRate: 0.08,
        weeklyRepayment: 20000,
        weeksRemaining: 20,
        takenWeek: 1,
      },
    ],
  });

  const loanId = studio.loans[0]._id.toString();

  // 1. Check getLoans
  const getReq = { user };
  const getRes = createMockRes();
  await getLoans(getReq, getRes);
  assert.strictEqual(getRes.statusCode, 200);
  assert.strictEqual(getRes.data.loans.length, 1);
  assert.strictEqual(getRes.data.totalWeeklyDebt, 20000);

  // 2. Early payoff
  const repayReq = { user, params: { loanId } };
  const repayRes = createMockRes();
  await repayLoanEarly(repayReq, repayRes);

  assert.strictEqual(repayRes.statusCode, 200);
  assert.strictEqual(repayRes.data.success, true);
  assert.strictEqual(repayRes.data.paidAmount, 400000); // 20000 * 20
  assert.strictEqual(repayRes.data.remainingLoans.length, 0);

  // Verify in DB
  const updatedStudio = await Studio.findById(studio._id);
  assert.strictEqual(updatedStudio.loans.length, 0);
  assert.strictEqual(updatedStudio.money, 1600000); // 2000000 - 400000
});

test("Loan Controller - early payoff rejects when funds are insufficient", async () => {
  const user = await User.create({
    username: "broke_borrower",
    email: "broke@example.com",
    password: "password123",
  });

  const studio = await Studio.create({
    name: "Broke Studios",
    owner: user._id,
    money: 50000,
    loans: [
      {
        amount: 1000000,
        interestRate: 0.12,
        weeklyRepayment: 25000,
        weeksRemaining: 40,
        takenWeek: 1,
      },
    ],
  });

  const loanId = studio.loans[0]._id.toString();

  const repayReq = { user, params: { loanId } };
  const repayRes = createMockRes();
  await repayLoanEarly(repayReq, repayRes);

  assert.strictEqual(repayRes.statusCode, 400);
  assert.strictEqual(repayRes.data.success, false);
  assert.ok(repayRes.data.message.includes("Insufficient funds"));
});

test("Loan Controller - early payoff returns 404 for unknown loan", async () => {
  const user = await User.create({
    username: "ghost_borrower",
    email: "ghost@example.com",
    password: "password123",
  });

  await Studio.create({
    name: "Ghost Studios",
    owner: user._id,
    money: 1000000,
    loans: [],
  });

  const fakeId = new mongoose.Types.ObjectId().toString();
  const repayReq = { user, params: { loanId: fakeId } };
  const repayRes = createMockRes();
  await repayLoanEarly(repayReq, repayRes);

  assert.strictEqual(repayRes.statusCode, 404);
  assert.strictEqual(repayRes.data.message, "Active loan not found");
});
