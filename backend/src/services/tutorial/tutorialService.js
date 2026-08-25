import GameState from "../../models/GameState.js";
import Studio from "../../models/Studio.js";

export const TUTORIAL_STEPS = [
  {
    id: "WELCOME_STUDIO",
    stepIndex: 0,
    title: "Welcome to Movie Studio Management",
    description: "Welcome to Box Office Inc! As head of your new studio, your goal is to produce blockbusters, manage finances, and dominate the global box office.",
    category: "ONBOARDING",
    targetRoute: "/",
    actionHint: "Inspect your studio cash reserves, current week, and studio reputation.",
    requiredMetric: "studioName",
  },
  {
    id: "SCOUT_SCRIPT",
    stepIndex: 1,
    title: "Acquiring Your First Script",
    description: "Every great film begins with a great screenplay. Browse the script marketplace or hire a screenwriter to develop an original story with high quality and genre appeal.",
    category: "PRE_PRODUCTION",
    targetRoute: "/scripts",
    actionHint: "Check the Scripts page to acquire an available screenplay.",
  },
  {
    id: "HIRE_DIRECTOR",
    stepIndex: 2,
    title: "Attaching a Visionary Director",
    description: "Directors translate scripts onto the screen. Match a director's genre specialty and creativity with your script for maximum production synergy.",
    category: "TALENT",
    targetRoute: "/directors",
    actionHint: "Visit the Directors market to recruit a director matching your project genre.",
  },
  {
    id: "CAST_ACTORS",
    stepIndex: 3,
    title: "Casting Leads and Supporting Stars",
    description: "Star power drives audience appeal and opening-weekend box office buzz. Balance popularity, acting skill, and salary expectations.",
    category: "TALENT",
    targetRoute: "/actors",
    actionHint: "Sign lead and supporting talent for your upcoming production.",
  },
  {
    id: "ASSEMBLE_CREW",
    stepIndex: 4,
    title: "Contracting Production Crew",
    description: "A skilled crew ensures production stays on schedule and avoids costly set delays and quality penalties.",
    category: "PRODUCTION",
    targetRoute: "/crew",
    actionHint: "Contract an experienced crew team to oversee cinematography, sound, and VFX.",
  },
  {
    id: "GREENLIGHT_PRODUCTION",
    stepIndex: 5,
    title: "Greenlighting Your Movie",
    description: "Assemble your script, director, lead actor, and crew into active production. Allocate your budget carefully.",
    category: "PRODUCTION",
    targetRoute: "/movies/create",
    actionHint: "Create and greenlight your movie project.",
  },
  {
    id: "MARKETING_CAMPAIGN",
    stepIndex: 6,
    title: "Marketing & Hype Building",
    description: "Launch marketing campaigns like trailers, press junkets, and billboard blitzes to raise audience hype before release.",
    category: "MARKETING",
    targetRoute: "/marketing",
    actionHint: "Invest in promotional strategies to maximize opening weekend awareness.",
  },
  {
    id: "THEATRICAL_RELEASE",
    stepIndex: 7,
    title: "Releasing to Theaters & Reading Reviews",
    description: "Schedule your release week. Watch critic reviews, audience scores, and opening-weekend returns roll in.",
    category: "DISTRIBUTION",
    targetRoute: "/movies/ready",
    actionHint: "Release your finished film and analyze critical response.",
  },
  {
    id: "STUDIO_EXPANSION",
    stepIndex: 8,
    title: "Reinvesting in Studio Upgrades & Facilities",
    description: "Use your box office profits to buy studio upgrades, soundstages, post-production suites, and PR crisis insurance.",
    category: "EXPANSION",
    targetRoute: "/upgrades",
    actionHint: "Upgrade your studio infrastructure to scale your Hollywood empire.",
  },
];

