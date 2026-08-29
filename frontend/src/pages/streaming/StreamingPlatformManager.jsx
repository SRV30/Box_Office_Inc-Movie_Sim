import React, { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getMyPlatform,
  getAllPlatforms,
  launchPlayerPlatform,
  updatePlatformConfig,
  upgradeRecommendationTech,
} from "../../api/streamingPlatformApi";
import {
  Tv,
  Film,
  Users,
  TrendingUp,
  DollarSign,
  Cpu,
  Server,
  Zap,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

export default function StreamingPlatformManager() {
  const [platform, setPlatform] = useState(null);
  const [allPlatforms, setAllPlatforms] = useState([]);
  const [nextUpgradeCost, setNextUpgradeCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Launch Form State
  const [launchName, setLaunchName] = useState("");
  const [launchTagline, setLaunchTagline] = useState("");
  const [launchStrategy, setLaunchStrategy] = useState("BALANCED");
  const [launchPrice, setLaunchPrice] = useState(9.99);

  // Config State
  const [editPrice, setEditPrice] = useState(9.99);
  const [editStrategy, setEditStrategy] = useState("BALANCED");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [myRes, allRes] = await Promise.all([
        getMyPlatform(),
        getAllPlatforms(),
      ]);
      if (myRes.success) {
        setPlatform(myRes.platform);
        setNextUpgradeCost(myRes.nextUpgradeCost || 0);
        if (myRes.platform) {
          setEditPrice(myRes.platform.monthlySubscriptionPrice);
          setEditStrategy(myRes.platform.strategy);
        }
      }
      if (allRes.success) setAllPlatforms(allRes.platforms || []);
    } catch (err) {
      console.error("Failed to load streaming platform", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async (e) => {
    e.preventDefault();
    try {
      const res = await launchPlayerPlatform({
        name: launchName,
        tagline: launchTagline,
        strategy: launchStrategy,
        monthlySubscriptionPrice: launchPrice,
      });
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to launch streaming service.",
      });
    }
  };

  const handleUpdateConfig = async () => {
    if (!platform) return;
    try {
      const res = await updatePlatformConfig(platform._id, {
        monthlySubscriptionPrice: editPrice,
        strategy: editStrategy,
      });
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to update configuration.",
      });
    }
  };

  const handleUpgradeTech = async () => {
    if (!platform) return;
    try {
      const res = await upgradeRecommendationTech(platform._id);
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to upgrade recommendation tech.",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-900 border border-blue-900/30 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <Tv className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Streaming Platform & Subscriber Simulation Hub
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Build your digital streaming empire, license studio catalogs, optimize recommendation algorithms, and simulate global subscriber growth.
            </p>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Tv className="w-4 h-4" />
            Studio Platform Overview
          </button>
          <button
            onClick={() => setActiveTab("market")}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "market"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Industry Market Share
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {!platform ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto space-y-5">
                <div className="text-center space-y-2">
                  <Sparkles className="w-10 h-10 text-blue-400 mx-auto" />
                  <h2 className="text-xl font-bold text-white">Launch Your Studio Streaming Service</h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Direct-to-consumer streaming bypasses box office middlemen, earning monthly recurring revenue directly from global subscribers.
                  </p>
                </div>

                <form onSubmit={handleLaunch} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={launchName}
                      onChange={(e) => setLaunchName(e.target.value)}
                      placeholder="e.g. CinemaMax Plus"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Marketing Tagline
                    </label>
                    <input
                      type="text"
                      value={launchTagline}
                      onChange={(e) => setLaunchTagline(e.target.value)}
                      placeholder="e.g. Premium Blockbusters On-Demand"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        Content Strategy
                      </label>
                      <select
                        value={launchStrategy}
                        onChange={(e) => setLaunchStrategy(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="PRESTIGE_FIRST">Prestige First (Award Winners)</option>
                        <option value="BLOCKBUSTER_FOCUSED">Blockbuster Focused (High Hype)</option>
                        <option value="BUDGET_MASS_MARKET">Budget Mass Market</option>
                        <option value="NICHE_INDIE">Niche Indie & Auteur</option>
                        <option value="BALANCED">Balanced Portfolio</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        Monthly Subscription ($)
                      </label>
                      <input
                        type="number"
                        step="0.50"
                        min="2.99"
                        max="29.99"
                        value={launchPrice}
                        onChange={(e) => setLaunchPrice(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 flex justify-between items-center">
                    <span>Initial CDN Infrastructure & Setup Cost:</span>
                    <span className="text-amber-400 font-bold text-sm">$1,500,000</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-950"
                  >
                    Deploy Streaming Platform
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Platform Overview Banner */}
                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-3 py-1 rounded-full font-bold">
                          {platform.strategy}
                        </span>
                        <span className="text-xs text-slate-400">
                          Prestige Rating: <strong className="text-white">{platform.prestigeRating}/100</strong>
                        </span>
                      </div>
                      <h2 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                        {platform.name}
                      </h2>
                      <p className="text-xs text-slate-400">{platform.tagline}</p>
                    </div>

                    <div className="text-right bg-slate-950/60 px-5 py-3 rounded-2xl border border-slate-800">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Active Subscribers</span>
                      <p className="text-3xl font-extrabold text-blue-400 mt-0.5">
                        {(platform.subscribers || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Financial & Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                      <span className="text-xs text-slate-400">Weekly Gross Revenue</span>
                      <p className="text-xl font-bold text-emerald-400 mt-1">
                        ${(platform.weeklyGrossRevenue || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                      <span className="text-xs text-slate-400">Server & CDN Cost</span>
                      <p className="text-xl font-bold text-red-400 mt-1">
                        -${(platform.weeklyServerCost || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                      <span className="text-xs text-slate-400">Net Weekly Profit</span>
                      <p className="text-xl font-bold text-blue-400 mt-1">
                        ${(platform.weeklyNetProfit || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                      <span className="text-xs text-slate-400">Weekly Churn Rate</span>
                      <p className="text-xl font-bold text-amber-400 mt-1">
                        {platform.churnRatePercent || 2.5}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tech & Configuration Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tech Upgrades */}
                  <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-bold text-white">Recommendation Algorithm & AI</h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      Machine learning content recommendations engage users and directly lower subscriber churn rates.
                    </p>

                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-2">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Algorithm Level</span>
                        <span className="text-blue-400 font-bold">Level {platform.recommendationTechLevel}/10</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${(platform.recommendationTechLevel / 10) * 100}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleUpgradeTech}
                      disabled={platform.recommendationTechLevel >= 10}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" /> Upgrade Algorithm (Cost: ${(nextUpgradeCost || 0).toLocaleString()})
                    </button>
                  </div>

                  {/* Pricing & Strategy Controls */}
                  <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-bold text-white">Pricing & Strategic Posture</h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      Calibrate subscription fees to balance subscriber growth velocity against revenue yield.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                          Monthly Fee ($)
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="2.99"
                          max="29.99"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                          Strategy
                        </label>
                        <select
                          value={editStrategy}
                          onChange={(e) => setEditStrategy(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                        >
                          <option value="PRESTIGE_FIRST">Prestige First</option>
                          <option value="BLOCKBUSTER_FOCUSED">Blockbuster Focused</option>
                          <option value="BUDGET_MASS_MARKET">Budget Mass Market</option>
                          <option value="NICHE_INDIE">Niche Indie</option>
                          <option value="BALANCED">Balanced</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateConfig}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      Save Configuration Updates
                    </button>
                  </div>
                </div>

                {/* Catalog List */}
                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="text-lg font-bold text-white">
                    Platform Content Catalog ({platform.catalog?.length || 0} Titles)
                  </h3>
                  {(!platform.catalog || platform.catalog.length === 0) ? (
                    <p className="text-xs text-slate-500 py-6 text-center">
                      No movies or TV series currently assigned. License titles from your studio library to expand catalog appeal!
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {platform.catalog.map((item) => (
                        <div key={item._id} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{item.title}</span>
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                                {item.contentType}
                              </span>
                              {item.isExclusive && (
                                <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                  EXCLUSIVE
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400 text-[11px]">Genre: {item.genre} | Quality: {item.qualityScore}/100</span>
                          </div>
                          <span className="text-slate-400">-${(item.weeklyLicensingCost || 0).toLocaleString()}/wk</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Market Tab */}
        {activeTab === "market" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Global Streaming Market Share & AI Competitors</h2>
              <p className="text-xs text-slate-400 mt-1">
                Comparative landscape showing global subscriber bases, pricing tiers, and algorithmic prestige.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allPlatforms.map((p) => (
                <div
                  key={p._id}
                  className={`p-5 rounded-2xl border ${
                    p.isPlayerPlatform
                      ? "bg-blue-950/30 border-blue-500/50"
                      : "bg-slate-950/60 border-slate-800"
                  } space-y-3`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {p.strategy?.replace(/_/g, " ")}
                      </span>
                      <h3 className="font-bold text-white text-base mt-0.5">{p.name}</h3>
                    </div>
                    {p.isPlayerPlatform && (
                      <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        YOUR STUDIO
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subscribers:</span>
                      <span className="text-white font-bold">{p.subscribers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Monthly Fee:</span>
                      <span className="text-emerald-400 font-semibold">${p.monthlySubscriptionPrice}/mo</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Algorithm Level:</span>
                      <span className="text-blue-400 font-semibold">Tier {p.recommendationTechLevel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
