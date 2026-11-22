import FinancialLedgerEntry, {
  FINANCIAL_CATEGORIES,
  FINANCIAL_DIRECTIONS,
} from "../models/FinancialLedgerEntry.js";
import Studio from "../models/Studio.js";
import GameState from "../models/GameState.js";
import { recordLedgerEntry } from "../services/financialLedgerService.js";

/**
 * GET /api/studio/ledger
 * Retrieves paginated, filterable, studio-scoped financial ledger entries.
 */
export async function getStudioLedger(req, res) {
  try {
    const studio = await Studio.findOne({ userId: req.user._id });
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    const {
      page = 1,
      limit = 20,
      category,
      direction,
      week,
      relatedEntityId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = { studioId: studio._id };

    if (category && FINANCIAL_CATEGORIES.includes(category.toUpperCase())) {
      filter.category = category.toUpperCase();
    }

    if (direction && FINANCIAL_DIRECTIONS.includes(direction.toUpperCase())) {
      filter.direction = direction.toUpperCase();
    }

    if (week !== undefined && !isNaN(parseInt(week, 10))) {
      filter.gameWeek = parseInt(week, 10);
    }

    if (relatedEntityId) {
      filter.relatedEntityId = String(relatedEntityId).trim();
    }

    const [entries, totalCount] = await Promise.all([
      FinancialLedgerEntry.find(filter)
        .sort({ gameWeek: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FinancialLedgerEntry.countDocuments(filter),
    ]);

    // Aggregate summary
    const summaryAgg = await FinancialLedgerEntry.aggregate([
      { $match: { studioId: studio._id } },
      {
        $group: {
          _id: "$direction",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalCredits = 0;
    let totalDebits = 0;
    summaryAgg.forEach((item) => {
      if (item._id === "CREDIT") totalCredits = item.totalAmount;
      if (item._id === "DEBIT") totalDebits = item.totalAmount;
    });

    return res.status(200).json({
      entries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      summary: {
        totalCredits,
        totalDebits,
        netLedger: totalCredits - totalDebits,
        studioBalance: studio.money,
      },
    });
  } catch (error) {
    console.error("Error fetching financial ledger:", error);
    return res.status(500).json({ message: "Internal server error fetching ledger" });
  }
}

/**
 * POST /api/studio/ledger/reversal
 * Creates an auditable reversal ledger entry for an existing transaction.
 */
export async function createLedgerReversal(req, res) {
  try {
    const studio = await Studio.findOne({ userId: req.user._id });
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    const { entryId, reason } = req.body;
    if (!entryId) {
      return res.status(400).json({ message: "Original entryId is required" });
    }

    const original = await FinancialLedgerEntry.findOne({
      _id: entryId,
      studioId: studio._id,
    });

    if (!original) {
      return res.status(404).json({ message: "Ledger entry not found" });
    }

    if (original.isReversal) {
      return res.status(400).json({ message: "Cannot reverse an entry that is already a reversal" });
    }

    const existingReversal = await FinancialLedgerEntry.findOne({
      reversalForEntryId: original._id,
    });
    if (existingReversal) {
      return res.status(400).json({ message: "Entry has already been reversed" });
    }

    const gameState = await GameState.findOne({ userId: req.user._id });
    const currentWeek = gameState?.currentWeek || original.gameWeek;

    const reverseDirection = original.direction === "CREDIT" ? "DEBIT" : "CREDIT";

    // Adjust studio money
    if (reverseDirection === "CREDIT") {
      studio.money += original.amount;
    } else {
      studio.money = Math.max(0, studio.money - original.amount);
    }
    await studio.save();

    const reversalEntry = await recordLedgerEntry({
      studioId: studio._id,
      amount: original.amount,
      direction: reverseDirection,
      category: original.category,
      description: `Reversal of #${original._id}: ${reason || original.description || "Correction"}`,
      gameWeek: currentWeek,
      runningBalance: studio.money,
      relatedEntityId: original.relatedEntityId,
      relatedEntityType: original.relatedEntityType,
      isReversal: true,
      reversalForEntryId: original._id,
    });

    return res.status(201).json({
      message: "Ledger entry successfully reversed",
      entry: reversalEntry,
      newBalance: studio.money,
    });
  } catch (error) {
    console.error("Error reversing ledger entry:", error);
    return res.status(500).json({ message: "Internal server error reversing ledger entry" });
  }
}
