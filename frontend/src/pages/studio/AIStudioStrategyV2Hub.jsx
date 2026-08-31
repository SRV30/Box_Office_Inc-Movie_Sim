import React, { useState, useEffect } from "react";

export const AIStudioStrategyV2Hub = ({ gameStateId }) => {
  const [strategies, setStrategies] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameStateId) fetchStrategies();
  }, [gameStateId]);

  const fetchStrategies = async () => {
    try {
      const res = await fetch(`/api/v2/ai-studios/${gameStateId}`);
      const data = await res.json();
      if (data.success) {
        setStrategies(data.strategies);
        setProfiles(data.profiles);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-md">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          🤖 V2 AI Studio Long-Term Strategic Personalities
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Multi-year planning, risk tolerance, budgets, talent strategy, awards & streaming adaptation for autonomous rival studios
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500">Loading AI studio strategies...</p>
        ) : strategies.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800">
            <p className="text-slate-400">No rival AI studio strategies initialized yet for this game state.</p>
          </div>
        ) : (
          strategies.map((st) => {
            const prof = profiles[st.strategyType] || {};
            return (
              <div key={st._id} className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">{st.studioName}</h3>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono mt-1 inline-block">
                      {st.strategyType}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t border-slate-800 pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Risk Tolerance:</span>
                    <span className="font-bold text-purple-300">{st.multiYearPlan?.riskTolerance}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Target Market Share:</span>
                    <span className="font-bold text-emerald-400">{st.multiYearPlan?.targetMarketShare}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Past Hits / Flops:</span>
                    <span className="font-mono text-slate-200">
                      {st.longTermMemory?.pastHitsCount} / {st.longTermMemory?.pastFlopsCount}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs space-y-1">
                  <p className="text-slate-400 font-semibold mb-1">Budget Allocation:</p>
                  <p className="text-slate-300">Production: {(st.budgetAllocation?.productionShare * 100).toFixed(0)}%</p>
                  <p className="text-slate-300">Marketing: {(st.budgetAllocation?.marketingShare * 100).toFixed(0)}%</p>
                  <p className="text-slate-300">Streaming: {(st.budgetAllocation?.streamingShare * 100).toFixed(0)}%</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AIStudioStrategyV2Hub;
