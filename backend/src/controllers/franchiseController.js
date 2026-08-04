import Franchise from "../models/Franchise.js";
import Studio from "../models/Studio.js";

export const getFranchises = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const franchises = await Franchise.find({ studioId: studio._id })
      .populate("movies", "title verdict worldwideGross releaseWeek sequelNumber quality")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, franchises });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFranchiseById = async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id)
      .populate(
        "movies",
        "title verdict worldwideGross releaseWeek sequelNumber quality criticScore audienceScore budget profit awards"
      )
      .lean();

    if (!franchise) {
      return res.status(404).json({ success: false, message: "Franchise not found" });
    }

    const movies = franchise.movies || [];
    const totalRevenueValue = franchise.totalRevenue || movies.reduce((sum, m) => sum + (m.worldwideGross || 0), 0);
    const releasedMovies = movies.filter((m) => m.releaseWeek !== null && m.releaseWeek !== undefined);

    const badges = [];
    if (totalRevenueValue >= 1_000_000_000) badges.push("1 Billion Club");
    if (movies.length >= 10) badges.push("10 Movies Club");
    if (releasedMovies.some((m) => ["BLOCKBUSTER", "ALL_TIME_BLOCKBUSTER"].includes(m.verdict))) {
      badges.push("Legendary Franchise");
    }
    if (releasedMovies.some((m) => Array.isArray(m.awards) && m.awards.length > 0)) {
      badges.push("Oscar Franchise");
    }

    return res.status(200).json({ success: true, franchise: { ...franchise, badges } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFranchise = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Franchise name is required" });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const franchise = await Franchise.create({
      name,
      studioId: studio._id,
      movies: [],
    });

    res.status(201).json({ success: true, franchise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFranchiseTimeline = async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id)
      .populate("movies", "title verdict worldwideGross releaseWeek sequelNumber quality")
      .lean();

    if (!franchise) {
      return res.status(404).json({ success: false, message: "Franchise not found" });
    }

    const timeline = (franchise.movies || [])
      .filter((movie) => movie.releaseWeek !== null && movie.releaseWeek !== undefined)
      .sort((a, b) => a.releaseWeek - b.releaseWeek || (a.sequelNumber || 0) - (b.sequelNumber || 0))
      .map((movie) => ({
        movieId: movie._id,
        title: movie.title,
        releaseWeek: movie.releaseWeek,
        worldwideGross: movie.worldwideGross,
        verdict: movie.verdict,
        sequelNumber: movie.sequelNumber,
        quality: movie.quality,
      }));

    res.status(200).json({
      success: true,
      franchiseId: franchise._id,
      name: franchise.name,
      timeline,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFranchiseRankings = async (req, res) => {
  try {
    const metric = String(req.query.metric || "revenue").toLowerCase();
    const metricMap = {
      revenue: "totalRevenue",
      popularity: "popularity",
      fanLoyalty: "fanLoyalty",
      movieCount: "movieCount",
    };

    if (!metricMap[metric]) {
      return res.status(400).json({
        success: false,
        message: `Invalid metric. Supported metrics: ${Object.keys(metricMap).join(", ")}.`,
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [franchises, total] = await Promise.all([
      Franchise.find()
        .sort({ [metricMap[metric]]: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Franchise.countDocuments(),
    ]);

    const rankings = franchises.map((franchise, index) => ({
      rank: skip + index + 1,
      franchiseId: franchise._id,
      name: franchise.name,
      studioId: franchise.studioId,
      totalRevenue: franchise.totalRevenue || 0,
      popularity: franchise.popularity || 0,
      fanLoyalty: franchise.fanLoyalty || 0,
      movieCount: franchise.movieCount || 0,
      fanbaseMultiplier: franchise.fanbaseMultiplier || 1,
      prestigeBonus: franchise.prestigeBonus || 0,
    }));

    res.status(200).json({
      success: true,
      metric,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      rankings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
