import GameState from "../../models/GameState.js";
import Studio from "../../models/Studio.js";
import MarketCrewTeam from "../../models/MarketCrewTeam.js";

export const CREW_SPECIALTY_ROLES = [
  "Cinematography",
  "VFX & Special Effects",
  "Sound Engineering & Foley",
  "Production Design & Art Direction",
  "Stunt Coordination & Rigging",
  "Costume & High-Concept Makeup",
];

export class CrewTeamEngine {
  /**
   * Calculates production quality impact, time delay risk, and budget efficiency for a crew team.
   */
  static calculateProductionImpact(crewTeam, productionTier = "STANDARD") {
    if (!crewTeam) {
      return {
        qualityScoreModifier: -5,
        delayRiskPercent: 35,
        budgetEfficiency: 0.9,
        specialtyBonusApplied: false,
      };
    }

    const technical = crewTeam.technicalQuality || 50;
    const vfx = crewTeam.vfxQuality || 50;
    const creativity = crewTeam.creativity || 50;
    const reliability = crewTeam.reliability || 50;
    const morale = crewTeam.morale || 100;

    // Aggregate skill composite (0-100)
    const compositeSkill = (technical * 0.35 + vfx * 0.35 + creativity * 0.3);

    // Quality modifier contributed to movie (+1 to +15 points)
    const qualityScoreModifier = Number(((compositeSkill / 100) * 12 + (morale / 100) * 3).toFixed(1));

    // Delay risk in percentage (Reliability decreases risk; lower morale increases risk)
    const baseRisk = Math.max(2, Math.round((100 - reliability) * 0.35 + (100 - morale) * 0.15));

    // Budget efficiency (High reliability saves money on set)
    const budgetEfficiency = Number((0.95 + (reliability / 100) * 0.15).toFixed(2)); // 0.95x - 1.10x

    return {
      compositeSkill: Math.round(compositeSkill),
      qualityScoreModifier,
      delayRiskPercent: baseRisk,
      budgetEfficiency,
      reliability,
      morale,
    };
  }

  /**
   * Checks if a crew team is available or currently overbooked on active productions.
   */
  static checkConflictAndOverbooking(crewTeam, currentWeek) {
    if (!crewTeam) return { isAvailable: false, reason: "No crew team provided" };

    if (crewTeam.status === "BUSY" && crewTeam.busyUntilWeek && crewTeam.busyUntilWeek > currentWeek) {
      return {
        isAvailable: false,
        remainingBusyWeeks: crewTeam.busyUntilWeek - currentWeek,
        reason: `Crew team is currently busy on a production until week ${crewTeam.busyUntilWeek}`,
      };
    }

    return {
      isAvailable: true,
      remainingBusyWeeks: 0,
    };
  }

  /**
   * Assigns a crew team to a movie production for a specific duration.
   */
  static async assignCrewToMovie(userId, crewId, durationWeeks) {
    const gameState = await GameState.findOne({ user: userId });
    if (!gameState) throw new Error("Game state not found");

    const crew = (gameState.ownedCrewTeams || []).find((c) => c.id === crewId);
    if (!crew) throw new Error("Crew team not found in studio roster");

    const availability = this.checkConflictAndOverbooking(crew, gameState.currentWeek);
    if (!availability.isAvailable) {
      throw new Error(availability.reason);
    }

    crew.status = "BUSY";
    crew.busyUntilWeek = gameState.currentWeek + durationWeeks;
    await gameState.save();

    return crew;
  }

  /**
   * Processes weekly tick for crew progression, fatigue recovery, and contract expiry.
   */
  static async processWeeklyCrewTick(userId, currentWeek) {
    const gameState = await GameState.findOne({ user: userId });
    if (!gameState || !gameState.ownedCrewTeams) return { processed: 0 };

    let modified = false;

    for (const crew of gameState.ownedCrewTeams) {
      // Release from busy state if duration elapsed
      if (crew.status === "BUSY" && crew.busyUntilWeek && crew.busyUntilWeek <= currentWeek) {
        crew.status = "AVAILABLE";
        crew.busyUntilWeek = null;
        // Skill progression on successful film wrap
        crew.technicalQuality = Math.min(100, (crew.technicalQuality || 50) + 1);
        crew.reliability = Math.min(100, (crew.reliability || 50) + 1);
        modified = true;
      }

      // Natural morale recovery when not overworked
      if (crew.status === "AVAILABLE" && (crew.morale || 100) < 100) {
        crew.morale = Math.min(100, (crew.morale || 90) + 2);
        modified = true;
      }
    }

    if (modified) {
      await gameState.save();
    }

    return {
      processed: gameState.ownedCrewTeams.length,
      currentWeek,
    };
  }
}

export default CrewTeamEngine;
