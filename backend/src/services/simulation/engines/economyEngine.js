import { addNotification } from "../helpers/notificationHelper.js";

/**
 * Processes weekly salary deductions for all owned writers.
 *
 * @param {Object} gameState - Current game state
 * @param {Object} studio - Player's studio document
 */
export const processWeeklySalaries = (gameState, studio) => {
  const totalSalaries = gameState.ownedWriters.reduce(
    (sum, writer) => sum + (writer.salary || 0),
    0
  );

  if (totalSalaries === 0) return;

  if (studio.money >= totalSalaries) {
    studio.money -= totalSalaries;
    addNotification(
      gameState,
      `Weekly salaries paid: ₹${totalSalaries.toLocaleString()}`
    );
  } else {
    // Player cannot afford full salaries
    const paidAmount = studio.money;
    studio.money = 0;

    addNotification(
      gameState,
      `CRITICAL: Insufficient funds to pay full salaries! Paid ₹${paidAmount.toLocaleString()} of ₹${totalSalaries.toLocaleString()}. Morale may be affected.`,
      "ECONOMY"
    );

    // Penalize morale for unpaid salaries
    gameState.ownedWriters.forEach((writer) => {
      writer.morale = Math.max(0, writer.morale - 5);
    });
  }
};
