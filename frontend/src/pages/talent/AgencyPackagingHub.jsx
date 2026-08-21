import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const AgencyPackagingHub = () => {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/talent-agencies/agencies");
      if (res.data.success) {
        setAgencies(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load agency standings", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Talent Agency Executive Packaging</h1>
      <p className="text-gray-400 mb-6">Partner with Hollywood talent agencies to negotiate star-studded package deals.</p>

      {loading ? (
        <div className="text-gray-400">Loading agency relationship profiles...</div>
      ) : agencies.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-xl text-center border border-gray-700">
          <p className="text-gray-400">No active agency relationship history yet recorded.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agencies.map((a) => (
            <div key={a._id} className="bg-gray-800 p-5 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-white">{a.agencyName}</h3>
                <span className={`text-xs px-2.5 py-1 rounded font-bold ${a.tier === "PREFERRED" ? "bg-purple-900 text-purple-300" : "bg-gray-700 text-gray-300"}`}>
                  {a.tier}
                </span>
              </div>
              <div className="text-sm space-y-1 text-gray-300">
                <p>Relationship Score: <span className="text-indigo-400 font-semibold">{a.relationshipScore} / 100</span></p>
                <p>Packages Executed: <span className="text-green-400 font-semibold">{a.packagedDealsCount}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgencyPackagingHub;
