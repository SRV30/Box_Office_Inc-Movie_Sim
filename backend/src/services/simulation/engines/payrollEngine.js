import { addNotification } from "../helpers/notificationHelper.js";

/**
 * @fileoverview Payroll Engine
 *
 * Processes weekly payroll for all talent under contract: writers, directors,
 * actors, and crew teams. The total weekly wage bill is deducted from the
 * studio's money balance once per simulation tick.
 *
 * If the studio cannot fully cover payroll, a proportional partial payment
 * is made (payrollCoverage < 1). Individual `totalEarnings` on each talent
 * object are updated to reflect only the amount actually paid, so the ledger
 * stays accurate even during financial hardship.
 *
 * Assumptions:
 * - Payroll fires every week regardless of project status (bench cost model).
 * - Studio money is floored at 0; it can never go negative from payroll alone.
 * - When the studio balance is already at or below 0 the run is skipped entirely
 *   and a bankruptcy-risk warning is emitted instead, preventing further
 *   deductions from compounding on an already-insolvent studio (#276).
 * - `talent.salary` is treated as a weekly figure.
 */

/**
 * Deducts weekly talent salaries from the studio's money balance.
 *
 * ## Algorithm
 * 1. Aggregate all talent from `ownedWriters`, `ownedDirectors`, `ownedActors`,
 *    and `ownedCrewTeams`.
 * 2. Sum their salaries to get `totalPayroll`.
 * 3. If `studio.money < totalPayroll`, push a notification warning.
 * 4. Compute `payrollCoverage = min(1, availableMoney / totalPayroll)`.
 * 5. Each talent's `totalEarnings` is incremented by their pro-rated salary.
 * 6. Deduct the amount actually paid out (sum of pro-rated salaries) from
 *    studio money (floored at 0).
 *
 * No-ops when there is no talent or total payroll is zero.
 *
 * @param {object} gameState               - GameState document; used for notification queue.
 * @param {object} studio                  - Studio document (mutated in place).
 * @param {number} [studio.money=0]        - Current studio cash balance in ₹.
 * @param {Array}  [gameState.ownedWriters=[]]    - Writer talent objects with `salary` field.
 * @param {Array}  [gameState.ownedDirectors=[]]  - Director talent objects with `salary` field.
 * @param {Array}  [gameState.ownedActors=[]]     - Actor talent objects with `salary` field.
 * @param {Array}  [gameState.ownedCrewTeams=[]]  - Crew team objects with `salary` field.
 * @returns {void}
 */
export const processWriterPayroll = (gameState, studio) => {
  const ownedWriters = gameState.ownedWriters || [];
  const ownedDirectors = gameState.ownedDirectors || [];
  const ownedActors = gameState.ownedActors || [];
  const ownedCrewTeams = gameState.ownedCrewTeams || [];

  const allTalent = [...ownedWriters, ...ownedDirectors, ...ownedActors, ...ownedCrewTeams];

  if (allTalent.length === 0) {
    return;
  }

  const totalPayroll = allTalent.reduce(
    (total, talent) => total + Number(talent.salary || 0),
    0
  );

  if (totalPayroll <= 0) {
    return;
  }

  const availableMoney = Number(studio.money || 0);

  // Issue #276: do not run further deductions when the studio is already insolvent.
  // A warning is emitted so the player knows payroll was skipped.
  if (availableMoney <= 0) {
    addNotification(
      gameState,
      `Studio is insolvent (balance ₹0). Weekly payroll of ₹${totalPayroll.toLocaleString()} was skipped. Resolve your debt to resume salary payments.`
    );
    studio.bankruptcyWarning = true;
    return;
  }

  if (availableMoney < totalPayroll) {
    addNotification(
      gameState,
      `Studio cannot afford weekly talent salaries. Required ₹${totalPayroll.toLocaleString()}, available ₹${availableMoney.toLocaleString()}.`
    );
  }

  const payrollCoverage = Math.min(1, availableMoney / totalPayroll);

  let totalActuallyPaid = 0;

  allTalent.forEach((talent) => {
    const paidSalary = Math.floor(Number(talent.salary || 0) * payrollCoverage);
    totalActuallyPaid += paidSalary;
    if (talent.totalEarnings !== undefined) {
        talent.totalEarnings = Number(talent.totalEarnings || 0) + paidSalary;
    }
  });

  studio.money = Math.max(0, availableMoney - totalActuallyPaid);
  return totalActuallyPaid;
};
