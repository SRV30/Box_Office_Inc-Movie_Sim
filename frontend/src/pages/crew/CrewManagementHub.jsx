import React, { useState, useEffect } from "react";
import {
  Wrench,
  Shield,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Users,
  Video,
  Layers,
} from "lucide-react";
import api from "../../api/axios";

const formatCurrency = (val) => {
  if (!val) return "$0";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
  return `$${val.toLocaleString()}`;
};

export default function CrewManagementHub() {
  const [activeTab, setActiveTab] = useState("ROSTER");
  const [ownedCrews, setOwnedCrews] = useState([]);
  const [marketCrews, setMarketCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchCrews = async () => {
    try {
      setLoading(true);
      const [ownedRes, marketRes] = await Promise.allSettled([
        api.get("/crew/owned"),
        api.get("/crew?limit=12"),
      ]);

      if (ownedRes.status === "fulfilled" && ownedRes.value.data?.success) {
        setOwnedCrews(ownedRes.value.data.crewTeams || []);
      }
      if (marketRes.status === "fulfilled" && marketRes.value.data?.success) {
        setMarketCrews(marketRes.value.data.crewTeams || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrews();
  }, []);

  const handleHire = async (crewId) => {
    try {
      const res = await api.post(`/crew/hire/${crewId}`);
      if (res.data?.success) {
        setMessage({ type: "success", text: "Successfully contracted crew team!" });
        fetchCrews();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to contract crew" });
    }
  };

  const handleFire = async (crewId) => {
    try {
      const res = await api.post(`/crew/fire/${crewId}`);
      if (res.data?.success) {
        setMessage({ type: "success", text: "Crew team released from studio roster" });
        fetchCrews();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to release crew" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <Wrench className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Production Crew Operations Center
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Manage cinematography, VFX, sound, and stunt units to safeguard film schedules and elevate production grades
              </p>
            </div>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("ROSTER")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "ROSTER" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Studio Crews ({ownedCrews.length})
            </button>
            <button
              onClick={() => setActiveTab("MARKET")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "MARKET" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Hire Crew Teams
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between text-sm ${
              message.type === "success"
                ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                : "bg-rose-950/60 border border-rose-800 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-xs font-bold underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Crew Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 mt-3">Loading crew operational telemetry...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === "ROSTER" ? ownedCrews : marketCrews).map((crew) => {
              const isBusy = crew.status === "BUSY";
              const reliability = crew.reliability || 50;
              const delayRisk = Math.max(2, Math.round((100 - reliability) * 0.35));

              return (
                <div
                  key={crew.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-white text-lg group-hover:text-blue-400 transition-colors">
                          {crew.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Tier: <span className="text-amber-400 font-bold">{crew.rarity || "STANDARD"}</span>
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-[10px] rounded-md font-extrabold ${
                          isBusy
                            ? "bg-rose-950/80 border border-rose-800 text-rose-300"
                            : "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                        }`}
                      >
                        {isBusy ? `BUSY (Until Wk ${crew.busyUntilWeek})` : "AVAILABLE"}
                      </span>
                    </div>

                    {/* Skill Breakdown */}
                    <div className="grid grid-cols-3 gap-2 my-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Technical</span>
                        <p className="text-base font-black text-cyan-400">{crew.technicalQuality || 50}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">VFX & SFX</span>
                        <p className="text-base font-black text-indigo-400">{crew.vfxQuality || 50}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Reliability</span>
                        <p className="text-base font-black text-emerald-400">{crew.reliability || 50}</p>
                      </div>
                    </div>

                    {/* Operational Metrics */}
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> Delay Risk:
                        </span>
                        <span
                          className={`font-bold ${
                            delayRisk <= 10 ? "text-emerald-400" : delayRisk <= 20 ? "text-amber-400" : "text-rose-400"
                          }`}
                        >
                          {delayRisk}% per production
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-blue-400" /> Morale:
                        </span>
                        <span className="font-semibold text-slate-200">{crew.morale || 100}%</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Weekly Salary:
                        </span>
                        <span className="font-bold text-emerald-400">{formatCurrency(crew.salary || 25000)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-800">
                    {activeTab === "MARKET" ? (
                      <button
                        onClick={() => handleHire(crew.id)}
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        Contract Crew Team
                      </button>
                    ) : (
                      <button
                        disabled={isBusy}
                        onClick={() => handleFire(crew.id)}
                        className="w-full py-2 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-800 text-slate-300 border border-slate-700 disabled:opacity-40 rounded-xl text-xs font-bold transition-all"
                      >
                        {isBusy ? "Locked on Active Production" : "Release from Studio"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
