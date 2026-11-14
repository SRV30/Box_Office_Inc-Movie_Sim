import mongoose from "mongoose";
import env from "./envConfig.js";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

export const isPlaceholderMongoUri = (uri) => {
  if (!uri || typeof uri !== "string") return true;
  const trimmed = uri.trim();
  return (
    trimmed === "" ||
    trimmed.includes("mongodb+srv://user:pass@cluster.mongodb.net/dbname") ||
    trimmed.includes("user:pass@") ||
    trimmed.includes("cluster.mongodb.net/dbname")
  );
};

export const validateMongoConfig = (envConfig = env) => {
  const isProduction = envConfig.NODE_ENV === "production";
  const uri = envConfig.MONGO_URI;

  if (isProduction) {
    if (isPlaceholderMongoUri(uri)) {
      throw new Error(
        "CRITICAL: Production startup rejected: MONGO_URI must point to a persistent MongoDB instance and cannot use development placeholder credentials."
      );
    }

    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
      throw new Error(
        "CRITICAL: Production MONGO_URI must be a valid URI starting with mongodb:// or mongodb+srv://."
      );
    }
  }

  return true;
};

const connectDB = async () => {
  try {
    validateMongoConfig(env);

    let mongoUri = env.MONGO_URI;
    
    // In-memory fallback is restricted to explicit development/local mode
    if (isPlaceholderMongoUri(mongoUri) || !mongoUri) {
      if (env.NODE_ENV === "production") {
        throw new Error(
          "In-memory MongoDB is strictly forbidden in production mode. Configure a persistent MONGO_URI."
        );
      }

      console.log("Starting in-memory MongoDB server for local development...");
      mongoServer = await MongoMemoryServer.create({
        instance: {
          port: 27017,
        },
        binary: {
          version: "6.0.5",
          skipMD5: true,
        },
        debug: false,
        startTimeout: 300000, // 5 minutes timeout
      });
      mongoUri = mongoServer.getUri();
      console.log(`In-memory MongoDB URI: ${mongoUri}`);
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);

    process.exit(1);
  }
};

// Cleanup function for in-memory server
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error(`Error disconnecting from MongoDB: ${error.message}`);
  }
};

export { connectDB, disconnectDB };
export default connectDB;
