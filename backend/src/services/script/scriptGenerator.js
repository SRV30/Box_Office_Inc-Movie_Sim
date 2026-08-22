import crypto from "node:crypto";

import { generateTitle } from "./titleGenerator.js";
import { generateGenres } from "./genreGenerator.js";
import { calculatePrice } from "./priceCalculator.js";
import { calculateRarity } from "./rarityCalculator.js";

const randomStat = () => Math.floor(Math.random() * 51) + 50;

export const generateScripts = (count = 5) => {
  return Array.from({ length: count }, () => {
    const quality = randomStat();
    const originality = randomStat();
    const audienceAppeal = randomStat();
    const franchisePotential = randomStat();

    const rarity = calculateRarity({
      quality,
      originality,
      audienceAppeal,
      franchisePotential,
    });

    return {
      id: crypto.randomUUID(),

      title: generateTitle(),

      genres: generateGenres(),

      quality,

      originality,

      audienceAppeal,

      franchisePotential,

      rarity,

      price: calculatePrice({
        quality,
        originality,
        audienceAppeal,
        franchisePotential,
      }),

      writer: null,

      writerId: null,

      studio: "Script Market",

      studioId: null,

      creationDate: new Date(),

      status: "AVAILABLE",

      assignedDirectorId: null,

      assignedDirectorName: null,

      directingProjectId: null,
    };
  });
};
