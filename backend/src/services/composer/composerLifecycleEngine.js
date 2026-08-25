import Composer from "../../models/Composer.js";
import Studio from "../../models/Studio.js";
import GameState from "../../models/GameState.js";

/**
 * Engine handling Composer lifecycles, aging, movie music score calculation, and salary progression.
 */
export class ComposerLifecycleEngine {
  /**
   * Calculates compatibility multiplier between composer and movie genre/style.
   */
  static calculateGenreCompatibility(composer, movieGenre) {
    if (!composer || !movieGenre) return 1.0;

    const expertise = composer.genreExpertise || [];
    const isSpecialist = expertise.some(
      (g) => g.toLowerCase() === movieGenre.toLowerCase()
    );

    if (isSpecialist) {
      // Specialist bonus scaled by versatility
      const bonus = 1.15 + (composer.versatility / 100) * 0.15;
      return Number(bonus.toFixed(3)); // 1.15x - 1.30x
    }

    // Out of genre penalty mitigated by high versatility
    const penalty = 0.85 + (composer.versatility / 100) * 0.15; // 0.85x - 1.00x
    return Number(penalty.toFixed(3));
  }

  /**
   * Calculates the soundtrack impact on movie quality score and audience buzz.
   */
  static calculateMovieMusicImpact(composer, movieGenre, productionBudget = 10000000) {
    if (!composer) {
      return {
        qualityBoost: 0,
        audienceScoreBonus: 0,
        soundtrackRoyalties: 0,
        criticScoreModifier: 0,
      };
    }

    const compatibility = this.calculateGenreCompatibility(composer, movieGenre);
    const effectiveTalent = composer.musicalTalent * compatibility;

    // Quality boost contributes between +2 and +12 points to movie quality
    const qualityBoost = Number(((effectiveTalent / 100) * 10 + (composer.versatility / 100) * 2).toFixed(1));

    // Audience soundtrack buzz bonus based on composer popularity
    const audienceScoreBonus = Math.round((composer.popularity / 100) * 8);

    // Royalty estimate scaled by movie tier and popularity
    const royaltyMultiplier = (composer.popularity / 100) * 0.05 + 0.01;
    const soundtrackRoyalties = Math.round(productionBudget * royaltyMultiplier);

    // Critic score modifier
    const criticScoreModifier = effectiveTalent > 75 ? 5 : effectiveTalent < 40 ? -3 : 0;

    return {
      qualityBoost,
      audienceScoreBonus,
      soundtrackRoyalties,
      criticScoreModifier,
      compatibility,
    };
  }

  /**
   * Evaluates career progression, salary increase, and demand after a movie release.
   */
  static async processMovieReleaseProgression(composerId, { boxOfficeHit, awardWon, reviewScore }) {
    const composer = await Composer.findById(composerId);
    if (!composer) return null;

    composer.scoresComposed += 1;

    let popularityGain = 0;
    let talentGain = 0;

    if (boxOfficeHit) {
      composer.hitScores += 1;
      popularityGain += Math.floor(Math.random() * 6) + 3; // +3 to +8
    } else {
      popularityGain += 1;
    }

    if (reviewScore >= 80) {
      talentGain += 2;
      composer.prestige += 5;
    } else if (reviewScore < 50 && composer.musicalTalent > 40) {
      talentGain -= 1;
    }

    if (awardWon) {
      composer.awards.push(awardWon);
      composer.prestige += 15;
      popularityGain += 10;
      talentGain += 3;
    }

    composer.popularity = Math.min(100, Math.max(1, composer.popularity + popularityGain));
    composer.musicalTalent = Math.min(100, Math.max(1, composer.musicalTalent + talentGain));

    // Demand & salary progression
    composer.demand = Number((1.0 + (composer.popularity / 100) * 1.5 + (composer.prestige / 50) * 0.8).toFixed(2));
    const baseSalary = 50000 + composer.musicalTalent * 1500 + composer.popularity * 2500;
    composer.salary = Math.round(baseSalary * composer.demand);

    await composer.save();
    return composer;
  }

  /**
   * Processes weekly aging, contract countdowns, fatigue, and retirement triggers across all active composers.
   */
  static async processWeeklyTick(currentWeek) {
    const isNewYear = currentWeek > 0 && currentWeek % 52 === 0;
    const updates = [];

    const activeComposers = await Composer.find({ status: { $ne: "RETIRED" } });

    for (const composer of activeComposers) {
      // Annual aging
      if (isNewYear) {
        composer.age += 1;

        // Retirement probability increases after age 65
        if (composer.age >= 65) {
          const retirementChance = (composer.age - 64) * 0.08; // 8% at 65, 48% at 70
          if (Math.random() < retirementChance) {
            composer.status = "RETIRED";
            composer.retiredAtWeek = currentWeek;
            updates.push(composer.save());
            continue;
          }
        }
      }

      // Decrement busy week if assigned
      if (composer.busyUntilWeek > 0 && composer.busyUntilWeek <= currentWeek) {
        composer.status = composer.studio ? "UNDER_CONTRACT" : "AVAILABLE";
        composer.busyUntilWeek = 0;
      }

      // Check contract expiration if applicable
      if (isNewYear && composer.contractYears > 0) {
        composer.contractYears -= 1;
        if (composer.contractYears === 0) {
          composer.studio = null;
          composer.status = "AVAILABLE";
        }
      }

      updates.push(composer.save());
    }

    await Promise.all(updates);
    return {
      processedCount: activeComposers.length,
      isNewYear,
    };
  }
}

export default ComposerLifecycleEngine;
