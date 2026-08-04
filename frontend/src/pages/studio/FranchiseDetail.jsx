import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  Film,
  IndianRupee,
  Star,
  Layers,
  Users,
  Award,
  ArrowLeft,
} from "lucide-react";

const verdictColor = (verdict) =>
  verdict === "BLOCKBUSTER" || verdict === "ALL_TIME_BLOCKBUSTER"
    ? "text-green-400"
    : verdict === "HIT"
    ? "text-emerald-400"
    : verdict === "AVERAGE"
    ? "text-blue-400"
    : verdict === "FLOP" || verdict === "DISASTER"
    ? "text-red-400"
    : "text-slate-400";

const FranchiseDetail = () => {
  const { id } = useParams();
  const [franchise, setFranchise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFranchise = async () => {
      try {
        const res = await api.get(`/franchises/${id}`);
        setFranchise(res.data.franchise);
      } catch (err) {
        console.error("Failed to fetch franchise", err);
        setError("Could not load this franchise.");
      } finally {
        setLoading(false);
      }
    };
    fetchFranchise();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-white font-bold">
          Loading Franchise...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !franchise) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <p className="text-slate-300 mb-6">{error || "Franchise not found."}</p>
          <Link
            to="/studio/franchises"
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition inline-flex items-center gap-2"
          >
            <ArrowLeft size={18} /> Back to Franchises
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const movies = franchise.movies || [];
  const numMovies = movies.length;
  // Released installments (those that have a verdict) drive the rating averages.
  const released = movies.filter((m) => m.verdict && m.verdict !== "N/A");
  const ratedCount = released.length || 0;

  const totalGross = movies.reduce((sum, m) => sum + (m.worldwideGross || 0), 0);
  const avgCritic =
    ratedCount > 0
      ? released.reduce((sum, m) => sum + (m.criticScore || 0), 0) / ratedCount
      : 0;
  const avgAudience =
    ratedCount > 0
      ? released.reduce((sum, m) => sum + (m.audienceScore || 0), 0) / ratedCount
      : 0;

  const fanbaseMultiplier = franchise.fanbaseMultiplier || 1;
  const fanBonusPct = Math.round((fanbaseMultiplier - 1) * 100);
  const prestigeBonus = franchise.prestigeBonus || 0;
  const popularity = franchise.popularity ?? 50;
  const fanLoyaltyRating = franchise.fanLoyalty ?? 50;
  const totalRevenueValue = franchise.totalRevenue || totalGross;
  const badges = franchise.badges || [];

  const movieBadges = [
    ...(badges || []),
    ...(franchise.movieCount >= 10 ? ["10 Movies Club"] : []),
    ...(totalRevenueValue >= 1_000_000_000 ? ["1 Billion Club"] : []),
  ].filter((value, index, arr) => arr.indexOf(value) === index);

  const timeline = [...movies]
    .filter((m) => m.releaseWeek !== null && m.releaseWeek !== undefined)
    .sort((a, b) => a.releaseWeek - b.releaseWeek || (a.sequelNumber || 0) - (b.sequelNumber || 0));

  const fmtMoney = (n) => `${(n / 1000000).toFixed(1)}M`;

  const StatCard = ({ icon, label, value, sub }) => (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
      <div className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
        {icon} {label}
      </div>
      <div className="text-white text-2xl font-black">{value}</div>
      {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col gap-4">
          <Link
            to="/studio/franchises"
            className="text-slate-400 hover:text-white text-sm inline-flex items-center gap-2 w-fit"
          >
            <ArrowLeft size={16} /> Back to Franchises
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Layers className="text-violet-500" size={36} /> {franchise.name}
            </h1>
            <p className="text-slate-400 mt-2">
              Franchise performance, reputation, and installment history.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            icon={<Film size={14} className="text-blue-400" />}
            label="Installments"
            value={numMovies}
            sub={`${ratedCount} released`}
          />
          <StatCard
            icon={<IndianRupee size={14} className="text-green-400" />}
            label="Total Box Office"
            value={fmtMoney(totalRevenueValue)}
          />
          <StatCard
            icon={<Star size={14} className="text-yellow-400" />}
            label="Popularity"
            value={`${popularity}%`}
            sub="Franchise awareness"
          />
          <StatCard
            icon={<Users size={14} className="text-pink-400" />}
            label="Fan Loyalty"
            value={`${fanLoyaltyRating}%`}
            sub="Audience devotion"
          />
          <StatCard
            icon={<Award size={14} className="text-violet-400" />}
            label="Franchise Prestige"
            value={`+${prestigeBonus}`}
            sub="Brand reputation"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">Popularity</h2>
                <p className="text-slate-400 text-sm">How well the franchise is known.</p>
              </div>
              <div className="text-white font-bold">{popularity}%</div>
            </div>
            <div className="h-4 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500"
                style={{ width: `${popularity}%` }}
              />
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">Fan Loyalty</h2>
                <p className="text-slate-400 text-sm">How attached fans are to the franchise.</p>
              </div>
              <div className="text-white font-bold">{fanLoyaltyRating}%</div>
            </div>
            <div className="h-4 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500"
                style={{ width: `${fanLoyaltyRating}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Badges</div>
            {movieBadges.length === 0 ? (
              <span className="text-slate-400 text-sm">No badges earned yet.</span>
            ) : (
              movieBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-200"
                >
                  {badge}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">Franchise Timeline</h2>
                <p className="text-slate-400 text-sm">Chronological release order for this franchise.</p>
              </div>
              <div className="text-slate-400 text-sm">{timeline.length} released</div>
            </div>
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <div className="text-slate-500">No released installments yet.</div>
              ) : (
                timeline.map((item, index) => (
                  <div key={item._id} className="grid grid-cols-[auto_1fr] gap-4 items-start">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wide">
                      Week {item.releaseWeek}
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-white font-bold">{item.title}</div>
                          <div className="text-slate-500 text-sm">Installment {item.sequelNumber || "—"}</div>
                        </div>
                        <div className={`text-sm font-bold ${verdictColor(item.verdict)}`}>
                          {item.verdict && item.verdict !== "N/A" ? item.verdict.replace(/_/g, " ") : "Released"}
                        </div>
                      </div>
                      <div className="mt-3 text-slate-400 text-sm grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-slate-500">Box Office</div>
                          <div className="text-white">{item.worldwideGross ? fmtMoney(item.worldwideGross) : "—"}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Critic</div>
                          <div className="text-white">{item.criticScore ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Audience</div>
                          <div className="text-white">{item.audienceScore ?? "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film size={18} className="text-violet-400" /> Installments
            </h2>
          </div>

          {numMovies === 0 ? (
            <div className="p-10 text-center text-slate-400">
              No installments in this franchise yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-800">
                    <th className="text-left font-bold px-6 py-3">#</th>
                    <th className="text-left font-bold px-6 py-3">Title</th>
                    <th className="text-left font-bold px-6 py-3">Verdict</th>
                    <th className="text-right font-bold px-6 py-3">Box Office</th>
                    <th className="text-right font-bold px-6 py-3">Critic</th>
                    <th className="text-right font-bold px-6 py-3">Audience</th>
                  </tr>
                </thead>
                <tbody>
                  {[...movies]
                    .sort((a, b) => (a.sequelNumber || 0) - (b.sequelNumber || 0))
                    .map((m) => (
                      <tr
                        key={m._id}
                        className="border-b border-slate-800/50 hover:bg-slate-900/40"
                      >
                        <td className="px-6 py-3 text-slate-400">
                          {m.sequelNumber || "—"}
                        </td>
                        <td className="px-6 py-3 text-slate-200 font-medium">
                          {m.title}
                        </td>
                        <td className={`px-6 py-3 font-bold ${verdictColor(m.verdict)}`}>
                          {m.verdict && m.verdict !== "N/A"
                            ? m.verdict.replace(/_/g, " ")
                            : "IN PRODUCTION"}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-200">
                          {m.worldwideGross ? fmtMoney(m.worldwideGross) : "—"}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-300">
                          {m.criticScore ? m.criticScore : "—"}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-300">
                          {m.audienceScore ? m.audienceScore : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FranchiseDetail;
