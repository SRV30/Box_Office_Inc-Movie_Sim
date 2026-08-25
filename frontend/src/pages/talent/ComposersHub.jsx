import React, { useState, useEffect } from "react";
import {
  Music,
  Award,
  DollarSign,
  TrendingUp,
  Sparkles,
  UserCheck,
  Disc,
  Filter,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import api from "../../api/axios";

const formatCurrency = (val) => {
  if (!val) return "$0";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
  return `$${val.toLocaleString()}`;
};

export default function ComposersHub() {
  const [activeTab, setActiveTab] = useState("MARKET");
  const [composers, setComposers] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState("ALL");
  const [message, setMessage] = useState(null);

  const fetchMarket = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/composers/market?genre=${selectedGenre}`);
      if (res.data?.success) {
        setComposers(res.data.data.composers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoster = async () => {
    try {
      const res = await api.get("/composers/roster");
      if (res.data?.success) {
        setRoster(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "MARKET") fetchMarket();
    else fetchRoster();
  }, [activeTab, selectedGenre]);

  const handleHire = async (composerId) => {
    try {
      const res = await api.post("/composers/hire", { composerId, contractYears: 2 });
      if (res.data?.success) {
        setMessage({ type: "success", text: res.data.message });
        fetchMarket();
        fetchRoster();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to hire composer" });
    }
  };

  const handleRelease = async (composerId) => {
    try {
      const res = await api.post(`/composers/${composerId}/release`);
      if (res.data?.success) {
        setMessage({ type: "success", text: res.data.message });
        fetchRoster();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to release composer" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-amber-500 to-rose-600 rounded-2xl shadow-lg shadow-amber-500/20">
              <Music className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Composers & Soundtrack Pavilion
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Contract legendary film composers to craft epic scores, boost critical acclaim, and generate music royalties
              </p>
            </div>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("MARKET")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "MARKET" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Composer Market
            </button>
            <button
              onClick={() => setActiveTab("ROSTER")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "ROSTER" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Studio Roster ({roster.length})
            </button>
          </div>
        </div>

        {/* Banner Alert */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between text-sm ${
              message.type === "success"
                ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                : "bg-rose-950/60 border border-rose-800 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-xs font-bold underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Genre Filter */}
        {activeTab === "MARKET" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Genre Affinity:
            </span>
            {["ALL", "Sci-Fi", "Action", "Drama", "Horror", "Comedy", "Romance", "Thriller"].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedGenre === g
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Grid Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 mt-3">Auditioning composers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === "MARKET" ? composers : roster).map((c) => (
              <div
                key={c._id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-lg group-hover:text-amber-400 transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Age: <span className="text-slate-200 font-semibold">{c.age}</span> • Style:{" "}
                        <span className="text-amber-300 font-medium">{c.musicStyle || "Orchestral"}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] rounded-md font-bold">
                      {c.status}
                    </span>
                  </div>

                  {/* Attributes */}
                  <div className="grid grid-cols-3 gap-2 my-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Talent</span>
                      <p className="text-base font-black text-amber-400">{c.musicalTalent}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Versatility</span>
                      <p className="text-base font-black text-indigo-400">{c.versatility}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Popularity</span>
                      <p className="text-base font-black text-emerald-400">{c.popularity}</p>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Genre Mastery:</span>
                      <span className="font-semibold text-slate-200">
                        {(c.genreExpertise || []).join(", ") || "General"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Scores Composed:</span>
                      <span className="font-semibold text-slate-200">{c.scoresComposed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Annual Salary:</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(c.salary)}</span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-4 mt-4 border-t border-slate-800">
                  {activeTab === "MARKET" ? (
                    <button
                      onClick={() => handleHire(c._id)}
                      className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Sign 2-Year Contract ({formatCurrency(c.salary * 0.25)} Signing Fee)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRelease(c._id)}
                      className="w-full py-2 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      Release from Roster
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
