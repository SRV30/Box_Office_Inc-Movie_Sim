import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  Info,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCurrency = (value) => currency.format(Number(value) || 0);
const formatCompact = (value) => compactCurrency.format(Number(value) || 0);

const statusStyles = {
  STABLE: "border-emerald-700/60 bg-emerald-950/40 text-emerald-300",
  TIGHT: "border-amber-700/60 bg-amber-950/40 text-amber-300",
  SHORTFALL: "border-red-700/60 bg-red-950/40 text-red-300",
};

const SummaryCard = ({ icon: Icon, label, value, sub, accent = "text-white" }) => (
  <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 shadow-xl">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <Icon size={18} className={accent} />
    </div>
    <div className={`text-2xl font-black mt-3 tracking-tighter ${accent}`}>{value}</div>
    {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
  </div>
);

const ForecastTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0b1220] border border-slate-700 rounded-xl px-4 py-3 shadow-2xl">
      <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
        {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-300 capitalize">{entry.name}:</span>
          <span className="font-bold text-white">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

const NumberField = ({ label, value, onChange, min = 0, max, step = 1 }) => (
  <label className="block">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
      {label}
    </span>
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-500"
    />
  </label>
);

const FinancialForecast = () => {
  const [weeks, setWeeks] = useState("4");
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState("0");
  const [oneTimeExpense, setOneTimeExpense] = useState("");
  const [weeklyExpense, setWeeklyExpense] = useState("");
  const [scenarioWeeks, setScenarioWeeks] = useState("");
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadForecast = useCallback(async (params) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/analytics/financials/forecast", { params });
      setForecast(response.data.data);
    } catch (requestError) {
      setError(requestError.message || "Unable to load the financial forecast.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForecast({ weeks: 4, lowBalanceThreshold: 0 });
  }, [loadForecast]);

  const buildParams = () => {
    const params = {
      weeks: Number(weeks) || 4,
      lowBalanceThreshold: Number(lowBalanceThreshold) || 0,
    };
    if (Number(oneTimeExpense) > 0) params.oneTimeExpense = Number(oneTimeExpense);
    if (Number(weeklyExpense) > 0) params.weeklyExpense = Number(weeklyExpense);
    if (Number(scenarioWeeks) > 0) params.scenarioWeeks = Number(scenarioWeeks);
    return params;
  };

  const chartData = useMemo(() => {
    if (!forecast) return [];
    return forecast.base.cashFlow.map((week, index) => ({
      label: `W${week.week}`,
      base: week.endingBalance,
      scenario: forecast.scenario?.cashFlow?.[index]?.endingBalance ?? null,
    }));
  }, [forecast]);

  const summary = forecast?.base?.summary;
  const scenarioSummary = forecast?.scenario?.summary;
  const status = summary?.status || "STABLE";

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
              Financial Forecast
            </h1>
            <p className="text-slate-400 mt-2">
              Project studio cash, upcoming obligations, and hypothetical scenarios.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadForecast(buildParams())}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Recalculate
          </button>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <NumberField label="Horizon (weeks)" value={weeks} onChange={setWeeks} min={1} max={12} />
            <NumberField
              label="Low balance threshold"
              value={lowBalanceThreshold}
              onChange={setLowBalanceThreshold}
              min={0}
            />
            <NumberField
              label="One-time scenario expense"
              value={oneTimeExpense}
              onChange={setOneTimeExpense}
              min={0}
            />
            <NumberField
              label="Weekly scenario expense"
              value={weeklyExpense}
              onChange={setWeeklyExpense}
              min={0}
            />
            <NumberField
              label="Scenario weeks"
              value={scenarioWeeks}
              onChange={setScenarioWeeks}
              min={1}
              max={12}
            />
          </div>
          <p className="text-xs text-slate-500">
            Scenario fields are optional. Leave them blank to view the base forecast only.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-800/60 bg-red-950/40 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading && !forecast ? (
          <div className="rounded-3xl border border-slate-800 bg-[#111827] p-16 text-center text-slate-500">
            Building forecast...
          </div>
        ) : null}

        {forecast && summary ? (
          <>
            <div className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${statusStyles[status]}`}>
              <div className="flex items-center gap-2">
                {status === "STABLE" ? <TrendingUp size={18} /> : <AlertTriangle size={18} />}
                <span>
                  {status === "STABLE"
                    ? "Cash flow looks stable across the forecast window."
                    : status === "TIGHT"
                      ? `Cash is projected to fall to or below the ${formatCurrency(forecast.lowBalanceThreshold)} threshold.`
                      : "The studio is projected to run out of cash within the forecast window."}
                </span>
              </div>
              {summary.firstLowBalanceWeek ? (
                <p className="mt-1 text-xs font-medium opacity-80">
                  First affected week: Week {summary.firstLowBalanceWeek}
                  {summary.lowestBalanceWeek ? ` | Lowest balance in Week ${summary.lowestBalanceWeek}` : ""}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                icon={Wallet}
                label="Cash On Hand"
                value={formatCurrency(forecast.current.cashOnHand)}
                accent="text-white"
              />
              <SummaryCard
                icon={CircleDollarSign}
                label={`Projected Balance (${forecast.horizonWeeks}w)`}
                value={formatCurrency(summary.endingBalance)}
                accent={summary.endingBalance >= 0 ? "text-emerald-400" : "text-red-400"}
                sub={`Net flow ${formatCurrency(summary.netCashFlow)}`}
              />
              <SummaryCard
                icon={TrendingDown}
                label="Lowest Balance"
                value={formatCurrency(summary.lowestBalance)}
                accent={summary.lowestBalance >= 0 ? "text-amber-300" : "text-red-400"}
                sub={summary.lowestBalanceWeek ? `Week ${summary.lowestBalanceWeek}` : "Starting balance"}
              />
              <SummaryCard
                icon={CalendarClock}
                label="Scheduled Releases"
                value={`${forecast.base.scheduledReleases.length}`}
                accent="text-violet-300"
                sub={`${formatCurrency(summary.totalRevenue)} projected revenue`}
              />
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">
                    Projected Cash Balance
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Base forecast plus optional scenario cash flow.
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  Revenue {formatCurrency(summary.totalRevenue)} | Expenses{" "}
                  {formatCurrency(summary.totalExpenses)}
                </div>
              </div>
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#1e293b" }}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#1e293b" }}
                      tickFormatter={formatCompact}
                      width={68}
                    />
                    <Tooltip content={<ForecastTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    <ReferenceLine
                      y={forecast.lowBalanceThreshold}
                      stroke="#f59e0b"
                      strokeDasharray="5 5"
                      label={{
                        value: "Threshold",
                        fill: "#f59e0b",
                        fontSize: 11,
                        position: "insideTopRight",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="base"
                      name="Base forecast"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    {forecast.scenario ? (
                      <Line
                        type="monotone"
                        dataKey="scenario"
                        name="Scenario"
                        stroke="#f97316"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={{ r: 3 }}
                      />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <h2 className="text-lg font-black text-white uppercase tracking-tight mb-4">
                Weekly Cash Flow
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                      <th className="px-3 py-3">Week</th>
                      <th className="px-3 py-3">Opening</th>
                      <th className="px-3 py-3">Payroll</th>
                      <th className="px-3 py-3">Loans</th>
                      <th className="px-3 py-3">Fan Club</th>
                      <th className="px-3 py-3">Social</th>
                      <th className="px-3 py-3">Recurring Revenue</th>
                      <th className="px-3 py-3">Releases</th>
                      <th className="px-3 py-3">Scenario</th>
                      <th className="px-3 py-3">Closing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {forecast.base.cashFlow.map((week) => (
                      <tr key={week.week} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 py-3 font-bold text-white">W{week.week}</td>
                        <td className="px-3 py-3 text-slate-300">{formatCurrency(week.startingBalance)}</td>
                        <td className="px-3 py-3 text-red-300">{formatCurrency(week.payrollPaid)}</td>
                        <td className="px-3 py-3 text-red-300">{formatCurrency(week.loanRepaymentsPaid)}</td>
                        <td className="px-3 py-3 text-red-300">{formatCurrency(week.fanClubPaid)}</td>
                        <td className="px-3 py-3 text-red-300">{formatCurrency(week.socialMediaPaid)}</td>
                        <td className="px-3 py-3 text-emerald-300">
                          {formatCurrency(
                            week.streamingRoyalties + week.merchandiseRevenue + week.soundtrackRevenue
                          )}
                        </td>
                        <td className={`px-3 py-3 ${week.scheduledReleaseIncome < 0 ? "text-red-300" : "text-emerald-300"}`}>
                          {formatCurrency(week.scheduledReleaseIncome)}
                        </td>
                        <td className="px-3 py-3 text-orange-300">{formatCurrency(week.scenarioExpenses)}</td>
                        <td className={`px-3 py-3 font-black ${week.endingBalance < 0 ? "text-red-400" : "text-white"}`}>
                          {formatCurrency(week.endingBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {forecast.base.scheduledReleases.length > 0 ? (
              <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl">
                <h2 className="text-lg font-black text-white uppercase tracking-tight mb-4">
                  Scheduled Release Estimates
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {forecast.base.scheduledReleases.map((release) => (
                    <div
                      key={`${release.movieId}-${release.week}`}
                      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">{release.title}</p>
                          <p className="text-xs text-slate-500">Week {release.week}</p>
                        </div>
                        <span className="rounded-full bg-violet-900/60 px-3 py-1 text-[10px] font-black text-violet-200">
                          {release.analystRating}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">Opening estimate</p>
                          <p className="font-bold text-slate-200">
                            {formatCurrency(release.projectedOpeningWeekend)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Projected gross</p>
                          <p className="font-bold text-slate-200">
                            {formatCurrency(release.projectedGross)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Projected profit</p>
                          <p className={`font-bold ${release.projectedProfit >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                            {formatCurrency(release.projectedProfit)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Cash impact</p>
                          <p className={`font-bold ${release.cashImpact >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                            {formatCurrency(release.cashImpact)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {forecast.scenario && scenarioSummary ? (
              <div className="bg-[#111827] border border-orange-900/50 rounded-3xl p-6 shadow-2xl">
                <h2 className="text-lg font-black text-orange-300 uppercase tracking-tight mb-4">
                  Scenario Comparison
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-widest">Scenario ending balance</p>
                    <p className={`text-xl font-black ${scenarioSummary.endingBalance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                      {formatCurrency(scenarioSummary.endingBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-widest">Balance impact</p>
                    <p className="text-xl font-black text-orange-300">
                      {formatCurrency(forecast.scenario.impact.endingBalanceDelta)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-widest">Additional expenses</p>
                    <p className="text-xl font-black text-orange-300">
                      {formatCurrency(forecast.scenario.impact.additionalExpenses)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Scenario expenses are hypothetical and are not saved to your studio.
                </p>
              </div>
            ) : null}

            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Info size={18} className="text-slate-400" />
                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                  Forecast Assumptions
                </h2>
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                {forecast.assumptions.map((assumption) => (
                  <li key={assumption} className="flex gap-2">
                    <span className="text-slate-600">-</span>
                    <span>{assumption}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default FinancialForecast;
