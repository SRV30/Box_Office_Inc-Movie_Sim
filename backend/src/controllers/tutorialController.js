import TutorialService from "../services/tutorial/tutorialService.js";

export const getTutorialState = async (req, res, next) => {
  try {
    const data = await TutorialService.getTutorialState(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const advanceTutorial = async (req, res, next) => {
  try {
    const data = await TutorialService.advanceTutorial(req.user._id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const skipTutorial = async (req, res, next) => {
  try {
    const data = await TutorialService.skipTutorial(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const replayTutorial = async (req, res, next) => {
  try {
    const data = await TutorialService.replayTutorial(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const dismissTooltip = async (req, res, next) => {
  try {
    const { tooltipKey } = req.body;
    const data = await TutorialService.dismissTooltip(req.user._id, tooltipKey);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
