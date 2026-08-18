import { useState, useEffect } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Heart, Sparkles, Calendar, IndianRupee, Users, Flame, ShieldAlert, CheckCircle } from "lucide-react";

const FanClubHub = () => {
  const [data, setData] = useState(null);
  const [budgetInput, setBudgetInput] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingBudget, setUpdatingBudget] = useState(false);
  const [hostingConvention, setHostingConvention] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFanClubDetails();
  }, []);

  const fetchFanClubDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/studios/fanclub");
      if (res.data?.success) {
        setData(res.data.data);
        setBudgetInput(res.data.data.fanClub?.weeklyBudget || 0);
      }
    } catch (err) {
      console.error("Failed to load fan club details:", err);
      setError("Unable to load fan club and conventions data.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    try {
      setUpdatingBudget(true);
      const res = await api.put("/studios/fanclub/budget", { weeklyBudget: Number(budgetInput) });
      if (res.data?.success) {
        fetchFanClubDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update fan club budget");
    } finally {
      setUpdatingBudget(false);
    }
  };

  const handleHostConvention = async () => {
    if (!window.confirm("Host Annual Studio Convention for ₹2,000,000? This will give +15 Hype to all movies in production.")) {
      return;
    }

    try {
      setHostingConvention(true);
      const res = await api.post("/studios/fanclub/convention");
      if (res.data?.success) {
        alert(res.data.message);
        fetchFanClubDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to host convention");
    } finally {
      setHostingConvention(false);
    }
  };

  const fanClub = data?.fanClub || {};
  const cooldown = data?.cooldownRemaining || 0;
  const canHost = data?.canHostConvention;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <Heart className="text-rose-500 fill-rose-500/30" size={36} /> Fan Club & Conventions Hub
            </h1>
            <p className="text-slate-400 mt-2">
              Nurture your studio loyalists with weekly community budgets and host annual studio conventions to supercharge movie hype.
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Fanbase</span>
            <div className="text-3xl font-black text-rose-400 mt-2 flex items-center gap-2">
              <Users size={24} /> {(data?.studioFans || 0).toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total studio loyalists</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Fan Club Members</span>
            <div className="text-3xl font-black text-indigo-400 mt-2 flex items-center gap-2">
              <Heart size={24} /> {(fanClub.totalFans || 0).toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-500 mt-1">Official club registered</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Weekly Maintenance</span>
            <div className="text-3xl font-black text-emerald-400 mt-2 flex items-center">
              <IndianRupee size={24} /> {((fanClub.weeklyBudget || 0) / 1000).toFixed(0)}k/wk
            </div>
            <p className="text-xs text-slate-500 mt-1">Ongoing fan cultivation</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Convention Status</span>
            <div className="text-2xl font-black text-amber-400 mt-2 flex items-center gap-2">
              <Calendar size={24} /> {cooldown === 0 ? "Ready" : `${cooldown}w Cooldown`}
            </div>
            <p className="text-xs text-slate-500 mt-1">Annual flagship event</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse font-medium">
            Loading fan club dashboard...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 bg-rose-950/20 border border-rose-900/50 rounded-2xl flex items-center justify-center gap-3">
            <ShieldAlert size={24} /> {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Budget Controls */}
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-950/50 border border-rose-800/40 flex items-center justify-center">
                  <Heart className="text-rose-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Fan Club Maintenance Budget</h2>
                  <p className="text-xs text-slate-400">Invest weekly to organically grow your dedicated fanbase each tick.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                    Weekly Fan Club Allocation (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3.5 text-white font-bold text-lg focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Higher budget yields greater weekly fan conversion rate (₹100 per baseline fan point).
                  </p>
                </div>

                <div className="flex gap-2">
                  {[0, 10000, 25000, 50000, 100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBudgetInput(preset)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                    >
                      ₹{preset === 0 ? "0" : `${preset / 1000}k`}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={updatingBudget}
                  className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold py-3.5 rounded-2xl transition shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {updatingBudget ? "Saving..." : "Save Weekly Budget"}
                </button>
              </form>
            </div>

            {/* Annual Convention Event */}
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-950/50 border border-amber-800/40 flex items-center justify-center">
                    <Sparkles className="text-amber-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Annual Studio Convention (CineCon)</h2>
                    <p className="text-xs text-slate-400">Host a massive fan gala with panels, trailers, and reveals.</p>
                  </div>
                </div>

                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Flame size={16} /> Key Convention Perks:
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li><strong className="text-slate-200">+15 Hype boost</strong> to all active movies in Pre-Production, Production, or Post-Production.</li>
                    <li><strong className="text-slate-200">50,000 – 100,000 new fans</strong> instantly recruited.</li>
                    <li>Upfront venue and production cost: <span className="text-emerald-400 font-bold">₹2,000,000</span>.</li>
                    <li>52-week cooldown between convention editions.</li>
                  </ul>
                </div>
              </div>

              <div>
                {cooldown > 0 ? (
                  <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4 text-center">
                    <span className="text-xs text-amber-400 font-bold block">
                      Convention on cooldown ({cooldown} weeks remaining).
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleHostConvention}
                    disabled={hostingConvention || !canHost}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles size={20} />
                    {hostingConvention ? "Organizing Convention Gala..." : "Host Annual Studio Convention (₹2.0M)"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FanClubHub;
