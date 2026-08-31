import { useState, useEffect } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Gavel, IndianRupee, Trophy, Flame, Plus, CheckCircle, Clock, ShieldAlert } from "lucide-react";

const StreamingBiddingHall = () => {
  const [auctions, setAuctions] = useState([]);
  const [movies, setMovies] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    movieId: "",
    windowType: "POST_THEATRICAL_SVOD",
    askingPrice: 500000,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [auctionsRes, moviesRes, platformsRes, analyticsRes] = await Promise.all([
        api.get("/streaming-auctions/auctions"),
        api.get("/movies/library"),
        api.get("/streaming-auctions/platforms"),
        api.get("/streaming-auctions/analytics"),
      ]);

      if (auctionsRes.data?.success) {
        setAuctions(auctionsRes.data.auctions || []);
      }
      if (moviesRes.data?.movies) {
        setMovies(moviesRes.data.movies || []);
      }
      if (platformsRes.data?.success) {
        setPlatforms(platformsRes.data.platforms || []);
      }
      if (analyticsRes.data?.success) {
        setAnalytics(analyticsRes.data.analytics);
      }
    } catch (err) {
      console.error("Failed to load auctions data:", err);
      setError("Unable to load auction hall. Please ensure backend services are connected.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuction = async (e) => {
    e.preventDefault();
    if (!formData.movieId) {
      alert("Please select a movie to auction.");
      return;
    }

    try {
      const res = await api.post("/streaming-auctions/auctions", formData);
      if (res.data?.success) {
        setShowCreateModal(false);
        setFormData({ movieId: "", windowType: "POST_THEATRICAL_SVOD", askingPrice: 500000 });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to initiate auction");
    }
  };

  const handleRunBidding = async (auctionId) => {
    try {
      setExecutingId(auctionId);
      const res = await api.post(`/streaming-auctions/auctions/${auctionId}/bid`);
      if (res.data?.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to execute platform bidding war");
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <Gavel className="text-amber-400" size={36} /> Streaming Rights Bidding Hall
            </h1>
            <p className="text-slate-400 mt-2">
              Competitive OTT bidding wars — exclusive rights, counteroffers, subscriber competition, and platform prestige.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg cursor-pointer transition-all duration-200"
          >
            <Plus size={20} /> Launch New Auction
          </button>
        </div>

        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-2xl font-bold text-white">{analytics.openAuctions}</p>
              <p className="text-xs text-slate-400 uppercase">Open Auctions</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-2xl font-bold text-emerald-400">{analytics.activeRights}</p>
              <p className="text-xs text-slate-400 uppercase">Active Rights</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-2xl font-bold text-white">{analytics.completedAuctions}</p>
              <p className="text-xs text-slate-400 uppercase">Completed Deals</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-2xl font-bold text-amber-400">₹{(analytics.totalBidRevenue / 10000000).toFixed(1)}Cr</p>
              <p className="text-xs text-slate-400 uppercase">Total Bid Revenue</p>
            </div>
          </div>
        )}

        {platforms.length > 0 && (
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
            {platforms.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-white font-bold text-sm">{p.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(p.subscribers / 1000000).toFixed(0)}M subs</p>
                <p className="text-xs text-slate-500">Prestige: {p.prestige ?? p.popularity}</p>
                <p className="text-xs text-emerald-400">{p.exclusiveCount ?? p.exclusiveMovies?.length ?? 0} exclusives</p>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Auction */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[#111827] border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Gavel size={24} className="text-amber-400" /> Start Streaming Auction
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAuction} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Select Library Movie</label>
                  <select
                    value={formData.movieId}
                    onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  >
                    <option value="">-- Choose a film from your library --</option>
                    {movies.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title} (Quality: {m.quality || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Exclusivity Window</label>
                  <select
                    value={formData.windowType}
                    onChange={(e) => setFormData({ ...formData, windowType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="POST_THEATRICAL_SVOD">Post-Theatrical SVOD (Standard Multiplier)</option>
                    <option value="GLOBAL_PREMIERE">Global Premiere Window (1.5x Multiplier)</option>
                    <option value="EXCLUSIVE_DAY_DATE">Exclusive Day-and-Date (2.0x Multiplier)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Reserve Asking Price (₹)</label>
                  <input
                    type="number"
                    min={50000}
                    step={50000}
                    value={formData.askingPrice}
                    onChange={(e) => setFormData({ ...formData, askingPrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition"
                  >
                    Open Auction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Auctions List */}
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse font-medium">
              Loading streaming bidding auctions...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 bg-rose-950/20 border border-rose-900/50 rounded-2xl flex items-center justify-center gap-3">
              <ShieldAlert size={24} /> {error}
            </div>
          ) : auctions.length === 0 ? (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center">
              <Gavel size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Active Streaming Auctions</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                Monetize your released library catalogue by opening streaming window auctions to competing platforms.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition"
              >
                Create Your First Auction
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {auctions.map((auction) => (
                <div
                  key={auction._id}
                  className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">
                          {auction.movieId?.title || "Untitled Film"}
                        </h2>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            auction.status === "COMPLETED"
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                              : "bg-amber-950/80 text-amber-400 border border-amber-800/60"
                          }`}
                        >
                          {auction.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Window: <span className="font-semibold text-slate-300">{auction.windowType.replace(/_/g, " ")}</span> • Asking Price: <span className="font-semibold text-amber-400">₹{(auction.askingPrice / 1_000_000).toFixed(2)}M</span>
                      </p>
                    </div>

                    {auction.status === "OPEN" ? (
                      <button
                        onClick={() => handleRunBidding(auction._id)}
                        disabled={executingId === auction._id}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Flame size={18} /> {executingId === auction._id ? "Bidding War in Progress..." : "Trigger Platform Bidding War"}
                      </button>
                    ) : (
                      <div className="bg-emerald-950/50 border border-emerald-800/50 rounded-2xl px-5 py-3 text-right">
                        <span className="text-xs text-slate-400 block font-medium">Winning Bidder</span>
                        <span className="text-lg font-black text-emerald-400 flex items-center gap-1.5 justify-end">
                          <Trophy size={18} className="text-amber-400" /> {auction.winningPlatform} (₹{((auction.winningBidAmount || 0) / 1_000_000).toFixed(2)}M)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bids received */}
                  {auction.bids && auction.bids.length > 0 ? (
                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Competing Platform Bids</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {auction.bids.map((b, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border ${
                              idx === 0 && auction.status === "COMPLETED"
                                ? "bg-emerald-950/30 border-emerald-600/60 ring-1 ring-emerald-500/30"
                                : "bg-slate-900/60 border-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-white text-sm">{b.platform}</span>
                              {idx === 0 && auction.status === "COMPLETED" && (
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle size={14} /> Won
                                </span>
                              )}
                            </div>
                            <div className="text-xl font-black text-amber-400 flex items-center">
                              <IndianRupee size={16} /> {(b.amount / 1_000_000).toFixed(2)}M
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                      <Clock size={16} className="text-amber-400" /> Auction is live and waiting for bidding war execution.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StreamingBiddingHall;
