import React, { useState, useEffect } from "react";
import api from "../../api/apiClient";

const TerritoryLicensingPanel = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await api.get("/territories/deals");
      if (res.data.success) {
        setDeals(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch territory deals", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">International Territory Distribution</h1>
      <p className="text-gray-400 mb-6">Manage international theatrical distribution agreements and regional minimum guarantees.</p>

      {loading ? (
        <div className="text-gray-400">Loading territory licensing contracts...</div>
      ) : deals.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-xl text-center border border-gray-700">
          <p className="text-gray-400">No international territory deals signed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map((d) => (
            <div key={d._id} className="bg-gray-800 p-5 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-white">{d.region.replace(/_/g, " ")}</h3>
                <span className="text-xs bg-blue-900 text-blue-300 font-bold px-2.5 py-1 rounded">
                  {d.dealType}
                </span>
              </div>
              <div className="text-sm space-y-1 text-gray-300">
                <p>Minimum Guarantee: <span className="text-green-400 font-semibold">${d.minimumGuaranteePayout?.toLocaleString()}</span></p>
                <p>Revenue Share: <span className="text-yellow-400 font-semibold">{d.revenueSharePercentage}%</span></p>
                <p>Dubbing & Subtitling: <span className="text-red-400 font-semibold">${d.dubbingSubtitlingCost?.toLocaleString()}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TerritoryLicensingPanel;
