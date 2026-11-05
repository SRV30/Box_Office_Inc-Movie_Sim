import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowLeft, Sparkles, Award, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import LobbyingCategorySelector from "../../components/awards/LobbyingCategorySelector";
import { showToast } from "../../features/ui/toastSlice";

const AwardsCampaign = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [movie, setMovie] = useState(null);
  const [studioMoney, setStudioMoney] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/movies/${id}`);
      setMovie(res.data.movie);

      const meRes = await api.get("/auth/me");
      setStudioMoney(meRes.data.user?.studio?.money || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve movie details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEnroll = async (categoryId) => {
    try {
      const res = await api.post("/awards-campaign/lobby", {
        movieId: id,
        categoryId
      });
      dispatch(showToast({ message: res.data.message, type: "success" }));
      fetchData();
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || "Failed to launch awards campaign",
          type: "error",
        })
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <Link to={`/movies/library/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} /> Back to Library Movie Details
        </Link>

        {loading ? (
          <div className="text-slate-400 py-12 text-center">Loading awards campaign details...</div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl text-red-200 flex items-center gap-3">
            <AlertCircle className="shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white">{movie.title}</h1>
                <p className="text-slate-450 mt-1 text-sm">Release Week: {movie.releaseWeek} • Worldwide Gross: ₹{movie.worldwideGross?.toLocaleString()}</p>
              </div>

              <div className="flex gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center min-w-[120px]">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Critic Score</p>
                  <p className="text-2xl font-black text-violet-400 mt-1">{movie.criticScore}/100</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center min-w-[120px]">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Audience Score</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">{movie.audienceScore}%</p>
                </div>
              </div>
            </div>

            {/* Campaign Selector */}
            <LobbyingCategorySelector
              activeNominations={(movie.awards || []).filter(a => a.name === "Campaign Nominee").map(a => a.category)}
              studioMoney={studioMoney}
              onEnroll={handleEnroll}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AwardsCampaign;
