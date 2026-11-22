import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { AWARDS_CAMPAIGN_COST, AWARDS_CAMPAIGN_PRESTIGE_GAIN } from "../constants/gameConstants.js";
import { withTransaction } from "../utils/financeTransactionHelper.js";

export const startAwardsCampaign = async (req, res) => {
  try {
    const { movieId, categoryId } = req.body;

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    // Ownership-scoped query: only movies owned by the authenticated studio can be campaigned
    const movie = await Movie.findOne({ _id: movieId, studioId: studio._id });
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    if (movie.status !== "RELEASED" && movie.status !== "RELEASED_STREAMING") {
      return res.status(400).json({ success: false, message: "Only released movies can run awards campaigns" });
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

    await withTransaction(async (session) => {
      // Re-read with session for transactional consistency
      const s = await Studio.findById(studio._id).session(session);
      const m = await Movie.findOne({ _id: movieId, studioId: s._id }).session(session);

      if (!s || !m) {
        throw new Error("Resource not found during transaction");
      }
      if (s.money < AWARDS_CAMPAIGN_COST) {
        throw new Error("Insufficient funds for an awards campaign");
      }

      m.awards.push({
        name: "Campaign Nominee",
        category: categoryId,
        year: m.releaseWeek ? Math.floor(m.releaseWeek / 52) + 2026 : 2026,
      });

      s.money -= AWARDS_CAMPAIGN_COST;
      s.prestige += AWARDS_CAMPAIGN_PRESTIGE_GAIN;

      await m.save({ session });
      await s.save({ session });

      studio.money = s.money;
      studio.prestige = s.prestige;
    });

    res.status(200).json({
      success: true,
      message: `Successfully launched awards lobbying for "${movie.title}" under ${categoryId}! Prestige increased by +15.`,
      movie,
      studioMoney: studio.money,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
