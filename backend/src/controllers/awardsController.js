import AwardsCampaign from "../models/AwardsCampaign.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { calculateCampaignSentiment, simulateAwardsCeremony } from "../services/awardsEngine.js";

/**
 * GET /api/awards
 * Retrieves all prestige awards and accolades won by the studio's catalog.
 */
export const getStudioAwards = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(200).json({ success: true, awards: [] });
    }

    const moviesWithAwards = await Movie.find({
      studioId: studio._id,
      "awards.0": { $exists: true },
    }).select("title awards");

    const awardsList = [];
    moviesWithAwards.forEach((movie) => {
      (movie.awards || []).forEach((award) => {
        awardsList.push({
          id: award._id || `${movie._id}-${award.name}-${award.year}`,
          name: award.name,
          category: award.category,
          year: award.year,
          movieTitle: movie.title,
        });
      });
    });

    return res.status(200).json({
      success: true,
      awards: awardsList,
      totalAwards: awardsList.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/awards/campaigns
 * Launch an FYC (For Your Consideration) awards campaign for an eligible studio film.
 */
export const launchAwardsCampaign = async (req, res) => {
  try {
    const { movieId, category, campaignBudget, fycScreeningsHeld } = req.body;
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    if (studio.money < campaignBudget) {
      return res.status(400).json({ success: false, message: "Insufficient studio funds for FYC campaign" });
    }

    const movie = await Movie.findOne({ _id: movieId, studioId: studio._id });
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found or unauthorized" });
    }

    const initialSentiment = calculateCampaignSentiment(campaignBudget, movie.rating, fycScreeningsHeld || 0);

    const campaign = await AwardsCampaign.create({
      studioId: studio._id,
      movieId,
      category,
      campaignBudget,
      fycScreeningsHeld: fycScreeningsHeld || 0,
      voterSentimentScore: initialSentiment,
    });

    studio.money -= campaignBudget;
    await studio.save();

    return res.status(201).json({
      success: true,
      campaign,
      remainingMoney: studio.money,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/awards/campaigns
 * Retrieve all awards season lobbying campaigns for the studio.
 */
export const getStudioAwardsCampaigns = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const campaigns = await AwardsCampaign.find({ studioId: studio._id }).populate("movieId", "title rating poster");
    return res.status(200).json({ success: true, campaigns });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/awards/ceremony
 * Simulate industry-wide awards ceremony.
 */
export const triggerAwardsCeremony = async (req, res) => {
  try {
    const ceremonyResults = await simulateAwardsCeremony();
    return res.status(200).json({ success: true, ceremonyResults });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
