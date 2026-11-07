import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Trophy, Award, Sparkles, Clock, Film } from "lucide-react";
import { fetchAwards } from "../../features/awards/awardsSlice";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Skeleton } from "../../components/ui/Skeleton";
import api from "../../api/axios";

const TrophyRoom = () => {
  const dispatch = useDispatch();
  const { data: awards, loading, error } = useSelector((state) => state.awards);
  const [activeTab, setActiveTab] = useState("academy"); // "academy" | "festivals"
  const [festivalLaurels, setFestivalLaurels] = useState([]);
  const [loadingLaurels, setLoadingLaurels] = useState(false);

  useEffect(() => {
    dispatch(fetchAwards());
    fetchLaurels();
  }, [dispatch]);

  const fetchLaurels = async () => {
    try {
      setLoadingLaurels(true);
      const res = await api.get("/festivals/laurels");
      if (res.data?.success) {
        setFestivalLaurels(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch festival laurels", err);
    } finally {
      setLoadingLaurels(false);
    }
  };

  const awardList = Array.isArray(awards) ? awards : (awards?.awards || []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-8">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl">
            Failed to load awards: {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-500 w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold text-white">Studio Trophy Case</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Prestige awards, golden festival laurels, and international jury accolades.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab("academy")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "academy"
                  ? "bg-amber-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Trophy size={14} /> Academy Awards ({awardList.length})
            </button>
            <button
              onClick={() => setActiveTab("festivals")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "festivals"
                  ? "bg-amber-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Award size={14} /> Festival Laurels ({festivalLaurels.length})
            </button>
          </div>
        </header>

        {activeTab === "academy" ? (
          awardList.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 p-12 rounded-2xl text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4">
                <Trophy className="text-yellow-500/80 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white">Your Academy Trophy Case is Empty</h2>
              <p className="text-gray-400 max-w-md mt-2 text-sm leading-relaxed">
                Produce acclaimed cinematic masterworks, conduct awards lobbying, and secure critical consensus to win prestigious golden trophies!
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link
                  to="/movies/create"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
                >
                  <Film size={16} /> Produce Contender
                </Link>
                <Link
                  to="/awards/season"
                  className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-200 font-medium text-sm transition border border-gray-700"
                >
                  Awards Season Central
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {awardList.map((award, index) => (
                <div 
                  key={index} 
                  className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col items-center text-center hover:border-yellow-500/50 transition-colors"
                >
                  <Trophy className="text-yellow-500 w-16 h-16 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-1">{award.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{award.category}</p>
                  <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold tracking-wider">
                    {award.year}
                  </span>
                </div>
              ))}
            </div>
          )
        ) : (
          loadingLaurels ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
          ) : festivalLaurels.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 p-12 rounded-2xl text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <Award className="text-amber-500/80 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white">No Festival Laurels Earned Yet</h2>
              <p className="text-gray-400 max-w-md mt-2 text-sm leading-relaxed">
                Screen your premiere films at Cannes, Venice, TIFF, or Sundance to capture Golden Lions and Palme d&apos;Or laurels.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link
                  to="/studio/festivals"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
                >
                  <Sparkles size={16} /> Enter Festival Circuit
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {festivalLaurels.map((laurel) => (
                <div
                  key={laurel.submissionId}
                  className="bg-gradient-to-b from-[#161c28] to-[#0f141e] border border-amber-500/30 hover:border-amber-500/60 transition rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles size={13} /> {laurel.festivalName}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{laurel.year}</span>
                    </div>

                    <div className="text-center my-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                        <Award size={32} />
                      </div>
                      <h3 className="text-xl font-black text-amber-300">
                        {laurel.awardTitle.replace(/_/g, " ")}
                      </h3>
                      <p className="text-sm font-bold text-white mt-1">{laurel.movieTitle}</p>
                    </div>

                    {laurel.consensusQuote && (
                      <p className="text-xs italic text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 line-clamp-3">
                        &ldquo;{laurel.consensusQuote}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                    <span>Jury: {laurel.juryScore}/100</span>
                    {laurel.standingOvationMinutes > 0 && (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Clock size={12} /> {laurel.standingOvationMinutes}m Ovation
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrophyRoom;
