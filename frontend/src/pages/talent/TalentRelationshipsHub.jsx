import { useState, useEffect } from "react";
import {
  Heart,
  Flame,
  GraduationCap,
  Sparkles,
  Users,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";

const RELATIONSHIP_ICONS = {
  FRIENDSHIP: { icon: Users, color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800/40", label: "Friendship" },
  ROMANTIC: { icon: Heart, color: "text-pink-400", bg: "bg-pink-950/40 border-pink-800/40", label: "Romantic" },
  MENTORSHIP: { icon: GraduationCap, color: "text-indigo-400", bg: "bg-indigo-950/40 border-indigo-800/40", label: "Mentorship" },
  RIVALRY: { icon: Flame, color: "text-amber-400", bg: "bg-amber-950/40 border-amber-800/40", label: "Rivalry" },
  BREAKUP: { icon: ShieldAlert, color: "text-rose-400", bg: "bg-rose-950/40 border-rose-800/40", label: "Breakup / Exes" },
  NEUTRAL: { icon: Sparkles, color: "text-slate-400", bg: "bg-slate-900 border-slate-800", label: "Neutral" },
};

const TalentRelationshipsHub = () => {
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [error, setError] = useState(null);

  // Chemistry testing sandbox
  const [candidateLead, setCandidateLead] = useState("");
  const [candidateSupporting, setCandidateSupporting] = useState("");
  const [chemistryResult, setChemistryResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const url = filterType === "ALL" ? "/relationships" : `/relationships?type=${filterType}`;
      const res = await api.get(url);
      setRelationships(res.data.relationships || []);
      setError(null);
    } catch {
      setError("Failed to fetch talent relationships.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [filterType]);

  const handleEvaluateChemistry = async (e) => {
    e.preventDefault();
    if (!candidateLead.trim()) return;

    try {
      setEvaluating(true);
      const res = await api.post("/relationships/cast-chemistry", {
        leadActorId: candidateLead.trim(),
        supportingActorIds: candidateSupporting
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setChemistryResult(res.data);
    } catch {
      setError("Failed to evaluate cast chemistry.");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="text-white fill-white/20" size={36} />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                Talent Chemistry & Relationship Engine
              </h1>
            </div>
            <p className="text-pink-100 text-sm sm:text-base max-w-2xl">
              Manage actor friendships, rivalries, romances, mentorships, and breakups. Chemistry modifiers directly alter movie quality, on-set conflict risks, and audience box-office intrigue.
            </p>
          </div>
        </div>

        {/* Cast Chemistry Simulator Widget */}
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-pink-400" size={20} />
            <h2 className="text-lg font-bold text-white">Casting Chemistry Diagnostic Tool</h2>
          </div>
          <form onSubmit={handleEvaluateChemistry} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Lead Actor ID / Name
              </label>
              <input
                type="text"
                value={candidateLead}
                onChange={(e) => setCandidateLead(e.target.value)}
                placeholder="e.g. actor_101"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Supporting Actor IDs (comma-separated)
              </label>
              <input
                type="text"
                value={candidateSupporting}
                onChange={(e) => setCandidateSupporting(e.target.value)}
                placeholder="e.g. actor_102, actor_103"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={evaluating}
                className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2"
              >
                {evaluating ? <RefreshCw className="animate-spin" size={16} /> : <TrendingUp size={16} />}
                Test Cast Synergy
              </button>
            </div>
          </form>

          {chemistryResult && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-[#111827] rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Net Chemistry Boost</span>
                  <p className={`text-lg font-black ${chemistryResult.netChemistryBonus >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {chemistryResult.netChemistryBonus > 0 ? `+${chemistryResult.netChemistryBonus}%` : `${chemistryResult.netChemistryBonus}%`}
                  </p>
                </div>
                <div className="p-3 bg-[#111827] rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Audience Intrigue</span>
                  <p className="text-lg font-black text-amber-400">
                    +{(chemistryResult.netAudienceBonus * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-3 bg-[#111827] rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Synergy Pairs</span>
                  <p className="text-lg font-black text-pink-400">
                    {chemistryResult.synergies?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-[#111827] rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Conflict Risks</span>
                  <p className="text-lg font-black text-rose-400">
                    {chemistryResult.conflicts?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["ALL", "ROMANTIC", "FRIENDSHIP", "MENTORSHIP", "RIVALRY", "BREAKUP"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition whitespace-nowrap ${
                filterType === type
                  ? "bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/30"
                  : "bg-[#111827] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
            >
              {type === "ALL" ? "All Dynamics" : RELATIONSHIP_ICONS[type]?.label || type}
            </button>
          ))}
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="animate-spin text-pink-500 mx-auto" size={32} />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center text-red-400 font-semibold">
            {error}
          </div>
        )}

        {/* Relationship Grid */}
        {!loading && !error && relationships.length === 0 && (
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-12 text-center">
            <Heart className="text-slate-600 mx-auto mb-4" size={48} />
            <p className="text-slate-400 text-lg font-bold">No active relationships recorded yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Cast actors together in productions or collaborate on scripts to dynamically form chemistry networks.
            </p>
          </div>
        )}

        {!loading && !error && relationships.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relationships.map((rel) => {
              const meta = RELATIONSHIP_ICONS[rel.type] || RELATIONSHIP_ICONS.NEUTRAL;
              const Icon = meta.icon;
              return (
                <div
                  key={rel._id}
                  className="bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${meta.bg} ${meta.color}`}
                      >
                        <Icon size={13} />
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        Strength: {rel.strength}%
                      </span>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 mb-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">
                          {rel.talentAName || rel.talentAId}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-slate-600 mx-2 shrink-0" />
                      <div className="min-w-0 flex-1 text-right">
                        <p className="text-sm font-bold text-white truncate">
                          {rel.talentBName || rel.talentBId}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] block uppercase font-semibold">Quality Effect</span>
                        <span className={`font-black ${rel.chemistryModifier >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {rel.chemistryModifier > 0 ? `+${rel.chemistryModifier}%` : `${rel.chemistryModifier}%`}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] block uppercase font-semibold">Audience Appeal</span>
                        <span className="font-black text-amber-400">
                          +{(rel.audienceInterestModifier * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Collabs: {rel.coStarMoviesCount || 0} movies</span>
                    <span>Week {rel.lastCollaboratedWeek || 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TalentRelationshipsHub;
