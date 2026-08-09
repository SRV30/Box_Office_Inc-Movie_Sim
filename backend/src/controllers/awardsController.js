import AwardsCampaign from "../models/AwardsCampaign.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { calculateCampaignSentiment, simulateAwardsCeremony } from "../services/awardsEngine.js";

export const launchAwardsCampaign = async (req, res) => {
  try {
    const { movieId, category, campaignBudget, fycScreeningsHeld } = req.body;
    const studioId = req.user.studioId || req.user._id;

    const studio = await Studio.findById(studioId);
    if (!studio || studio.balance < campaignBudget) {
      return res.status(400).json({ message: "Insufficient studio funds for FYC campaign" });
    }

    const movie = await Movie.findOne({ _id: movieId, studioId });
    if (!movie) {
      return res.status(404).json({ message: "Movie not found or unauthorized" });
    }

    const initialSentiment = calculateCampaignSentiment(campaignBudget, movie.rating, fycScreeningsHeld || 0);

    const campaign = await AwardsCampaign.create({
      studioId,
      movieId,
      category,
      campaignBudget,
      fycScreeningsHeld: fycScreeningsHeld || 0,
      voterSentimentScore: initialSentiment,
    });

    await Studio.findByIdAndUpdate(studioId, { $inc: { balance: -campaignBudget } });

    return res.status(201).json({ success: true, campaign });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getStudioAwardsCampaigns = async (req, res) => {
  try {
    const studioId = req.user.studioId || req.user._id;
    const campaigns = await AwardsCampaign.find({ studioId }).populate("movieId", "title rating poster");
    return res.status(200).json({ success: true, campaigns });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const triggerAwardsCeremony = async (req, res) => {
  try {
    const ceremonyResults = await simulateAwardsCeremony();
    return res.status(200).json({ success: true, ceremonyResults });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
