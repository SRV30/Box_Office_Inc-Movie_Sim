import { useState, useEffect } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { FileText, Plus, CheckCircle, XCircle, RefreshCw, IndianRupee, ShieldAlert, Clock } from "lucide-react";

const TalentContractsManager = () => {
  const [contracts, setContracts] = useState([]);
  const [actors, setActors] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [writers, setWriters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [showRenegotiateModal, setShowRenegotiateModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [formData, setFormData] = useState({
    talentId: "",
    talentType: "ACTOR",
    baseSalary: 200000,
    backendPoints: 5,
    movieCount: 1,
  });
  const [renegotiateOffer, setRenegotiateOffer] = useState({
    baseSalary: 250000,
    backendPoints: 8,
    movieCount: 2,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContractsAndTalent();
  }, []);

  const fetchContractsAndTalent = async () => {
    try {
      setLoading(true);
      setError(null);
      const [contractsRes, actorsRes, directorsRes, writersRes] = await Promise.all([
        api.get("/contracts"),
        api.get("/actors"),
        api.get("/directors"),
        api.get("/writers"),
      ]);

      if (contractsRes.data?.success) {
        setContracts(contractsRes.data.data || []);
      }
      if (actorsRes.data?.actors) setActors(actorsRes.data.actors || []);
      if (directorsRes.data?.directors) setDirectors(directorsRes.data.directors || []);
      if (writersRes.data?.writers) setWriters(writersRes.data.writers || []);
    } catch (err) {
      console.error("Failed to load talent contracts:", err);
      setError("Unable to load talent contract records.");
    } finally {
      setLoading(false);
    }
  };

  const handleNegotiateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        talentId: formData.talentId,
        talentType: formData.talentType,
        offer: {
          baseSalary: Number(formData.baseSalary),
          backendPoints: Number(formData.backendPoints),
          movieCount: Number(formData.movieCount),
        },
      };

      const res = await api.post("/contracts/negotiate", payload);
      if (res.data?.success) {
        setShowNegotiateModal(false);
        setFormData({ talentId: "", talentType: "ACTOR", baseSalary: 200000, backendPoints: 5, movieCount: 1 });
        fetchContractsAndTalent();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to negotiate contract");
    }
  };

  const handleAcceptContract = async (talentId) => {
    try {
      const res = await api.post("/contracts/accept", { talentId });
      if (res.data?.success) {
        fetchContractsAndTalent();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to finalize contract");
    }
  };

  const handleBuyoutContract = async (contractId) => {
    if (!window.confirm("Are you sure you want to buy out this contract? Buyout penalty fee will be charged to your studio balance.")) {
      return;
    }
    try {
      const res = await api.post("/contracts/buyout", { contractId });
      if (res.data?.success) {
        alert(`Contract terminated. Penalty paid: ₹${(res.data.data.penaltyPaid / 1_000_000).toFixed(2)}M`);
        fetchContractsAndTalent();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to buyout contract");
    }
  };

  const handleRenegotiateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContract) return;

    try {
      const res = await api.post("/contracts/renegotiate", {
        contractId: selectedContract._id || selectedContract.talentId,
        newOffer: {
          baseSalary: Number(renegotiateOffer.baseSalary),
          backendPoints: Number(renegotiateOffer.backendPoints),
          movieCount: Number(renegotiateOffer.movieCount),
        },
      });

      if (res.data?.success) {
        setShowRenegotiateModal(false);
        setSelectedContract(null);
        fetchContractsAndTalent();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to renegotiate contract");
    }
  };

  const talentOptions = formData.talentType === "ACTOR"
    ? actors
    : formData.talentType === "DIRECTOR"
    ? directors
    : writers;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <FileText className="text-purple-400" size={36} /> Talent Contract Negotiations
            </h1>
            <p className="text-slate-400 mt-2">
              Manage multi-picture talent contracts, negotiate backend points, execute buyouts, and renegotiate terms.
            </p>
          </div>

          <button
            onClick={() => setShowNegotiateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg cursor-pointer transition-all"
          >
            <Plus size={20} /> Propose New Contract
          </button>
        </div>

        {/* Modal: Propose Contract */}
        {showNegotiateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[#111827] border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText size={24} className="text-purple-400" /> Offer Talent Contract
                </h3>
                <button onClick={() => setShowNegotiateModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
              </div>

              <form onSubmit={handleNegotiateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Talent Type</label>
                  <select
                    value={formData.talentType}
                    onChange={(e) => setFormData({ ...formData, talentType: e.target.value, talentId: "" })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="ACTOR">Actor</option>
                    <option value="DIRECTOR">Director</option>
                    <option value="WRITER">Writer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Select Talent</label>
                  <select
                    value={formData.talentId}
                    onChange={(e) => setFormData({ ...formData, talentId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="">-- Choose Talent --</option>
                    {talentOptions.map((t) => (
                      <option key={t.id || t._id} value={t.id || t._id}>
                        {t.name} (Salary: ₹{((t.salary || 0) / 1000).toFixed(0)}k)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Base Salary (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Backend Points (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={25}
                      value={formData.backendPoints}
                      onChange={(e) => setFormData({ ...formData, backendPoints: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Movie Count (Multi-picture Deal)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.movieCount}
                    onChange={(e) => setFormData({ ...formData, movieCount: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNegotiateModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition"
                  >
                    Send Offer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Renegotiate Contract */}
        {showRenegotiateModal && selectedContract && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[#111827] border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <RefreshCw size={24} className="text-amber-400" /> Renegotiate Terms
                </h3>
                <button onClick={() => setShowRenegotiateModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
              </div>

              <p className="text-xs text-slate-400">
                Talent: <span className="font-bold text-white">{selectedContract.talentName}</span> ({selectedContract.talentType})
              </p>

              <form onSubmit={handleRenegotiateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">New Base Salary (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={renegotiateOffer.baseSalary}
                      onChange={(e) => setRenegotiateOffer({ ...renegotiateOffer, baseSalary: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Backend Royalty (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={25}
                      value={renegotiateOffer.backendPoints}
                      onChange={(e) => setRenegotiateOffer({ ...renegotiateOffer, backendPoints: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRenegotiateModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contracts Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-purple-400" /> Pending & Active Contracts ({contracts.length})
          </h2>

          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse font-medium">
              Loading contract negotiations...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 bg-rose-950/20 border border-rose-900/50 rounded-2xl flex items-center justify-center gap-3">
              <ShieldAlert size={24} /> {error}
            </div>
          ) : contracts.length === 0 ? (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center">
              <FileText size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Contracts Under Negotiation</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                Lock in top-tier actors, visionary directors, and acclaimed screenwriters with multi-movie contracts.
              </p>
              <button
                onClick={() => setShowNegotiateModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl transition"
              >
                Propose Your First Contract
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contracts.map((c, idx) => (
                <div
                  key={c._id || idx}
                  className="bg-[#111827] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-white">{c.talentName || "Talent Deal"}</h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/40">
                          {c.talentType}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                          c.status === "ACCEPTED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : c.status === "RENEGOTIATED"
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 space-y-2 text-xs text-slate-300 my-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Base Salary:</span>
                        <span className="font-bold text-white flex items-center">
                          <IndianRupee size={12} /> {((c.offer?.baseSalary || 0) / 1000).toFixed(0)}k/wk
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Backend Royalty:</span>
                        <span className="font-bold text-emerald-400">{c.offer?.backendPoints || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Committed Movies:</span>
                        <span className="font-bold text-amber-400">{c.offer?.movieCount || 1} Films</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Patience Remaining:</span>
                        <span className="font-bold text-slate-300 flex items-center gap-1">
                          <Clock size={12} /> {c.patience || 0} Rounds
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    {c.status === "ACCEPTED" ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedContract(c);
                            setRenegotiateOffer({
                              baseSalary: c.offer?.baseSalary || 200000,
                              backendPoints: c.offer?.backendPoints || 5,
                              movieCount: c.offer?.movieCount || 1,
                            });
                            setShowRenegotiateModal(true);
                          }}
                          className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1"
                        >
                          <RefreshCw size={14} /> Renegotiate
                        </button>
                        <button
                          onClick={() => handleBuyoutContract(c._id || c.talentId)}
                          className="bg-rose-950/40 hover:bg-rose-950/60 text-rose-400 border border-rose-800/50 text-xs font-bold px-3 py-2 rounded-xl transition"
                        >
                          Buyout
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleAcceptContract(c.talentId)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={14} /> Finalize Terms
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TalentContractsManager;
