import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import api from "../api/axios";

const TutorialContext = createContext(null);

export const TutorialProvider = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  const [tutorialState, setTutorialState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchTutorialState = useCallback(async () => {
    if (!token) {
      setTutorialState(null);
      setIsOverlayOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/tutorial/state");
      if (res.data?.success) {
        setTutorialState(res.data.data);
        if (res.data.data?.isActive && !res.data.data?.isCompleted && !res.data.data?.isSkipped) {
          setIsOverlayOpen(true);
        }
      }
    } catch (err) {
      if (err.status !== 401 && err.status !== 403 && err.status !== 404) {
        console.warn("Tutorial state not available yet", err.message || err);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTutorialState();
    } else {
      setTutorialState(null);
      setIsOverlayOpen(false);
      setLoading(false);
    }
  }, [token, fetchTutorialState]);

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
        isDrawerOpen,
        setIsDrawerOpen,
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
