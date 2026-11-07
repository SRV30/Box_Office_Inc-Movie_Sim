import "./helpers/testEnv.js";

import test from "node:test";
import assert from "node:assert/strict";
import { buildFinancialForecast } from "../src/services/analytics/financialForecastService.js";

const createGameState = (overrides = {}) => ({
  currentWeek: 10,
  ownedWriters: [{ id: "writer-1", salary: 1000 }],
  ownedDirectors: [{ id: "director-1", salary: 2000 }],
  ownedActors: [{ id: "actor-1", salary: 3000, popularity: 80 }],
  ownedCrewTeams: [{ id: "crew-1", salary: 4000 }],
  streamingPlatforms: [{ id: "platform-1", popularity: 100 }],
  ...overrides,
});

const createReleasedMovie = (overrides = {}) => ({
  _id: "released-1",
  title: "Galactic Odyssey",
  status: "RELEASED",
  releaseWeek: 5,
  boxOffice: 200000000,
  hype: 80,
  verdict: "HIT",
  soundtrackTier: "INDIE",
  streamingDeal: {
    platformId: "platform-1",
    dealValue: 1000000,
    exclusiveWeeks: 52,
    status: "ACCEPTED",
  },
  ...overrides,
});

const createStudio = (overrides = {}) => ({
  money: 1000000,
  fanClub: { weeklyBudget: 500 },
  loans: [{ amount: 100000, weeklyRepayment: 1000, weeksRemaining: 1 }],
  ...overrides,
});

test("projects recurring expenses, recurring revenue, and scheduled releases", () => {
  const result = buildFinancialForecast({
    studio: createStudio(),
    gameState: createGameState(),
    releasedMovies: [createReleasedMovie()],
    scheduledMovies: [
      {
        _id: "scheduled-1",
        title: "Arrival",
        status: "READY_FOR_RELEASE",
        scheduledReleaseWeek: 11,
        budget: 50000000,
        marketingBudget: 10000000,
        quality: 80,
        hype: 80,
        leadActorId: "actor-1",
        coProducerShare: 0,
      },
      {
        _id: "scheduled-2",
        title: "Far Future",
        status: "READY_FOR_RELEASE",
        scheduledReleaseWeek: 13,
        budget: 50000000,
        marketingBudget: 10000000,
        quality: 80,
        hype: 80,
        leadActorId: "actor-1",
        coProducerShare: 0,
      },
    ],
    socialAccounts: [{ weeklyBudget: 200 }, { weeklyBudget: 300 }],
    options: { weeks: 2 },
  });

  assert.equal(result.current.cashOnHand, 1000000);
  assert.equal(result.base.cashFlow.length, 2);
  assert.equal(result.base.scheduledReleases.length, 1);
  assert.equal(result.base.scheduledReleases[0].title, "Arrival");
  assert.equal(result.base.scheduledReleases[0].projectedOpeningWeekend, 21840000);
  assert.equal(result.base.scheduledReleases[0].projectedGross, 65520000);
  assert.equal(result.base.scheduledReleases[0].projectedProfit, 5520000);
  assert.equal(result.base.scheduledReleases[0].cashImpact, 5520000);

  const firstWeek = result.base.cashFlow[0];
  assert.equal(firstWeek.startingBalance, 1000000);
  assert.equal(firstWeek.payrollRequired, 10000);
  assert.equal(firstWeek.payrollPaid, 10000);
  assert.equal(firstWeek.fanClubPaid, 500);
  assert.equal(firstWeek.loanRepaymentsPaid, 1000);
  assert.equal(firstWeek.streamingRoyalties, 7500);
  assert.equal(firstWeek.merchandiseRevenue, 85031);
  assert.equal(firstWeek.soundtrackRevenue, 1470);
  assert.equal(firstWeek.scheduledReleaseIncome, 5520000);
  assert.equal(firstWeek.totalRevenue, 5614001);
  assert.equal(firstWeek.totalExpenses, 12000);
  assert.equal(firstWeek.socialMediaPaid, 500);
  assert.equal(firstWeek.endingBalance, 6602001);

  const secondWeek = result.base.cashFlow[1];
  assert.equal(secondWeek.startingBalance, 6602001);
  assert.equal(secondWeek.loanRepaymentDue, 0);
  assert.equal(secondWeek.loanRepaymentsPaid, 0);
  assert.equal(secondWeek.streamingRoyalties, 7500);
  assert.equal(secondWeek.merchandiseRevenue, 76528);
  assert.equal(secondWeek.soundtrackRevenue, 1397);
  assert.equal(secondWeek.scheduledReleaseIncome, 0);
  assert.equal(secondWeek.totalRevenue, 85425);
  assert.equal(secondWeek.totalExpenses, 11000);
  assert.equal(secondWeek.endingBalance, 6676426);
  assert.equal(result.base.summary.endingBalance, 6676426);
  assert.equal(result.base.summary.totalRevenue, 5699426);
  assert.equal(result.base.summary.totalExpenses, 23000);
  assert.equal(result.base.summary.lowBalanceWarning, false);
  assert.equal(result.base.summary.status, "STABLE");
});

