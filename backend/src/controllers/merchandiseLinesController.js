import Studio from "../models/Studio.js";
import GameState from "../models/GameState.js";
import { MERCH_LINE_TIERS } from "../services/simulation/engines/merchandiseLinesEngine.js";

const CAMPAIGN_COST = 250000;
const CAMPAIGN_DURATION_WEEKS = 4;
const CAMPAIGN_BOOST = 0.5; // +50% revenue for the line during campaign

/**
 * GET /api/merchandise/lines
 * Returns all merchandise lines for the player's studio.
 */
export const getMerchandiseLines = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) return res.status(404).json({ success: false, message: "Studio not found." });

    res.status(200).json({
      success: true,
      data: {
        merchandiseLines: studio.merchandiseLines || [],
        availableTiers: Object.entries(MERCH_LINE_TIERS).map(([id, cfg]) => ({ id, ...cfg }))
      }
    });
  } catch (error) {
    console.error("getMerchandiseLines error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * POST /api/merchandise/lines
 * Launch a new merchandise product line.
 * Body: { tier: "APPAREL" | "COLLECTIBLES" | "DIGITAL" | "TOYS" }
 */
export const launchMerchandiseLine = async (req, res) => {
  try {
    const { tier } = req.body;
    if (!tier || !MERCH_LINE_TIERS[tier]) {
      return res.status(400).json({
        success: false,
        message: `Invalid tier. Choose one of: ${Object.keys(MERCH_LINE_TIERS).join(", ")}`
      });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) return res.status(404).json({ success: false, message: "Studio not found." });

    const gameState = await GameState.findOne({ user: req.user._id });
    if (!gameState) return res.status(404).json({ success: false, message: "Game state not found." });

    // Prevent duplicates
    if (!studio.merchandiseLines) studio.merchandiseLines = [];
    const existing = studio.merchandiseLines.find(l => l.tier === tier && l.active);
    if (existing) {
      return res.status(400).json({ success: false, message: `An active ${MERCH_LINE_TIERS[tier].label} line already exists.` });
    }

    const SETUP_COST = 500000;
    if ((studio.money || 0) < SETUP_COST) {
      return res.status(400).json({ success: false, message: `Insufficient funds. Setup costs ₹${SETUP_COST.toLocaleString("en-IN")}.` });
    }

    studio.money -= SETUP_COST;
    studio.merchandiseLines.push({
      tier,
      active: true,
      launchedWeek: gameState.currentWeek,
      totalRevenue: 0,
      campaigns: []
    });

    await studio.save();

    res.status(201).json({
      success: true,
      message: `${MERCH_LINE_TIERS[tier].label} merchandise line launched!`,
      data: studio.merchandiseLines.at(-1)
    });
  } catch (error) {
    console.error("launchMerchandiseLine error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * POST /api/merchandise/lines/:lineId/campaign
 * Launch a seasonal campaign for a specific merchandise line.
 */
export const launchSeasonalCampaign = async (req, res) => {
  try {
    const { lineId } = req.params;

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) return res.status(404).json({ success: false, message: "Studio not found." });

    const gameState = await GameState.findOne({ user: req.user._id });
    if (!gameState) return res.status(404).json({ success: false, message: "Game state not found." });

    const line = (studio.merchandiseLines || []).find(l => l._id?.toString() === lineId);
    if (!line) return res.status(404).json({ success: false, message: "Merchandise line not found." });
    if (!line.active) return res.status(400).json({ success: false, message: "Merchandise line is not active." });

    // Check for existing active campaign
    const hasActiveCampaign = (line.campaigns || []).some(c => c.active);
    if (hasActiveCampaign) {
      return res.status(400).json({ success: false, message: "A seasonal campaign is already running for this line." });
    }

    if ((studio.money || 0) < CAMPAIGN_COST) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Campaign costs ₹${CAMPAIGN_COST.toLocaleString("en-IN")}.`
      });
    }

    studio.money -= CAMPAIGN_COST;
    if (!line.campaigns) line.campaigns = [];
    line.campaigns.push({
      startWeek: gameState.currentWeek,
      endWeek: gameState.currentWeek + CAMPAIGN_DURATION_WEEKS,
      boostMultiplier: CAMPAIGN_BOOST,
      active: true
    });

    await studio.save();

    res.status(201).json({
      success: true,
      message: `Seasonal campaign launched! +${CAMPAIGN_BOOST * 100}% revenue boost for ${CAMPAIGN_DURATION_WEEKS} weeks.`,
      data: line.campaigns.at(-1)
    });
  } catch (error) {
    console.error("launchSeasonalCampaign error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
