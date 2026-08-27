import { useEffect, useState } from "react";
import {
  Trophy,
  Star,
  Users,
  IndianRupee,
  TrendingUp,
  RefreshCw,
  Building2,
  Crown,
  Medal,
  ChevronLeft,
  ChevronRight,
  Award,
  Bot,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";

const fmt = (n) => (n || 0).toLocaleString();

// Extended metrics per Issue #531
const METRICS = [
  { key: "prestige", label: "Prestige", icon: Star, value: (e) => fmt(e.prestige) },
  { key: "revenue", label: "Revenue", icon: IndianRupee, value: (e) => `₹${fmt(e.revenue)}` },
  { key: "profit", label: "Profit", icon: TrendingUp, value: (e) => `₹${fmt(e.profit)}` },
  { key: "box_office", label: "Box Office", icon: Layers, value: (e) => `₹${fmt(e.boxOffice || e.revenue)}` },
  { key: "fans", label: "Fanbase", icon: Users, value: (e) => fmt(e.fans) },
  { key: "awards", label: "Awards", icon: Award, value: (e) => fmt(e.awards) },
  { key: "blockbusters", label: "Blockbusters", icon: Trophy, value: (e) => fmt(e.blockbusters) },
  { key: "level", label: "Studio Level", icon: Sparkles, value: (e) => `Lvl ${e.studioLevel || 1}` },
];

const PERIODS = [
  { key: "all_time", label: "All-Time" },
  { key: "yearly", label: "Past Year (52w)" },
  { key: "monthly", label: "Past Month (4w)" },
  { key: "weekly", label: "This Week" },
];

const rankColor = (rank) =>
  rank === 1
    ? "text-yellow-400"
    : rank === 2
    ? "text-slate-300"
    : rank === 3
    ? "text-orange-400"
    : "text-slate-600";

const RankBadge = ({ rank }) => {
  if (rank === 1) return <Crown size={20} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={20} className="text-slate-300" />;
  if (rank === 3) return <Medal size={20} className="text-orange-400" />;
  return <span className={`text-sm font-black ${rankColor(rank)}`}>#{rank}</span>;
};

// A single ranking row. Highlights the current player's studio and flags AI competitors.
const LeaderboardRow = ({ entry, activeMetric }) => (
  <div
    className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition ${
      entry.isCurrentUser
        ? "bg-violet-600/20 border-violet-500/50 shadow-lg shadow-violet-500/10"
        : entry.isRival
        ? "bg-[#0f172a] border-slate-800 hover:border-slate-700"
        : "bg-[#111827] border-slate-800 hover:border-slate-600"
    }`}
  >
    <div className="w-9 flex items-center justify-center shrink-0">
      <RankBadge rank={entry.rank} />
    </div>

    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
        entry.isCurrentUser
          ? "bg-violet-950 border-violet-600 text-violet-300"
          : entry.isRival
          ? "bg-blue-950/60 border-blue-800/60 text-blue-400"
          : "bg-slate-900 border-slate-800 text-slate-400"
      }`}
    >
      {entry.isRival ? <Bot size={18} /> : <Building2 size={18} />}
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p
          className={`font-bold text-sm truncate ${
            entry.isCurrentUser
              ? "text-violet-300"
              : entry.isRival
              ? "text-slate-200"
              : "text-white"
          }`}
        >
          {entry.name}
        </p>
        {entry.isCurrentUser && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-violet-600/40 text-violet-300 border border-violet-500/40">
            You
          </span>
        )}
        {entry.isRival && (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md bg-blue-950 text-blue-400 border border-blue-800/50">
            AI Studio
          </span>
        )}
      </div>
      <p className="text-slate-500 text-[11px] truncate mt-0.5">
        {fmt(entry.fans)} fans · {entry.prestige} prestige · Lvl {entry.studioLevel || 1} ·{" "}
        {entry.awards || 0} awards · {entry.moviesReleased || 0} movies
      </p>
    </div>

    <div className="text-right shrink-0">
      <p className="text-white font-black text-base sm:text-lg tabular-nums">
        {activeMetric.value(entry)}
      </p>
      <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
        {activeMetric.label}
      </p>
    </div>
  </div>
);

