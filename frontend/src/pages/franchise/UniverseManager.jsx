/**
 * @fileoverview Universe Manager Page Component
 * 
 * Manages cinematic universe connections, spin-offs, crossovers, and fatigue meters.
 */

import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const UniverseManager = ({ franchiseId }) => {
  const [synergy, setSynergy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!franchiseId) return;
    const fetchSynergy = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/franchises/universe-synergy/${franchiseId}`);
        setSynergy(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSynergy();
  }, [franchiseId]);

  if (loading) return <div className="p-4 text-center text-slate-400">Loading universe data...</div>;
  if (!synergy) return null;

  const fatigueColor = synergy.fatigueScore >= 75 ? "text-rose-400" : synergy.fatigueScore >= 40 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse"></span>
            Cinematic Universe Synergy: {synergy.name}
          </h2>
          <p className="text-slate-400 text-sm">
            Ecosystem audience multipliers, universe fatigue decay, and lore consistency.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-950/80 border border-violet-700 text-violet-300 w-fit">
          Shared Universe Active
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Fanbase Multiplier</span>
          <span className="text-xl font-black text-indigo-400">{synergy.fanbaseMultiplier}x</span>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Prestige Bonus</span>
          <span className="text-xl font-black text-amber-400">+{synergy.prestigeBonus}</span>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Crossover Multiplier</span>
          <span className="text-xl font-black text-emerald-400">{synergy.crossoverBonusMultiplier}x</span>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Audience Fatigue</span>
          <span className={`text-xl font-black ${fatigueColor}`}>{synergy.fatigueScore ?? 0}%</span>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Revenue Decay</span>
          <span className="text-xl font-black text-slate-300">{synergy.decayMultiplier ?? 1.0}x</span>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Lore Consistency</span>
          <span className="text-xl font-black text-purple-400">{synergy.loreConsistencyScore ?? 100}/100</span>
        </div>
      </div>
    </div>
  );
};

export default UniverseManager;

