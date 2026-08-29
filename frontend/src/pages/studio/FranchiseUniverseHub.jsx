import React, { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getStudioUniverses,
  getUniverseById,
  createUniverse,
  addCanonEntry,
  toggleHiatus,
} from "../../api/franchiseV2Api";
import {
  Globe,
  Layers,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Film,
  Tv,
  Plus,
  Play,
  Pause,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function FranchiseUniverseHub() {
  const [universes, setUniverses] = useState([]);
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [universeDetail, setUniverseDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // New Universe Modal / State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUniName, setNewUniName] = useState("");
  const [newUniTier, setNewUniTier] = useState("CINEMATIC_UNIVERSE");
  const [newUniDesc, setNewUniDesc] = useState("");

  // Add Canon Entry State
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [entryTitle, setEntryTitle] = useState("");
  const [entryType, setEntryType] = useState("MOVIE");
  const [narrativeType, setNarrativeType] = useState("SEQUEL");
  const [phaseNumber, setPhaseNumber] = useState(1);
  const [writerRetained, setWriterRetained] = useState(true);

  useEffect(() => {
    loadUniverses();
  }, []);

  const loadUniverses = async () => {
    try {
      setLoading(true);
      const res = await getStudioUniverses();
      if (res.success) {
        setUniverses(res.universes || []);
        if (res.universes?.length > 0) {
          selectUniverse(res.universes[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load universes", err);
    } finally {
      setLoading(false);
    }
  };

  const selectUniverse = async (id) => {
    try {
      const res = await getUniverseById(id);
      if (res.success) {
        setSelectedUniverse(res.universe);
        setUniverseDetail(res);
      }
    } catch (err) {
      console.error("Failed to load universe detail", err);
    }
  };

  const handleCreateUniverse = async (e) => {
    e.preventDefault();
    try {
      const res = await createUniverse({
        universeName: newUniName,
        tier: newUniTier,
        description: newUniDesc,
      });
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setShowCreateModal(false);
        setNewUniName("");
        setNewUniDesc("");
        await loadUniverses();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to create universe",
      });
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!selectedUniverse) return;

    try {
      const res = await addCanonEntry(selectedUniverse._id, {
        entryId: "650c1f1e1f1e1f1e1f1e1f1e",
        entryType,
        narrativeType,
        phase: Number(phaseNumber),
        leadWriterRetained: writerRetained,
      });
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setShowAddEntryModal(false);
        setEntryTitle("");
        await selectUniverse(selectedUniverse._id);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to add canon entry",
      });
    }
  };

  const handleToggleHiatus = async () => {
    if (!selectedUniverse) return;
    try {
      const res = await toggleHiatus(selectedUniverse._id);
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        await selectUniverse(selectedUniverse._id);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to toggle hiatus",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900 border border-purple-900/30 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Globe className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                V2 Cinematic Universe & Canon Continuity Hub
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Architect shared universes, branch sequels, prequels and spin-offs, preserve canon lore, and manage franchise fatigue.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-purple-950"
          >
            <Plus className="w-4 h-4" /> Create Cinematic Universe
          </button>
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

        {/* Universe Selector Tabs */}
        {universes.length > 0 && (
          <div className="flex border-b border-slate-800 gap-3 overflow-x-auto pb-2">
            {universes.map((u) => (
              <button
                key={u._id}
                onClick={() => selectUniverse(u._id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  selectedUniverse?._id === u._id
                    ? "bg-purple-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
                {u.universeName} ({u.tier})
              </button>
            ))}
          </div>
        )}

        {/* Selected Universe View */}
        {selectedUniverse ? (
          <div className="space-y-6">
            {/* Universe Telemetry Banner */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs px-3 py-0.5 rounded-full font-bold">
                      {selectedUniverse.tier}
                    </span>
                    {selectedUniverse.inHiatus && (
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-3 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Pause className="w-3 h-3" /> ON CREATIVE HIATUS
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
                    {selectedUniverse.universeName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedUniverse.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleHiatus}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      selectedUniverse.inHiatus
                        ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                        : "bg-amber-950/60 border-amber-500/50 text-amber-300"
                    }`}
                  >
                    {selectedUniverse.inHiatus ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    {selectedUniverse.inHiatus ? "Resume Production" : "Initiate Hiatus (Decay Fatigue)"}
                  </button>

                  <button
                    onClick={() => setShowAddEntryModal(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Canon Entry
                  </button>
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Lore Consistency</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">
                    {selectedUniverse.loreConsistencyScore}%
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Franchise Fatigue</span>
                  <p className="text-xl font-bold text-amber-400 mt-1">
                    {selectedUniverse.fatigueScore}%
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Universe Fanbase</span>
                  <p className="text-xl font-bold text-purple-400 mt-1">
                    {(selectedUniverse.fanbaseSize || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Box Office Synergy</span>
                  <p className="text-xl font-bold text-white mt-1">
                    {selectedUniverse.universeHypeMultiplier}x
                  </p>
                </div>
              </div>
            </div>

            {/* Canon Timeline Visualizer */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Chronological Canon Timeline ({selectedUniverse.canonTimeline?.length || 0} Entries)
                </h3>
              </div>

              {(!selectedUniverse.canonTimeline || selectedUniverse.canonTimeline.length === 0) ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  No canon releases registered yet. Click "Add Canon Entry" to connect your studio's films and television series!
                </p>
              ) : (
                <div className="relative pl-6 border-l-2 border-purple-800/40 space-y-6">
                  {selectedUniverse.canonTimeline.map((item, idx) => (
                    <div key={item._id || idx} className="relative group">
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-purple-600 border-4 border-slate-900" />
                      <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                              Phase {item.phase} • {item.narrativeType}
                            </span>
                            <h4 className="font-bold text-white text-base mt-0.5 flex items-center gap-2">
                              {item.entryType === "MOVIE" ? <Film size={16} className="text-blue-400" /> : <Tv size={16} className="text-indigo-400" />}
                              {item.title}
                            </h4>
                          </div>
                          <span className="text-xs font-semibold text-slate-400">
                            Week {item.releaseWeek}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-850">
                          <span>Quality: {item.qualityScore}/100</span>
                          <span className="text-emerald-400 font-medium">
                            {item.leadWriterRetained ? "Canon Compliant" : "Retcon Risk"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Globe className="w-12 h-12 text-purple-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Cinematic Universes Established</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Initialize a cinematic universe to interweave movie sequels, spin-offs, and TV show spin-offs with compounding box office bonuses.
            </p>
          </div>
        )}

        {/* Modal: Create Universe */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-lg font-bold text-white">Create New Cinematic Universe</h3>

              <form onSubmit={handleCreateUniverse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Universe Title
                  </label>
                  <input
                    type="text"
                    value={newUniName}
                    onChange={(e) => setNewUniName(e.target.value)}
                    placeholder="e.g. Chronicles of Eldoria Universe"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Scale & Tier
                  </label>
                  <select
                    value={newUniTier}
                    onChange={(e) => setNewUniTier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="STANDALONE_SERIES">Standalone Series</option>
                    <option value="TRILOGY">Trilogy Arc</option>
                    <option value="CINEMATIC_UNIVERSE">Cinematic Universe (Multi-Hero)</option>
                    <option value="MULTI_MEDIA_EMPIRE">Multi-Media Empire (Movies + TV)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Narrative Concept
                  </label>
                  <textarea
                    value={newUniDesc}
                    onChange={(e) => setNewUniDesc(e.target.value)}
                    placeholder="Overview of the lore, mythology, and shared characters..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                  >
                    Initialize Universe
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Canon Entry */}
        {showAddEntryModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-lg font-bold text-white">Add Entry to Canon Timeline</h3>

              <form onSubmit={handleAddEntry} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Medium
                    </label>
                    <select
                      value={entryType}
                      onChange={(e) => setEntryType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm"
                    >
                      <option value="MOVIE">Feature Film</option>
                      <option value="TV_SHOW">Television Series</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Narrative Type
                    </label>
                    <select
                      value={narrativeType}
                      onChange={(e) => setNarrativeType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm"
                    >
                      <option value="ORIGIN">Origin Story</option>
                      <option value="SEQUEL">Direct Sequel</option>
                      <option value="PREQUEL">Prequel</option>
                      <option value="SPIN_OFF">Character Spin-Off</option>
                      <option value="CROSSOVER_EVENT">Crossover Event (Massive Hype)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="writerCheck"
                    checked={writerRetained}
                    onChange={(e) => setWriterRetained(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-purple-600"
                  />
                  <label htmlFor="writerCheck" className="text-xs text-slate-300">
                    Retain Lead Screenwriter / Showrunner (Protects Lore Consistency)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEntryModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                  >
                    Record into Canon
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
