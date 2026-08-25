import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Film,
  Award,
  Users,
  BarChart2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../../api/axios";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

const formatCurrency = (val) => {
  if (val === undefined || val === null) return "$0";
  if (Math.abs(val) >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
  return `$${val.toLocaleString()}`;
};

export default function SimulationAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("FINANCIALS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [financialData, setFinancialData] = useState(null);
  const [moviesData, setMoviesData] = useState(null);
  const [genreData, setGenreData] = useState(null);
  const [talentData, setTalentData] = useState(null);
  const [rivalData, setRivalData] = useState(null);

  // Pagination states
  const [finPage, setFinPage] = useState(1);
  const [moviePage, setMoviePage] = useState(1);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [finRes, movRes, genRes, talRes, rivRes] = await Promise.allSettled([
        api.get(`/analytics/financials?page=${finPage}&limit=15`),
        api.get(`/analytics/movies?page=${moviePage}&limit=10`),
        api.get("/analytics/genres"),
        api.get("/analytics/talent"),
        api.get("/analytics/rivals"),
      ]);

      if (finRes.status === "fulfilled" && finRes.value.data?.success) {
        setFinancialData(finRes.value.data.data);
      }
      if (movRes.status === "fulfilled" && movRes.value.data?.success) {
        setMoviesData(movRes.value.data.data);
      }
      if (genRes.status === "fulfilled" && genRes.value.data?.success) {
        setGenreData(genRes.value.data.data);
      }
      if (talRes.status === "fulfilled" && talRes.value.data?.success) {
        setTalentData(talRes.value.data.data);
      }
      if (rivRes.status === "fulfilled" && rivRes.value.data?.success) {
        setRivalData(rivRes.value.data.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load simulation analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [finPage, moviePage]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  Simulation Analytics & Historical Reports
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Unified studio telemetry, box office performance, multi-year trends, and market comparisons
                </p>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl gap-1 overflow-x-auto">
            {[
              { id: "FINANCIALS", label: "Financials", icon: DollarSign },
              { id: "MOVIES", label: "Movie Reports & ROI", icon: Film },
              { id: "GENRES", label: "Genre Dynamics", icon: Layers },
              { id: "TALENT", label: "Talent Roster", icon: Users },
              { id: "RIVALS", label: "Rival Benchmarks", icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Summary Stats */}
        {financialData?.summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Studio Cash Balance
                </span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black mt-2 text-white">
                {formatCurrency(financialData.summary.currentCash)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Runway: <span className="text-emerald-400 font-bold">{financialData.summary.runwayWeeks} weeks</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Lifetime Revenue
                </span>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-black mt-2 text-white">
                {formatCurrency(financialData.summary.totalRevenue)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Expenses: {formatCurrency(financialData.summary.totalExpenses)}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Net Simulation Profit
                </span>
                <BarChart2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div
                className={`text-2xl font-black mt-2 ${
                  financialData.summary.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatCurrency(financialData.summary.netProfit)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Profit Margin: <span className="font-bold">{financialData.summary.profitMargin}%</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Movies Released
                </span>
                <Film className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-black mt-2 text-white">
                {moviesData?.summary?.totalMoviesReleased || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Hit Ratio: <span className="text-amber-400 font-bold">{moviesData?.summary?.hitRatio || 0}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400 mt-4">Synthesizing simulation telemetry & historical records...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-2xl">
            <p className="font-semibold">{error}</p>
          </div>
        ) : (
          <>
            {/* 1. FINANCIALS TAB */}
            {activeTab === "FINANCIALS" && (
              <div className="space-y-6">
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Weekly Revenue vs Expense Trajectory
                  </h3>
                  <div className="h-72 w-full">
                    {financialData?.financials?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[...financialData.financials].reverse().map((f) => ({
                            week: `Wk ${f.week}`,
                            Revenue: f.revenue || f.boxOfficeIncome || 0,
                            Expenses: f.expenses || f.overheadExpenses || 0,
                          }))}
                        >
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="week" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" tickFormatter={(v) => formatCurrency(v)} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                            formatter={(v) => formatCurrency(v)}
                          />
                          <Legend />
                          <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#revGrad)" />
                          <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fillOpacity={1} fill="url(#expGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        No financial records simulated yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Paginated Financial Table */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <h4 className="font-bold text-white">Historical Ledger Breakdown</h4>
                    <span className="text-xs text-slate-400">
                      Showing Page {financialData?.pagination?.page} of {financialData?.pagination?.totalPages || 1}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                        <tr>
                          <th className="p-4">Week</th>
                          <th className="p-4">Revenue</th>
                          <th className="p-4">Expenses</th>
                          <th className="p-4">Net Profit</th>
                          <th className="p-4">Closing Cash</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {financialData?.financials?.map((item, idx) => {
                          const rev = item.revenue || item.boxOfficeIncome || 0;
                          const exp = item.expenses || (item.productionExpenses || 0) + (item.overheadExpenses || 0);
                          const prof = rev - exp;
                          return (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="p-4 font-semibold text-white">Week {item.week}</td>
                              <td className="p-4 text-emerald-400 font-medium">{formatCurrency(rev)}</td>
                              <td className="p-4 text-rose-400 font-medium">{formatCurrency(exp)}</td>
                              <td className={`p-4 font-bold ${prof >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {formatCurrency(prof)}
                              </td>
                              <td className="p-4 text-slate-200">{formatCurrency(item.balance || financialData.summary.currentCash)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                    <button
                      disabled={finPage <= 1}
                      onClick={() => setFinPage((p) => p - 1)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <button
                      disabled={finPage >= (financialData?.pagination?.totalPages || 1)}
                      onClick={() => setFinPage((p) => p + 1)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MOVIES TAB */}
            {activeTab === "MOVIES" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Highest Grossing Film</span>
                    <h4 className="text-xl font-bold text-white mt-1">
                      {moviesData?.summary?.highestGrossing?.title || "None"}
                    </h4>
                    <p className="text-emerald-400 font-extrabold mt-1">
                      {formatCurrency(moviesData?.summary?.highestGrossing?.gross || 0)}
                    </p>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Highest ROI Film</span>
                    <h4 className="text-xl font-bold text-white mt-1">
                      {moviesData?.summary?.highestROI?.title || "None"}
                    </h4>
                    <p className="text-indigo-400 font-extrabold mt-1">
                      +{moviesData?.summary?.highestROI?.roi || 0}% ROI
                    </p>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Average Studio ROI</span>
                    <h4 className="text-xl font-bold text-white mt-1">
                      {moviesData?.summary?.averageROI || 0}%
                    </h4>
                    <p className="text-slate-400 text-xs mt-1">
                      Total Production: {formatCurrency(moviesData?.summary?.totalActualCost || 0)}
                    </p>
                  </div>
                </div>

                {/* Paginated Movie Table */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <h4 className="font-bold text-white">Movie Performance, Budget vs Actuals & ROI</h4>
                    <span className="text-xs text-slate-400">
                      Page {moviesData?.pagination?.page} of {moviesData?.pagination?.totalPages || 1}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                        <tr>
                          <th className="p-4">Title</th>
                          <th className="p-4">Genre</th>
                          <th className="p-4">Budget</th>
                          <th className="p-4">Box Office</th>
                          <th className="p-4">Net Profit</th>
                          <th className="p-4">ROI</th>
                          <th className="p-4">Verdict</th>
                          <th className="p-4">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {moviesData?.movies?.map((m) => (
                          <tr key={m._id} className="hover:bg-slate-800/40">
                            <td className="p-4 font-bold text-white">{m.title}</td>
                            <td className="p-4 text-slate-400">{m.genre}</td>
                            <td className="p-4">{formatCurrency(m.budget)}</td>
                            <td className="p-4 text-emerald-400 font-semibold">{formatCurrency(m.totalGross)}</td>
                            <td className={`p-4 font-bold ${m.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {formatCurrency(m.netProfit)}
                            </td>
                            <td className={`p-4 font-bold ${m.roi >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {m.roi}%
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-slate-800 border border-slate-700 text-xs rounded-md font-semibold">
                                {m.verdict}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-indigo-400">{m.reviewScore}/100</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                    <button
                      disabled={moviePage <= 1}
                      onClick={() => setMoviePage((p) => p - 1)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <button
                      disabled={moviePage >= (moviesData?.pagination?.totalPages || 1)}
                      onClick={() => setMoviePage((p) => p + 1)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. GENRES TAB */}
            {activeTab === "GENRES" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
                  <h4 className="font-bold text-white mb-4">Box Office Share by Genre</h4>
                  <div className="h-72 w-full">
                    {genreData?.genres?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={genreData.genres}
                            dataKey="totalGross"
                            nameKey="genre"
                            cx="50%"
                            cy="50%"
                            outerRadius={85}
                            label={(entry) => entry.genre}
                          >
                            {genreData.genres.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        No genre analytics available yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
                  <h4 className="font-bold text-white mb-4">Average ROI by Genre</h4>
                  <div className="h-72 w-full">
                    {genreData?.genres?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={genreData.genres}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="genre" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                          <Tooltip formatter={(v) => `${v}%`} />
                          <Bar dataKey="averageROI" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        No genre analytics available yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. TALENT TAB */}
            {activeTab === "TALENT" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800">
                  <h4 className="font-bold text-white">Talent Lifetime Career & Box Office Trajectory</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Age</th>
                        <th className="p-4">Skill</th>
                        <th className="p-4">Popularity</th>
                        <th className="p-4">Salary</th>
                        <th className="p-4">Films</th>
                        <th className="p-4">Lifetime Gross</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {talentData?.talents?.map((t) => (
                        <tr key={t._id} className="hover:bg-slate-800/40">
                          <td className="p-4 font-bold text-white">{t.name}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-blue-950 border border-blue-800 text-blue-300 text-xs rounded-md font-semibold">
                              {t.role}
                            </span>
                          </td>
                          <td className="p-4">{t.age}</td>
                          <td className="p-4 font-semibold text-indigo-400">{t.skill}/100</td>
                          <td className="p-4 font-semibold text-amber-400">{t.popularity}/100</td>
                          <td className="p-4">{formatCurrency(t.salary)}</td>
                          <td className="p-4 font-bold text-slate-200">{t.filmsParticipated}</td>
                          <td className="p-4 text-emerald-400 font-extrabold">{formatCurrency(t.lifetimeGross)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. RIVALS TAB */}
            {activeTab === "RIVALS" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="font-bold text-white">Industry Standings & Market Share</h4>
                  <span className="text-xs px-3 py-1 bg-indigo-950 border border-indigo-800 text-indigo-300 rounded-full font-bold">
                    Your Studio Rank: #{rivalData?.playerRank || 1} of {rivalData?.totalCompetitors || 1}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                      <tr>
                        <th className="p-4">Rank</th>
                        <th className="p-4">Studio Name</th>
                        <th className="p-4">Cash Reserve</th>
                        <th className="p-4">Prestige</th>
                        <th className="p-4">Movies Released</th>
                        <th className="p-4">Total Revenue</th>
                        <th className="p-4">Market Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {rivalData?.rankings?.map((s, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-800/40 ${
                            s.isPlayer ? "bg-blue-950/30 border-l-4 border-blue-500 font-semibold" : ""
                          }`}
                        >
                          <td className="p-4 font-bold text-white">#{idx + 1}</td>
                          <td className="p-4 font-bold flex items-center gap-2">
                            {s.name}
                            {s.isPlayer && (
                              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">
                                YOU
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-emerald-400">{formatCurrency(s.cash)}</td>
                          <td className="p-4 text-amber-400">{s.prestige}</td>
                          <td className="p-4">{s.moviesReleased}</td>
                          <td className="p-4 text-white font-bold">{formatCurrency(s.totalGross)}</td>
                          <td className="p-4 font-bold text-indigo-400">{s.marketShare}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
