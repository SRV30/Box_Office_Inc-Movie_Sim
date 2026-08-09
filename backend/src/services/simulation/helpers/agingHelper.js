import { generateWriter } from "../../writer/writerGenerator.js";

import { addNotification } from "./notificationHelper.js";

export const processWriterAging = (gameState) => {
  const retiredMarketWriterIds = [];
  const retiredOwnedWriterIds = [];

  // 1. Age market writers
  (gameState.marketWriters || []).forEach((writer) => {
    writer.age += 1 / 52;

    if (writer.age >= 90) {
      retiredMarketWriterIds.push(writer.id);

      addNotification(
        gameState,
        `${writer.name} has retired from the industry.`
      );
    }
  });

  // 2. Age owned writers
  (gameState.ownedWriters || []).forEach((writer) => {
    writer.age += 1 / 52;

    if (writer.age >= 90) {
      retiredOwnedWriterIds.push(writer.id);

      addNotification(
        gameState,
        `Contracted writer ${writer.name} has retired from the industry.`
      );
    }
  });

  // 3. Filter out retired writers
  gameState.marketWriters = (gameState.marketWriters || []).filter(
    (writer) => !retiredMarketWriterIds.includes(writer.id)
  );

  gameState.ownedWriters = (gameState.ownedWriters || []).filter(
    (writer) => !retiredOwnedWriterIds.includes(writer.id)
  );

  // 4. Replenish market writers for ALL retirements
  const totalRetirements = retiredMarketWriterIds.length + retiredOwnedWriterIds.length;
  for (let i = 0; i < totalRetirements; i++) {
    gameState.marketWriters.push(generateWriter(18));
  }
};
