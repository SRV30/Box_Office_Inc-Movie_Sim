import React, { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getStudioScandals,
  getAvailableStrategies,
  respondToScandal,
  triggerScandal,
} from "../../api/scandalApi";
import {
  AlertOctagon,
  ShieldAlert,
  TrendingDown,
  Flame,
  Radio,
  FileText,
  UserX,
  CheckCircle2,
  DollarSign,
  History,
  Sparkles,
} from "lucide-react";

export default function CelebrityScandalHub() {
  const [scandals, setScandals] = useState([]);
  const [strategies, setStrategies] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [feedback, setFeedback] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Form for simulated manual incident
  const [simTalentName, setSimTalentName] = useState("");
  const [simType, setSimType] = useState("DRUG_USE");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scandalsRes, strategiesRes] = await Promise.all([
        getStudioScandals(),
        getAvailableStrategies(),
      ]);
      if (scandalsRes.success) setScandals(scandalsRes.data || []);
      if (strategiesRes.success) setStrategies(strategiesRes.data || {});
    } catch (err) {
      console.error("Failed to load scandals", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (scandalId, strategyKey) => {
    try {
      setProcessingId(scandalId);
      const res = await respondToScandal(scandalId, strategyKey);
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to execute PR strategy",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSimulateScandal = async (e) => {
    e.preventDefault();
    if (!simTalentName.trim()) return;

    try {
      const res = await triggerScandal({
        talentId: "650c1f1e1f1e1f1e1f1e1f1e",
        talentName: simTalentName,
        talentRole: "Actor",
        scandalType: simType,
      });
      if (res.success) {
        setFeedback({
          type: "success",
          text: `Breaking News: ${simTalentName} embroiled in ${simType.replace(/_/g, " ")} scandal!`,
        });
        setSimTalentName("");
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to simulate scandal",
      });
    }
  };

  const activeScandals = scandals.filter((s) => s.status === "ACTIVE" || s.status === "CONTAINED");
  const resolvedScandals = scandals.filter((s) => s.status === "RESOLVED" || s.status === "RECOVERED");

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-red-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Celebrity Scandal & Reputation Recovery Hub
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Manage crisis communications, suppress tabloid leaks, mitigate movie box office damage, and restore talent reputations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60 text-center">
              <span className="text-xs text-slate-400 uppercase font-semibold">Active Scandals</span>
              <p className="text-xl font-bold text-red-400">{activeScandals.length}</p>
            </div>
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60 text-center">
              <span className="text-xs text-slate-400 uppercase font-semibold">Repaired Reputations</span>
              <p className="text-xl font-bold text-emerald-400">{resolvedScandals.length}</p>
            </div>
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
            onClick={() => setActiveTab("active")}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "active"
                ? "border-red-500 text-red-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            Active Crises ({activeScandals.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "history"
                ? "border-red-500 text-red-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            Archived & Recovered ({resolvedScandals.length})
          </button>
          <button
            onClick={() => setActiveTab("simulate")}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "simulate"
                ? "border-red-500 text-red-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Radio className="w-4 h-4" />
            Simulate Media Incident
          </button>
        </div>

        {/* Tab 1: Active Scandals */}
        {activeTab === "active" && (
          <div className="space-y-6">
            {activeScandals.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">Clean Media Slate</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                  Your studio talent currently has zero active media scandals or damaging tabloid leaks.
                </p>
              </div>
            ) : (
              activeScandals.map((scandal) => (
                <div
                  key={scandal._id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getSeverityBadge(
                            scandal.severity
                          )}`}
                        >
                          {scandal.severity}
                        </span>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                          {scandal.evidenceStatus?.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                          {scandal.mediaExposure?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mt-1.5">
                        {scandal.talentName} ({scandal.talentRole}):{" "}
                        <span className="text-red-400">
                          {scandal.scandalType?.replace(/_/g, " ")}
                        </span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Public Outrage</span>
                        <div className="flex items-center gap-1.5 text-red-400 font-bold">
                          <Flame className="w-4 h-4" />
                          {scandal.publicOutrage}%
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Box Office Impact</span>
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                          <TrendingDown className="w-4 h-4" />
                          -{scandal.boxOfficeImpactPercent}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Outrage Intensity</span>
                        <span>{scandal.publicOutrage}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-red-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${scandal.publicOutrage}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Recovery Progress</span>
                        <span>{scandal.recoveryProgress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${scandal.recoveryProgress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* PR Strategies Execution Grid */}
                  <div>
                    <h4 className="text-xs uppercase font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Deploy PR & Legal Crisis Response
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(strategies).map(([key, strat]) => (
                        <button
                          key={key}
                          disabled={processingId === scandal._id}
                          onClick={() => handleRespond(scandal._id, key)}
                          className="p-3.5 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-red-500/50 rounded-xl text-left transition-all group disabled:opacity-50"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-sm text-white group-hover:text-red-300">
                              {strat.name}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1 text-amber-400 font-medium">
                              <DollarSign className="w-3.5 h-3.5" />
                              ${(strat.cost || 0).toLocaleString()}
                            </span>
                            <span className="text-emerald-400 font-medium">
                              -{strat.outrageReduction}% Outrage
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: History */}
        {activeTab === "history" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Scandal Archive & Vindication History</h3>
            {resolvedScandals.length === 0 ? (
              <p className="text-sm text-slate-400">No archived scandal records found.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {resolvedScandals.map((item) => (
                  <div key={item._id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          {item.status}
                        </span>
                        <h4 className="font-bold text-white text-base">
                          {item.talentName} - {item.scandalType?.replace(/_/g, " ")}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Resolved with {item.chosenPRStrategy?.replace(/_/g, " ") || "Natural Recovery"} after {item.weeksActive || 1} weeks. Total Crisis Outlay: ${(item.strategyCost || 0).toLocaleString()}
                      </p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Simulate Incident */}
        {activeTab === "simulate" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto space-y-4">
            <h3 className="text-lg font-bold text-white">Simulate Celebrity Scandal Incident</h3>
            <p className="text-sm text-slate-400">
              Trigger a test scandal to evaluate media exposure escalation and reputation recovery mechanics.
            </p>

            <form onSubmit={handleSimulateScandal} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Celebrity / Talent Name
                </label>
                <input
                  type="text"
                  value={simTalentName}
                  onChange={(e) => setSimTalentName(e.target.value)}
                  placeholder="e.g. Scarlett Sterling"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Scandal Type
                </label>
                <select
                  value={simType}
                  onChange={(e) => setSimType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="DRUG_USE">Drug Use Allegation</option>
                  <option value="AFFAIR">Romantic Affair Leaked</option>
                  <option value="ASSAULT_ALLEGATION">Assault Allegation (Critical)</option>
                  <option value="POLITICAL_CONTROVERSY">Political Controversy</option>
                  <option value="TAX_FRAUD">Tax Fraud Investigation</option>
                  <option value="LEAKED_VIDEOS">Leaked Confidential Videos</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-900/30"
              >
                Trigger Breaking Scandal
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
