import FinancialLedgerEntry from "../models/FinancialLedgerEntry.js";

/**
 * Creates an immutable ledger entry recording a studio financial transaction.
 * Supports running within an optional MongoDB transaction session.
 */
export async function recordLedgerEntry(entryData, session = null) {
  const {
    studioId,
    amount,
    direction,
    category,
    description = "",
    gameWeek = 1,
    runningBalance = null,
    relatedEntityId = null,
    relatedEntityType = null,
    isReversal = false,
    reversalForEntryId = null,
  } = entryData;

  if (!studioId || amount == null || !direction || !category) {
    throw new Error("Missing required fields for financial ledger entry");
  }

  const options = session ? { session } : {};
  const [created] = await FinancialLedgerEntry.create(
    [
      {
        studioId,
        amount: Math.abs(Number(amount)),
        direction,
        category,
        description,
        gameWeek: Number(gameWeek) || 1,
        runningBalance: runningBalance != null ? Number(runningBalance) : null,
        relatedEntityId: relatedEntityId ? String(relatedEntityId) : null,
        relatedEntityType: relatedEntityType ? String(relatedEntityType) : null,
        isReversal: Boolean(isReversal),
        reversalForEntryId: reversalForEntryId || null,
      },
    ],
    options
  );

  return created;
}
