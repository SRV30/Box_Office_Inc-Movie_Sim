import { useEffect, useState, useCallback } from "react";
import {
  Trophy,
  Award,
  Crown,
  Sparkles,
  Film,
  Zap,
  TrendingUp,
  Star,
  DollarSign,
  Clock,
  Flame,
  Layers,
  CheckCircle2,
  Lock,
  Download,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";

const RARITY_STYLES = {
  COMMON: { bg: "bg-slate-500/20", border: "border-slate-500/30", text: "text-slate-300" },
  RARE: { bg: "bg-sky-500/20", border: "border-sky-500/30", text: "text-sky-300" },
  EPIC: { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-300" },
  LEGENDARY: { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-300" },
  MYTHIC: { bg: "bg-rose-500/20", border: "border-rose-500/30", text: "text-rose-300 font-black" },
};

const ICON_MAP = {
  Film,
  TrendingUp,
  Zap,
  Sparkles,
  DollarSign,
  Award,
  Trophy,
  Layers,
  Star,
  Clock,
  Crown,
  Flame,
};

const ProgressionDashboard = () => {
  const [achievements, setAchievements] = useState([]);
  const [hallOfFame, setHallOfFame] = useState([]);
  const [endgameReport, setEndgameReport] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [activeTab, setActiveTab] = useState("achievements"); // achievements, hallOfFame, endgameReport
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [achRes, hofRes, reportRes] = await Promise.allSettled([
        api.get("/progression/achievements"),
        api.get("/progression/hall-of-fame"),
        api.get("/progression/endgame-report"),
      ]);

      if (achRes.status === "fulfilled") {
        setAchievements(achRes.value.data.achievements || []);
        setCompletionPercentage(achRes.value.data.completionPercentage || 0);
        setUnlockedCount(achRes.value.data.unlockedCount || 0);
      }
      if (hofRes.status === "fulfilled") {
        setHallOfFame(hofRes.value.data.hallOfFame || []);
      }
      if (reportRes.status === "fulfilled") {
        setEndgameReport(reportRes.value.data.report || null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load progression telemetry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categories = ["ALL", "PRODUCTION", "BOX_OFFICE", "AWARDS", "FRANCHISE", "TALENT", "SURVIVAL", "LEGACY"];

  const filteredAchievements = achievements.filter((a) => {
    if (categoryFilter === "ALL") return true;
    return a.category === categoryFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <Crown className="text-amber-400" size={36} /> Studio Progression & Achievements
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Track lifetime milestones, unlock persistent trophies, and view your Studio Hall of Fame.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Top Progression Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>Achievements</span>
              <Trophy size={18} className="text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {unlockedCount} / {achievements.length}
            </p>
            <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>Completion Rate</span>
              <Sparkles size={18} className="text-violet-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-violet-400">{completionPercentage}%</p>
            <p className="mt-1 text-xs text-slate-500">Persistent across career saves</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>Hall of Fame Inductees</span>
              <Award size={18} className="text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{hallOfFame.length}</p>
            <p className="mt-1 text-xs text-slate-500">Living legends & iconic movies</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>Studio Legacy Score</span>
              <Crown size={18} className="text-yellow-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-yellow-400">
              {endgameReport?.legacyScore || 0} / 1000
            </p>
            <p className="mt-1 text-xs text-yellow-500/80 font-medium">
              {endgameReport?.rankTitle || "Independent Studio"}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-[#111827] border border-slate-800 p-1.5 rounded-2xl gap-2">
          <button
            onClick={() => setActiveTab("achievements")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "achievements"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Trophy size={16} /> Achievements ({unlockedCount}/{achievements.length})
          </button>
          <button
            onClick={() => setActiveTab("hallOfFame")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "hallOfFame"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Award size={16} /> Hall of Fame ({hallOfFame.length})
          </button>
          <button
            onClick={() => setActiveTab("endgameReport")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "endgameReport"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <BarChart3 size={16} /> Endgame Report
          </button>
        </div>

        {/* Tab 1: Achievements */}
        {activeTab === "achievements" && (
          <div className="space-y-4">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    categoryFilter === cat
                      ? "bg-violet-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((ach) => {
                const IconComponent = ICON_MAP[ach.icon] || Trophy;
                const rStyle = RARITY_STYLES[ach.rarity] || RARITY_STYLES.COMMON;
                const progressPct = Math.min(
                  100,
                  Math.round(((ach.progress || 0) / (ach.maxProgress || 1)) * 100)
                );

                return (
                  <div
                    key={ach.id}
                    className={`relative rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between ${
                      ach.isUnlocked
                        ? "border-violet-500/40 bg-linear-to-br from-[#131b2e] to-[#0f172a] shadow-lg shadow-violet-950/20"
                        : "border-slate-800 bg-[#111827]/70 opacity-80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${rStyle.bg} ${rStyle.border} ${rStyle.text} border`}
                        >
                          {ach.rarity}
                        </span>

                        {ach.isUnlocked ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                            <CheckCircle2 size={14} /> Unlocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                            <Lock size={14} /> Locked
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-3">
                        <div
                          className={`p-3 rounded-xl ${
                            ach.isUnlocked ? "bg-violet-600/20 text-violet-400" : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          <IconComponent size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{ach.name}</h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ach.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60">
                      {ach.maxProgress > 1 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Progress</span>
                            <span>
                              {Number(ach.progress || 0).toLocaleString()} / {Number(ach.maxProgress).toLocaleString()} ({progressPct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-violet-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {ach.isUnlocked && ach.unlockedAtWeek && (
                        <p className="text-[10px] text-slate-500 mt-2">
                          Unlocked on Week {ach.unlockedAtWeek}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Hall of Fame */}
        {activeTab === "hallOfFame" && (
          <div className="space-y-4">
            {hallOfFame.length === 0 ? (
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <Trophy size={48} className="mx-auto mb-4 opacity-30 text-amber-400" />
                <h3 className="text-lg font-bold text-white mb-2">Hall of Fame is Empty</h3>
                <p>
                  Produce legendary all-time blockbusters or mentor talent to Living Legend status to induct them into the Hall of Fame!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hallOfFame.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="rounded-2xl border border-amber-500/30 bg-linear-to-br from-[#181a24] to-[#111827] p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-3 py-0.5 text-xs font-bold">
                        ★ {entry.type} INDUCTEE
                      </span>
                      <span className="text-xs text-slate-400">Week {entry.inductedAtWeek}</span>
                    </div>

                    <h3 className="text-xl font-bold text-white">{entry.name}</h3>
                    <p className="text-sm font-semibold text-amber-400 mt-0.5">{entry.title}</p>
                    <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                      {entry.achievementSummary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Endgame Report */}
        {activeTab === "endgameReport" && endgameReport && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-violet-500/30 bg-linear-to-br from-[#131b2e] via-[#111827] to-[#0f172a] p-8 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">
                    Official Studio Historical Retrospective
                  </span>
                  <h2 className="text-3xl font-extrabold text-white mt-1">{endgameReport.studioName}</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Simulated over {endgameReport.yearsSimulated} years ({endgameReport.totalWeeks} weeks)
                  </p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-amber-400 uppercase">Legacy Standing</p>
                  <p className="text-2xl font-black text-white mt-0.5">{endgameReport.rankTitle}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Score: <span className="font-bold text-amber-400">{endgameReport.legacyScore}</span> / 1000
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400">Lifetime Gross</p>
                  <p className="text-xl font-bold text-green-400 mt-1">
                    ₹{Number(endgameReport.financialSummary.totalLifetimeGross).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400">Movies Released</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {endgameReport.catalogStats.moviesReleased}
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400">Blockbusters Produced</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">
                    {endgameReport.catalogStats.blockbusters}
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400">Top Grossing Film</p>
                  <p className="text-sm font-bold text-white mt-1 truncate">
                    {endgameReport.catalogStats.topGrossingMovie.title}
                  </p>
                  <p className="text-xs text-green-400">
                    ₹{Number(endgameReport.catalogStats.topGrossingMovie.gross).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProgressionDashboard;
