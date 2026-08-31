import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getTVShowById,
  renewTVShowSeason,
  syndicateTVShow,
} from "../../api/tvShowApi";
import {
  Tv,
  Film,
  Award,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Users,
} from "lucide-react";

export default function TVShowDetailView() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [syndicationInfo, setSyndicationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSeasonIdx, setActiveSeasonIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    loadShowDetails();
  }, [id]);

  const loadShowDetails = async () => {
    try {
      setLoading(true);
      const res = await getTVShowById(id);
      if (res.success) {
        setShow(res.tvShow);
        setSyndicationInfo(res.syndicationInfo);
        if (res.tvShow.seasons?.length > 0) {
          setActiveSeasonIdx(res.tvShow.seasons.length - 1);
        }
      }
    } catch (err) {
      console.error("Failed to load TV show details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    try {
      setRenewing(true);
      const res = await renewTVShowSeason(id, {
        episodesCount: 10,
        budgetPerEpisode: (show.budgetPerEpisode || 250000) * 1.1,
      });
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        await loadShowDetails();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to renew TV season",
      });
    } finally {
      setRenewing(false);
    }
  };

  const handleSyndicate = async () => {
    try {
      const res = await syndicateTVShow(id);
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        await loadShowDetails();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to syndicate TV series",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-24 text-slate-400">Loading series telemetry & episode pipelines...</div>
      </DashboardLayout>
    );
  }

  if (!show) {
    return (
      <DashboardLayout>
        <div className="text-center py-24 text-red-400">TV show series not found.</div>
      </DashboardLayout>
    );
  }

  const currentSeason = show.seasons?.[activeSeasonIdx] || show.seasons?.[0];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <Link
          to="/tv-shows"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to TV Slate
        </Link>

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs px-3 py-1 rounded-full font-bold">
                {show.networkOrPlatform}
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700">
                {show.genre}
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold">
                {show.status}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
              {show.title}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">{show.concept}</p>
          </div>

          <div className="flex items-center gap-3">
            {show.status === "RENEWAL_DECISION" && (
              <button
                onClick={handleRenew}
                disabled={renewing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-950"
              >
                <RotateCcw className="w-4 h-4" /> Order Season {show.seasons.length + 1}
              </button>
            )}

            {syndicationInfo?.syndicationEligible && !show.isSyndicated && (
              <button
                onClick={handleSyndicate}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-950"
              >
                <Sparkles className="w-4 h-4" /> Launch Syndication Package
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                : "bg-red-950/40 border-red-500/30 text-red-300"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold uppercase hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Seasons</span>
            <p className="text-2xl font-bold text-white mt-1">{show.seasons?.length || 1}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Episodes</span>
            <p className="text-2xl font-bold text-white mt-1">{show.totalEpisodesCount || 8}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 uppercase font-semibold">Cumulative Ad Revenue</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              ${(show.totalAdvertisingRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 uppercase font-semibold">Weekly Syndication</span>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              ${(show.weeklySyndicationRoyalty || 0).toLocaleString()}/wk
            </p>
          </div>
        </div>

        {/* Season Selector Tabs */}
        <div className="flex border-b border-slate-800 gap-3 overflow-x-auto pb-2">
          {show.seasons?.map((s, idx) => (
            <button
              key={s._id || idx}
              onClick={() => setActiveSeasonIdx(idx)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                activeSeasonIdx === idx
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Season {s.seasonNumber} ({s.status})
            </button>
          ))}
        </div>

        {/* Selected Season Dashboard */}
        {currentSeason && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Season {currentSeason.seasonNumber} Lifecycle & Telemetry
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Production Stage: <span className="text-indigo-400 font-semibold">{currentSeason.status}</span> | Budget: ${(currentSeason.budget || 0).toLocaleString()}
                </p>
              </div>

              {currentSeason.renewalVerdict && currentSeason.renewalVerdict !== "PENDING" && (
                <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-right">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Network Verdict</span>
                  <p
                    className={`text-sm font-bold ${
                      currentSeason.renewalVerdict === "RENEWED"
                        ? "text-emerald-400"
                        : currentSeason.renewalVerdict === "FINAL_SEASON"
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {currentSeason.renewalVerdict} (Score: {currentSeason.renewalScore}/100)
                  </p>
                </div>
              )}
            </div>

            {/* Episode Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Episode Run & Ratings Curve
              </h3>
              {(!currentSeason.episodes || currentSeason.episodes.length === 0) ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  Episodes in preparation. Advancing weekly turns will broadcast episodes sequentially.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {currentSeason.episodes.map((ep) => (
                    <div
                      key={ep._id || ep.episodeNumber}
                      className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-2"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-indigo-400">EP {ep.episodeNumber}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                          {ep.status}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-white">{ep.title}</p>
                      <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-850">
                        <span>{ep.viewershipRating}M Viewers</span>
                        <span className="text-emerald-400 font-medium">
                          +${(ep.advertisingRevenue || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
