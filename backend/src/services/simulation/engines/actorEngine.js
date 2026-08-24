import MarketActor from "../../../models/MarketActor.js";
import { generateActor } from "../../actor/actorGenerator.js";
import { addNotification } from "../helpers/notificationHelper.js";

const RETIREMENT_AGE = 70;
const WEEKS_PER_YEAR = 52;

const archiveRetiredActor = (gameState, actorData) => {
  gameState.retiredActors = gameState.retiredActors || [];
  const alreadyPreserved = gameState.retiredActors.some(
    (retired) => retired.id === actorData.id
  );

  if (!alreadyPreserved) {
    gameState.retiredActors.push({
      ...actorData,
      status: "RETIRED",
      retiredAtWeek: gameState.currentWeek,
    });
    addNotification(gameState, `${actorData.name} has retired from acting.`);
  }
};

const ageMarketActorPool = ({ actors = [], gameState }) => {
  const activeActors = [];
  let retiredCount = 0;

  actors.forEach((actor) => {
    if (actor.status === "RETIRED") {
      archiveRetiredActor(gameState, actor);
      return;
    }

    actor.age = Number(actor.age || 0) + 1;

    if (actor.age >= RETIREMENT_AGE) {
      archiveRetiredActor(gameState, actor);
      retiredCount += 1;
      return;
    }

    activeActors.push(actor);
  });

  return { activeActors, retiredCount };
};

const ageOwnedActorPool = ({ actors = [], gameState, activeMovieActorIds = new Set() }) => {
  const activeActors = [];
  let retiredCount = 0;

  actors.forEach((actor) => {
    if (actor.status === "RETIRED") {
      archiveRetiredActor(gameState, actor);
      return;
    }

    actor.age = Number(actor.age || 0) + 1;

    if (actor.age >= RETIREMENT_AGE) {
      // Do not retire an actor who is currently cast in an active production.
      // Their retirement is deferred until the production completes (#270).
      if (activeMovieActorIds.has(actor.id)) {
        activeActors.push(actor);
        return;
      }
      archiveRetiredActor(gameState, actor);
      retiredCount += 1;
      return;
    }

    activeActors.push(actor);
  });

  return { activeActors, retiredCount };
};

export const processActorAging = async (gameState) => {
  if (gameState.currentWeek % WEEKS_PER_YEAR !== 0) {
    return;
  }

  const userId = gameState.user;

  // 1. Age Market Actors
  const marketActors = await MarketActor.find({ userId }).lean();
  const marketResult = ageMarketActorPool({
    actors: marketActors,
    gameState,
  });

  const retiredIds = marketActors
    .filter((a) => !marketResult.activeActors.some((aa) => aa.id === a.id))
    .map((a) => a._id);

  if (retiredIds.length > 0) {
    await MarketActor.deleteMany({ _id: { $in: retiredIds } });
  }

  // Update surviving market actors via bulkWrite
  if (marketResult.activeActors.length > 0) {
    const bulkOps = marketResult.activeActors.map((actor) => ({
      updateOne: {
        filter: { _id: actor._id },
        update: { $set: { age: actor.age } },
      },
    }));
    await MarketActor.bulkWrite(bulkOps);
  }

  // 2. Age Owned Actors
  // Gather all actor IDs cast in active movies (non-released status)
  const activeMovieActorIds = new Set();
  (gameState.activeMovies || []).forEach((movie) => {
    if (!["RELEASED", "RELEASED_STREAMING"].includes(movie.status)) {
      if (movie.leadActorId) activeMovieActorIds.add(movie.leadActorId);
      if (movie.supportingActorIds) {
        movie.supportingActorIds.forEach((id) => activeMovieActorIds.add(id));
      }
    }
  });

  const ownedResult = ageOwnedActorPool({
    actors: gameState.ownedActors || [],
    gameState,
    activeMovieActorIds,
  });

  gameState.ownedActors = ownedResult.activeActors;

  // 3. Replenish market with replacements
  const totalRetirements = marketResult.retiredCount + ownedResult.retiredCount;
  if (totalRetirements > 0) {
    const replacements = [];
    for (let index = 0; index < totalRetirements; index += 1) {
      replacements.push({
        ...generateActor(),
        userId,
      });
    }
    await MarketActor.insertMany(replacements);
  }
};
