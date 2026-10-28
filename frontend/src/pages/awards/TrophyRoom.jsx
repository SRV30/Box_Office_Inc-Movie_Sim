import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trophy, Medal, Sparkles } from "lucide-react";
import { fetchAwards } from "../../features/awards/awardsSlice";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Skeleton } from "../../components/ui/Skeleton";
import api from "../../api/axios";

const TrophyRoom = () => {
  const dispatch = useDispatch();
  const { data: awards, loading, error } = useSelector((state) => state.awards);
  const [festivalLaurels, setFestivalLaurels] = useState([]);
  const [laurelLoading, setLaurelLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("academy");

  useEffect(() => {
    dispatch(fetchAwards());
  }, [dispatch]);

  useEffect(() => {
    const loadFestivalLaurels = async () => {
      try {
        setLaurelLoading(true);
        const res = await api.get("/festivals/laurels");
        if (res.data?.success) setFestivalLaurels(res.data.data || []);
      } catch (err) {
        console.error("Failed to load festival laurels", err);
      } finally {
        setLaurelLoading(false);
      }
    };

    loadFestivalLaurels();
  }, []);

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
      <div className="p-6 space-y-8">
        <header className="flex items-center gap-3">
          <Trophy className="text-yellow-500 w-10 h-10" />
          <h1 className="text-3xl font-bold text-white">Trophy Room</h1>
        </header>

        <div className="flex gap-3 border-b border-gray-800 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("academy")}
            className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === "academy" ? "bg-yellow-500 text-black" : "bg-gray-800 text-gray-300"}`}
          >
            Academy Awards
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("festival")}
            className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === "festival" ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-300"}`}
          >
            Festival Laurels
          </button>
        </div>

        {activeTab === "academy" && (
          awards.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 p-12 rounded-2xl text-center">
              <Trophy className="text-gray-600 w-16 h-16 mx-auto mb-4" />
              <h2 className="text-xl text-gray-400">Your trophy case is empty.</h2>
              <p className="text-gray-500 mt-2">Keep producing blockbuster movies to win awards!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {awards.map((award, index) => (
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
        )}

        {activeTab === "festival" && (
          laurelLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
          ) : festivalLaurels.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 p-12 rounded-2xl text-center">
              <Medal className="text-amber-500 w-16 h-16 mx-auto mb-4" />
              <h2 className="text-xl text-gray-400">No festival laurels yet.</h2>
              <p className="text-gray-500 mt-2">Screen a strong film at Cannes, Venice, TIFF, or Sundance to add prestige to your trophy case.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {festivalLaurels.map((laurel) => (
                <div key={laurel._id} className="bg-gradient-to-br from-amber-950/50 to-gray-900 border border-amber-700/40 p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <Sparkles className="text-amber-400 w-8 h-8" />
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {laurel.awardWon?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{laurel.movieId?.title || "Festival Feature"}</h3>
                  <p className="text-sm text-gray-400 mt-1">{laurel.festivalName}</p>
                  <p className="text-xs text-gray-300 mt-4 italic">“{laurel.juryConsensusQuote || "Festival jury response was electric."}”</p>
                  <div className="mt-4 flex justify-between text-xs text-gray-400">
                    <span>Jury score</span>
                    <span className="font-bold text-amber-200">{laurel.juryScore}/100</span>
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
