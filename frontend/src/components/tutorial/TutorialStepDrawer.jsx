import React from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  CheckCircle2,
  Circle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useTutorial } from "../../context/TutorialContext";

export default function TutorialStepDrawer({ isOpen, onClose }) {
  const { tutorialState, advanceStep, replayTutorial } = useTutorial();
  const navigate = useNavigate();

  if (!isOpen || !tutorialState) return null;

  const currentStep = tutorialState.currentStep || 0;
  const allSteps = tutorialState.allSteps || [];
  const completedSteps = tutorialState.completedSteps || [];

  const handleGoToRoute = (route, stepId, index) => {
    if (route) {
      navigate(route);
    }
    // If clicking an accessible step, advance if current
    if (index === currentStep) {
      advanceStep(stepId, index + 1);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-violet-950/80 border border-violet-800 rounded-xl text-violet-400">
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Studio Roadmap & Milestones</h2>
                <p className="text-xs text-slate-400">Step-by-step masterclass to box office dominance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Milestones Completed</span>
              <span className="text-emerald-400 font-bold">
                {completedSteps.length} / {allSteps.length}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-600 to-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps.length / allSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Timeline */}
          <div className="space-y-3">
            {allSteps.map((step, idx) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === idx;

              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? "bg-violet-950/30 border-violet-600 shadow-lg shadow-violet-900/20"
                      : isCompleted
                      ? "bg-slate-950/40 border-slate-800/80 opacity-80"
                      : "bg-slate-950/20 border-slate-800/40 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 size={18} className="text-emerald-400" />
                        ) : isCurrent ? (
                          <Sparkles size={18} className="text-amber-400 animate-pulse" />
                        ) : (
                          <Circle size={18} className="text-slate-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Step {idx + 1}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-violet-600 text-white rounded font-semibold">
                              Current Objective
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-0.5">{step.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                      </div>
                    </div>
                  </div>

                  {step.targetRoute && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex justify-end">
                      <button
                        onClick={() => handleGoToRoute(step.targetRoute, step.id, idx)}
                        className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                          isCurrent
                            ? "bg-violet-600 hover:bg-violet-500 text-white shadow-sm"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                      >
                        <span>Go to {step.category}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-4 mt-6 flex justify-between items-center">
          <button
            onClick={() => {
              replayTutorial();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Restart Tutorial</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close Drawer
          </button>
        </div>
      </aside>
    </div>
  );
}
