import Movie from "../../models/Movie.js";
import GameState from "../../models/GameState.js";
import Studio from "../../models/Studio.js";
import MarketActor from "../../models/MarketActor.js";
import MarketDirector from "../../models/MarketDirector.js";
import RivalStudio from "../../models/RivalStudio.js";

/**
 * Service for comprehensive studio, movie, talent, and industry analytics.
 */
export class SimulationAnalyticsService {
  /**
   * Retrieves aggregated studio financial history and metrics.
   */
  static async getFinancialAnalytics(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [gameState, studio] = await Promise.all([
      GameState.findOne({ user: userId }).lean(),
      Studio.findOne({ owner: userId }).lean(),
    ]);

    if (!gameState && !studio) {
      return {
        summary: {
          currentCash: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0,
          runwayWeeks: 0,
        },
        financials: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const rawHistory =
      (studio && studio.financialHistory && studio.financialHistory.length > 0)
        ? studio.financialHistory
        : ((gameState && gameState.financialHistory) || []);
    const totalRecords = rawHistory.length;

    // Sort descending by week (newest first)
    const sortedHistory = [...rawHistory].sort((a, b) => (b.week || 0) - (a.week || 0));
    const paginatedItems = sortedHistory.slice(skip, skip + limit);

    // Calculate aggregated totals
    let totalRevenue = 0;
    let totalExpenses = 0;

    rawHistory.forEach((record) => {
      totalRevenue += record.revenue !== undefined ? record.revenue : (record.boxOfficeIncome || 0);
      totalExpenses +=
        record.expenses !== undefined
          ? record.expenses
          : (record.productionExpenses || 0) +
            (record.marketingExpenses || 0) +
            (record.talentSalaries || 0) +
            (record.overheadExpenses || 0) +
            (record.loanPayments || 0) +
            (record.maintenanceExpenses || 0);
    });

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
    
    // Average weekly burn rate over last 4 recorded weeks
    const recentWeeks = rawHistory.slice(-4);
    const recentBurn =
      recentWeeks.length > 0
        ? recentWeeks.reduce((acc, r) => acc + (r.expenses || r.overheadExpenses || 50000), 0) / recentWeeks.length
        : 50000;
    const currentCash = (studio && studio.money !== undefined) ? studio.money : (gameState?.cash || 0);
    const runwayWeeks = recentBurn > 0 ? Math.floor(currentCash / recentBurn) : 999;

    return {
      summary: {
        currentCash,
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: Number(profitMargin),
        runwayWeeks,
        totalWeeksSimulated: gameState?.currentWeek || totalRecords,
      },
      financials: paginatedItems,
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  /**
   * Retrieves comprehensive movie performance reports, budgets vs actuals, and ROI metrics.
   */
  static async getMoviePerformanceReports(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 15));
    const skip = (page - 1) * limit;
    const genre = query.genre;

    const [gameState, studio] = await Promise.all([
      GameState.findOne({ user: userId }).lean(),
      Studio.findOne({ owner: userId }).lean(),
    ]);

    const studioIds = [userId];
    if (studio && studio._id) studioIds.push(studio._id);

    const filter = {
      $or: [
        { studioId: { $in: studioIds } },
        { user: userId },
      ],
      status: { $in: ["RELEASED", "RELEASED_STREAMING"] },
    };

    const [movies, total] = await Promise.all([
      Movie.find(filter)
        .sort({ boxOffice: -1, worldwideGross: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Movie.countDocuments(filter),
    ]);

    const allReleased = await Movie.find(filter).lean();
    const scripts = (gameState && (gameState.ownedScripts || gameState.marketScripts)) || [];
    const scriptMap = new Map(scripts.map((s) => [String(s.id), s]));

    let totalBudget = 0;
    let totalActualCost = 0;
    let totalGross = 0;
    let totalHits = 0;
    let totalFlops = 0;
    let highestGrossing = null;
    let highestROI = null;

    allReleased.forEach((m) => {
      const budget = m.budget || 0;
      const actual = m.totalCost || budget;
      const gross = m.worldwideGross || m.boxOffice || 0;
      const roi = m.roi !== undefined ? m.roi : (actual > 0 ? ((gross - actual) / actual) * 100 : 0);

      totalBudget += budget;
      totalActualCost += actual;
      totalGross += gross;

      if (roi > 20) totalHits += 1;
      else if (roi < -20) totalFlops += 1;

      if (!highestGrossing || gross > (highestGrossing.gross || 0)) {
        highestGrossing = { title: m.title, gross, roi };
      }
      if (!highestROI || roi > (highestROI.roi || 0)) {
        highestROI = { title: m.title, gross, roi };
      }
    });

    const averageROI =
      totalActualCost > 0 ? (((totalGross - totalActualCost) / totalActualCost) * 100).toFixed(2) : 0;

    const formattedMovies = movies.map((m) => {
      const actualCost = m.totalCost || m.budget || 1;
      const gross = m.worldwideGross || m.boxOffice || 0;
      const opening = m.openingWeekend || 0;
      const netProfit = m.profit !== undefined ? m.profit : gross - actualCost;
      const roi = m.roi !== undefined ? m.roi : Number(((netProfit / actualCost) * 100).toFixed(2));
      const script = scriptMap.get(String(m.scriptId));
      const detectedGenre = m.genre || (script && script.genres && script.genres[0]) || "Drama";

      return {
        _id: m._id,
        title: m.title,
        genre: detectedGenre,
        budget: m.budget,
        actualCost,
        costVariance: actualCost - m.budget,
        totalGross: gross,
        openingWeekend: opening,
        netProfit,
        roi,
        reviewScore: m.criticScore || m.reviewScore || 0,
        verdict: m.verdict || "N/A",
        weeksInTheaters: m.weeksInTheaters || 1,
        directorName: m.directorName || "Unknown",
        leadActorNames: m.leadActorName || "Unknown",
      };
    });

    return {
      summary: {
        totalMoviesReleased: allReleased.length,
        totalBudget,
        totalActualCost,
        totalGross,
        totalNetProfit: totalGross - totalActualCost,
        averageROI: Number(averageROI),
        hitRatio: allReleased.length > 0 ? Number(((totalHits / allReleased.length) * 100).toFixed(1)) : 0,
        highestGrossing,
        highestROI,
      },
      movies: formattedMovies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Evaluates genre trends, market share, and multi-year shifts.
   */
  static async getGenreAnalytics(userId) {
    const [gameState, studio] = await Promise.all([
      GameState.findOne({ user: userId }).lean(),
      Studio.findOne({ owner: userId }).lean(),
    ]);

    const studioIds = [userId];
    if (studio && studio._id) studioIds.push(studio._id);

    const filter = {
      $or: [
        { studioId: { $in: studioIds } },
        { user: userId },
      ],
      status: { $in: ["RELEASED", "RELEASED_STREAMING"] },
    };
    const releasedMovies = await Movie.find(filter).lean();
    const scripts = (gameState && (gameState.ownedScripts || gameState.marketScripts)) || [];
    const scriptMap = new Map(scripts.map((s) => [String(s.id), s]));

    const genreMap = {};

    releasedMovies.forEach((m) => {
      const script = scriptMap.get(String(m.scriptId));
      const g = m.genre || (script && script.genres && script.genres[0]) || "Drama";
      if (!genreMap[g]) {
        genreMap[g] = {
          genre: g,
          movieCount: 0,
          totalGross: 0,
          totalCost: 0,
          totalReviewScore: 0,
        };
      }
      const cost = m.totalCost || m.budget || 0;
      const gross = m.worldwideGross || m.boxOffice || 0;
      genreMap[g].movieCount += 1;
      genreMap[g].totalGross += gross;
      genreMap[g].totalCost += cost;
      genreMap[g].totalReviewScore += m.criticScore || m.reviewScore || 0;
    });

    const genreStats = Object.values(genreMap).map((item) => {
      const avgROI =
        item.totalCost > 0
          ? (((item.totalGross - item.totalCost) / item.totalCost) * 100).toFixed(2)
          : 0;
      return {
        genre: item.genre,
        movieCount: item.movieCount,
        totalGross: item.totalGross,
        averageGross: Math.round(item.totalGross / item.movieCount),
        averageCost: Math.round(item.totalCost / item.movieCount),
        averageReviewScore: Number((item.totalReviewScore / item.movieCount).toFixed(1)),
        averageROI: Number(avgROI),
      };
    });

    genreStats.sort((a, b) => b.totalGross - a.totalGross);

    return {
      genres: genreStats,
      totalGenresExplored: genreStats.length,
      topPerformingGenre: genreStats[0] || null,
    };
  }

  /**
   * Evaluates talent career trajectories, box office impact, and award accumulations.
   */
  static async getTalentCareerTrajectories(userId) {
    const gameState = await GameState.findOne({ user: userId }).lean();
    if (!gameState) {
      return {
        rosterCount: 0,
        topStar: null,
        talents: [],
      };
    }

    const actors = gameState.ownedActors || gameState.hiredActors || [];
    const directors = gameState.ownedDirectors || gameState.hiredDirectors || [];
    const writers = gameState.ownedWriters || gameState.hiredWriters || [];

    const formatTalent = (t, role) => ({
      _id: t._id || t.id,
      name: t.name,
      role,
      age: t.age || 30,
      skill: t.actingSkill || t.creativity || t.skill || 50,
      popularity: t.popularity || t.reputation || 50,
      salary: t.salary || t.weeklySalary || 100000,
      prestige: t.prestige || 0,
      awardsCount: typeof t.awards === "number" ? t.awards : (t.awards || []).length,
      filmsParticipated: typeof t.movies === "number" ? t.movies : ((t.filmography || []).length || t.writtenScripts || t.moviesDirected || 0),
      lifetimeGross: t.boxOfficeTotal || t.totalGross || t.totalEarnings || t.careerEarnings || t.boxOfficeGross || 0,
    });

    const talentList = [
      ...actors.map((a) => formatTalent(a, "Actor")),
      ...directors.map((d) => formatTalent(d, "Director")),
      ...writers.map((w) => formatTalent(w, "Writer")),
    ];

    talentList.sort((a, b) => b.lifetimeGross - a.lifetimeGross);

    return {
      rosterCount: talentList.length,
      topStar: talentList[0] || null,
      talents: talentList,
    };
  }

  /**
   * Benchmarks player studio against rival AI studios.
   */
  static async getRivalComparisons(userId) {
    const [gameState, studio] = await Promise.all([
      GameState.findOne({ user: userId }).lean(),
      Studio.findOne({ owner: userId }).lean(),
    ]);

    const studioIds = [userId];
    if (studio && studio._id) studioIds.push(studio._id);

    const [rivalStudios, playerMovies] = await Promise.all([
      RivalStudio.find().lean(),
      Movie.find({
        $or: [{ studioId: { $in: studioIds } }, { user: userId }],
        status: { $in: ["RELEASED", "RELEASED_STREAMING"] },
      }).lean(),
    ]);

    const playerGross = playerMovies.reduce(
      (sum, m) => sum + (m.worldwideGross || m.boxOffice || 0),
      0
    );

    const playerEntity = {
      name: studio?.name || gameState?.studioName || "Your Studio",
      isPlayer: true,
      cash: studio?.money !== undefined ? studio.money : (gameState?.cash || 0),
      prestige: studio?.prestige !== undefined ? studio.prestige : (gameState?.prestige || 0),
      moviesReleased: playerMovies.length,
      totalGross: playerGross,
      marketShare: 0,
    };

    const rivals = (rivalStudios || []).map((r) => {
      const producedGross = (r.producedMovies || []).reduce((acc, m) => acc + (m.boxOffice || 0), 0);
      const totalGross = r.totalRevenue || r.totalGross || producedGross || 0;
      return {
        name: r.name,
        isPlayer: false,
        cash: r.budget !== undefined ? r.budget : (r.money || r.cash || 0),
        prestige: r.reputation !== undefined ? r.reputation : (r.prestige || 0),
        moviesReleased: (r.producedMovies || []).length || r.moviesReleased || r.filmsCount || 0,
        totalGross,
        marketShare: 0,
      };
    });

    const allStudios = [playerEntity, ...rivals];
    const totalIndustryGross = allStudios.reduce((acc, s) => acc + s.totalGross, 0) || 1;

    allStudios.forEach((s) => {
      s.marketShare = Number(((s.totalGross / totalIndustryGross) * 100).toFixed(2));
    });

    // Rank by total box office gross descending
    allStudios.sort((a, b) => b.totalGross - a.totalGross);

    const playerRank = allStudios.findIndex((s) => s.isPlayer) + 1;

    return {
      rankings: allStudios,
      playerRank,
      totalCompetitors: allStudios.length,
      industryTotalGross: totalIndustryGross,
    };
  }
}

export default SimulationAnalyticsService;
