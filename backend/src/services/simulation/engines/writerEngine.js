import { createScriptFromWriter } from "../../writer/scriptCreationEngine.js";

import { addNotification } from "../helpers/notificationHelper.js";

export const processWritingProjects = async (gameState) => {
  const completedProjects = [];

  for (const project of gameState.activeWritingProjects) {
    const totalDuration = project.completionWeek - project.startWeek;

    const elapsedWeeks = gameState.currentWeek - project.startWeek;

    project.progress = Math.min(
      100,
      Math.floor((elapsedWeeks / totalDuration) * 100)
    );

    if (gameState.currentWeek >= project.completionWeek) {
      const writer = gameState.ownedWriters.find(
        (w) => w.id === project.writerId
      );

      if (!writer) {
        continue;
      }

      const script = createScriptFromWriter(
        writer,
        project.genre,
        project.qualityPenalty || 0
      );

      gameState.ownedScripts.push({
        ...script,
        createdAt: new Date(),
      });

      writer.status = "AVAILABLE";

      writer.busyUntilWeek = null;

      writer.writtenScripts += 1;

      writer.reputation = Math.min(100, writer.reputation + 1);

      writer.morale = Math.min(100, writer.morale + 2);

      const oldDiscovered = writer.discovered || 0;
      writer.discovered = Math.min(100, (writer.discovered || 0) + 15);

      addNotification(gameState, `${writer.name} completed "${script.title}".`);

      if (oldDiscovered < 50 && writer.discovered >= 50) {
        addNotification(
          gameState,
          `The industry has recognized the true potential of ${writer.name}! All stats revealed.`,
          "TALENT"
        );
      }

      completedProjects.push(project.id);
    }
  }

  gameState.activeWritingProjects = gameState.activeWritingProjects.filter(
    (project) => !completedProjects.includes(project.id)
  );
};
