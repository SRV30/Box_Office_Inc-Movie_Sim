import crypto from "node:crypto";

import { generateDirectorAge } from "./ageGenerator.js";
import { generateDirectorName } from "./nameGenerator.js";
import { calculateDirectorRarity } from "./rarityCalculator.js";
import { calculateDirectorSalary } from "./salaryCalculator.js";

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

export const generateDirector = (forcedAge = null) => {
  const age = forcedAge ?? generateDirectorAge();

  const creativity = randomStat();
  const reliability = randomStat();
  const leadership = randomStat();

  const reputation =
    age < 25
      ? randomStat(0, 20)
      : age < 40
      ? randomStat(10, 50)
      : age < 60
      ? randomStat(30, 80)
      : randomStat(50, 100);

  const rarity = calculateDirectorRarity({
    creativity,
    reliability,
    leadership,
  });

  const salary = calculateDirectorSalary({
    creativity,
    reliability,
    leadership,
    reputation,
  });

  return {
    id: crypto.randomUUID(),

    name: generateDirectorName(),

    avatarSeed: crypto.randomUUID(),

    age,

    creativity,

    reliability,

    leadership,

    reputation,

    morale: randomStat(60, 100),

    salary,

    marketValue: salary * 52,

    rarity,

    genreExpertise: getGenreExpertise(),

    status: "AVAILABLE",

    busyUntilWeek: null,

    contractYears: Math.floor(Math.random() * 5) + 1,

    moviesDirected: 0,

    hitMovies: 0,

    flopMovies: 0,

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

    studiosWorkedWith: [],

    ratings: [],

    discovered: age < 25 ? 10 : age < 40 ? 40 : 80,
  };
};

export const generateDirectors = (count = 50) => {
  const targetYoungDirectors = Math.floor(count * 0.2);
  const targetMidCareerDirectors = Math.floor(count * 0.7);
  const targetVeteranDirectors = count - targetYoungDirectors - targetMidCareerDirectors;

  return [
    ...Array.from({ length: targetYoungDirectors }, () =>
      generateDirector(Math.floor(Math.random() * 13) + 18),
    ),
    ...Array.from({ length: targetMidCareerDirectors }, () =>
      generateDirector(Math.floor(Math.random() * 30) + 31),
    ),
    ...Array.from({ length: targetVeteranDirectors }, () =>
      generateDirector(Math.floor(Math.random() * 30) + 61),
    ),
  ].sort(() => Math.random() - 0.5);
};
