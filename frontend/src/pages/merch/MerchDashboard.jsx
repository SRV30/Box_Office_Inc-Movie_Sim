import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { DollarSign, Shield, Star, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { showToast } from "../../features/ui/toastSlice";

const MerchDashboard = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState({
    activeMovies: [],
    merchandiseIncomeHistory: [],
    totalMerchandiseRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studioMoney, setStudioMoney] = useState(0);

  const fetchMerchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/merch");
      setData(res.data);

      const studioRes = await api.get("/auth/me");
      setStudioMoney(studioRes.data.user?.studio?.money || 0);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch merchandise data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchData();
  }, []);

  const handleBoost = async (movieId) => {
    if (studioMoney < 2500000) {
      dispatch(
        showToast({
          message: "Insufficient funds! Upgrading merchandising campaigns costs $2,500,000.",
          type: "error",
        })
      );
      return;
    }
    try {
      const res = await api.post(`/merch/boost/${movieId}`);
      dispatch(showToast({ message: res.data.message, type: "success" }));
      fetchMerchData();
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || "Failed to upgrade merchandising campaign",
          type: "error",
        })
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-linear-to-r from-emerald-700 to-teal-500 p-6 sm:p-8 rounded-3xl text-white">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold flex items-center gap-3">
              <Sparkles className="animate-pulse" /> Merchandising & Licensing
            </h1>
            <p className="text-emerald-100 mt-2 text-sm sm:text-base">
              Capitalize on your movie's fame and unlock passive weekly income streams.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-emerald-100">Total Lifetime Merch Revenue</p>
            <p className="text-3xl font-extrabold">₹{data.totalMerchandiseRevenue.toLocaleString()}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-200 flex items-center gap-3">
            <AlertTriangle className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-slate-400 font-medium py-10 text-center">Loading merchandise operations...</div>
        ) : (
          <>
            {/* Active Movies Section */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="text-emerald-400" /> Active Merchandise Campaigns
              </h2>

              {data.activeMovies.length === 0 ? (
                <div className="text-slate-500 py-6 text-center">
                  No released blockbusters are generating merchandise income yet. Release movies with high hype or box office gross to activate!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.activeMovies.map((movie) => (
                    <div
                      key={movie.id}
                      className="bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 rounded-xl p-5 transition flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div>
                            <span className="px-2 py-0.5 text-xs font-semibold tracking-wider bg-violet-900/40 text-violet-300 rounded border border-violet-700/30 mr-2">
                              {movie.verdict}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-semibold tracking-wider bg-emerald-900/40 text-emerald-300 rounded border border-emerald-700/30">
                              Lvl {movie.merchandiseLevel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">Weeks: {movie.weeksSinceRelease}</p>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 truncate">{movie.title}</h3>
                        <p className="text-xs text-slate-400">Total Box Office: ₹{movie.totalGross.toLocaleString()}</p>
                      </div>

                      <div className="bg-slate-950/50 p-4 rounded-lg space-y-2 text-sm border border-slate-800">
                        <div className="flex justify-between text-slate-400">
                          <span>Total Merch Revenue:</span>
                          <span className="text-white font-medium">₹{movie.merchandiseRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Decay Factor:</span>
                          <span className="text-slate-300">{movie.decayFactor}x</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-emerald-400">
                          <span>Next Week's Proj:</span>
                          <span>~₹{movie.weeklyProjection.toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleBoost(movie.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles size={16} /> Boost Merch Campaign (₹2.5M)
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Income History Log */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <DollarSign className="text-emerald-400" /> Weekly Merchandise Licensing Log
              </h2>

              {data.merchandiseIncomeHistory.length === 0 ? (
                <div className="text-slate-500 py-6 text-center">No weekly revenue records yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900 text-xs uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Week</th>
                        <th className="px-6 py-4">Source Description</th>
                        <th className="px-6 py-4 text-right">Amount Earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {data.merchandiseIncomeHistory.slice().reverse().map((log, index) => (
                        <tr key={index} className="hover:bg-slate-900/30">
                          <td className="px-6 py-4 font-semibold text-white">Week {log.week}</td>
                          <td className="px-6 py-4">{log.reason}</td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-400">+₹{log.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MerchDashboard;