export class TutorialService {
  /**
   * Retrieves player's current tutorial progress.
   */
  static async getTutorialState(userId) {
    const gameState = await GameState.findOne({ user: userId });
    if (!gameState) {
      return {
        isActive: false,
        currentStep: 0,
        currentStepData: TUTORIAL_STEPS[0],
        allSteps: TUTORIAL_STEPS,
        completedSteps: [],
        dismissedTooltips: [],
        isCompleted: false,
        isSkipped: false,
      };
    }

    if (!gameState.tutorialProgress) {
      gameState.tutorialProgress = {
        isActive: true,
        currentStep: 0,
        currentStepId: TUTORIAL_STEPS[0].id,
        completedSteps: [],
        dismissedTooltips: [],
        isCompleted: false,
        isSkipped: false,
        replayCount: 0,
        lastUpdated: new Date(),
      };
      await gameState.save();
    }

    const prog = gameState.tutorialProgress;
    const stepData = TUTORIAL_STEPS[prog.currentStep] || TUTORIAL_STEPS[0];

    return {
      isActive: prog.isActive,
      currentStep: prog.currentStep,
      currentStepId: prog.currentStepId,
      currentStepData: stepData,
      allSteps: TUTORIAL_STEPS,
      completedSteps: prog.completedSteps || [],
      dismissedTooltips: prog.dismissedTooltips || [],
      isCompleted: prog.isCompleted,
      isSkipped: prog.isSkipped,
      replayCount: prog.replayCount || 0,
    };
  }

  /**
   * Advances the tutorial to the next step or marks a specific step as complete.
   */
  static async advanceTutorial(userId, { stepId, nextStepIndex }) {
    const gameState = await GameState.findOne({ user: userId });
    if (!gameState) throw new Error("Game state not found");

    if (!gameState.tutorialProgress) {
      gameState.tutorialProgress = {
        isActive: true,
        currentStep: 0,
        currentStepId: TUTORIAL_STEPS[0].id,
        completedSteps: [],
        dismissedTooltips: [],
        isCompleted: false,
        isSkipped: false,
        replayCount: 0,
      };
    }

    const prog = gameState.tutorialProgress;

    if (stepId && !prog.completedSteps.includes(stepId)) {
      prog.completedSteps.push(stepId);
    }

    let targetIndex =
      typeof nextStepIndex === "number"
        ? nextStepIndex
        : prog.currentStep + 1;

    if (targetIndex >= TUTORIAL_STEPS.length) {
      prog.isCompleted = true;
      prog.isActive = false;
      prog.currentStep = TUTORIAL_STEPS.length - 1;
      prog.currentStepId = TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].id;
    } else {
      prog.currentStep = Math.max(0, targetIndex);
      prog.currentStepId = TUTORIAL_STEPS[prog.currentStep].id;
    }

    prog.lastUpdated = new Date();
    await gameState.save();

    return this.getTutorialState(userId);
  }

  /**
   * Skips the tutorial for experienced players.
   */
  static async skipTutorial(userId) {
    const gameState = await GameState.findOne({ user: userId });
    if (!gameState) throw new Error("Game state not found");

    if (!gameState.tutorialProgress) {
      gameState.tutorialProgress = {};
    }

    gameState.tutorialProgress.isSkipped = true;
    gameState.tutorialProgress.isActive = false;
    gameState.tutorialProgress.lastUpdated = new Date();
    await gameState.save();

    return this.getTutorialState(userId);
  }

  /**
   * Replays the tutorial from the beginning.
   */
  static async replayTutorial(userId) {
    const gameState = await GameState.findOne({ user: userId });
    if (!gameState) throw new Error("Game state not found");

    const currentReplay = (gameState.tutorialProgress?.replayCount || 0) + 1;

    gameState.tutorialProgress = {
      isActive: true,
      currentStep: 0,
      currentStepId: TUTORIAL_STEPS[0].id,
      completedSteps: [],
      dismissedTooltips: [],
      isCompleted: false,
      isSkipped: false,
      replayCount: currentReplay,
      lastUpdated: new Date(),
    };

    await gameState.save();
    return this.getTutorialState(userId);
  }

  /**
   * Records contextual tooltip dismissal so players aren't overwhelmed with duplicate prompts.
   */
  static async dismissTooltip(userId, tooltipKey) {
    const gameState = await GameState.findOne({ user: userId });
    if (!gameState) throw new Error("Game state not found");

    if (!gameState.tutorialProgress) {
      gameState.tutorialProgress = {
        dismissedTooltips: [],
      };
    }

    if (!gameState.tutorialProgress.dismissedTooltips.includes(tooltipKey)) {
      gameState.tutorialProgress.dismissedTooltips.push(tooltipKey);
    }

    await gameState.save();
    return {
      success: true,
      dismissedTooltips: gameState.tutorialProgress.dismissedTooltips,
    };
  }
}

export default TutorialService;
