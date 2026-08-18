import { useState, useEffect } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Globe, IndianRupee, Film, TrendingUp, BarChart2, PieChart, ShieldAlert } from "lucide-react";

const RegionalBoxOfficeHub = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRegionalSummary();
  }, []);

  const fetchRegionalSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/box-office/regional-summary");
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load regional box office telemetry:", err);
      setError("Unable to load regional telemetry data. Please ensure studio releases exist.");
    } finally {
      setLoading(false);
    }
  };

  const totals = summary?.totals || {};
  const combined = totals.combinedWorldwide || 1;

  const regions = [
    {
      name: "North America (Domestic)",
      key: "northAmerica",
      amount: totals.northAmerica || 0,
      share: ((totals.northAmerica || 0) / combined * 100).toFixed(1),
      color: "from-blue-500 to-indigo-600",
      textColor: "text-blue-400",
    },
    {
      name: "Europe & UK",
      key: "europe",
      amount: totals.europe || 0,
      share: ((totals.europe || 0) / combined * 100).toFixed(1),
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-400",
    },
    {
      name: "Asia-Pacific (APAC)",
      key: "asiaPacific",
      amount: totals.asiaPacific || 0,
      share: ((totals.asiaPacific || 0) / combined * 100).toFixed(1),
      color: "from-amber-500 to-orange-600",
      textColor: "text-amber-400",
    },
    {
      name: "Latin America (LATAM)",
      key: "latinAmerica",
      amount: totals.latinAmerica || 0,
      share: ((totals.latinAmerica || 0) / combined * 100).toFixed(1),
      color: "from-rose-500 to-pink-600",
      textColor: "text-rose-400",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <Globe className="text-blue-500" size={36} /> Global Box Office Telemetry
            </h1>
            <p className="text-slate-400 mt-2">
              Comprehensive international theatrical performance splits across major global distribution territories.
            </p>
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Theatrical Releases</span>
            <div className="text-3xl font-black text-blue-400 mt-2 flex items-center gap-2">
              <Film size={24} /> {summary?.totalReleasedMovies || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Tracked worldwide releases</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Cumulative Worldwide Gross</span>
            <div className="text-3xl font-black text-emerald-400 mt-2 flex items-center gap-1.5">
              <IndianRupee size={24} /> {((totals.combinedWorldwide || 0) / 1_000_000).toFixed(2)}M
            </div>
            <p className="text-xs text-slate-500 mt-1">Aggregated box office</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Top Regional Contributor</span>
            <div className="text-2xl font-black text-amber-400 mt-2 flex items-center gap-2">
              <TrendingUp size={24} /> North America
            </div>
            <p className="text-xs text-slate-500 mt-1">Leading territorial gross</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Analytics Status</span>
            <div className="text-2xl font-black text-violet-400 mt-2 flex items-center gap-2">
              <BarChart2 size={24} /> Active
            </div>
            <p className="text-xs text-slate-500 mt-1">Real-time telemetry stream</p>
          </div>
        </div>

        {/* Regional Breakdown Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PieChart size={20} className="text-blue-400" /> Territorial Revenue Distribution
          </h2>

          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse font-medium">
              Calculating global telemetry and territory splits...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 bg-rose-950/20 border border-rose-900/50 rounded-2xl flex items-center justify-center gap-3">
              <ShieldAlert size={24} /> {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {regions.map((reg) => (
                <div
                  key={reg.key}
                  className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{reg.name}</h3>
                      <span className="text-xs text-slate-400">Regional Gross Performance</span>
                    </div>
                    <span className={`text-2xl font-black ${reg.textColor}`}>{reg.share}%</span>
                  </div>

                  <div className="text-3xl font-black text-white flex items-center">
                    <IndianRupee size={24} className="mr-1 text-slate-400" />
                    {(reg.amount / 1_000_000).toFixed(2)}M
                  </div>

                  {/* Progress bar visualizer */}
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${reg.color} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(4, Math.min(100, Number(reg.share)))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegionalBoxOfficeHub;