const Leaderboard = () => {
  const [metric, setMetric] = useState("prestige");
  const [period, setPeriod] = useState("all_time");
  const [includeAI, setIncludeAI] = useState(true);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await api.get(
          `/leaderboard?metric=${metric}&period=${period}&includeAI=${includeAI}&page=${page}`
        );
        if (!active) return;
        setData(res.data);
        setError(null);
      } catch {
        if (active) setError("Failed to load the leaderboard. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [metric, period, includeAI, page]);

  const selectMetric = (key) => {
    if (key === metric) return;
    setLoading(true);
    setMetric(key);
    setPage(1);
  };

  const selectPeriod = (key) => {
    if (key === period) return;
    setLoading(true);
    setPeriod(key);
    setPage(1);
  };

  const toggleIncludeAI = () => {
    setLoading(true);
    setIncludeAI(!includeAI);
    setPage(1);
  };

  const goToPage = (next) => {
    setLoading(true);
    setPage(next);
  };

  const activeMetric = METRICS.find((m) => m.key === metric) || METRICS[0];
  const rows = data?.leaderboard || [];
  const currentUser = data?.currentUser || null;
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-violet-700 via-fuchsia-600 to-amber-500 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-white" size={36} />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                Industry Leaderboards & Rankings
              </h1>
            </div>
            <p className="text-amber-100 text-sm sm:text-base max-w-2xl">
              Real-time competitive studio rankings across prestige, revenue, profit, box-office gross, fanbase, and awards. Deterministically updated after simulation ticks.
            </p>
          </div>
        </div>

        {/* Filters & Control Bar */}
        <div className="space-y-3">
          {/* Metrics */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {METRICS.map((m) => {
              const Icon = m.icon;
              const isActive = m.key === metric;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => selectMetric(m.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition whitespace-nowrap ${
                    isActive
                      ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/30"
                      : "bg-[#111827] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  <Icon size={15} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Time Periods & AI Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111827] border border-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400 hidden sm:block ml-1" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden sm:block">
                Period:
              </span>
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => selectPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    period === p.key
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleIncludeAI}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                includeAI
                  ? "bg-blue-900/40 border-blue-700 text-blue-300"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
            >
              <Bot size={14} />
              {includeAI ? "AI Studios Included" : "Players Only"}
            </button>
          </div>
        </div>

        {/* Your rank banner */}
        {currentUser && (
          <div className="bg-gradient-to-r from-violet-950/80 to-[#111827] border border-violet-500/40 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
            <div className="w-10 flex items-center justify-center shrink-0">
              <RankBadge rank={currentUser.rank} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-violet-300 font-bold text-sm truncate">
                {currentUser.name} <span className="text-violet-400">(Your Studio)</span>
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                Ranked #{currentUser.rank} of {total} in {activeMetric.label.toLowerCase()} ({PERIODS.find((p) => p.key === period)?.label})
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white font-black text-lg tabular-nums">
                {activeMetric.value(currentUser)}
              </p>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                {activeMetric.label}
              </p>
            </div>
          </div>
        )}

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <RefreshCw className="animate-spin text-violet-400 mx-auto" size={36} />
              <p className="text-slate-400 font-medium">Computing industry ranking metrics…</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
            <Trophy className="text-red-400 mx-auto mb-3" size={32} />
            <p className="text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-10 text-center">
            <Building2 className="text-slate-600 mx-auto mb-4" size={40} />
            <p className="text-slate-500 text-lg font-semibold">No studios to rank yet</p>
            <p className="text-slate-600 text-sm mt-2">
              Studios and market competitors will appear here as the simulation progresses.
            </p>
          </div>
        )}

        {/* Leaderboard list */}
        {!loading && !error && rows.length > 0 && (
          <>
            <div className="space-y-2">
              {rows.map((entry) => (
                <LeaderboardRow
                  key={entry.studioId}
                  entry={entry}
                  activeMetric={activeMetric}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#111827] border border-slate-800 text-slate-300 text-sm font-semibold disabled:opacity-40 hover:border-slate-600 transition"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <span className="text-slate-400 text-sm font-semibold">
                  Page {page} of {totalPages} ({total} studios total)
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#111827] border border-slate-800 text-slate-300 text-sm font-semibold disabled:opacity-40 hover:border-slate-600 transition"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;

