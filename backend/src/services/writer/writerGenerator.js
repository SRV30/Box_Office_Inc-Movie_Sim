import crypto from "node:crypto";

import { generateWriterName } from "./nameGenerator.js";
import { generateWriterAge } from "./ageGenerator.js";
import { calculateWriterRarity } from "./rarityCalculator.js";
import { calculateWriterSalary } from "./salaryCalculator.js";

const genres = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Romance",
  "Horror",
  "Thriller",
  "Mystery",
  "Sci-Fi",
  "Fantasy",
  "Survival",
  "Sports",
  "Crime",
  "War",
  "Historical",
  "Biography",
  "Political",
  "Animation",
  "Musical",
];

const randomStat = (min = 40, max = 100) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getGenreExpertise = () => {
  const shuffled = [...genres].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, 2);
};

export const generateWriter = (forcedAge = null) => {
  const age = forcedAge ?? generateWriterAge();

  const originality = randomStat();
  const consistency = randomStat();
  const reliability = randomStat();

  const reputation =
    age < 25
      ? randomStat(0, 20)
      : age < 40
      ? randomStat(10, 50)
      : age < 60
      ? randomStat(30, 80)
      : randomStat(50, 100);

  const rarity = calculateWriterRarity({
    originality,
    consistency,
    reliability,
  });

  const salary = calculateWriterSalary({
    originality,
    consistency,
    reliability,
    reputation,
  });

  return {
    id: crypto.randomUUID(),

    name: generateWriterName(),

    avatarSeed: crypto.randomUUID(),

    age,

    originality,

    consistency,

    reliability,

    reputation,

    morale: randomStat(60, 100),

    salary,

    rarity,

    genreExpertise: getGenreExpertise(),

    status: "AVAILABLE",

    busyUntilWeek: null,

    contractYears: Math.floor(Math.random() * 5) + 1,

    writtenScripts: 0,

    hitScripts: 0,

    flopScripts: 0,

    awards: 0,

    awardsHistory: [],

    totalEarnings: 0,

    salaryHistory: [
      {
        week: 1,
        salary,
        reason: "Initial Salary",
      },
    ],

    careerHistory: [],

    discovered: age < 25 ? 10 : age < 40 ? 40 : 80,
  };
};

export const generateWriters = (count = 50) => {
  return Array.from({ length: count }, () => generateWriter());
};
