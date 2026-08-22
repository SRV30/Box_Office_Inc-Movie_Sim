import Movie from "../../../models/Movie.js";
import Studio from "../../../models/Studio.js";
import Notification from "../../../models/Notification.js";
import PastAward from "../../../models/PastAward.js";

// Awards run annually at Week 52.
export const processAnnualAwards = async (gameState, studio) => {
    // We run awards once every 52 weeks (so when week % 52 === 0).
    // The tickEngine should call this exactly on week 52, 104, etc.

    // 1. Get all movies released this year (releaseWeek between currentWeek - 51 and currentWeek)
    const startWeek = gameState.currentWeek - 51;
    const endWeek = gameState.currentWeek;

    const eligibleMovies = await Movie.find({
        status: "RELEASED",
        releaseWeek: { $gte: startWeek, $lte: endWeek }
    });

    if (eligibleMovies.length === 0) return;

    // Evaluate Best Picture (highest quality + critic score)
    eligibleMovies.sort((a, b) => (b.quality + b.criticScore) - (a.quality + a.criticScore));
    const bestPicture = eligibleMovies[0];

    // Evaluate Best Director (highest quality + box office impact)
    // For simplicity, we just use the Best Picture's director, or we could sort directors differently
    const bestDirectorMovie = eligibleMovies.reduce((prev, curr) => (curr.criticScore > prev.criticScore) ? curr : prev, eligibleMovies[0]);
    
    // Evaluate Best Actor (highest audience appeal + quality)
    const bestActorMovie = eligibleMovies.reduce((prev, curr) => (curr.audienceScore + curr.quality > prev.audienceScore + prev.quality) ? curr : prev, eligibleMovies[0]);

    const year = Math.floor(gameState.currentWeek / 52);

    const awardRecord = {
        gameStateId: gameState._id,
        studioId: studio?._id,
        year,
        bestPictureId: bestPicture._id.toString(),
        bestPictureTitle: bestPicture.title,
        bestDirectorId: bestDirectorMovie.directorId,
        bestDirectorName: bestDirectorMovie.directorName || "Unknown Director",
        bestActorId: bestActorMovie.leadActorId,
        bestActorName: bestActorMovie.leadActorName || "Unknown Actor",
    };

    try {
        await PastAward.create(awardRecord);
    } catch (awardErr) {
        console.error("Failed to persist PastAward:", awardErr.message);
    }

    // Notify the user if their studio won
    if (studio) {
        let won = false;
        let messages = [];

        if (bestPicture.studioId.toString() === studio._id.toString()) {
            won = true;
            messages.push(`Best Picture (${bestPicture.title})`);
            studio.stats.awardsWon = (studio.stats.awardsWon || 0) + 1;
            studio.prestige += 500;
        }

        // Notifications are their own collection, not a field on gameState.
        //
        // This pushed to `gameState.notifications`, which the GameState schema
        // does not declare — so it was always undefined and the push threw
        // `Cannot read properties of undefined (reading 'push')`, failing the
        // whole weekly tick with a 500 and rolling back the transaction. Since
        // awards run on week 52, 104 and so on, the simulation became
        // impossible to advance past the first year end.
        //
        // Every other writer in the codebase uses Notification.create with a
        // gameStateId, which is what the client reads from; anything pushed
        // onto gameState would not have been displayed even had it persisted.
        await Notification.create({
            gameStateId: gameState._id,
            type: "AWARDS",
            message: won
                ? `🏆 Annual Awards! Your studio won: ${messages.join(", ")}! You gained massive prestige!`
                : `🏆 Annual Awards Year ${year}: Best Picture goes to '${bestPicture.title}'.`,
            createdAt: new Date(),
        });
    }
};

/**
 * Calculates prestige boost from winning film festival honors.
 * 
 * @param {string} awardWon - Award title (PALME_D_OR, GRAND_PRIX, etc).
 * @returns {number} Prestige points awarded.
 */
export const calculateFestivalPrestige = (awardWon) => {
  switch (awardWon) {
    case "PALME_D_OR": return 1000;
    case "GRAND_PRIX": return 600;
    case "GOLDEN_LION": return 750;
    case "AUDIENCE_AWARD": return 400;
    default: return 0;
  }
};

