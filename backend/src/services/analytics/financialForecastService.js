import GameState from "../../models/GameState.js";
import Movie from "../../models/Movie.js";
import SocialMediaAccount from "../../models/SocialMediaAccount.js";
import Studio from "../../models/Studio.js";
import { SOUNDTRACK_TIERS } from "../../constants/soundtrackTiers.js";
import { generateBoxOfficeProjection } from "../simulation/engines/analystProjectionEngine.js";

export const DEFAULT_FORECAST_WEEKS = 4;
export const MAX_FORECAST_WEEKS = 12;
export const DEFAULT_LOW_BALANCE_THRESHOLD = 0;
export const WEEKLY_STREAMING_ROYALTY_RATE = 0.005;
export const PROJECTED_RELEASE_LEGS_MULTIPLIER = 3;

const FORECAST_ASSUMPTIONS = [
  "The forecast starts from the next simulated week and excludes transactions already recorded in the ledger.",
  "Payroll follows the weekly engine: salaries are pro-rated when cash is short and skipped when the studio is at or below zero.",
  "Fan-club and social-media budgets are only deducted when the studio can afford them, matching the weekly tick.",
  "Recurring streaming, merchandise, and soundtrack income uses current deal values, hype, and release dates.",
  "Scheduled releases use the analyst midpoint opening projection with a 3x legs multiplier and are treated as net profit.",
  "Facility maintenance is excluded because it is not deducted by the weekly simulation tick.",
  "Scenario inputs are hypothetical and never persisted to the studio or game state.",
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNonNegativeNumber = (value, fallback = 0) =>
  Math.max(0, toNumber(value, fallback));

const toPositiveInteger = (value, fallback, max) => {
  const parsed = Math.floor(toNumber(value, fallback));
  return Math.min(max, Math.max(1, parsed));
};

const roundCurrency = (value) => Math.round(toNumber(value));

const getTalentList = (gameState) => [
  ...(gameState.ownedWriters || []),
  ...(gameState.ownedDirectors || []),
  ...(gameState.ownedActors || []),
  ...(gameState.ownedCrewTeams || []),
];

const calculatePayroll = (balance, talents) => {
  const totalRequired = talents.reduce(
    (sum, talent) => sum + toNonNegativeNumber(talent?.salary),
    0
  );

  if (totalRequired <= 0 || balance <= 0) {
    return { required: totalRequired, paid: 0 };
  }

  const coverage = Math.min(1, balance / totalRequired);
  const paid = talents.reduce(
    (sum, talent) =>
      sum + Math.floor(toNonNegativeNumber(talent?.salary) * coverage),
    0
  );

  return {
    required: totalRequired,
    paid: Math.min(balance, paid),
  };
};

const calculateStreamingRoyalty = (movie, gameState, projectWeek) => {
  const deal = movie?.streamingDeal;
  if (!deal || deal.status !== "ACCEPTED") return 0;

  const dealValue = toNonNegativeNumber(deal.dealValue);
  const exclusiveWeeks = toNonNegativeNumber(deal.exclusiveWeeks);
  const releaseWeek = toNumber(movie.releaseWeek, NaN);

  if (dealValue <= 0 || exclusiveWeeks <= 0 || Number.isNaN(releaseWeek)) {
    return 0;
  }

  const weeksElapsed = projectWeek - releaseWeek;
  if (weeksElapsed < 1 || weeksElapsed > exclusiveWeeks) return 0;

  const platform = (gameState.streamingPlatforms || []).find(
    (entry) => entry.id === deal.platformId
  );
  const popularityFactor = platform
    ? 0.5 + toNonNegativeNumber(platform.popularity) / 100
    : 1;

  return roundCurrency(
    dealValue * WEEKLY_STREAMING_ROYALTY_RATE * popularityFactor
  );
};

const calculateMerchandise = (movie, projectWeek) => {
  if (movie?.status !== "RELEASED") return 0;
  if (toNonNegativeNumber(movie.boxOffice) <= 100000000 && toNonNegativeNumber(movie.hype) <= 70) {
    return 0;
  }

  const potential = toNonNegativeNumber(movie.boxOffice) * 0.001;
  let modifier = toNonNegativeNumber(movie.hype, 50) / 100;

  if (movie.verdict === "Blockbuster" || movie.verdict === "All-Time Blockbuster") {
    modifier *= 1.5;
  } else if (movie.verdict === "Hit") {
    modifier *= 1.2;
  } else if (movie.verdict === "Flop" || movie.verdict === "Disaster") {
    modifier *= 0.2;
  }

  const releaseWeek = toNumber(movie.releaseWeek, projectWeek);
  const weeksSinceRelease = Math.max(1, projectWeek - releaseWeek);
  const decay = Math.pow(0.9, weeksSinceRelease);

  return roundCurrency(potential * modifier * decay);
};

const calculateSoundtrack = (movie, projectWeek) => {
  if (movie?.status !== "RELEASED") return 0;

  const tierId = movie.soundtrackTier || "PUBLIC_DOMAIN";
  const config = SOUNDTRACK_TIERS[tierId];
  if (!config || config.baseWeeklyRevenue <= 0) return 0;

  const releaseWeek = toNumber(movie.releaseWeek, projectWeek);
  const weeksSinceRelease = Math.max(1, projectWeek - releaseWeek);
  const decay = Math.pow(0.95, weeksSinceRelease);

  return roundCurrency(config.baseWeeklyRevenue * decay);
};

const calculateScheduledRelease = (movie, gameState) => {
  const leadActor =
    (gameState.ownedActors || []).find(
      (actor) => actor.id === movie.leadActorId
    ) || { popularity: 50 };

  const projection = generateBoxOfficeProjection(movie, leadActor, 1);
  const projectedGross =
    projection.mid * PROJECTED_RELEASE_LEGS_MULTIPLIER;
  const totalBudget =
    toNonNegativeNumber(movie.budget) +
    toNonNegativeNumber(movie.marketingBudget);
  const coProducerShare = Math.min(
    100,
    toNonNegativeNumber(movie.coProducerShare)
  );
  const projectedProfit = roundCurrency(projectedGross - totalBudget);

  return {
    movieId: movie._id ? String(movie._id) : null,
    title: movie.title || "Untitled",
    week: toNumber(movie.scheduledReleaseWeek),
    projectedOpeningWeekend: projection.mid,
    projectedGross: roundCurrency(projectedGross),
    projectedProfit,
    cashImpact: roundCurrency(projectedProfit * (1 - coProducerShare / 100)),
    analystRating: projection.analystRating,
  };
};

const buildWeeklyBreakdown = ({
  studio,
  gameState,
  releasedMovies,
  scheduledMovies,
  socialAccounts,
  horizonWeeks,
  currentWeek,
  scenario = null,
}) => {
  const talents = getTalentList(gameState);
  const loans = (studio.loans || [])
    .map((loan) => ({
      weeklyRepayment: toNonNegativeNumber(loan?.weeklyRepayment),
      weeksRemaining: Math.max(0, Math.floor(toNumber(loan?.weeksRemaining))),
    }))
    .filter((loan) => loan.weeklyRepayment > 0 && loan.weeksRemaining > 0);

  const fanClubBudget = toNonNegativeNumber(studio.fanClub?.weeklyBudget);
  const socialMediaAccounts = (socialAccounts || []).map((account) => ({
    weeklyBudget: toNonNegativeNumber(account?.weeklyBudget),
  }));
  const socialMediaBudget = socialMediaAccounts.reduce(
    (sum, account) => sum + account.weeklyBudget,
    0
  );

  let balance = toNumber(studio.money);
  const cashFlow = [];
  const scheduledReleaseDetails = [];

  for (let offset = 1; offset <= horizonWeeks; offset += 1) {
    const projectWeek = currentWeek + offset;
    const startingBalance = roundCurrency(balance);

    const payroll = calculatePayroll(balance, talents);
    balance = Math.max(0, balance - payroll.paid);

    const fanClubPaid = fanClubBudget > 0 && balance >= fanClubBudget ? fanClubBudget : 0;
    balance -= fanClubPaid;

    let loanRepaymentDue = 0;
    let loanRepaymentsPaid = 0;
    for (const loan of loans) {
      if (loan.weeksRemaining <= 0) continue;
      loanRepaymentDue += loan.weeklyRepayment;
      const payment = Math.min(
        loan.weeklyRepayment,
        Math.max(0, balance + loan.weeklyRepayment)
      );
      balance -= payment;
      loanRepaymentsPaid += payment;
      loan.weeksRemaining -= 1;
    }

    let streamingRoyalties = 0;
    let merchandiseRevenue = 0;
    let soundtrackRevenue = 0;
    for (const movie of releasedMovies) {
      streamingRoyalties += calculateStreamingRoyalty(movie, gameState, projectWeek);
      merchandiseRevenue += calculateMerchandise(movie, projectWeek);
      soundtrackRevenue += calculateSoundtrack(movie, projectWeek);
    }

    let scheduledReleaseIncome = 0;
    for (const movie of scheduledMovies) {
      if (toNumber(movie.scheduledReleaseWeek) !== projectWeek) continue;
      const release = calculateScheduledRelease(movie, gameState);
      scheduledReleaseIncome += release.cashImpact;
      scheduledReleaseDetails.push(release);
    }

    const totalRevenue =
      streamingRoyalties +
      merchandiseRevenue +
      soundtrackRevenue +
      scheduledReleaseIncome;
    balance += totalRevenue;

    let socialMediaPaid = 0;
    for (const account of socialMediaAccounts) {
      if (account.weeklyBudget <= 0 || balance < account.weeklyBudget) continue;
      balance -= account.weeklyBudget;
      socialMediaPaid += account.weeklyBudget;
    }

    let scenarioExpenses = 0;
    if (scenario) {
      if (offset === 1) scenarioExpenses += scenario.oneTimeExpense;
      if (offset <= scenario.weeklyExpenseWeeks) {
        scenarioExpenses += scenario.weeklyExpense;
      }
    }
    balance -= scenarioExpenses;

    const totalExpenses =
      payroll.paid +
      fanClubPaid +
      loanRepaymentsPaid +
      socialMediaPaid +
      scenarioExpenses;
    const requiredExpenses =
      payroll.required +
      fanClubBudget +
      loanRepaymentDue +
      socialMediaBudget +
      scenarioExpenses;
    const endingBalance = roundCurrency(balance);

    cashFlow.push({
      week: projectWeek,
      label: `Week ${projectWeek}`,
      startingBalance,
      payrollRequired: roundCurrency(payroll.required),
      payrollPaid: roundCurrency(payroll.paid),
      fanClubBudget: roundCurrency(fanClubBudget),
      fanClubPaid: roundCurrency(fanClubPaid),
      loanRepaymentDue: roundCurrency(loanRepaymentDue),
      loanRepaymentsPaid: roundCurrency(loanRepaymentsPaid),
      socialMediaBudget: roundCurrency(socialMediaBudget),
      socialMediaPaid: roundCurrency(socialMediaPaid),
      streamingRoyalties: roundCurrency(streamingRoyalties),
      merchandiseRevenue: roundCurrency(merchandiseRevenue),
      soundtrackRevenue: roundCurrency(soundtrackRevenue),
      scheduledReleaseIncome: roundCurrency(scheduledReleaseIncome),
      scenarioExpenses: roundCurrency(scenarioExpenses),
      totalRevenue: roundCurrency(totalRevenue),
      totalExpenses: roundCurrency(totalExpenses),
      requiredExpenses: roundCurrency(requiredExpenses),
      obligationGap: roundCurrency(Math.max(0, requiredExpenses - totalExpenses)),
      netCashFlow: roundCurrency(totalRevenue - totalExpenses),
      endingBalance,
    });
  }

  return { cashFlow, scheduledReleaseDetails };
};

const summarizeCashFlow = (cashFlow, startingBalance, lowBalanceThreshold) => {
  let totalRevenue = 0;
  let totalExpenses = 0;
  let requiredObligations = 0;
  let lowestBalance = startingBalance;
  let lowestBalanceWeek = null;
  let firstLowBalanceWeek = null;

  for (const week of cashFlow) {
    totalRevenue += week.totalRevenue;
    totalExpenses += week.totalExpenses;
    requiredObligations += week.requiredExpenses;
    if (week.endingBalance < lowestBalance) {
      lowestBalance = week.endingBalance;
      lowestBalanceWeek = week.week;
    }
    if (firstLowBalanceWeek === null && week.endingBalance <= lowBalanceThreshold) {
      firstLowBalanceWeek = week.week;
    }
  }

  const endingBalance =
    cashFlow.length > 0
      ? cashFlow[cashFlow.length - 1].endingBalance
      : startingBalance;
  const lowBalanceWarning = firstLowBalanceWeek !== null;
  const status =
    lowestBalance < 0 ? "SHORTFALL" : lowBalanceWarning ? "TIGHT" : "STABLE";

  return {
    startingBalance: roundCurrency(startingBalance),
    endingBalance: roundCurrency(endingBalance),
    totalRevenue: roundCurrency(totalRevenue),
    totalExpenses: roundCurrency(totalExpenses),
    requiredObligations: roundCurrency(requiredObligations),
    netCashFlow: roundCurrency(totalRevenue - totalExpenses),
    averageWeeklyRevenue: roundCurrency(totalRevenue / (cashFlow.length || 1)),
    averageWeeklyExpenses: roundCurrency(totalExpenses / (cashFlow.length || 1)),
    lowestBalance: roundCurrency(lowestBalance),
    lowestBalanceWeek,
    firstLowBalanceWeek,
    lowBalanceWarning,
    status,
  };
};

export const buildFinancialForecast = ({
  studio = {},
  gameState = {},
  releasedMovies = [],
  scheduledMovies = [],
  socialAccounts = [],
  options = {},
}) => {
  const currentWeek = Math.max(0, Math.floor(toNumber(gameState.currentWeek)));
  const horizonWeeks = toPositiveInteger(
    options.weeks,
    DEFAULT_FORECAST_WEEKS,
    MAX_FORECAST_WEEKS
  );
  const lowBalanceThreshold = toNonNegativeNumber(
    options.lowBalanceThreshold,
    DEFAULT_LOW_BALANCE_THRESHOLD
  );
  const startingBalance = toNumber(studio.money);

  const baseProjection = buildWeeklyBreakdown({
    studio,
    gameState,
    releasedMovies,
    scheduledMovies,
    socialAccounts,
    horizonWeeks,
    currentWeek,
  });
  const baseSummary = summarizeCashFlow(
    baseProjection.cashFlow,
    startingBalance,
    lowBalanceThreshold
  );

  const scenarioInputs = {
    oneTimeExpense: toNonNegativeNumber(options.oneTimeExpense),
    weeklyExpense: toNonNegativeNumber(options.weeklyExpense),
    weeklyExpenseWeeks: toPositiveInteger(
      options.scenarioWeeks,
      horizonWeeks,
      MAX_FORECAST_WEEKS
    ),
  };
  const hasScenario =
    scenarioInputs.oneTimeExpense > 0 || scenarioInputs.weeklyExpense > 0;

  let scenario = null;
  if (hasScenario) {
    const scenarioProjection = buildWeeklyBreakdown({
      studio,
      gameState,
      releasedMovies,
      scheduledMovies,
      socialAccounts,
      horizonWeeks,
      currentWeek,
      scenario: scenarioInputs,
    });
    const scenarioSummary = summarizeCashFlow(
      scenarioProjection.cashFlow,
      startingBalance,
      lowBalanceThreshold
    );

    scenario = {
      inputs: {
        oneTimeExpense: roundCurrency(scenarioInputs.oneTimeExpense),
        weeklyExpense: roundCurrency(scenarioInputs.weeklyExpense),
        weeklyExpenseWeeks: scenarioInputs.weeklyExpenseWeeks,
      },
      cashFlow: scenarioProjection.cashFlow,
      summary: scenarioSummary,
      impact: {
        endingBalanceDelta: roundCurrency(
          scenarioSummary.endingBalance - baseSummary.endingBalance
        ),
        additionalExpenses: roundCurrency(
          scenarioSummary.totalExpenses - baseSummary.totalExpenses
        ),
        lowBalanceWarning: scenarioSummary.lowBalanceWarning,
      },
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    currentWeek,
    horizonWeeks,
    lowBalanceThreshold,
    assumptions: FORECAST_ASSUMPTIONS,
    projectionParams: {
      releaseLegsMultiplier: PROJECTED_RELEASE_LEGS_MULTIPLIER,
      weeklyStreamingRoyaltyRate: WEEKLY_STREAMING_ROYALTY_RATE,
    },
    current: {
      cashOnHand: roundCurrency(startingBalance),
      negativeCashWeeks: Math.max(0, Math.floor(toNumber(studio.negativeCashWeeks))),
      isBankrupt: Boolean(studio.isBankrupt),
    },
    base: {
      cashFlow: baseProjection.cashFlow,
      scheduledReleases: baseProjection.scheduledReleaseDetails,
      summary: baseSummary,
    },
    scenario,
  };
};

export const getFinancialForecast = async (userId, options = {}) => {
  const [gameState, studio] = await Promise.all([
    GameState.findOne({ user: userId }).lean(),
    Studio.findOne({ owner: userId }).lean(),
  ]);

  if (!gameState || !studio) {
    return buildFinancialForecast({ options });
  }

  const horizonWeeks = toPositiveInteger(
    options.weeks,
    DEFAULT_FORECAST_WEEKS,
    MAX_FORECAST_WEEKS
  );
  const currentWeek = Math.max(0, Math.floor(toNumber(gameState.currentWeek)));

  const [releasedMovies, scheduledMovies, socialAccounts] = await Promise.all([
    Movie.find({
      studioId: studio._id,
      status: { $in: ["RELEASED", "RELEASED_STREAMING"] },
    })
      .select(
        "title status releaseWeek boxOffice hype verdict soundtrackTier streamingDeal"
      )
      .lean(),
    Movie.find({
      studioId: studio._id,
      status: "READY_FOR_RELEASE",
      scheduledReleaseWeek: {
        $gt: currentWeek,
        $lte: currentWeek + horizonWeeks,
      },
    })
      .select(
        "title scheduledReleaseWeek budget marketingBudget quality hype leadActorId coProducerShare"
      )
      .lean(),
    SocialMediaAccount.find({ userId }).select("weeklyBudget").lean(),
  ]);

  return buildFinancialForecast({
    studio,
    gameState,
    releasedMovies,
    scheduledMovies,
    socialAccounts,
    options,
  });
};

export default {
  buildFinancialForecast,
  getFinancialForecast,
};
