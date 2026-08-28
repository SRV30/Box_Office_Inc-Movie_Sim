import { useState, useEffect } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  Share2,
  TrendingUp,
  Users,
  Flame,
  AlertTriangle,
  IndianRupee,
  RefreshCw,
  Zap,
  Hash,
} from "lucide-react";

const PLATFORM_STYLES = {
  INSTAGRAM: { gradient: "from-pink-600 to-purple-600", icon: "📸" },
  TIKTOK: { gradient: "from-slate-800 to-cyan-600", icon: "🎵" },
  YOUTUBE: { gradient: "from-red-700 to-red-500", icon: "▶️" },
  X: { gradient: "from-slate-700 to-slate-900", icon: "𝕏" },
};

const SocialMediaHub = () => {
  const [accounts, setAccounts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [events, setEvents] = useState([]);
  const [movies, setMovies] = useState([]);
  const [campaignTypes, setCampaignTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budgetInputs, setBudgetInputs] = useState({});
  const [campaignForm, setCampaignForm] = useState({
    platform: "INSTAGRAM",
    movieId: "",
    campaignType: "TRAILER_PUSH",
  });
  const [launching, setLaunching] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accountsRes, analyticsRes, eventsRes, moviesRes] = await Promise.all([
        api.get("/social/accounts"),
        api.get("/social/analytics"),
        api.get("/social/events?limit=20"),
        api.get("/social/movies"),
      ]);

      if (accountsRes.data?.success) {
        setAccounts(accountsRes.data.accounts || []);
        const budgets = {};
        (accountsRes.data.accounts || []).forEach((a) => {
          budgets[a.platform] = a.weeklyBudget || 0;
        });
        setBudgetInputs(budgets);
      }
      if (analyticsRes.data?.success) {
        setAnalytics(analyticsRes.data.analytics);
        setCampaignTypes(analyticsRes.data.campaignTypes || []);
      }
      if (eventsRes.data?.success) setEvents(eventsRes.data.events || []);
      if (moviesRes.data?.success) setMovies(moviesRes.data.movies || []);
    } catch {
      setError("Unable to load social media data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleBudgetUpdate = async (platform) => {
    try {
      await api.put(`/social/accounts/${platform}/budget`, {
        weeklyBudget: Number(budgetInputs[platform] || 0),
      });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update budget.");
    }
  };

  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.movieId) return;

    try {
      setLaunching(true);
      const res = await api.post("/social/campaigns", campaignForm);
      if (res.data?.success) {
        alert(res.data.message);
        fetchAll();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to launch campaign.");
    } finally {
      setLaunching(false);
    }
  };

  const formatNumber = (n) => (n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <Share2 className="text-sky-400" size={36} /> Social Media Hub
            </h1>
            <p className="text-slate-400 mt-2">
              Manage Instagram, TikTok, YouTube, and X campaigns for your studio.
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
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-slate-400 text-center py-12">Loading social media ecosystem...</div>
        ) : (
          <>
            {/* Analytics Summary */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <Users className="text-sky-400 mb-2" size={20} />
                  <p className="text-2xl font-bold text-white">{formatNumber(analytics.totalFollowers)}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total Followers</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <TrendingUp className="text-emerald-400 mb-2" size={20} />
                  <p className="text-2xl font-bold text-white">{analytics.avgEngagement}%</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Avg Engagement</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <Flame className="text-amber-400 mb-2" size={20} />
                  <p className="text-2xl font-bold text-white">{analytics.totalMomentum.toFixed(0)}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Viral Momentum</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <Zap className="text-violet-400 mb-2" size={20} />
                  <p className="text-2xl font-bold text-white">×{analytics.boxOfficeMultiplier}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Box Office Boost</p>
                </div>
              </div>
            )}

            {/* Platform Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {accounts.map((account) => {
                const style = PLATFORM_STYLES[account.platform] || PLATFORM_STYLES.INSTAGRAM;
                return (
                  <div
                    key={account.platform}
                    className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden"
                  >
                    <div className={`p-5 bg-gradient-to-r ${style.gradient}`}>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>{style.icon}</span> {account.platformName}
                        </h2>
                        <span className="text-white/80 text-sm">
                          {account.activeCampaigns?.length || 0} active campaigns
                        </span>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold text-white">{formatNumber(account.followers)}</p>
                          <p className="text-xs text-slate-500">Followers</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{account.engagementRate?.toFixed(1)}%</p>
                          <p className="text-xs text-slate-500">Engagement</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-amber-400">{account.viralMomentum?.toFixed(0)}</p>
                          <p className="text-xs text-slate-500">Momentum</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                          <input
                            type="number"
                            min="0"
                            value={budgetInputs[account.platform] ?? 0}
                            onChange={(e) =>
                              setBudgetInputs({ ...budgetInputs, [account.platform]: e.target.value })
                            }
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                            placeholder="Weekly budget"
                          />
                        </div>
                        <button
                          onClick={() => handleBudgetUpdate(account.platform)}
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Launch Campaign */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Hash size={20} className="text-sky-400" /> Launch Social Campaign
              </h2>
              <form onSubmit={handleLaunchCampaign} className="grid md:grid-cols-4 gap-4">
                <select
                  value={campaignForm.platform}
                  onChange={(e) => setCampaignForm({ ...campaignForm, platform: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.platform} value={a.platform}>
                      {a.platformName}
                    </option>
                  ))}
                </select>
                <select
                  value={campaignForm.movieId}
                  onChange={(e) => setCampaignForm({ ...campaignForm, movieId: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  required
                >
                  <option value="">Select movie...</option>
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.status})
                    </option>
                  ))}
                </select>
                <select
                  value={campaignForm.campaignType}
                  onChange={(e) => setCampaignForm({ ...campaignForm, campaignType: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
                >
                  {campaignTypes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (₹{c.cost?.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={launching}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-violet-600 text-white font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {launching ? "Launching..." : "Launch Campaign"}
                </button>
              </form>
            </div>

            {/* Recent Events Feed */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Social Events</h2>
              {events.length === 0 ? (
                <p className="text-slate-500">No social events yet. Advance weeks to see activity.</p>
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div
                      key={ev._id}
                      className={`p-4 rounded-2xl border ${
                        ev.sentiment === "negative"
                          ? "bg-rose-950/20 border-rose-800/30"
                          : ev.sentiment === "positive"
                            ? "bg-emerald-950/20 border-emerald-800/30"
                            : "bg-slate-800/50 border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-medium">{ev.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Week {ev.week} · {ev.platform} · {ev.eventType.replace(/_/g, " ")}
                            {ev.movieTitle && ` · ${ev.movieTitle}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {ev.sentiment === "negative" ? (
                            <AlertTriangle className="text-rose-400" size={18} />
                          ) : (
                            <TrendingUp className="text-emerald-400" size={18} />
                          )}
                          {ev.hypeDelta !== 0 && (
                            <p className={`text-xs mt-1 ${ev.hypeDelta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              Hype {ev.hypeDelta > 0 ? "+" : ""}{ev.hypeDelta}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SocialMediaHub;
