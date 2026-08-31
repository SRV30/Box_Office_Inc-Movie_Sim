import React, { useState, useEffect } from "react";

export const AwardCeremonyV2Hub = ({ gameStateId }) => {
  const [configs, setConfigs] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCeremony, setSelectedCeremony] = useState("GLOBAL_ACADEMY");
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    fetchConfigs();
    if (gameStateId) fetchHistory();
  }, [gameStateId]);

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/v2/awards/configs");
      const data = await res.json();
      if (data.success) setConfigs(data.configs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/v2/awards/history/${gameStateId}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.ceremonies);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleTriggerEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await fetch("/api/v2/awards/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameStateId, ceremonyKey: selectedCeremony }),
      });
      const data = await res.json();
      if (data.success) {
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      <div className="flex justify-between items-center bg-slate-900/80 p-6 rounded-2xl border border-amber-500/20 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            🏆 V2 Award Ceremonies & Prestige Circuit
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Global, International, Domestic & National Film Guild Honors and Juries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCeremony}
            onChange={(e) => setSelectedCeremony(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          >
            {Object.keys(configs).map((key) => (
              <option key={key} value={key}>
                {configs[key].name} ({configs[key].scope})
              </option>
            ))}
          </select>
          <button
            onClick={handleTriggerEvaluation}
            disabled={evaluating || !gameStateId}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 px-4 py-2 rounded-lg font-semibold text-sm transition shadow-lg disabled:opacity-50"
          >
            {evaluating ? "Evaluating..." : "Simulate Ceremony"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(configs).map((cfg) => (
          <div
            key={cfg.key}
            onClick={() => setSelectedCeremony(cfg.key)}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedCeremony === cfg.key
                ? "bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10"
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">{cfg.scope}</span>
            <h3 className="text-lg font-bold mt-1 text-slate-100">{cfg.name}</h3>
            <p className="text-xs text-slate-400 mt-2">Week Held: W{cfg.weekHeld} • Prestige x{cfg.prestigeMultiplier}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {cfg.categories.map((c) => (
                <span key={c} className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {c.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <h2 className="text-xl font-bold text-slate-100 mb-4">📜 Historical Ceremonies & Hall of Fame</h2>
        {loading ? (
          <p className="text-slate-500">Loading ceremony history...</p>
        ) : history.length === 0 ? (
          <p className="text-slate-500 text-sm">No historical ceremonies recorded yet. Run simulation ticks to generate award winners.</p>
        ) : (
          <div className="space-y-4">
            {history.map((ceremony) => (
              <div key={ceremony._id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-3">
                  <div>
                    <span className="text-lg font-bold text-amber-300">{ceremony.name}</span>
                    <span className="ml-2 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Year {ceremony.year} (W{ceremony.weekHeld})
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Prestige Multiplier x{ceremony.prestigeMultiplier}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ceremony.categories.map((cat) => (
                    <div key={cat.categoryKey} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                      <span className="text-xs text-amber-400 font-semibold uppercase">{cat.categoryName}</span>
                      {cat.winner ? (
                        <div className="mt-1">
                          <p className="text-sm font-bold text-slate-100">🏆 {cat.winner.movieTitle}</p>
                          <p className="text-xs text-slate-400">{cat.winner.studioName} • {cat.winner.talentName}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1">No winner declared</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AwardCeremonyV2Hub;
