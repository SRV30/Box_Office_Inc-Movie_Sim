import crypto from "node:crypto";

import { generateActorAge, generateActorAgeForBucket } from "./ageGenerator.js";
import { generateActorName } from "./nameGenerator.js";
import { calculateActorRarity } from "./rarityCalculator.js";
import { calculateActorSalary } from "./salaryCalculator.js";

const randomStat = (min = 40, max = 100) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getAgeAdjustedPopularity = (age) => {
  if (age < 25) return randomStat(5, 35);
  if (age < 40) return randomStat(20, 75);
  if (age < 60) return randomStat(35, 90);

  return randomStat(45, 100);
};

const getAgeAdjustedFanbase = (age, popularity) => {
  const baseFanbase = popularity * randomStat(3000, 12000);
  const ageMultiplier = age < 25 ? 0.45 : age < 40 ? 0.9 : age < 60 ? 1.25 : 1.05;

  return Math.round(baseFanbase * ageMultiplier);
};

export const generateActor = (forcedAge = null) => {
  const age = forcedAge ?? generateActorAge();
  const popularity = getAgeAdjustedPopularity(age);
  const actingSkill = randomStat();
  const reliability = randomStat();
  const fanbase = getAgeAdjustedFanbase(age, popularity);
  const hiddenPotential = randomStat(1, 100);

  const rarity = calculateActorRarity({
    popularity,
    actingSkill,
    reliability,
    fanbase,
    hiddenPotential,
  });

  const salary = calculateActorSalary({
    popularity,
    actingSkill,
    reliability,
    fanbase,
    rarity,
  });

  return {
    id: crypto.randomUUID(),
    name: generateActorName(),
    avatarSeed: crypto.randomUUID(),
    age,
    popularity,
    actingSkill,
    reliability,
    fanbase,
    morale: randomStat(60, 100),
    salary,
    rarity,
    hiddenPotential,
    status: "AVAILABLE",
    busyUntilWeek: null,
    contractYears: Math.floor(Math.random() * 5) + 1,
    movies: 0,
    leadRoles: 0,
    supportingRoles: 0,
    hitMovies: 0,
    flopMovies: 0,
    awards: 0,
    boxOfficeTotal: 0,
    careerEarnings: 0,
    salaryHistory: [
      {
        week: 1,
        salary,
        reason: "Initial Salary",
      },
    ],
    careerHistory: [],
    studiosWorkedWith: [],
    discovered: age < 25 ? 10 : age < 40 ? 35 : 70,
    hiredAt: null,
  };
};

export const generateActors = (count = 100) => {
  const targetYoungActors = Math.floor(count * 0.2);
  const targetPrimeActors = Math.floor(count * 0.7);
  const targetVeteranActors = count - targetYoungActors - targetPrimeActors;

  return [
    ...Array.from({ length: targetYoungActors }, () =>
      generateActor(generateActorAgeForBucket("young")),
    ),
    ...Array.from({ length: targetPrimeActors }, () =>
      generateActor(generateActorAgeForBucket("prime")),
    ),
    ...Array.from({ length: targetVeteranActors }, () =>
      generateActor(generateActorAgeForBucket("veteran")),
    ),
  ].sort(() => Math.random() - 0.5);
};
