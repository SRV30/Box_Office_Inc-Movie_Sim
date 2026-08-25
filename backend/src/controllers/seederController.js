import IndustryMarketSeeder from "../services/seeder/industryMarketSeeder.js";
import RivalStudio from "../models/RivalStudio.js";
import MarketActor from "../models/MarketActor.js";
import MarketDirector from "../models/MarketDirector.js";
import Composer from "../models/Composer.js";
import GameState from "../models/GameState.js";

/**
 * Controller for running and validating industry market seeding.
 */
export const seedIndustry = async (req, res, next) => {
  try {
    const report = await IndustryMarketSeeder.seedFullIndustryMarket(req.user._id);
    res.status(200).json({
      success: true,
      message: "Industry market seeded successfully",
      report,
    });
  } catch (error) {
    next(error);
  }
};

export const getSeedValidationReport = async (req, res, next) => {
  try {
    const [
      studioCount,
      actorCount,
      directorCount,
      composerCount,
      gameState,
    ] = await Promise.all([
      RivalStudio.countDocuments(),
      MarketActor.countDocuments({ userId: req.user._id }),
      MarketDirector.countDocuments({ userId: req.user._id }),
      Composer.countDocuments(),
      GameState.findOne({ user: req.user._id }).lean(),
    ]);

    const writerCount = (gameState?.marketWriters || []).length;

    const isValid =
      studioCount >= 99 &&
      actorCount >= 1000 &&
      directorCount >= 300 &&
      composerCount >= 300 &&
      writerCount >= 500;

    res.status(200).json({
      success: true,
      data: {
        isValid,
        expected: {
          studios: 99,
          actors: 1000,
          writers: 500,
          directors: 300,
          composers: 300,
        },
        actual: {
          studios: studioCount,
          actors: actorCount,
          writers: writerCount,
          directors: directorCount,
          composers: composerCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
