import { Link } from "react-router-dom";
import { Tv, Sparkles, TrendingUp, DollarSign, ArrowRight } from "lucide-react";

const TVShowCard = ({ show }) => {
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "IN_PRODUCTION":
      case "DEVELOPMENT":
        return "bg-violet-900/40 text-violet-300 border-violet-750";
      case "AIRING":
        return "bg-emerald-900/40 text-emerald-300 border-emerald-750";
      case "RENEWAL_DECISION":
        return "bg-amber-900/40 text-amber-300 border-amber-750";
      case "SYNDICATED":
        return "bg-cyan-900/40 text-cyan-300 border-cyan-750";
      case "COMPLETED":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-rose-900/40 text-rose-300 border-rose-750";
    }
  };

  const seasonsCount = show.seasons?.length || show.totalSeasonsCount || show.seasons || 1;
  const episodesCount = show.totalEpisodesCount || (show.episodesPerSeason * seasonsCount) || 8;
  const totalRev = show.totalAdvertisingRevenue || show.totalRevenue || 0;

  return (
    <Link
      to={`/tv-shows/${show._id}`}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-violet-500/50 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
    >
      <div>
        <div className="flex justify-between items-start gap-2 mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(show.status)}`}>
            {show.status ? show.status.replace("_", " ") : "DEVELOPMENT"}
          </span>
          <span className="text-xs text-slate-500 font-medium">{show.networkOrPlatform || "Broadcast"}</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2 truncate group-hover:text-violet-300 transition-colors">
          <Tv size={18} className="text-violet-400 shrink-0" /> {show.title}
        </h3>
        <p className="text-xs text-slate-400">Genre: {show.genre}</p>
      </div>

      <div className="bg-slate-950/60 p-4 rounded-xl space-y-2 text-sm border border-slate-850">
        <div className="flex justify-between text-slate-400 text-xs">
          <span>Format:</span>
          <span className="text-white font-medium">{seasonsCount} Season(s) / {episodesCount} Ep.</span>
        </div>
        <div className="flex justify-between text-slate-400 text-xs">
          <span>Ad Revenue:</span>
          <span className="text-emerald-400 font-medium">${totalRev.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center border-t border-slate-850 pt-2 font-bold text-violet-400 text-xs">
          <span className="flex items-center gap-1"><Sparkles size={12} /> Quality:</span>
          <span>{show.quality || 50}/100</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <span>Manage Episodes & Renewal</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-violet-400" />
      </div>
    </Link>
  );
};

export default TVShowCard;
