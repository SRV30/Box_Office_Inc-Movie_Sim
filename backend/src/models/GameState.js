import mongoose from "mongoose";

const gameStateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    currentWeek: {
      type: Number,
      default: 1,
    },

    lastSimulatedWeek: {
      type: Number,
      default: 0,
    },

    // Global Random Event Engine state. Tracks per-event cooldowns and a
    // rolling history of fired events. Mixed because event-id keys are
    // dynamic; the engine reads/writes it as a plain object. Optional with a
    // sensible default so pre-existing saves load unchanged.
    randomEvents: {
      cooldowns: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      history: [
        {
          id: String,
          label: String,
          week: Number,
        },
      ],
    },

    ownedScripts: [
      {
        id: String,

        title: String,

        genres: [String],

        quality: Number,

        originality: Number,

        audienceAppeal: Number,

        franchisePotential: Number,

        rarity: String,

        price: Number,

        sellPrice: Number,

        writer: String,

        writerId: String,

        studio: String,

        studioId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Studio",
        },

        creationDate: Date,

        purchasedAt: Date,

        status: {
          type: String,
          enum: ["AVAILABLE", "IN_DIRECTING", "PRE_PRODUCTION_READY", "SOLD"],
          default: "AVAILABLE",
        },

        assignedDirectorId: String,

        assignedDirectorName: String,

        directingProjectId: String,
      },
    ],

    marketScripts: [
      {
        id: String,

        title: String,

        genres: [String],

        quality: Number,

        originality: Number,

        audienceAppeal: Number,

        franchisePotential: Number,

        rarity: String,

        price: Number,

        writer: String,

        writerId: String,

        studio: String,

        studioId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Studio",
        },

        creationDate: Date,

        status: {
          type: String,
          enum: ["AVAILABLE", "IN_DIRECTING", "PRE_PRODUCTION_READY", "SOLD"],
          default: "AVAILABLE",
        },

        assignedDirectorId: String,

        assignedDirectorName: String,

        directingProjectId: String,
      },
    ],

    activeMovies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],

    movieHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],

    preProductionMovies: [
      {
        id: String,

        title: String,

        scriptId: String,

        scriptTitle: String,

        directorId: String,

        directorName: String,

        genre: String,

        projectedQuality: Number,

        stage: {
          type: String,
          default: "PRE_PRODUCTION_READY",
        },
      },
    ],

    marketWriters: [
      {
        id: String,

        name: String,

        avatarSeed: String,

        age: Number,

        originality: Number,

        consistency: Number,

        reliability: Number,

        reputation: Number,

        morale: Number,

        salary: Number,

        rarity: String,

        genreExpertise: [String],

        status: {
          type: String,
          default: "AVAILABLE",
        },

        busyUntilWeek: Number,

        contractYears: Number,

        writtenScripts: {
          type: Number,
          default: 0,
        },

        hitScripts: {
          type: Number,
          default: 0,
        },

        flopScripts: {
          type: Number,
          default: 0,
        },

        awards: {
          type: Number,
          default: 0,
        },

        totalEarnings: {
          type: Number,
          default: 0,
        },

        discovered: {
          type: Number,
          default: 0,
        },
      },
    ],

    ownedWriters: [
      {
        id: String,

        name: String,

        avatarSeed: String,

        age: Number,

        originality: Number,

        consistency: Number,

        reliability: Number,

        reputation: Number,

        morale: Number,

        salary: Number,

        rarity: String,

        genreExpertise: [String],

        status: {
          type: String,
          default: "AVAILABLE",
        },

        busyUntilWeek: Number,

        contractYears: Number,

        writtenScripts: {
          type: Number,
          default: 0,
        },

        hitScripts: {
          type: Number,
          default: 0,
        },

        flopScripts: {
          type: Number,
          default: 0,
        },

        awards: {
          type: Number,
          default: 0,
        },

        totalEarnings: {
          type: Number,
          default: 0,
        },

        discovered: {
          type: Number,
          default: 0,
        },

        hiredAt: Date,
      },
    ],

    ownedDirectors: [
      {
        id: String,

        name: String,

        avatarSeed: String,

        age: Number,

        creativity: Number,

        reliability: Number,

        leadership: Number,

        reputation: Number,

        morale: Number,

        salary: Number,

        marketValue: {
          type: Number,
          default: 0,
        },

        rarity: String,

        genreExpertise: [String],

        status: {
          type: String,
          default: "AVAILABLE",
        },

        busyUntilWeek: Number,

        contractYears: Number,

        moviesDirected: {
          type: Number,
          default: 0,
        },

        hitMovies: {
          type: Number,
          default: 0,
        },

        flopMovies: {
          type: Number,
          default: 0,
        },

        awards: {
          type: Number,
          default: 0,
        },

        totalEarnings: {
          type: Number,
          default: 0,
        },

        studiosWorkedWith: [String],

        ratings: [Number],

        discovered: {
          type: Number,
          default: 0,
        },

        hiredAt: Date,
      },
    ],


    ownedActors: [
      {
        id: String,

        name: String,

        avatarSeed: String,

        age: Number,

        popularity: Number,

        actingSkill: Number,

        reliability: Number,

        fanbase: Number,

        morale: Number,

        salary: Number,

        rarity: String,

        hiddenPotential: Number,

        status: {
          type: String,
          default: "AVAILABLE",
        },

        busyUntilWeek: Number,

        contractYears: Number,

        movies: {
          type: Number,
          default: 0,
        },

        leadRoles: {
          type: Number,
          default: 0,
        },

        supportingRoles: {
          type: Number,
          default: 0,
        },

        hitMovies: {
          type: Number,
          default: 0,
        },

        flopMovies: {
          type: Number,
          default: 0,
        },

        awards: {
          type: Number,
          default: 0,
        },

        boxOfficeTotal: {
          type: Number,
          default: 0,
        },

        careerEarnings: {
          type: Number,
          default: 0,
        },

        studiosWorkedWith: [String],

        discovered: {
          type: Number,
          default: 0,
        },

        hiredAt: Date,
      },
    ],

    ownedCrewTeams: [
      {
        id: String,
        name: String,
        technicalQuality: Number,
        musicQuality: Number,
        vfxQuality: Number,
        creativity: Number,
        reliability: Number,
        reputation: Number,
        morale: Number,
        salary: Number,
        rarity: String,
        age: Number,
        discovery: Number,
        status: {
          type: String,
          enum: ["AVAILABLE", "BUSY"],
          default: "AVAILABLE",
        },
        busyUntilWeek: Number,
        hiredAt: Date,
        contractYears: Number,
        careerTier: { type: String, default: "Rookie" },
      },
    ],

    retiredActors: [mongoose.Schema.Types.Mixed],

    actorAwardYearsProcessed: [Number],

    retiredDirectors: [mongoose.Schema.Types.Mixed],

    directorAwardYearsProcessed: [Number],

    activeDirectorProjects: [
      {
        id: String,

        directorId: String,

        directorName: String,

        scriptId: String,

        scriptTitle: String,

        scriptQuality: Number,

        movieName: String,

        genre: String,

        startWeek: Number,

        completionWeek: Number,

        progress: Number,

        qualityPenalty: {
          type: Number,
          default: 0,
        },

        replacementRequired: {
          type: Boolean,
          default: false,
        },

        status: {
          type: String,
          default: "DIRECTING",
        },
      },
    ],


    activeActorProjects: [
      {
        id: String,

        actorId: String,

        actorName: String,

        movieId: String,

        movieTitle: String,

        roleType: String,

        startWeek: Number,

        completionWeek: Number,

        progress: Number,

        performanceScore: Number,

        qualityImpact: Number,

        replacementRequired: {
          type: Boolean,
          default: false,
        },

        status: {
          type: String,
          default: "ACTING",
        },
      },
    ],

    activeWritingProjects: [
      {
        id: String,

        writerId: String,

        writerName: String,

        genre: String,

        targetAudience: String,

        startWeek: Number,

        completionWeek: Number,

        progress: Number,

        qualityPenalty: {
          type: Number,
          default: 0,
        },

        replacementRequired: {
          type: Boolean,
          default: false,
        },

        status: {
          type: String,
          default: "WRITING",
        },
      },
    ],

    // -----------------------------------------------------------------------
    // AI Rival Studios
    // -----------------------------------------------------------------------
    rivalStudiosInitialized: {
      type: Boolean,
      default: false,
    },

    rivalStudios: [
      {
        id: String,

        name: String,

        // Drives AI decision-making style
        personality: {
          type: String,
          enum: ["BLOCKBUSTER", "PRESTIGE", "INDIE", "COMMERCIAL", "CHAOTIC"],
          default: "COMMERCIAL",
        },

        money: {
          type: Number,
          default: 5000000,
        },

        prestige: {
          type: Number,
          default: 0,
        },

        fans: {
          type: Number,
          default: 0,
        },

        level: {
          type: Number,
          default: 1,
        },

        // Movies currently in production (simplified — no full talent pipeline)
        activeMovies: [
          {
            id: String,
            title: String,
            genre: String,
            budget: Number,
            quality: Number,       // 0-100, determines box office
            weeksRemaining: Number,
            totalWeeks: Number,
          },
        ],

        // Completed releases
        movieHistory: [
          {
            id: String,
            title: String,
            genre: String,
            budget: Number,
            boxOffice: Number,
            profit: Number,
            verdict: String,
            releaseWeek: Number,
          },
        ],

        stats: {
          moviesReleased: { type: Number, default: 0 },
          hits: { type: Number, default: 0 },
          blockbusters: { type: Number, default: 0 },
          flops: { type: Number, default: 0 },
          totalRevenue: { type: Number, default: 0 },
          totalFansEarned: { type: Number, default: 0 },
        },
      },
    ],

    // Market Trends Engine state. Tracks the active box-office climate.
    marketTrends: {
      activeTrends: [
        {
          id: String,
          label: String,
          genre: String,
          multiplier: Number,
          startWeek: Number,
          endWeek: Number,
        },
      ],
      // genre -> remaining cooldown weeks. Mixed because keys are dynamic
      // genre names; the engine reads/writes it as a plain object.
      genreCooldowns: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },

    streamingPlatforms: [
      {
        id: String,
        name: String,
        popularity: Number,
        contentBudget: Number,
        subscribers: Number,
        exclusiveMovies: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Movie",
          },
        ],
      },
    ],

    // Film Crew Unions and Strikes (issue #285)
    crewUnion: {
      satisfaction: { type: Number, default: 100, min: 0, max: 100 },
      isStriking: { type: Boolean, default: false },
      strikeStartWeek: { type: Number, default: null }
    },
    
    // Dynamic contract negotiation (issue #282)
    pendingContracts: [{
      talentId: { type: String, required: true },
      talentType: { type: String, enum: ["ACTOR", "DIRECTOR", "WRITER"], required: true },
      talentName: { type: String, default: "" },
      offer: {
        baseSalary: { type: Number, default: 0, min: 0 },
        backendPoints: { type: Number, default: 0, min: 0, max: 25 }, // percentage of profit
        movieCount: { type: Number, default: 1, min: 1, max: 10 },    // multi-picture deal
      },
      status: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"], default: "PENDING" },
    }],

    // Legacy support for pastAwards prior to externalization (Issue #517)
    pastAwards: {
      type: [mongoose.Schema.Types.Mixed],
      default: undefined,
    },

    // First-Time Player Tutorial & Guidance System (issue #527)
    tutorialProgress: {
      isActive: { type: Boolean, default: true },
      currentStep: { type: Number, default: 0 },
      currentStepId: { type: String, default: "WELCOME_STUDIO" },
      completedSteps: [{ type: String }],
      dismissedTooltips: [{ type: String }],
      isCompleted: { type: Boolean, default: false },
      isSkipped: { type: Boolean, default: false },
      replayCount: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

const GameState = mongoose.model("GameState", gameStateSchema);

export default GameState;