test("pro-rates payroll and reports low-balance or shortfall weeks", () => {
  const payrollResult = buildFinancialForecast({
    studio: createStudio({ money: 10000, loans: [], fanClub: { weeklyBudget: 500 } }),
    gameState: createGameState({
      ownedWriters: [{ id: "writer-1", salary: 20000 }],
      ownedDirectors: [],
      ownedActors: [],
      ownedCrewTeams: [],
    }),
    options: { weeks: 2 },
  });

  assert.equal(payrollResult.base.cashFlow[0].payrollRequired, 20000);
  assert.equal(payrollResult.base.cashFlow[0].payrollPaid, 10000);
  assert.equal(payrollResult.base.cashFlow[0].fanClubPaid, 0);
  assert.equal(payrollResult.base.cashFlow[0].endingBalance, 0);
  assert.equal(payrollResult.base.summary.lowBalanceWarning, true);
  assert.equal(payrollResult.base.summary.firstLowBalanceWeek, 11);
  assert.equal(payrollResult.base.summary.status, "TIGHT");

  const shortfallResult = buildFinancialForecast({
    studio: createStudio({
      money: 5000,
      fanClub: { weeklyBudget: 0 },
      loans: [{ amount: 20000, weeklyRepayment: 10000, weeksRemaining: 2 }],
    }),
    gameState: createGameState({
      ownedWriters: [],
      ownedDirectors: [],
      ownedActors: [],
      ownedCrewTeams: [],
    }),
    options: { weeks: 2 },
  });

  assert.equal(shortfallResult.base.cashFlow[0].endingBalance, -5000);
  assert.equal(shortfallResult.base.cashFlow[1].endingBalance, -10000);
  assert.equal(shortfallResult.base.summary.lowBalanceWarning, true);
  assert.equal(shortfallResult.base.summary.lowestBalance, -10000);
  assert.equal(shortfallResult.base.summary.lowestBalanceWeek, 12);
  assert.equal(shortfallResult.base.summary.status, "SHORTFALL");
});

test("scenario analysis is pure and does not mutate inputs or the base forecast", () => {
  const studio = createStudio({
    money: 100000,
    fanClub: { weeklyBudget: 0 },
    loans: [{ amount: 5000, weeklyRepayment: 1000, weeksRemaining: 5 }],
  });
  const gameState = createGameState({
    ownedWriters: [],
    ownedDirectors: [],
    ownedActors: [],
    ownedCrewTeams: [],
  });
  const releasedMovies = [];
  const scheduledMovies = [];
  const socialAccounts = [];

  const studioSnapshot = JSON.parse(JSON.stringify(studio));
  const gameStateSnapshot = JSON.parse(JSON.stringify(gameState));

  const result = buildFinancialForecast({
    studio,
    gameState,
    releasedMovies,
    scheduledMovies,
    socialAccounts,
    options: {
      weeks: 2,
      oneTimeExpense: 60000,
      weeklyExpense: 30000,
      scenarioWeeks: 2,
    },
  });

  assert.deepEqual(studio, studioSnapshot);
  assert.deepEqual(gameState, gameStateSnapshot);
  assert.equal(result.base.summary.endingBalance, 98000);
  assert.equal(result.scenario.inputs.oneTimeExpense, 60000);
  assert.equal(result.scenario.inputs.weeklyExpense, 30000);
  assert.equal(result.scenario.inputs.weeklyExpenseWeeks, 2);
  assert.equal(result.scenario.cashFlow[0].scenarioExpenses, 90000);
  assert.equal(result.scenario.cashFlow[0].endingBalance, 9000);
  assert.equal(result.scenario.cashFlow[1].scenarioExpenses, 30000);
  assert.equal(result.scenario.cashFlow[1].endingBalance, -22000);
  assert.equal(result.scenario.summary.status, "SHORTFALL");
  assert.equal(result.scenario.impact.endingBalanceDelta, -120000);
  assert.equal(result.scenario.impact.additionalExpenses, 120000);
  assert.equal(result.base.summary.endingBalance, 98000);
});

test("ignores recorded financial history so past transactions are not counted again", () => {
  const result = buildFinancialForecast({
    studio: createStudio({
      money: 250000,
      fanClub: { weeklyBudget: 0 },
      loans: [],
      financialHistory: [
        { week: 8, revenue: 90000000, expenses: 1000000, profit: 89000000 },
        { week: 9, revenue: 50000000, expenses: 2000000, profit: 48000000 },
      ],
    }),
    gameState: createGameState({
      ownedWriters: [],
      ownedDirectors: [],
      ownedActors: [],
      ownedCrewTeams: [],
    }),
    options: { weeks: 2 },
  });

  assert.equal(result.base.cashFlow[0].totalRevenue, 0);
  assert.equal(result.base.cashFlow[1].totalRevenue, 0);
  assert.equal(result.base.summary.totalRevenue, 0);
  assert.equal(result.base.cashFlow[0].startingBalance, 250000);
  assert.equal(result.base.cashFlow[1].endingBalance, 250000);
});

test("streaming royalties start after the release week and stop at the exclusivity limit", () => {
  const result = buildFinancialForecast({
    studio: createStudio({ money: 0, fanClub: { weeklyBudget: 0 }, loans: [] }),
    gameState: createGameState({
      ownedWriters: [],
      ownedDirectors: [],
      ownedActors: [],
      ownedCrewTeams: [],
    }),
    releasedMovies: [
      createReleasedMovie({
        releaseWeek: 10,
        boxOffice: 0,
        hype: 0,
        soundtrackTier: "PUBLIC_DOMAIN",
        streamingDeal: {
          platformId: "platform-1",
          dealValue: 1000000,
          exclusiveWeeks: 2,
          status: "ACCEPTED",
        },
      }),
    ],
    options: { weeks: 4 },
  });

  assert.equal(result.base.cashFlow[0].streamingRoyalties, 7500);
  assert.equal(result.base.cashFlow[1].streamingRoyalties, 7500);
  assert.equal(result.base.cashFlow[2].streamingRoyalties, 0);
  assert.equal(result.base.cashFlow[3].streamingRoyalties, 0);
});
