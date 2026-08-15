import StreamingAuction from "../models/StreamingAuction.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { runStreamingAuction } from "../services/streamingAuctionEngine.js";

export const createStreamingAuction = async (req, res) => {
  try {
    const { movieId, windowType, askingPrice } = req.body;
    
    // Resolve Studio accurately via owner
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }
    const studioId = studio._id;

    const movie = await Movie.findOne({ _id: movieId, studioId });
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found or unauthorized" });
    }

    const existingAuction = await StreamingAuction.findOne({ movieId, status: "OPEN" });
    if (existingAuction) {
      return res.status(400).json({ success: false, message: "An active streaming auction is already open for this movie" });
    }

    const auction = await StreamingAuction.create({
      studioId,
      movieId,
      windowType,
      askingPrice,
    });

    return res.status(201).json({ success: true, auction });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const executeAuctionBidding = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const auction = await runStreamingAuction(auctionId);
    return res.status(200).json({ success: true, auction });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getStudioAuctions = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }
    const studioId = studio._id;

    const auctions = await StreamingAuction.find({ studioId })
      .populate("movieId", "title quality criticScore worldwideGross budget boxOffice")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, auctions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
