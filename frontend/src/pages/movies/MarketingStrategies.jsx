import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowLeft, Sparkles, AlertCircle, Film, DollarSign, Star } from "lucide-react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import CampaignSelector from "../../components/movies/CampaignSelector";
import { showToast } from "../../features/ui/toastSlice";

const MarketingStrategies = () => {
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

  const handleLaunchCampaign = async (campaignId) => {
    try {
      const res = await api.post(`/marketing/${id}/campaign`, { campaignId });
      dispatch(showToast({ message: res.data.message, type: "success" }));
      fetchData();
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || "Failed to launch campaign",
          type: "error",
        })
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <Link to={`/movies/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} /> Back to Movie Details
        </Link>

        {loading ? (
          <div className="text-slate-400 py-12 text-center">Loading movie marketing suite...</div>
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
                <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-violet-900/40 text-violet-300 rounded border border-violet-700/50">
                  {movie.status}
                </span>
                <h1 className="text-3xl font-extrabold text-white mt-3">{movie.title}</h1>
                <p className="text-slate-450 mt-1 text-sm">Budget Spent: ₹{movie.budget.toLocaleString()}</p>
              </div>

              <div className="flex gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center min-w-[120px]">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Current Hype</p>
                  <p className="text-2xl font-black text-violet-400 mt-1">{movie.hype}/100</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center min-w-[120px]">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Quality Estimate</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">{movie.quality}/100</p>
                </div>
              </div>
            </div>

            {/* Campaign Selector */}
            <CampaignSelector
              activeCampaigns={movie.marketingCampaigns || []}
              studioMoney={studioMoney}
              onLaunchCampaign={handleLaunchCampaign}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarketingStrategies;
