import StreamingAuction from "../models/StreamingAuction.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";

/**
 * Calculates platform valuation & bids for a film based on quality, genre, and box office
 */
export function calculatePlatformBids(movie, windowType, askingPrice) {
  const baseValuation = (movie.boxOfficeTotal || movie.budget || 2000000) * 0.4;
  const ratingMult = Math.max(0.6, (movie.rating || 50) / 50);

  const platforms = [
    { name: "NetCinema", budgetMultiplier: 1.25 },
    { name: "StreamMax", budgetMultiplier: 1.15 },
    { name: "CineStream", budgetMultiplier: 0.95 },
    { name: "PrimePlay", budgetMultiplier: 1.05 },
  ];

  const windowMult = windowType === "EXCLUSIVE_DAY_DATE" ? 2.0 : windowType === "GLOBAL_PREMIERE" ? 1.5 : 1.0;

  const generatedBids = platforms.map((p) => {
    const rawBid = Math.round(baseValuation * ratingMult * p.budgetMultiplier * windowMult * (0.85 + Math.random() * 0.3));
    return {
      platform: p.name,
      amount: Math.max(askingPrice, rawBid),
      createdAt: new Date(),
    };
  });

  return generatedBids.sort((a, b) => b.amount - a.amount);
}

/**
 * Executes a bidding auction for a streaming release window
 */
export async function runStreamingAuction(auctionId) {
  const auction = await StreamingAuction.findById(auctionId).populate("movieId");
  if (!auction || auction.status !== "OPEN") {
    throw new Error("Auction not found or not open for bidding");
  }

  const generatedBids = calculatePlatformBids(auction.movieId, auction.windowType, auction.askingPrice);
  const highestBid = generatedBids[0];

  auction.bids = generatedBids;
  auction.winningPlatform = highestBid.platform;
  auction.winningBidAmount = highestBid.amount;
  auction.status = "COMPLETED";
  await auction.save();

  // Credit winning bid payout to studio
  await Studio.findByIdAndUpdate(auction.studioId, {
    $inc: { balance: highestBid.amount, lifetimeEarnings: highestBid.amount },
  });

  return auction;
}
