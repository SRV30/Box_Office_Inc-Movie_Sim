import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const TutorialContext = createContext(null);

export const TutorialProvider = ({ children }) => {
  const [tutorialState, setTutorialState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const fetchTutorialState = async () => {
    try {
      const res = await api.get("/tutorial/state");
      if (res.data?.success) {
        setTutorialState(res.data.data);
        if (res.data.data?.isActive && !res.data.data?.isCompleted && !res.data.data?.isSkipped) {
          setIsOverlayOpen(true);
        }
      }
    } catch (err) {
      console.warn("Tutorial state not available yet", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorialState();
  }, []);

  const advanceStep = async (stepId, nextIndex) => {
    try {
      const res = await api.post("/tutorial/advance", {
        stepId,
        nextStepIndex: nextIndex,
      });
      if (res.data?.success) {
        setTutorialState(res.data.data);
      }
    } catch (err) {
      console.error("Failed to advance tutorial step", err);
    }
  };

  const skipTutorial = async () => {
    try {
      const res = await api.post("/tutorial/skip");
      if (res.data?.success) {
        setTutorialState(res.data.data);
        setIsOverlayOpen(false);
      }
    } catch (err) {
      console.error("Failed to skip tutorial", err);
    }
  };

  const replayTutorial = async () => {
    try {
      const res = await api.post("/tutorial/replay");
      if (res.data?.success) {
        setTutorialState(res.data.data);
        setIsOverlayOpen(true);
      }
    } catch (err) {
      console.error("Failed to replay tutorial", err);
    }
  };

  const dismissTooltip = async (tooltipKey) => {
    try {
      await api.post("/tutorial/dismiss-tooltip", { tooltipKey });
      if (tutorialState) {
        setTutorialState((prev) => ({
          ...prev,
          dismissedTooltips: [...(prev?.dismissedTooltips || []), tooltipKey],
        }));
      }
    } catch (err) {
      console.error("Failed to dismiss tooltip", err);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        tutorialState,
        loading,
        isOverlayOpen,
        setIsOverlayOpen,
        advanceStep,
        skipTutorial,
        replayTutorial,
        dismissTooltip,
        fetchTutorialState,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  return context || {};
};

export default TutorialContext;
