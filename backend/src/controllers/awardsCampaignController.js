import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { AWARDS_CAMPAIGN_COST, AWARDS_CAMPAIGN_PRESTIGE_GAIN } from "../constants/gameConstants.js";

export const startAwardsCampaign = async (req, res) => {
  try {
    const { movieId, categoryId } = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    if (movie.status !== "RELEASED" && movie.status !== "RELEASED_STREAMING") {
      return res.status(400).json({ success: false, message: "Only released movies can run awards campaigns" });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    if (studio.money < AWARDS_CAMPAIGN_COST) {
      return res.status(400).json({ success: false, message: "Insufficient funds for an awards campaign" });
    }

    // Check if category already campaigned
    const alreadyCampaigned = movie.awards.some(
      (a) => a.category === categoryId && a.name === "Campaign Nominee"
    );
    if (alreadyCampaigned) {
      return res.status(400).json({ success: false, message: "You have already run a campaign for this category" });
    }

    // Lobbying success: Add nomination entry
    movie.awards.push({
      name: "Campaign Nominee",
      category: categoryId,
      year: movie.releaseWeek ? Math.floor(movie.releaseWeek / 52) + 2026 : 2026
    });

    studio.money -= AWARDS_CAMPAIGN_COST;
    studio.prestige += AWARDS_CAMPAIGN_PRESTIGE_GAIN;

    await movie.save();
    await studio.save();

    res.status(200).json({
      success: true,
      message: `Successfully launched awards lobbying for "${movie.title}" under ${categoryId}! Prestige increased by +15.`,
      movie,
      studioMoney: studio.money
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
