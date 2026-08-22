import crypto from "node:crypto";

import { generateTitle } from "../script/titleGenerator.js";
import { calculatePrice } from "../script/priceCalculator.js";

const randomVariation = () => Math.floor(Math.random() * 11) - 5;

const calculateRarity = (
  quality,
  originality,
  audienceAppeal,
  franchisePotential
) => {
  const avg = (quality + originality + audienceAppeal + franchisePotential) / 4;

  if (avg >= 95) return "Legendary";
  if (avg >= 88) return "Epic";
  if (avg >= 78) return "Rare";
  if (avg >= 68) return "Uncommon";

  return "Common";
};

export const createScriptFromWriter = (writer, genre, qualityPenalty = 0) => {
  const quality = Math.min(
    100,
    Math.max(
      40,
      Math.round(
        writer.consistency * 0.5 +
          writer.originality * 0.3 +
          writer.reputation * 0.2 +
          randomVariation()
      )
    )
  );

  const adjustedQuality = Math.max(1, quality - qualityPenalty);

  const originality = Math.min(
    100,
    Math.max(40, Math.round(writer.originality + randomVariation()))
  );

  const audienceAppeal = Math.min(
    100,
    Math.max(
      40,
      Math.round(
        (writer.consistency + writer.reputation) / 2 + randomVariation()
      )
    )
  );

  const franchisePotential = Math.min(
    100,
    Math.max(
      40,
      Math.round(
        (writer.originality + writer.reputation) / 2 + randomVariation()
      )
    )
  );

  const rarity = calculateRarity(
    adjustedQuality,
    originality,
    audienceAppeal,
    franchisePotential
  );

  return {
    id: crypto.randomUUID(),

    title: generateTitle(),

    genres: [genre],

    quality: adjustedQuality,

    originality,

    audienceAppeal,

    franchisePotential,

    rarity,

    price: calculatePrice({
      quality: adjustedQuality,
      originality,
      audienceAppeal,
      franchisePotential,
    }),
  };
};
