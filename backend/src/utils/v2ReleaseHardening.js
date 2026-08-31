/**
 * @fileoverview V2 Release Hardening & Index Initialization Script
 * Ensures all V2 collections have mandatory indexes and data retention policies applied.
 */

import PastAward from "../models/PastAward.js";
import CelebrityScandal from "../models/CelebrityScandal.js";
import MerchandiseProduct from "../models/MerchandiseProduct.js";
import StreamingPlatform from "../models/StreamingPlatform.js";

export const ensureV2IndexesAndRetention = async () => {
  console.log("🛠️ Hardening V2 indexes and retention policies...");

  try {
    await PastAward.createIndexes();
    await CelebrityScandal.createIndexes();
    await MerchandiseProduct.createIndexes();
    await StreamingPlatform.createIndexes();
    console.log("✅ All V2 Mongoose collection indexes successfully initialized.");
  } catch (err) {
    console.error("⚠️ Error building V2 indexes:", err.message);
  }
};
