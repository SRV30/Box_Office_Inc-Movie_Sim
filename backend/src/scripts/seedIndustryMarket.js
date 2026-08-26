import mongoose from "mongoose";
import dotenv from "dotenv";
import env from "../config/envConfig.js";
import IndustryMarketSeeder from "../services/seeder/industryMarketSeeder.js";
import User from "../models/User.js";

dotenv.config();

const runSeederCli = async () => {
  try {
    console.log("Connecting to MongoDB database...");
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const user = await User.findOne();
    const userId = user ? user._id : new mongoose.Types.ObjectId();

    console.log(`Executing Industry Market Seeder for User ID: ${userId}...`);
    const report = await IndustryMarketSeeder.seedFullIndustryMarket(userId);

    console.log("=========================================");
    console.log("V1 INDUSTRY MARKET SEEDING REPORT");
    console.log("=========================================");
    console.log(`- AI Competitor Studios: ${report.aiStudiosCreated}`);
    console.log(`- Industry Giants:        ${report.industryGiantsCreated}`);
    console.log(`- Market Actors:          ${report.actorsCreated}`);
    console.log(`- Market Writers:         ${report.writersCreated}`);
    console.log(`- Market Directors:       ${report.directorsCreated}`);
    console.log(`- Composers:              ${report.composersCreated}`);
    console.log(`- Timestamp:              ${report.timestamp.toISOString()}`);
    console.log("=========================================");
    console.log("Seeding verified and completed successfully.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seeder failed:", error);
    process.exit(1);
  }
};

if (process.argv[1].endsWith("seedIndustryMarket.js")) {
  runSeederCli();
}

export default runSeederCli;
