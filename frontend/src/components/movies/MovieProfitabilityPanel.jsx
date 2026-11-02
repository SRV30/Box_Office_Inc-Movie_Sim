import {
  AlertCircle,
  IndianRupee,
  Loader2,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const STATUS_STYLES = {
  PROFITABLE: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    value: "text-emerald-400",
    Icon: TrendingUp,
  },
  LOSS: {
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    value: "text-rose-400",
    Icon: TrendingDown,
  },
  BREAK_EVEN: {
    badge: "border-slate-600 bg-slate-800/60 text-slate-300",
    value: "text-slate-200",
    Icon: Minus,
  },
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

const BreakdownRow = ({ label, value, emphasis = false }) => (
  <div
    className={`flex items-center justify-between gap-4 ${
      emphasis ? "border-t border-slate-800 pt-3 text-white" : "text-slate-300"
    }`}
  >
    <span className={emphasis ? "font-bold" : "text-sm text-slate-400"}>
      {label}
    </span>
    <span className={emphasis ? "font-black" : "font-semibold"}>
      {formatCurrency(value)}
    </span>
  </div>
);

const MovieProfitabilityPanel = ({ profitability, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-800 bg-[#111827] p-10 text-slate-400">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-sm font-bold uppercase tracking-widest">
          Calculating profitability...
        </span>
      </div>
    );
  }

  if (error || !profitability) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-[#111827] p-6 text-slate-400">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-400" />
          <span className="text-sm font-semibold">
            Profitability analytics are unavailable for this movie.
          </span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            <RefreshCw size={14} /> Retry
          </button>
        )}
      </div>
    );
  }

  const statusStyle =
    STATUS_STYLES[profitability.profitabilityStatus] || STATUS_STYLES.BREAK_EVEN;
  const StatusIcon = statusStyle.Icon;

  return (
    <section className="space-y-6 rounded-3xl border border-slate-800 bg-[#111827] p-8">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold uppercase italic text-white">
            <IndianRupee className="text-emerald-500" /> Profitability Analytics
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Canonical movie-level revenue, expenses, and net profit. Regional
            market and re-release gross are already included in box office.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest ${statusStyle.badge}`}
        >
          <StatusIcon size={16} />
          {profitability.profitabilityLabel}
        </div>
      </div>

      {!profitability.hasFinancialRecords ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
          No financial records have been recorded for this movie yet.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Net Profit
              </div>
              <div className={`mt-2 text-3xl font-black ${statusStyle.value}`}>
                {formatCurrency(profitability.netProfit)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                ROI
              </div>
              <div className={`mt-2 text-3xl font-black ${statusStyle.value}`}>
                {formatPercent(profitability.roiPercent)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Profit Margin
              </div>
              <div className={`mt-2 text-3xl font-black ${statusStyle.value}`}>
                {formatPercent(profitability.profitMargin)}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Revenue
              </h4>
              <BreakdownRow label="Box Office / Deal" value={profitability.revenue.boxOffice} />
              <BreakdownRow label="Merchandise" value={profitability.revenue.merchandise} />
              <BreakdownRow label="Soundtrack" value={profitability.revenue.soundtrack} />
              <BreakdownRow label="Total Revenue" value={profitability.revenue.total} emphasis />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Expenses
              </h4>
              <BreakdownRow label="Production" value={profitability.expenses.production} />
              <BreakdownRow label="Marketing" value={profitability.expenses.marketing} />
              {profitability.expenses.localization > 0 && (
                <BreakdownRow
                  label="Localization & Distribution"
                  value={profitability.expenses.localization}
                />
              )}
              <BreakdownRow label="Total Expenses" value={profitability.expenses.total} emphasis />
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default MovieProfitabilityPanel;
