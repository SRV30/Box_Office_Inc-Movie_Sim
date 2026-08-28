import StreamingAuction from "../models/StreamingAuction.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import GameState from "../models/GameState.js";
import {
  generateStrategicBids,
  resolveAuctionWinner,
  awardStreamingRights,
  hasConflictingRights,
  evaluateContentValue,
} from "./simulation/engines/streamingWarsEngine.js";
import { EXCLUSIVITY_WINDOWS } from "../constants/streamingWars.js";

/**
 * Calculates platform valuation & bids for a film (legacy export for tests).
 */
export function calculatePlatformBids(movie, windowType, askingPrice) {
  const mockState = { streamingPlatforms: [] };
  return generateStrategicBids(movie, windowType, askingPrice, mockState).map((b) => ({
    platform: b.platform,
    amount: b.amount,
    createdAt: b.createdAt,
  }));
}

/**
 * Executes a bidding auction with transparent rules and exclusive rights award.
 */
export async function runStreamingAuction(auctionId, gameState = null) {
  const auction = await StreamingAuction.findById(auctionId).populate("movieId");
  if (!auction || auction.status !== "OPEN") {
    throw new Error("Auction not found or not open for bidding");
  }

  const movie = auction.movieId;
  if (!movie) throw new Error("Movie not found for auction");

  const conflict = await hasConflictingRights(movie._id, auction.contentType || "MOVIE");
  if (conflict) {
    throw new Error("Content already has active exclusive streaming rights.");
  }

  let state = gameState;
  if (!state) {
    const studio = await Studio.findById(auction.studioId);
    state = studio ? await GameState.findOne({ user: studio.owner }) : null;
  }

  const allBids = [
    ...generateStrategicBids(movie, auction.windowType, auction.askingPrice, state || {}),
    ...(auction.counteroffers || []).map((c) => ({
      platformId: c.platformId,
      platform: c.platform,
      amount: c.amount,
      prestige: 50,
      isAI: c.isAI,
    })),
  ];

  const winner = resolveAuctionWinner(allBids);
  if (!winner) throw new Error("No valid bids received for this auction.");

  auction.bids = allBids;
  auction.winningPlatform = winner.platform;
  auction.winningBidAmount = winner.amount;
  auction.exclusiveWeeks = EXCLUSIVITY_WINDOWS[auction.windowType]?.weeks || 52;
  auction.status = "COMPLETED";

  const studio = await Studio.findById(auction.studioId);
  const week = state?.currentWeek || 1;

  await awardStreamingRights({
    content: movie,
    contentType: auction.contentType || "MOVIE",
    winner,
    windowType: auction.windowType,
    studio,
    gameState: state || { streamingPlatforms: [] },
    currentWeek: week,
  });

  if (state) await state.save();
  await studio.save();
  await auction.save();

  return auction;
}

export { evaluateContentValue };
