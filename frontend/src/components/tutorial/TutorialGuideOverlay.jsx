import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { useTutorial } from "../../context/TutorialContext";

export default function TutorialGuideOverlay() {
  const {
    tutorialState,
    isOverlayOpen,
    setIsOverlayOpen,
    advanceStep,
    skipTutorial,
    replayTutorial,
  } = useTutorial();

  const navigate = useNavigate();
  const location = useLocation();

  if (!tutorialState) return null;

  const currentStepData = tutorialState.currentStepData;
  const currentStep = tutorialState.currentStep || 0;
  const allSteps = tutorialState.allSteps || [];
  const progressPercent = Math.round(((currentStep + 1) / allSteps.length) * 100);

  // Floating Minimized Button
  if (!isOverlayOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOverlayOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-xl shadow-blue-500/25 border border-blue-400/30 font-semibold text-sm transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
          <span>Studio Tutorial</span>
          {tutorialState.isCompleted ? (
            <span className="text-[10px] bg-emerald-500/80 px-1.5 py-0.5 rounded-full">Completed</span>
          ) : (
            <span className="text-[10px] bg-blue-900/80 px-1.5 py-0.5 rounded-full">
              {currentStep + 1}/{allSteps.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 text-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <span className="text-xs font-black uppercase tracking-wider text-blue-100">
              Studio Director's Guide
            </span>
          </div>
          <button
            onClick={() => setIsOverlayOpen(false)}
            className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors"
            title="Minimize tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2">
          <div className="flex justify-between text-[11px] font-bold text-blue-100 mb-1">
            <span>
              Step {currentStep + 1} of {allSteps.length}: {currentStepData?.category}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            {currentStepData?.title}
          </h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {currentStepData?.description}
          </p>
        </div>

        {/* Action Hint */}
        {currentStepData?.actionHint && (
          <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Recommended Action
            </span>
            <p className="text-xs text-slate-200 mt-1 font-medium">
              {currentStepData.actionHint}
            </p>
          </div>
        )}

        {/* Navigation & Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          {currentStepData?.targetRoute && location.pathname !== currentStepData.targetRoute && (
            <button
              onClick={() => navigate(currentStepData.targetRoute)}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
            >
              <span>Go to {currentStepData.title}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              disabled={currentStep <= 0}
              onClick={() => advanceStep(currentStepData?.id, currentStep - 1)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-xs font-semibold flex items-center gap-1 text-slate-300"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>

            <button
              onClick={() => advanceStep(currentStepData?.id, currentStep + 1)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              {currentStep + 1 >= allSteps.length ? "Finish Tutorial" : "Next Step"}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <button
            onClick={skipTutorial}
            className="hover:text-slate-200 transition-colors"
          >
            Skip Tutorial
          </button>
          <button
            onClick={replayTutorial}
            className="hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Replay From Start
          </button>
        </div>
      </div>
    </div>
  );
}
