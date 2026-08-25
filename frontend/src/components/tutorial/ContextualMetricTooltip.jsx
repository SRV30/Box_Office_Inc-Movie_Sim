import React, { useState } from "react";
import { Info, HelpCircle, X } from "lucide-react";
import { useTutorial } from "../../context/TutorialContext";

export const METRIC_DESCRIPTIONS = {
  ROI: {
    title: "Return on Investment (ROI)",
    formula: "((Gross Revenue - Production & Marketing Cost) / Total Cost) * 100",
    description: "Measures film profitability relative to its overall investment. Over 100% indicates a hit blockbuster; negative values indicate a box office loss.",
  },
  PRESTIGE: {
    title: "Studio Prestige",
    formula: "Earned via awards, A-list talent, and critically acclaimed releases",
    description: "Determines your studio's standing in the film industry. High prestige unlocks elite directors, top actors, and favorable streaming licensing terms.",
  },
  QUALITY: {
    title: "Movie Quality Score",
    formula: "Script Quality + Director Skill + Actor Performance + Crew Craftsmanship",
    description: "Underlying artistic and technical execution of your movie. High quality translates into favorable critic reviews and sustained word-of-mouth box office legs.",
  },
  HYPE: {
    title: "Audience Hype & Buzz",
    formula: "Marketing Campaigns + Talent Fanbases + Genre Trends + Trailers",
    description: "Directly determines opening-weekend ticket demand and global theater attendance.",
  },
  BOX_OFFICE_SPLIT: {
    title: "Theatrical Box Office Split",
    formula: "Studio Net = Worldwide Gross * ~55% (Domestic ~50%, International ~40%)",
    description: "Theaters and regional distributors take an exhibition cut. Studio net profit represents the remaining gross.",
  },
};

export default function ContextualMetricTooltip({ metricKey, children, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const { tutorialState, dismissTooltip } = useTutorial();

  const metricInfo = METRIC_DESCRIPTIONS[metricKey];
  if (!metricInfo) return <>{children}</>;

  const isDismissed = tutorialState?.dismissedTooltips?.includes(metricKey);

  const handleDismiss = (e) => {
    e.stopPropagation();
    dismissTooltip(metricKey);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-flex items-center gap-1 group ${className}`}>
      {children}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-slate-400 hover:text-blue-400 p-0.5 rounded transition-colors focus:outline-none"
        title={`Learn about ${metricInfo.title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-2xl shadow-black/90 text-slate-200 text-xs animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              {metricInfo.title}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-slate-300 leading-relaxed">{metricInfo.description}</p>

          {metricInfo.formula && (
            <div className="mt-2.5 p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] font-mono text-indigo-300">
              <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Calculation</span>
              {metricInfo.formula}
            </div>
          )}

          {!isDismissed && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleDismiss}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                Don't show hint again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
