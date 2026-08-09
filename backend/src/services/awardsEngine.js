import AwardsCampaign from "../models/AwardsCampaign.js";
import Movie from "../models/Movie.js";

/**
 * Calculates FYC campaign impact on voter sentiment score
 */
export function calculateCampaignSentiment(budget, movieRating, fycScreenings) {
  const budgetBonus = Math.min(45, Math.floor(budget / 100000) * 3);
  const ratingBonus = Math.floor((movieRating || 50) * 0.4);
  const screeningBonus = Math.min(25, fycScreenings * 3);

  const totalScore = Math.min(100, Math.max(10, budgetBonus + ratingBonus + screeningBonus));
  return totalScore;
}

/**
 * Simulates Academy Awards voting tally and determines winners & box office bumps
 */
export async function simulateAwardsCeremony() {
  const campaigns = await AwardsCampaign.find({ nominationStatus: { $in: ["PENDING", "NOMINATED"] } }).populate("movieId");

  const results = [];

  for (const campaign of campaigns) {
    if (!campaign.movieId) continue;

    const movieRating = campaign.movieId.rating || 50;
    const finalScore = calculateCampaignSentiment(campaign.campaignBudget, movieRating, campaign.fycScreeningsHeld);

    campaign.voterSentimentScore = finalScore;

    if (finalScore >= 75) {
      campaign.nominationStatus = "WINNER";
      campaign.postWinBoxOfficeBoost = Math.round((campaign.movieId.budget || 5000000) * 0.25);

      // Boost movie prestige and rating
      await Movie.findByIdAndUpdate(campaign.movieId._id, {
        $inc: { rating: 5, boxOfficeTotal: campaign.postWinBoxOfficeBoost },
      });
    } else if (finalScore >= 55) {
      campaign.nominationStatus = "NOMINATED";
      campaign.postWinBoxOfficeBoost = Math.round((campaign.movieId.budget || 5000000) * 0.1);
    } else {
      campaign.nominationStatus = "NOT_NOMINATED";
    }

    await campaign.save();
    results.push({
      movieId: campaign.movieId._id,
      title: campaign.movieId.title,
      category: campaign.category,
      status: campaign.nominationStatus,
      sentimentScore: campaign.voterSentimentScore,
      boxOfficeBoost: campaign.postWinBoxOfficeBoost,
    });
  }

  return results;
}
