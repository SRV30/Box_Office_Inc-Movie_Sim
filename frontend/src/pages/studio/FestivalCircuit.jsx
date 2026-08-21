import { useState, useEffect } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Award, Film, Plus, Sparkles, DollarSign, Star, Trophy, Trash2, CheckCircle2 } from "lucide-react";

const FESTIVAL_ROSTER = [
  { name: "CANNES", label: "Cannes Film Festival", fee: 500000, prestige: "A-List International", reward: "Palme d'Or / Grand Prix" },
  { name: "VENICE", label: "Venice International Film Festival", fee: 400000, prestige: "A-List International", reward: "Golden Lion" },
  { name: "TIFF", label: "Toronto International Film Festival", fee: 300000, prestige: "Major Audience Catalyst", reward: "People's Choice Award" },
  { name: "SUNDANCE", label: "Sundance Film Festival", fee: 250000, prestige: "Indie Premiere Hub", reward: "Grand Jury Prize" },
];

const FestivalCircuit = () => {
  const [submissions, setSubmissions] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedFestival, setSelectedFestival] = useState("CANNES");
  const [actionMessage, setActionMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubmissionsAndMovies = async () => {
    try {
      setLoading(true);
      const [subsRes, moviesRes] = await Promise.allSettled([
        api.get("/festivals/active"),
        api.get("/movies/studio"),
      ]);

      if (subsRes.status === "fulfilled" && subsRes.value.data?.success) {
        setSubmissions(subsRes.value.data.data || []);
      }
      if (moviesRes.status === "fulfilled" && moviesRes.value.data?.data) {
        setMovies(moviesRes.value.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load festival circuit data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionsAndMovies();
  }, []);

  const handleSubmitToFestival = async (e) => {
    e.preventDefault();
    if (!selectedMovieId) return;

    try {
      setIsSubmitting(true);
      const res = await api.post("/festivals/submit", {
        movieId: selectedMovieId,
        festivalName: selectedFestival,
      });

      if (res.data?.success) {
        const sub = res.data.data;
        setActionMessage(
          `Entry screened at ${sub.festivalName}! Jury Result: ${sub.status} (Jury Score: ${sub.juryScore}/100) ${
            sub.awardWon !== "NONE" ? `• Award: ${sub.awardWon}` : ""
          }`
        );
        setShowModal(false);
        setSelectedMovieId("");
        await fetchSubmissionsAndMovies();
      }
    } catch (err) {
      setActionMessage(err.response?.data?.message || "Failed to submit film to festival.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (submissionId) => {
    try {
      const res = await api.post("/festivals/withdraw", { submissionId });
      if (res.data?.success) {
        setActionMessage("Festival submission successfully withdrawn.");
        await fetchSubmissionsAndMovies();
      }
    } catch (err) {
      setActionMessage(err.response?.data?.message || "Failed to withdraw submission.");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Award className="text-amber-400" size={36} /> Film Festival & Prestige Circuit
            </h1>
            <p className="text-slate-400 mt-2">
              Enter premiere films into Cannes, Venice, TIFF, and Sundance to win awards and unlock distributor acquisitions.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="py-3 px-5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-amber-900/30 transition"
          >
            <Plus size={18} /> Submit Film Entry
          </button>
        </div>

        {actionMessage && (
          <div className="p-4 bg-amber-950/60 border border-amber-700/60 rounded-2xl text-amber-200 text-sm flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage("")} className="text-amber-400 hover:text-white font-bold text-xs ml-4">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh] text-slate-400 font-bold">
            Scanning festival jury results and premiere selections...
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <Trophy className="mx-auto text-amber-400" size={54} />
            <h2 className="text-2xl font-bold text-white">No Festival Submissions On Record</h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm">
              Your studio has not submitted any projects to international festival circuits yet. Submitting critically acclaimed films unlocks major distributor acquisition offers and critic hype bonuses.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs inline-flex items-center gap-2"
            >
              <Plus size={16} /> Enter Festival Circuit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {submissions.map((sub) => (
              <div
                key={sub._id}
                className="bg-[#111827] border border-slate-800 hover:border-slate-700 transition rounded-3xl p-6 space-y-5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-amber-400" size={18} /> {sub.festivalName}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Entry: <span className="text-slate-200 font-bold">{sub.movieId?.title || "Studio Feature"}</span>
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      sub.status === "AWARDED"
                        ? "bg-amber-950 text-amber-300 border border-amber-700"
                        : sub.status === "ACCEPTED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Jury Score</span>
                    <span className="text-base font-black text-amber-400">{sub.juryScore}/100</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Award Accolade</span>
                    <span className="text-base font-black text-indigo-400">{sub.awardWon?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] text-slate-400 block font-semibold">Distributor Acquisition Offer</span>
                    <span className="text-base font-black text-emerald-400">
                      {sub.marketDistributionOffer > 0
                        ? `₹${(sub.marketDistributionOffer / 100000).toFixed(1)} Lakhs`
                        : "No Acquisition Offer"}
                    </span>
                  </div>
                </div>

                {sub.status === "SUBMITTED" && (
                  <button
                    onClick={() => handleWithdraw(sub._id)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} /> Withdraw Festival Entry
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submission Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Award className="text-amber-400" size={24} /> Festival Entry Submission
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitToFestival} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Select Film to Enter
                  </label>
                  <select
                    value={selectedMovieId}
                    onChange={(e) => setSelectedMovieId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    required
                  >
                    <option value="">-- Choose a Film --</option>
                    {movies.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Target Film Festival Circuit
                  </label>
                  <select
                    value={selectedFestival}
                    onChange={(e) => setSelectedFestival(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    {FESTIVAL_ROSTER.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.label} (Fee: ₹{(f.fee / 100000).toFixed(1)}L)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedMovieId}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit to Jury"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FestivalCircuit;

