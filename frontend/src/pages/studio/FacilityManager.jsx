import { useState, useEffect } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Building2, Plus, Sparkles, DollarSign, Layers, CheckCircle2, Shield } from "lucide-react";

const AVAILABLE_FACILITY_TYPES = [
  {
    type: "SOUNDSTAGE_COMPLEX",
    title: "Soundstage Complex",
    description: "Multi-acre production stages for large-scale sets, rigging, and controlled filming.",
    baseCost: 500000,
  },
  {
    type: "VFX_VIRTUAL_PRODUCTION_LED",
    title: "VFX & Virtual Production Stage",
    description: "Next-gen LED Volume wall with real-time in-camera visual effects rendering.",
    baseCost: 1200000,
  },
  {
    type: "POST_PRODUCTION_SUITE",
    title: "Post-Production Suite",
    description: "High-end Dolby Atmos audio mixing, color-grading, and editorial suites.",
    baseCost: 350000,
  },
  {
    type: "BACKLOT_SET",
    title: "Backlot Permanent Sets",
    description: "Historical streets, sci-fi alleys, and outdoor architecture available on-demand.",
    baseCost: 450000,
  },
];

const FacilityManager = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await api.get("/facilities/list");
      if (res.data?.success) {
        setFacilities(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load facilities", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildOrUpgrade = async (facilityType) => {
    try {
      setBusyId(facilityType);
      const res = await api.post("/facilities/build", { facilityType });
      if (res.data?.success) {
        setActionMessage(res.data.message || `Facility ${facilityType} upgraded successfully.`);
        await fetchFacilities();
      }
    } catch (err) {
      setActionMessage(err.response?.data?.message || "Failed to commission facility.");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleRental = async (facilityId, isRented) => {
    try {
      setBusyId(facilityId);
      const res = await api.post("/facilities/rental", {
        facilityId,
        isRentedToThirdParty: !isRented,
      });
      if (res.data?.success) {
        setActionMessage(res.data.message || "Third-party rental status updated.");
        await fetchFacilities();
      }
    } catch (err) {
      setActionMessage(err.response?.data?.message || "Failed to toggle rental status.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Building2 className="text-emerald-400" size={36} /> Studio Facilities & Real Estate
            </h1>
            <p className="text-slate-400 mt-2">
              Commission soundstages, LED virtual production volumes, and lease facilities for weekly income.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300">
            Constructed Assets: {facilities.length} / 4
          </div>
        </div>

        {actionMessage && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl text-emerald-200 text-sm flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage("")} className="text-emerald-400 hover:text-white font-bold text-xs ml-4">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh] text-slate-400 font-bold">
            Loading studio facility assets...
          </div>
        ) : (
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="text-amber-400" size={22} /> Production Infrastructure Roster
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {AVAILABLE_FACILITY_TYPES.map((fType) => {
                  const owned = facilities.find((f) => f.facilityType === fType.type);
                  const isCommissioning = busyId === fType.type || busyId === owned?._id;

                  return (
                    <div
                      key={fType.type}
                      className="bg-[#111827] border border-slate-800 hover:border-slate-700 transition rounded-3xl p-6 space-y-5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-white">{fType.title}</h3>
                          <p className="text-slate-400 text-sm mt-1">{fType.description}</p>
                        </div>
                        {owned ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                            <CheckCircle2 size={14} /> Tier {owned.tierLevel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Unbuilt
                          </span>
                        )}
                      </div>

                      {owned ? (
                        <div className="grid grid-cols-3 gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Quality Boost</span>
                            <span className="text-base font-black text-emerald-400">+{owned.qualityBoost} pts</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Weekly Cost</span>
                            <span className="text-base font-black text-rose-400">₹{(owned.maintenanceCostPerWeek / 1000).toFixed(0)}k</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-semibold">Rental Yield</span>
                            <span className="text-base font-black text-amber-400">₹{(owned.rentalIncomePerWeek / 1000).toFixed(0)}k/wk</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                          Initial Construction Cost: <span className="text-white font-bold">₹{(fType.baseCost / 100000).toFixed(1)} Lakhs</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          disabled={isCommissioning || owned?.tierLevel >= 5}
                          onClick={() => handleBuildOrUpgrade(fType.type)}
                          className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          {owned ? (owned.tierLevel >= 5 ? "Max Tier Reached" : `Upgrade Tier (T${owned.tierLevel + 1})`) : "Commission Build"}
                        </button>

                        {owned && (
                          <button
                            disabled={isCommissioning}
                            onClick={() => handleToggleRental(owned._id, owned.isRentedToThirdParty)}
                            className={`py-3 px-4 rounded-xl text-sm font-bold transition disabled:opacity-50 ${
                              owned.isRentedToThirdParty
                                ? "bg-amber-600/90 hover:bg-amber-500 text-white"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                            }`}
                          >
                            {owned.isRentedToThirdParty ? "End Lease (In-House)" : "Lease Out (Yield Mode)"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FacilityManager;
