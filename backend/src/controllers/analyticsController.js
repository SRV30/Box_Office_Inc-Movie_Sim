import SimulationAnalyticsService from "../services/analytics/simulationAnalyticsService.js";

/**
 * Controller for simulation analytics and historical performance reporting endpoints.
 */
export const getFinancialAnalytics = async (req, res, next) => {
  try {
    const data = await SimulationAnalyticsService.getFinancialAnalytics(
      req.user._id,
      req.query
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMoviePerformanceReports = async (req, res, next) => {
  try {
    const data = await SimulationAnalyticsService.getMoviePerformanceReports(
      req.user._id,
      req.query
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getGenreAnalytics = async (req, res, next) => {
  try {
    const data = await SimulationAnalyticsService.getGenreAnalytics(req.user._id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getTalentCareerTrajectories = async (req, res, next) => {
  try {
    const data = await SimulationAnalyticsService.getTalentCareerTrajectories(
      req.user._id
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getRivalComparisons = async (req, res, next) => {
  try {
    const data = await SimulationAnalyticsService.getRivalComparisons(req.user._id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
