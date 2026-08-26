import Composer from "../models/Composer.js";
import Studio from "../models/Studio.js";
import ComposerLifecycleEngine from "../services/composer/composerLifecycleEngine.js";

/**
 * Controller for Composer recruitment, contracts, and roster queries.
 */
export const getAvailableComposers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;
    const genre = req.query.genre;

    const filter = { status: "AVAILABLE" };
    if (genre && genre !== "ALL") {
      filter.genreExpertise = genre;
    }

    const [composers, total] = await Promise.all([
      Composer.find(filter).sort({ musicalTalent: -1, popularity: -1 }).skip(skip).limit(limit).lean(),
      Composer.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        composers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudioComposers = async (req, res, next) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(200).json({ success: true, data: [] });
    }

    const composers = await Composer.find({ studio: studio._id }).lean();
    res.status(200).json({ success: true, data: composers });
  } catch (error) {
    next(error);
  }
};

export const hireComposer = async (req, res, next) => {
  try {
    const { composerId, contractYears = 1 } = req.body;
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const composer = await Composer.findById(composerId);
    if (!composer) {
      return res.status(404).json({ success: false, message: "Composer not found" });
    }

    if (composer.status !== "AVAILABLE") {
      return res.status(400).json({ success: false, message: "Composer is not currently available for hire" });
    }

    const upfrontSigningFee = Math.round(composer.salary * 0.25);
    if (studio.money < upfrontSigningFee) {
      return res.status(400).json({ success: false, message: "Insufficient studio funds for signing bonus" });
    }

    studio.money -= upfrontSigningFee;
    await studio.save();

    composer.studio = studio._id;
    composer.user = req.user._id;
    composer.status = "UNDER_CONTRACT";
    composer.contractYears = contractYears;
    await composer.save();

    res.status(200).json({
      success: true,
      message: `Signed ${composer.name} to a ${contractYears}-year contract`,
      data: composer,
    });
  } catch (error) {
    next(error);
  }
};

export const releaseComposerContract = async (req, res, next) => {
  try {
    const { composerId } = req.params;
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const composer = await Composer.findOne({ _id: composerId, studio: studio._id });
    if (!composer) {
      return res.status(404).json({ success: false, message: "Composer not found under your studio roster" });
    }

    composer.studio = null;
    composer.user = null;
    composer.status = "AVAILABLE";
    composer.contractYears = 0;
    await composer.save();

    res.status(200).json({
      success: true,
      message: `Released ${composer.name} from studio contract`,
      data: composer,
    });
  } catch (error) {
    next(error);
  }
};

export const evaluateMusicImpact = async (req, res, next) => {
  try {
    const { composerId, movieGenre, productionBudget } = req.body;
    let composer = null;
    if (composerId) {
      composer = await Composer.findById(composerId);
    }

    const impact = ComposerLifecycleEngine.calculateMovieMusicImpact(composer, movieGenre, productionBudget);
    res.status(200).json({ success: true, data: impact });
  } catch (error) {
    next(error);
  }
};
