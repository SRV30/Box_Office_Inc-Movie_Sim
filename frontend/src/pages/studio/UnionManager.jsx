import React, { useState, useEffect, useCallback } from "react";
import axios from "../../api/axios";
import { Scale, AlertTriangle } from "lucide-react";

const SETTLEMENT_FEE = 1500000;

const UnionManager = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get("/api/studios/union/status");
      setStatus(res.data.data || res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load union status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSettle = async () => {
    setSettling(true);
    try {
      setError(null);
      await axios.post("/api/studios/union/settle");
      await fetchStatus();
      setShowConfirm(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to settle the strike.");
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-400">Loading union status...</div>;
  }

  const isStriking = status?.isStriking;
  const satisfaction = status?.satisfaction ?? status?.crewSatisfaction ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Scale className="w-7 h-7 text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">Crew Union</h1>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {isStriking ? (
        <div className="bg-slate-900 border border-red-700 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-red-300">
                Crew union is on strike — productions halted
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Crew satisfaction fell below the threshold and the union has
                declared a strike. All active productions are paused until
                the strike is settled.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Settle Strike (₹{SETTLEMENT_FEE.toLocaleString("en-IN")})
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-300">
            No active strike. Crew satisfaction is currently{" "}
            <span className="font-semibold text-white">{satisfaction}%</span>.
          </p>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold text-white">Confirm Settlement</h3>
            <p className="text-sm text-slate-300">
              This will deduct ₹{SETTLEMENT_FEE.toLocaleString("en-IN")} from
              your studio's cash balance and resume all halted productions.
              Are you sure?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={settling}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSettle}
                disabled={settling}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium disabled:opacity-50"
              >
                {settling ? "Settling..." : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnionManager;
