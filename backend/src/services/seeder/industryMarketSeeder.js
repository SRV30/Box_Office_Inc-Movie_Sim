import RivalStudio from "../../models/RivalStudio.js";
import MarketActor from "../../models/MarketActor.js";
import MarketDirector from "../../models/MarketDirector.js";
import Composer from "../../models/Composer.js";
import GameState from "../../models/GameState.js";
import Studio from "../../models/Studio.js";

const TOP_10_GIANTS = [
  { name: "Apex Global Pictures", budget: 250000000, reputation: 95, marketShare: 0.18 },
  { name: "Olympus Pictures", budget: 220000000, reputation: 92, marketShare: 0.15 },
  { name: "Paramount Mirage", budget: 200000000, reputation: 90, marketShare: 0.13 },
  { name: "Centurion Filmworks", budget: 180000000, reputation: 88, marketShare: 0.11 },
  { name: "Silver Screen Universe", budget: 160000000, reputation: 86, marketShare: 0.09 },
  { name: "Monarch Studios", budget: 150000000, reputation: 84, marketShare: 0.08 },
  { name: "Nova Horizon Media", budget: 140000000, reputation: 82, marketShare: 0.07 },
  { name: "Starlight Cinematic", budget: 130000000, reputation: 80, marketShare: 0.06 },
  { name: "Vanguard Entertainment", budget: 120000000, reputation: 78, marketShare: 0.05 },
  { name: "Eclipse Studios", budget: 110000000, reputation: 76, marketShare: 0.04 },
];

const GENRES = ["Action", "Sci-Fi", "Drama", "Comedy", "Horror", "Romance", "Thriller", "Adventure", "Fantasy", "Animation"];

const FIRST_NAMES = [
  "Alexander", "Charlotte", "Liam", "Sophia", "Noah", "Emma", "Oliver", "Amelia", "James", "Ava",
  "Benjamin", "Isabella", "Lucas", "Mia", "Henry", "Evelyn", "Ethan", "Harper", "Sebastian", "Luna",
  "Jack", "Camila", "Owen", "Gianna", "Samuel", "Abigail", "Ryan", "Ella", "Nathan", "Avery",
  "Christian", "Scarlett", "Hunter", "Emily", "Adrian", "Aria", "Julian", "Penelope", "Leo", "Chloe",
  "Gabriel", "Layla", "Matthew", "Mila", "Dominic", "Nora", "Ezra", "Hazel", "Anthony", "Victoria"
];

const LAST_NAMES = [
  "Sterling", "Vance", "Blackwood", "Sinclair", "Holloway", "Mercer", "Kingsley", "Winter", "Fox", "Cross",
  "Hart", "Stone", "Thorne", "Drake", "Hayes", "Frost", "Reid", "Cole", "Knight", "Rivers",
  "Locke", "Monroe", "West", "Archer", "Wilder", "Rowan", "Beckett", "Sloane", "Kensington", "Fairchild"
];

const deterministicRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export class IndustryMarketSeeder {
  /**
   * Seeds 99 AI Competitor Studios + 10 Industry Giants deterministically and idempotently.
   */
  static generateStudios() {
    const studios = [...TOP_10_GIANTS];

    for (let i = 11; i <= 99; i++) {
      const prefix = ["Summit", "Metro", "Atlas", "Crown", "Titan", "Zenith", "Pinnacle", "Aurora", "Beacon", "Crest"][i % 10];
      const suffix = ["Entertainment", "Productions", "Films", "Media Group", "Studios", "Pictures"][i % 6];
      const budget = Math.floor(10000000 + (i * 900000));
      const reputation = Math.floor(40 + (i * 0.4));
      studios.push({
        name: `${prefix} ${suffix} #${i}`,
        budget,
        reputation,
        marketShare: Number((0.001 + (i * 0.0001)).toFixed(4)),
        producedMovies: [
          {
            title: `${prefix} Premiere ${i}`,
            genre: GENRES[i % GENRES.length],
            budget: Math.floor(budget * 0.3),
            boxOffice: Math.floor(budget * 0.7),
            releasedAt: new Date(Date.now() - i * 86400000),
          },
        ],
      });
    }

    return studios;
  }

  /**
   * Generates deterministic talent entities (Actors, Writers, Directors, Composers).
   */
  static generateActors(userId, count = 1000) {
    const actors = [];
    for (let i = 1; i <= count; i++) {
      const fn = FIRST_NAMES[i % FIRST_NAMES.length];
      const ln = LAST_NAMES[(i * 3) % LAST_NAMES.length];
      const age = 18 + (i % 65);
      const skill = Math.floor(30 + (i % 68));
      const popularity = Math.floor(20 + ((i * 7) % 78));
      const salary = Math.floor(25000 + skill * 2000 + popularity * 3500);

      actors.push({
        userId,
        id: `act_${i}`,
        name: `${fn} ${ln}`,
        avatarSeed: `seed_act_${i}`,
        age,
        actingSkill: skill,
        popularity,
        reliability: Math.floor(50 + (i % 48)),
        fanbase: popularity * 20000,
        morale: 100,
        salary,
        rarity: skill >= 85 ? "LEGENDARY" : skill >= 70 ? "EPIC" : skill >= 50 ? "RARE" : "COMMON",
        hiddenPotential: Math.floor(i % 100),
        status: "AVAILABLE",
        movies: Math.floor(i % 15),
        hitMovies: Math.floor((i % 15) * 0.4),
      });
    }
    return actors;
  }

  static generateWriters(count = 500) {
    const writers = [];
    for (let i = 1; i <= count; i++) {
      const fn = FIRST_NAMES[(i * 2) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(i * 5) % LAST_NAMES.length];
      const age = 22 + (i % 55);
      const originality = Math.floor(40 + (i % 58));
      const consistency = Math.floor(40 + ((i * 3) % 58));
      const salary = Math.floor(20000 + originality * 1500);

      writers.push({
        id: `wri_${i}`,
        name: `${fn} ${ln}`,
        avatarSeed: `seed_wri_${i}`,
        age,
        originality,
        consistency,
        reliability: Math.floor(50 + (i % 45)),
        reputation: Math.floor(20 + (i % 75)),
        morale: 100,
        salary,
        rarity: originality >= 85 ? "LEGENDARY" : originality >= 70 ? "EPIC" : "COMMON",
        genreExpertise: [GENRES[i % GENRES.length], GENRES[(i + 2) % GENRES.length]],
        status: "AVAILABLE",
        writtenScripts: Math.floor(i % 10),
      });
    }
    return writers;
  }

  static generateDirectors(userId, count = 300) {
    const directors = [];
    for (let i = 1; i <= count; i++) {
      const fn = FIRST_NAMES[(i * 4) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(i * 7) % LAST_NAMES.length];
      const age = 25 + (i % 50);
      const creativity = Math.floor(45 + (i % 53));
      const leadership = Math.floor(40 + ((i * 2) % 58));
      const salary = Math.floor(35000 + creativity * 2500);

      directors.push({
        userId,
        id: `dir_${i}`,
        name: `${fn} ${ln}`,
        avatarSeed: `seed_dir_${i}`,
        age,
        creativity,
        reliability: Math.floor(50 + (i % 48)),
        leadership,
        reputation: Math.floor(30 + (i % 68)),
        morale: 100,
        salary,
        rarity: creativity >= 85 ? "LEGENDARY" : creativity >= 70 ? "EPIC" : "COMMON",
        genreExpertise: [GENRES[i % GENRES.length]],
        status: "AVAILABLE",
        moviesDirected: Math.floor(i % 8),
      });
    }
    return directors;
  }

  static generateComposers(count = 300) {
    const composers = [];
    for (let i = 1; i <= count; i++) {
      const fn = FIRST_NAMES[(i * 6) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(i * 2) % LAST_NAMES.length];
      const age = 24 + (i % 52);
      const musicalTalent = Math.floor(40 + (i % 58));
      const versatility = Math.floor(40 + ((i * 5) % 58));
      const popularity = Math.floor(25 + ((i * 3) % 70));
      const salary = Math.floor(25000 + musicalTalent * 1800 + popularity * 2000);

      composers.push({
        name: `${fn} ${ln}`,
        avatarSeed: `seed_comp_${i}`,
        age,
        musicalTalent,
        versatility,
        popularity,
        prestige: Math.floor((i % 10) * 5),
        salary,
        genreExpertise: [GENRES[i % GENRES.length], GENRES[(i + 3) % GENRES.length]],
        status: "AVAILABLE",
        scoresComposed: Math.floor(i % 12),
      });
    }
    return composers;
  }

  /**
   * Idempotently seeds the full V1 industry market into MongoDB.
   */
  static async seedFullIndustryMarket(userId) {
    const report = {
      aiStudiosCreated: 0,
      industryGiantsCreated: 0,
      actorsCreated: 0,
      writersCreated: 0,
      directorsCreated: 0,
      composersCreated: 0,
      timestamp: new Date(),
    };

    // 1. Seed Rival AI Studios & Giants (idempotent: delete existing rival studios)
    await RivalStudio.deleteMany({});
    const studios = this.generateStudios();
    await RivalStudio.insertMany(studios);
    report.aiStudiosCreated = 99;
    report.industryGiantsCreated = 10;

    // 2. Seed Actors in MarketActor collection
    if (userId) {
      await MarketActor.deleteMany({ userId });
      const actors = this.generateActors(userId, 1000);
      await MarketActor.insertMany(actors);
      report.actorsCreated = 1000;

      // 3. Seed Directors in MarketDirector collection
      await MarketDirector.deleteMany({ userId });
      const directors = this.generateDirectors(userId, 300);
      await MarketDirector.insertMany(directors);
      report.directorsCreated = 300;

      // 4. Seed Writers in GameState.marketWriters
      const writers = this.generateWriters(500);
      await GameState.updateOne(
        { user: userId },
        { $set: { marketWriters: writers } }
      );
      report.writersCreated = 500;
    }

    // 5. Seed Composers in Composer collection
    await Composer.deleteMany({});
    const composers = this.generateComposers(300);
    await Composer.insertMany(composers);
    report.composersCreated = 300;

    return report;
  }
}

export default IndustryMarketSeeder;
