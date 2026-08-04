import mongoose from "mongoose";

const franchiseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: "Studio", required: true },
    movies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
    totalRevenue: { type: Number, default: 0 },
    popularity: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    fanLoyalty: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    movieCount: {
      type: Number,
      default: 0,
    },
    fanbaseMultiplier: { type: Number, default: 1.0 },
    prestigeBonus: { type: Number, default: 0 },
    // Spin-off support: link to parent franchise
    parentFranchiseId: { type: mongoose.Schema.Types.ObjectId, ref: "Franchise", default: null },
    // Crossover support
    isCrossover: { type: Boolean, default: false },
    crossoverFranchiseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Franchise" }],
  },
  { timestamps: true }
);

const Franchise = mongoose.model("Franchise", franchiseSchema);
export default Franchise;
