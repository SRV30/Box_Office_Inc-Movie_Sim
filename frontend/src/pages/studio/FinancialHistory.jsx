import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "../../features/ui/toastSlice";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import ReportModal from "../../components/studio/ReportModal";
import {
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Film,
  BarChart3,
  Trophy,
  FileSpreadsheet,
  Landmark,
  AlertTriangle,
  CreditCard,
  PlusCircle,
  CheckCircle2,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const formatINR = (n) => `₹${Math.round(Number(n) || 0).toLocaleString()}`;

// Compact axis labels using Indian units (K / L / Cr), signed.
const formatCompact = (n) => {
  const value = Number(n) || 0;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(0)}K`;
  return `${sign}₹${abs}`;
};

const formatPercent = (ratio) => {
  const pct = (Number(ratio) || 0) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
};

const verdictColor = (verdict) => {
  switch (verdict) {
    case "ALL_TIME_BLOCKBUSTER":
    case "LEGENDARY":
      return "bg-orange-600 text-white";
    case "BLOCKBUSTER":
      return "bg-purple-600 text-white";
    case "HIT":
      return "bg-green-600 text-white";
    case "AVERAGE":
      return "bg-slate-600 text-white";
    case "FLOP":
      return "bg-red-600 text-white";
    case "DISASTER":
      return "bg-red-900 text-white";
    case "STREAMING_EXCLUSIVE":
      return "bg-blue-600 text-white";
    default:
      return "bg-slate-700 text-slate-300";
  }
};

// ---------------------------------------------------------------------------
// Dark-themed tooltip for the trend charts
// ---------------------------------------------------------------------------

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#0b1220] border border-slate-700 rounded-xl px-4 py-3 shadow-2xl">
      <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
        {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-300 capitalize">{entry.name}:</span>
          <span className="font-bold text-white">{formatINR(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

const RoiTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const m = payload[0].payload;
  return (
    <div className="bg-[#0b1220] border border-slate-700 rounded-xl px-4 py-3 shadow-2xl max-w-[240px]">
      <div className="text-white font-bold mb-1 truncate">{m.title}</div>
      <div className="text-sm text-slate-300">Budget: {formatINR(m.totalCost)}</div>
      <div className="text-sm text-slate-300">Box Office: {formatINR(m.boxOffice)}</div>
      <div className={`text-sm font-bold ${m.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
        Profit: {formatINR(m.profit)}
      </div>
      <div className={`text-sm font-black ${m.roiPct >= 0 ? "text-green-400" : "text-red-400"}`}>
        ROI: {m.roiPct >= 0 ? "+" : ""}{m.roiPct.toFixed(0)}%
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------

const SummaryCard = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-xl">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <Icon size={18} className={accent} />
    </div>
    <div className={`text-2xl font-black mt-3 tracking-tighter ${accent}`}>{value}</div>
    {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
  </div>
);

// ---------------------------------------------------------------------------
// Monthly aggregation of weekly entries
// ---------------------------------------------------------------------------

const WEEKS_PER_MONTH = 52 / 12;

const aggregateMonthly = (weekly) => {
  const buckets = new Map();
  weekly.forEach((entry) => {
    const year = Number(entry.year) || 1;
    const week = Number(entry.week) || 1;
    const month = Math.min(12, Math.max(1, Math.ceil(week / WEEKS_PER_MONTH)));
    const key = `${year}-${month}`;
    const existing = buckets.get(key) || {
      key,
      order: year * 100 + month,
      label: `Y${year} M${month}`,
      revenue: 0,
      expenses: 0,
      profit: 0,
      balance: 0,
      lastWeek: -1,
    };
    existing.revenue += Number(entry.revenue) || 0;
    existing.expenses += Number(entry.expenses) || 0;
    existing.profit += Number(entry.profit) || 0;
    // End-of-month balance = latest week's balance in this bucket.
    if (week >= existing.lastWeek) {
      existing.lastWeek = week;
      existing.balance = Number(entry.balance) || 0;
    }
    buckets.set(key, existing);
  });
  return Array.from(buckets.values()).sort((a, b) => a.order - b.order);
};

// ---------------------------------------------------------------------------
// Loan tier definitions for application modal
// ---------------------------------------------------------------------------

const LOAN_TIERS_CONFIG = [
  {
    tier: "SMALL",
    title: "Bridge Credit Facility",
    amount: 500_000,
    rate: "8% APR",
    weeks: 26,
    weeklyPayment: 20_769,
    description: "Short-term operational liquidity for mid-budget casting, emergency rewrites, and post-production.",
  },
  {
    tier: "MEDIUM",
    title: "Production Expansion Capital",
    amount: 1_000_000,
    rate: "12% APR",
    weeks: 52,
    weeklyPayment: 21_538,
    description: "Medium-term capital injection for studio stage upgrades, talent contract buyouts, and multi-market distribution.",
  },
  {
    tier: "LARGE",
    title: "Blockbuster Syndication Loan",
    amount: 2_000_000,
    rate: "18% APR",
    weeks: 78,
    weeklyPayment: 30_256,
    description: "High-volume studio credit line for big-budget cinematic universe entries and massive promotional campaigns.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const FinancialHistory = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const studio = user?.studio;

  const [granularity, setGranularity] = useState("weekly");
  const [movies, setMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Corporate loan state
  const [loans, setLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [totalWeeklyDebt, setTotalWeeklyDebt] = useState(0);
  const [isBankrupt, setIsBankrupt] = useState(false);
  const [negativeCashWeeks, setNegativeCashWeeks] = useState(0);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState("SMALL");

  // Chronological (oldest -> newest) for charts.
  const weekly = useMemo(
    () =>
      [...(studio?.financialHistory || [])].map((log, idx) => ({
        ...log,
        label: `Y${log.year} W${log.week}`,
        idx,
      })),
    [studio]
  );

  // Newest-first for the detailed ledger table (preserves original behaviour).
  const ledgerRows = useMemo(() => [...weekly].reverse(), [weekly]);

  const trendData = useMemo(
    () => (granularity === "monthly" ? aggregateMonthly(weekly) : weekly),
    [granularity, weekly]
  );

  const summary = useMemo(() => {
    const totalRevenue = weekly.reduce((s, e) => s + (Number(e.revenue) || 0), 0);
    const totalExpenses = weekly.reduce((s, e) => s + (Number(e.expenses) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const currentBalance = weekly.length ? Number(weekly[weekly.length - 1].balance) || 0 : Number(studio?.money) || 0;
    let best = null;
    weekly.forEach((e) => {
      if (best === null || (Number(e.profit) || 0) > (Number(best.profit) || 0)) best = e;
    });
    return { totalRevenue, totalExpenses, netProfit, currentBalance, best };
  }, [weekly, studio]);

  const fetchReleasedMovies = useCallback(async () => {
    try {
      setMoviesLoading(true);
      const res = await api.get("/movies/released");
      setMovies(res.data.movies || []);
    } catch (error) {
      console.error(error);
    } finally {
      setMoviesLoading(false);
    }
  }, []);

  const fetchLoans = useCallback(async () => {
    try {
      setLoansLoading(true);
      const res = await api.get("/studios/loans");
      if (res.data?.success) {
        setLoans(res.data.loans || []);
        setTotalWeeklyDebt(Number(res.data.totalWeeklyDebt) || 0);
        setIsBankrupt(Boolean(res.data.isBankrupt));
        setNegativeCashWeeks(Number(res.data.negativeCashWeeks) || 0);
      }
    } catch (err) {
      console.error("Failed to fetch studio corporate loans:", err);
    } finally {
      setLoansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReleasedMovies();
    fetchLoans();
  }, [fetchReleasedMovies, fetchLoans]);

  const handleTakeLoan = async () => {
    try {
      setBorrowLoading(true);
      const res = await api.post("/studios/loans/take", { tier: selectedTier });
      if (res.data?.success) {
        dispatch(
          showToast({
            message: res.data.message || "Corporate credit line approved!",
            type: "success",
          })
        );
        setIsLoanModalOpen(false);
        fetchLoans();
      }
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || "Failed to secure corporate loan.",
          type: "error",
        })
      );
    } finally {
      setBorrowLoading(false);
    }
  };

  // Top movies by ROI for the profitability chart.
  const roiData = useMemo(() => {
    return movies
      .map((m) => {
        const totalCost = (Number(m.budget) || 0) + (Number(m.marketingBudget) || 0);
        const boxOffice = Number(m.worldwideGross ?? m.boxOffice) || 0;
        const profit = Number(m.profit) || 0;
        const roiPct = (Number(m.roi) || 0) * 100;
        return {
          id: m._id,
          title: m.title || "Untitled",
          shortTitle: (m.title || "Untitled").length > 22 ? `${m.title.slice(0, 21)}…` : m.title || "Untitled",
          verdict: m.verdict,
          totalCost,
          boxOffice,
          profit,
          roiPct,
        };
      })
      .sort((a, b) => b.roiPct - a.roiPct);
  }, [movies]);

  const topRoi = useMemo(() => roiData.slice(0, 8), [roiData]);

  const hasHistory = weekly.length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Ledger &amp; Financials</h1>
            <p className="text-slate-400 mt-2">Performance insights and historical logs for {studio?.name}.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLoanModalOpen(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center gap-2 cursor-pointer text-sm shadow-lg shadow-violet-600/20"
            >
              <Landmark size={18} /> Manage Corporate Loans
            </button>
            {hasHistory && (
              <button
                onClick={() => setIsExportOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center gap-2 cursor-pointer text-sm"
              >
                <FileSpreadsheet size={18} /> Export Audit Report
              </button>
            )}
          </div>
        </div>

        {isBankrupt && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex items-center gap-3 text-red-400 shadow-xl">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">Studio Under Bankruptcy Administration</div>
              <div className="text-xs text-red-300 mt-0.5">
                Outstanding liabilities exceed studio liquidity. Weekly loan repayments have ceased operations.
              </div>
            </div>
          </div>
        )}

        {!isBankrupt && negativeCashWeeks > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex items-center gap-3 text-amber-400 shadow-xl">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">Liquidity Warning: Negative Cash Reserves</div>
              <div className="text-xs text-amber-300 mt-0.5">
                Studio balance has remained negative for {negativeCashWeeks} consecutive week(s). Reaching 4 consecutive weeks triggers studio bankruptcy.
              </div>
            </div>
          </div>
        )}

        {!hasHistory ? (
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-20 text-center text-slate-500">
            No financial records available yet. Simulate weeks to generate data.
          </div>
        ) : (
          <>
            {/* Summary insight cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard icon={ArrowUpCircle} label="Total Revenue" value={formatINR(summary.totalRevenue)} accent="text-green-500" />
              <SummaryCard icon={TrendingDown} label="Total Expenses" value={formatINR(summary.totalExpenses)} accent="text-red-500" />
              <SummaryCard
                icon={summary.netProfit >= 0 ? TrendingUp : TrendingDown}
                label="Net Profit"
                value={formatINR(summary.netProfit)}
                accent={summary.netProfit >= 0 ? "text-green-500" : "text-red-500"}
              />
              <SummaryCard
                icon={Wallet}
                label="Current Balance"
                value={formatINR(summary.currentBalance)}
                accent="text-white"
                sub={summary.best ? `Best week: ${summary.best.label} (${formatINR(summary.best.profit)})` : null}
              />
            </div>

            {/* Revenue vs Expenses trend */}
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-violet-400" />
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Revenue vs Expenses</h2>
                </div>
                <div className="flex bg-slate-900/60 rounded-xl p-1 border border-slate-800">
                  {["weekly", "monthly"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGranularity(g)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                        granularity === g ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#1e293b" }} minTickGap={24} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#1e293b" }} tickFormatter={formatCompact} width={64} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" strokeWidth={2} fill="url(#revFill)" />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Net worth over time */}
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-violet-400" />
                <h2 className="text-lg font-black text-white uppercase tracking-tight">Net Worth Over Time</h2>
              </div>
              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#1e293b" }} minTickGap={24} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#1e293b" }} tickFormatter={formatCompact} width={64} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="balance" name="Balance" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#balFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Movie profitability (ROI) */}
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Film size={18} className="text-violet-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Movie Profitability (ROI)</h2>
          </div>

          {moviesLoading ? (
            <div className="text-slate-500 text-center py-10">Loading movie performance…</div>
          ) : roiData.length === 0 ? (
            <div className="text-slate-500 text-center py-10">No released movies yet. Release a film to see profitability.</div>
          ) : (
            <>
              <div className="w-full" style={{ height: `${Math.max(160, topRoi.length * 42)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRoi} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#1e293b" }} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="shortTitle" tick={{ fill: "#cbd5e1", fontSize: 11 }} tickLine={false} axisLine={false} width={130} />
                    <Tooltip content={<RoiTooltip />} cursor={{ fill: "#1e293b33" }} />
                    <Bar dataKey="roiPct" name="ROI %" radius={[0, 6, 6, 0]}>
                      {topRoi.map((m) => (
                        <Cell key={m.id} fill={m.roiPct >= 0 ? "#22c55e" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                      <th className="px-4 py-3">Movie</th>
                      <th className="px-4 py-3">Verdict</th>
                      <th className="px-4 py-3">Budget</th>
                      <th className="px-4 py-3">Box Office</th>
                      <th className="px-4 py-3">Profit</th>
                      <th className="px-4 py-3">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {roiData.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-white">{m.title}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter ${verdictColor(m.verdict)}`}>
                            {m.verdict}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{formatINR(m.totalCost)}</td>
                        <td className="px-4 py-3 text-slate-300">{formatINR(m.boxOffice)}</td>
                        <td className={`px-4 py-3 font-bold ${m.profit >= 0 ? "text-green-500" : "text-red-500"}`}>{formatINR(m.profit)}</td>
                        <td className={`px-4 py-3 font-black ${m.roiPct >= 0 ? "text-green-500" : "text-red-500"}`}>{formatPercent(m.roiPct / 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Corporate Loans & Debt Obligations */}
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Landmark size={20} className="text-violet-400" />
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight">Corporate Debt &amp; Credit Facilities</h2>
                <p className="text-slate-400 text-xs">Studio loan commitments, interest amortization, and weekly debt service.</p>
              </div>
            </div>
            <button
              onClick={() => setIsLoanModalOpen(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-600/20"
            >
              <PlusCircle size={15} /> Apply for Credit
            </button>
          </div>

          {loansLoading ? (
            <div className="text-slate-500 text-center py-8">Checking loan obligations…</div>
          ) : loans.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-center">
              <CreditCard className="text-slate-600 w-10 h-10 mx-auto mb-2" />
              <div className="text-white font-bold text-sm">No Active Corporate Debt</div>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                Your studio is debt-free with zero weekly debt deductions. Need capital for large projects? You can draw down emergency liquidity from corporate credit lines anytime.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-violet-950/20 border border-violet-800/40 rounded-2xl p-4 flex justify-between items-center flex-wrap gap-3">
                <div>
                  <span className="text-xs text-violet-300 font-medium">Total Weekly Debt Service:</span>
                  <div className="text-xl font-black text-violet-400 mt-0.5">
                    {formatINR(totalWeeklyDebt)} <span className="text-xs text-slate-400 font-normal">/ week</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 max-w-sm text-right">
                  Deducted automatically from studio cash balance at the conclusion of each weekly simulation cycle.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                      <th className="px-4 py-3">Loan Principal</th>
                      <th className="px-4 py-3">Annual Interest</th>
                      <th className="px-4 py-3">Weekly Repayment</th>
                      <th className="px-4 py-3">Term Remaining</th>
                      <th className="px-4 py-3">Drawdown Week</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {loans.map((loan, idx) => (
                      <tr key={loan._id || idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-white">{formatINR(loan.amount)}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {((loan.interestRate || 0) * 100).toFixed(0)}% APR
                        </td>
                        <td className="px-4 py-3 font-bold text-amber-400">{formatINR(loan.weeklyRepayment)}</td>
                        <td className="px-4 py-3 text-slate-300">{loan.weeksRemaining} weeks</td>
                        <td className="px-4 py-3 text-slate-400">Week {loan.takenWeek}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Detailed weekly ledger (original table, preserved) */}
        {hasHistory ? (
          <div className="bg-[#111827] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 pt-6 flex items-center gap-2">
              <Trophy size={18} className="text-violet-400" />
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Detailed Ledger</h2>
            </div>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <th className="p-5">Timeline</th>
                    <th className="p-5">Revenue</th>
                    <th className="p-5">Payroll</th>
                    <th className="p-5">Production</th>
                    <th className="p-5">Marketing</th>
                    <th className="p-5">Net Profit</th>
                    <th className="p-5">Ending Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {ledgerRows.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-5">
                        <div className="text-white font-bold tracking-tighter">Y{log.year} W{log.week}</div>
                      </td>
                      <td className="p-5">
                        <div className="text-green-500 font-bold flex items-center gap-1">
                          <ArrowUpCircle size={12} />
                          {formatINR(log.revenue)}
                        </div>
                      </td>
                      <td className="p-5 text-slate-300">{formatINR(log.payroll)}</td>
                      <td className="p-5 text-slate-300">{formatINR(log.movieCosts)}</td>
                      <td className="p-5 text-slate-300">{formatINR(log.marketingCosts)}</td>
                      <td className="p-5">
                        <div className={`font-black ${log.profit >= 0 ? "text-green-500" : "text-red-500"}`}>{formatINR(log.profit)}</div>
                      </td>
                      <td className="p-5">
                        <div className="text-white font-black">{formatINR(log.balance)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {/* Corporate Loan Application Modal */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsLoanModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
                <Landmark size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Apply for Corporate Credit</h3>
                <p className="text-xs text-slate-400">Secure immediate non-dilutive liquidity for your studio.</p>
              </div>
            </div>

            <div className="space-y-3 my-6">
              {LOAN_TIERS_CONFIG.map((tier) => {
                const isSelected = selectedTier === tier.tier;
                return (
                  <div
                    key={tier.tier}
                    onClick={() => setSelectedTier(tier.tier)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                      isSelected
                        ? "bg-violet-950/40 border-violet-500 shadow-md shadow-violet-500/10"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{tier.title}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-600/30 text-violet-300">
                          {tier.rate}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-md">{tier.description}</p>
                      <div className="text-xs text-slate-500 mt-2">
                        Repayment: <strong className="text-slate-300">{formatINR(tier.weeklyPayment)}/wk</strong> over {tier.weeks} weeks
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                      <div className="text-lg font-black text-white">{formatINR(tier.amount)}</div>
                      <div
                        className={`w-5 h-5 rounded-full border mt-2 flex items-center justify-center ${
                          isSelected ? "border-violet-400 bg-violet-500 text-white" : "border-slate-600"
                        }`}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsLoanModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTakeLoan}
                disabled={borrowLoading}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-600/20"
              >
                {borrowLoading ? "Securing Credit…" : "Authorize Drawdown"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        history={studio?.financialHistory || []}
        studioName={studio?.name || "Studio"}
      />
    </DashboardLayout>
  );
};

export default FinancialHistory;
