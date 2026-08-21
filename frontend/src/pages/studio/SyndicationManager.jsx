import { useState, useEffect } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Tv, Film, DollarSign, Calendar, TrendingUp, Radio, Award, Plus, CheckCircle2 } from "lucide-react";

const SyndicationManager = () => {
  const [deals, setDeals] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [valuation, setValuation] = useState(null);
  const [networkName, setNetworkName] = useState("National Cable Broadcasting");
  const [dealType, setDealType] = useState("EXCLUSIVE_TV_BROADCAST");
  const [actionMessage, setActionMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDealsAndMovies();
  }, []);

  const fetchDealsAndMovies = async () => {
    try {
      setLoading(true);
      const [dealsRes, moviesRes] = await Promise.allSettled([
        api.get("/syndication/deals"),
        api.get("/movies/studio"),
      ]);

      if (dealsRes.status === "fulfilled" && dealsRes.value.data?.success) {
        setDeals(dealsRes.value.data.data || []);
      }
      if (moviesRes.status === "fulfilled" && moviesRes.value.data?.data) {
        setMovies(moviesRes.value.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load syndication data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMovieForValuation = async (movieId) => {
    setSelectedMovieId(movieId);
    if (!movieId) {
      setValuation(null);
      return;
    }
    try {
      const res = await api.get(`/syndication/valuation/${movieId}`);
      if (res.data?.success) {
        setValuation(res.data.data);
      }
    } catch (err) {
      console.error("Failed to calculate valuation", err);
    }
  };

  const handleNegotiateDeal = async (e) => {
    e.preventDefault();
    if (!selectedMovieId) return;

    try {
      setIsSubmitting(true);
      const res = await api.post("/syndication/deals", {
        movieId: selectedMovieId,
        networkName,
        dealType,
        durationWeeks: valuation?.maxDurationWeeks || 26,
      });

      if (res.data?.success) {
        setActionMessage("Television licensing deal successfully executed and bonus credited!");
        setShowModal(false);
        setSelectedMovieId("");
        setValuation(null);
        await fetchDealsAndMovies();
      }
    } catch (err) {
      setActionMessage(err.response?.data?.message || "Failed to finalize licensing deal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Tv className="text-indigo-400" size={36} /> Television & Syndication Licensing
            </h1>
            <p className="text-slate-400 mt-2">
              Negotiate television broadcast packages, cable network syndication, and weekly royalty cashflows.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-indigo-900/30 transition"
          >
            <Plus size={18} /> Negotiate TV Deal
          </button>
        </div>

        {actionMessage && (
          <div className="p-4 bg-indigo-950/60 border border-indigo-700/60 rounded-2xl text-indigo-200 text-sm flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage("")} className="text-indigo-400 hover:text-white font-bold text-xs ml-4">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh] text-slate-400 font-bold">
            Scanning television broadcast markets...
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <Tv className="mx-auto text-indigo-400" size={54} />
            <h2 className="text-2xl font-bold text-white">No Active Television Licensing Deals</h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm">
              Your studio catalog has not been syndicated to television networks yet. Negotiate syndication deals to generate recurring weekly cashflows.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2"
            >
              <Plus size={16} /> Negotiate First Deal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <div
                key={deal._id}
                className="bg-[#111827] border border-slate-800 hover:border-slate-700 transition rounded-3xl p-6 space-y-5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">{deal.networkName}</h3>
                    <p className="text-xs text-indigo-400 font-semibold uppercase mt-0.5">{deal.dealType?.replace(/_/g, " ")}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      deal.status === "ACTIVE"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {deal.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Weekly Royalty</span>
                    <span className="text-base font-black text-emerald-400">₹{(deal.weeklyRoyalty / 1000).toFixed(0)}k/wk</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Upfront Bonus</span>
                    <span className="text-base font-black text-indigo-400">₹{(deal.upfrontBonus / 1000).toFixed(0)}k</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Duration Left</span>
                    <span className="text-base font-black text-amber-400">{deal.weeksRemaining} / {deal.totalWeeksDuration} wks</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Total Revenue</span>
                    <span className="text-base font-black text-white">₹{((deal.totalPayoutCollected || 0) / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Negotiation Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Tv className="text-indigo-400" size={24} /> Negotiate TV Syndication
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">
                  ✕
                </button>
              </div>

              <form onSubmit={handleNegotiateDeal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Select Catalog Movie
                  </label>
                  <select
                    value={selectedMovieId}
                    onChange={(e) => handleSelectMovieForValuation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">-- Choose a Completed Movie --</option>
                    {movies.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Broadcasting Network
                  </label>
                  <input
                    type="text"
                    value={networkName}
                    onChange={(e) => setNetworkName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Licensing Package Tier
                  </label>
                  <select
                    value={dealType}
                    onChange={(e) => setDealType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="EXCLUSIVE_TV_BROADCAST">Exclusive Television Broadcast</option>
                    <option value="CABLE_SYNDICATION_PACKAGE">Cable Syndication Package</option>
                    <option value="GLOBAL_TERRITORY_RIGHTS">Global Territory TV Rights</option>
                  </select>
                </div>

                {valuation && (
                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase">Estimated Deal Valuation</div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="bg-slate-800/80 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Upfront Bonus</span>
                        <span className="text-sm font-black text-indigo-400">₹{(valuation.upfrontBonus / 1000).toFixed(0)}k</span>
                      </div>
                      <div className="bg-slate-800/80 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Weekly Royalty</span>
                        <span className="text-sm font-black text-emerald-400">₹{(valuation.weeklyRoyalty / 1000).toFixed(0)}k</span>
                      </div>
                      <div className="bg-slate-800/80 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Term</span>
                        <span className="text-sm font-black text-amber-400">{valuation.maxDurationWeeks} wks</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedMovieId}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                  >
                    {isSubmitting ? "Executing..." : "Sign Deal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SyndicationManager;
