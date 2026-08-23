import crypto from "node:crypto";

const rarities = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];

const prefixes = [
  "Silver", "Golden", "Aurora", "Titan", "Moonlight", "Red", "Blue", "Emerald",
  "Zenith", "Apex", "Stellar", "Infinite", "Global", "Direct", "Vision", "Alpha"
];

const midfixes = [
  "Frame", "Horizon", "Visual", "Production", "Cinema", "Digital", "Creative",
  "Nexus", "Peak", "Core", "Stream", "Focus", "Legacy", "Origin", "Empire"
];

const suffixes = [
  "Studios", "House", "Works", "Crew", "Productions", "Group", "Collective",
  "Media", "Labs", "Partners", "Enterprises", "Films", "Systems", "Agency"
];

const randomStat = (min = 40, max = 100) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateCrewName = () => {
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const m = midfixes[Math.floor(Math.random() * midfixes.length)];
  const s = suffixes[Math.floor(Math.random() * suffixes.length)];

  if (Math.random() > 0.5) {
    return `${p} ${m} ${s}`;
  }
  return `${p} ${s}`;
};

const calculateCrewRarity = (stats) => {
  const avg = (stats.technicalQuality + stats.musicQuality + stats.vfxQuality + stats.creativity + stats.reliability) / 5;
  if (avg >= 85) return "LEGENDARY";
  if (avg >= 75) return "EPIC";
  if (avg >= 65) return "RARE";
  if (avg >= 55) return "UNCOMMON";
  return "COMMON";
};

const calculateCrewSalary = (stats, rarity) => {
  const base = 5000;
  const rarityMultipliers = {
    COMMON: 1,
    UNCOMMON: 2,
    RARE: 5,
    EPIC: 12,
    LEGENDARY: 30
  };

  const statWeight = (stats.technicalQuality + stats.musicQuality + stats.vfxQuality) / 3;
  return Math.floor(base * rarityMultipliers[rarity] * (statWeight / 50));
};

export const generateCrewTeam = () => {
  const technicalQuality = randomStat();
  const musicQuality = randomStat();
  const vfxQuality = randomStat();
  const creativity = randomStat();
  const reliability = randomStat();

  const rarity = calculateCrewRarity({
    technicalQuality, musicQuality, vfxQuality, creativity, reliability
  });

  const stats = { technicalQuality, musicQuality, vfxQuality, creativity, reliability };
  const salary = calculateCrewSalary(stats, rarity);

  return {
    id: crypto.randomUUID(),
    name: generateCrewName(),
    technicalQuality,
    musicQuality,
    vfxQuality,
    creativity,
    reliability,
    reputation: randomStat(10, 50),
    morale: randomStat(70, 100),
    salary,
    rarity,
    age: Math.floor(Math.random() * 20) + 1, // Years active
    discovery: Math.floor(Math.random() * 100),
    status: "AVAILABLE",
    busyUntilWeek: null,
    contractYears: Math.floor(Math.random() * 5) + 1,
    hiredAt: null
  };
};

export const generateCrewTeams = (count = 25) => {
  return Array.from({ length: count }, () => generateCrewTeam());
};
