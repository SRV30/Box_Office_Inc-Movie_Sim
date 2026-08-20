import { useState, useEffect } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { AlertTriangle, ShieldCheck, DollarSign, Radio, Scale, MessageSquare, Megaphone } from "lucide-react";

const severityColor = (severity) => {
  switch (severity) {
    case "CRITICAL":
      return "bg-rose-950/80 border-rose-600 text-rose-300";
    case "HIGH":
      return "bg-orange-950/80 border-orange-600 text-orange-300";
    case "MEDIUM":
      return "bg-amber-950/80 border-amber-600 text-amber-300";
    default:
      return "bg-slate-800 border-slate-700 text-slate-300";
  }
};

const PRCrisisCenter = () => {
  const [crises, setCrises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    fetchCrises();
  }, []);

  const fetchCrises = async () => {
    try {
      setLoading(true);
      const res = await api.get("/crisis/active");
      if (res.data?.success) {
        setCrises(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load PR crises", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (crisisId, strategy) => {
    try {
      setResolvingId(crisisId);
      const res = await api.post("/crisis/resolve", { crisisId, strategy });
      if (res.data?.success) {
        setMessage(res.data.message || `Crisis successfully addressed using ${strategy.replace(/_/g, " ")}`);
        await fetchCrises();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to resolve crisis.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <AlertTriangle className="text-rose-500" size={36} /> PR Crisis Command Center
            </h1>
            <p className="text-slate-400 mt-2">
              Manage studio scandals, media controversies, and reputation damage control.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            Active Incidents: {crises.length}
          </div>
        </div>

        {message && (
          <div className="p-4 bg-violet-950/60 border border-violet-700/60 rounded-2xl text-violet-200 text-sm flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="text-violet-400 hover:text-white font-bold text-xs ml-4">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh] text-slate-400 font-bold">
            Scanning studio public relations feeds...
          </div>
        ) : crises.length === 0 ? (
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <ShieldCheck className="mx-auto text-emerald-400" size={54} />
            <h2 className="text-2xl font-bold text-white">Spotless Public Standing</h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm">
              There are no active studio scandals or media controversies reported. Your press sentiment is secure.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {crises.map((c) => (
              <div
                key={c._id}
                className="bg-[#111827] border border-slate-800 hover:border-slate-700 transition rounded-3xl p-6 space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{c.title}</h3>
                    <p className="text-slate-400 text-sm mt-1">{c.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${severityColor(c.severity)}`}>
                    {c.severity} Severity
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1 font-semibold">Weekly Reputation Decay</span>
                    <span className="text-lg font-black text-rose-400">-{c.reputationDamagePerWeek || 5} pts / wk</span>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1 font-semibold">Incident Status</span>
                    <span className="text-lg font-black text-amber-400">{c.status}</span>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 sm:col-span-2 md:col-span-1">
                    <span className="text-xs text-slate-400 block mb-1 font-semibold">Incident Escalation</span>
                    <span className="text-lg font-black text-indigo-400">Action Required</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Deploy Crisis Mitigation Strategy
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      disabled={resolvingId === c._id}
                      onClick={() => handleResolve(c._id, "PUBLIC_APOLOGY")}
                      className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl text-left transition flex flex-col justify-between group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-200 group-hover:text-white">
                        <MessageSquare size={16} className="text-blue-400" /> Public Apology
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold mt-2">Cost: ₹50,000 (50% relief)</span>
                    </button>

                    <button
                      disabled={resolvingId === c._id}
                      onClick={() => handleResolve(c._id, "PRESS_TOUR")}
                      className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl text-left transition flex flex-col justify-between group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-200 group-hover:text-white">
                        <Megaphone size={16} className="text-violet-400" /> Press Tour
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold mt-2">Cost: ₹100,000 (70% relief)</span>
                    </button>

                    <button
                      disabled={resolvingId === c._id}
                      onClick={() => handleResolve(c._id, "SETTLEMENT_PAYOUT")}
                      className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl text-left transition flex flex-col justify-between group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-200 group-hover:text-white">
                        <DollarSign size={16} className="text-amber-400" /> Settlement Payout
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold mt-2">Cost: ₹250,000 (90% relief)</span>
                    </button>

                    <button
                      disabled={resolvingId === c._id}
                      onClick={() => handleResolve(c._id, "LEGAL_ACTION")}
                      className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl text-left transition flex flex-col justify-between group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-200 group-hover:text-white">
                        <Scale size={16} className="text-rose-400" /> Legal Action
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold mt-2">Cost: ₹500,000 (95% relief)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PRCrisisCenter;
