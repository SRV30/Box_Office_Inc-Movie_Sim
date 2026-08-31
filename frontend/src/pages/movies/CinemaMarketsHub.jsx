import { useState, useEffect } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Globe, Film, TrendingUp, IndianRupee, MapPin, RefreshCw } from "lucide-react";

const MARKET_COLORS = {
  BOLLYWOOD: "from-orange-500 to-amber-600",
  TOLLYWOOD: "from-red-600 to-rose-500",
  KOLLYWOOD: "from-violet-600 to-purple-500",
  HOLLYWOOD: "from-blue-600 to-indigo-600",
  KOREAN: "from-pink-500 to-rose-600",
  JAPANESE: "from-slate-600 to-slate-800",
};

const CinemaMarketsHub = () => {
  const [markets, setMarkets] = useState([]);
  const [movies, setMovies] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState("");
  const [selectedMarkets, setSelectedMarkets] = useState(["BOLLYWOOD"]);
  const [primaryMarket, setPrimaryMarket] = useState("BOLLYWOOD");
  const [projection, setProjection] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [marketsRes, moviesRes, analyticsRes] = await Promise.all([
        api.get("/cinema-markets"),
        api.get("/cinema-markets/movies"),
        api.get("/cinema-markets/analytics"),
      ]);
      if (marketsRes.data?.success) setMarkets(marketsRes.data.markets || []);
      if (moviesRes.data?.success) setMovies(moviesRes.data.movies || []);
      if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.analytics);
    } catch {
      setError("Unable to load cinema market data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleMarket = (marketId) => {
    setSelectedMarkets((prev) => {
      if (prev.includes(marketId)) {
        const next = prev.filter((id) => id !== marketId);
        if (primaryMarket === marketId && next.length > 0) setPrimaryMarket(next[0]);
        return next.length > 0 ? next : prev;
      }
      return [...prev, marketId];
    });
  };

  const handleSaveTargets = async (e) => {
    e.preventDefault();
    if (!selectedMovie) return;

    try {
      setSaving(true);
      await api.put(`/cinema-markets/movies/${selectedMovie}/targets`, {
        targetMarkets: selectedMarkets,
        primaryMarket,
        crossMarketRelease: selectedMarkets.length > 1,
      });
      const projRes = await api.get(`/cinema-markets/movies/${selectedMovie}/projections`);
      setProjection(projRes.data?.projection || null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update market targets.");
    } finally {
      setSaving(false);
    }
  };

  const formatINR = (n) =>
    n >= 10000000 ? `₹${(n / 10000000).toFixed(1)} Cr` : `₹${(n / 100000).toFixed(1)} L`;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <Globe className="text-emerald-400" size={36} /> Cinema Markets
            </h1>
            <p className="text-slate-400 mt-2">
              Target Bollywood, Tollywood, Kollywood, Hollywood, Korean, and Japanese markets.
            </p>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300">{error}</div>
        )}

        {loading ? (
          <div className="text-slate-400 text-center py-12">Loading cinema markets...</div>
        ) : (
          <>
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <IndianRupee className="text-emerald-400 mb-2" size={20} />
                  <p className="text-2xl font-bold text-white">{formatINR(analytics.totalRevenue)}</p>
                  <p className="text-xs text-slate-400 uppercase">Total Market Revenue</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <Film className="text-blue-400 mb-2" size={20} />
                  <p className="text-2xl font-bold text-white">{analytics.releasedCount}</p>
                  <p className="text-xs text-slate-400 uppercase">Market Releases</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <TrendingUp className="text-violet-400 mb-2" size={20} />
                  <p className="text-2xl font-bold text-white">{analytics.crossMarketReleases}</p>
                  <p className="text-xs text-slate-400 uppercase">Cross-Market Releases</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {markets.map((market) => (
                <div key={market.id} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                  <div className={`p-4 bg-gradient-to-r ${MARKET_COLORS[market.id] || "from-slate-600 to-slate-700"}`}>
                    <h3 className="text-lg font-bold text-white">{market.name}</h3>
                    <p className="text-white/70 text-xs">{market.region} · {market.currency}</p>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>Avg Ticket</span>
                      <span className="text-white">₹{market.avgTicketPriceINR}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Prod. Cost Mult.</span>
                      <span className="text-white">×{market.productionCostMultiplier}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Distribution Fee</span>
                      <span className="text-white">{(market.distributionFeePct * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-emerald-400" /> Set Market Targets
              </h2>
              <form onSubmit={handleSaveTargets} className="space-y-4">
                <select
                  value={selectedMovie}
                  onChange={(e) => setSelectedMovie(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  required
                >
                  <option value="">Select active movie...</option>
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.status}) — {m.targetMarkets?.join(", ") || "No targets"}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-2">
                  {markets.map((market) => (
                    <button
                      key={market.id}
                      type="button"
                      onClick={() => toggleMarket(market.id)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                        selectedMarkets.includes(market.id)
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {market.name}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    value={primaryMarket}
                    onChange={(e) => setPrimaryMarket(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    {selectedMarkets.map((id) => {
                      const m = markets.find((mk) => mk.id === id);
                      return (
                        <option key={id} value={id}>
                          Primary: {m?.name || id}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="submit"
                    disabled={saving || !selectedMovie}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 transition"
                  >
                    {saving ? "Saving..." : "Save Market Targets"}
                  </button>
                </div>
              </form>

              {projection && (
                <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <h3 className="text-white font-bold mb-3">Revenue Projection</h3>
                  <p className="text-emerald-400 text-lg font-bold mb-2">
                    Worldwide: {formatINR(projection.totalWorldwide)}
                    {projection.crossMarketBonus > 1 && (
                      <span className="text-sm text-slate-400 ml-2">
                        (+{Math.round((projection.crossMarketBonus - 1) * 100)}% cross-market bonus)
                      </span>
                    )}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {projection.markets?.map((m) => (
                      <div key={m.marketId} className="p-3 rounded-xl bg-slate-900 text-sm">
                        <p className="text-white font-medium">{m.marketName}</p>
                        <p className="text-slate-400">Gross: {formatINR(m.grossINR)}</p>
                        {m.localizationCost > 0 && (
                          <p className="text-rose-400 text-xs">Localization: {formatINR(m.localizationCost)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CinemaMarketsHub;
