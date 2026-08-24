import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Sparkles,
  Layers,
  DollarSign,
  Award,
  Lock,
  CheckCircle2,
  TrendingUp,
  Hammer,
  Shield,
  Zap,
  RefreshCw,
  Info,
  ChevronRight,
} from "lucide-react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";

const LOT_CONFIGS = [
  {
    type: "SOUNDSTAGE_COMPLEX",
    title: "Main Soundstage Complex",
    zone: "Production Zone A",
    icon: Building2,
    color: "from-blue-600/30 to-indigo-900/40 border-blue-500/40 text-blue-400",
    description: "Acoustically isolated soundstages with heavy rigging, gantry systems, and lighting grids.",
    baseCost: 500000,
    requiredLevel: 1,
    category: "PRODUCTION",
  },
  {
    type: "VFX_VIRTUAL_PRODUCTION_LED",
    title: "VFX & Virtual LED Stage",
    zone: "Technology Hub B",
    icon: Zap,
    color: "from-purple-600/30 to-violet-900/40 border-purple-500/40 text-purple-400",
    description: "State-of-the-art curved LED Volume wall with Unreal Engine real-time camera tracking.",
    baseCost: 1200000,
    requiredLevel: 2,
    category: "VFX_TECH",
  },
  {
    type: "POST_PRODUCTION_SUITE",
    title: "Dolby Atmos Post Suite",
    zone: "Creative District C",
    icon: Sparkles,
    color: "from-emerald-600/30 to-teal-900/40 border-emerald-500/40 text-emerald-400",
    description: "Precision HDR color-grading, editorial bays, and Dolby Atmos 9.1.4 immersive mixing suites.",
    baseCost: 350000,
    requiredLevel: 1,
    category: "POST_PROD",
  },
  {
    type: "BACKLOT_SET",
    title: "Permanent Backlot City Sets",
    zone: "Exterior District D",
    icon: Layers,
    color: "from-amber-600/30 to-orange-900/40 border-amber-500/40 text-amber-400",
    description: "Permanent modular streetscapes, European squares, and futuristic alleys.",
    baseCost: 450000,
    requiredLevel: 2,
    category: "SETS",
  },
];

const EXPANSION_SLOTS = [
  { id: "EXP_1", title: "Lot Expansion Slot 1", requiredLevel: 3, requiredPrestige: 40, cost: 2000000 },
  { id: "EXP_2", title: "Mega-Stage Expansion Slot 2", requiredLevel: 4, requiredPrestige: 75, cost: 5000000 },
  { id: "EXP_3", title: "Studio Executive Tower Lot", requiredLevel: 5, requiredPrestige: 100, cost: 10000000 },
];

const StudioHQ = () => {
  const [studio, setStudio] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [upgrades, setUpgrades] = useState([]);
  const [selectedLot, setSelectedLot] = useState(LOT_CONFIGS[0]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchHQData = useCallback(async () => {
    try {
      setLoading(true);
      const [studioRes, facRes, upgRes] = await Promise.allSettled([
        api.get("/studios/profile"),
        api.get("/facilities/list"),
        api.get("/upgrades"),
      ]);

      if (studioRes.status === "fulfilled") {
        setStudio(studioRes.value.data.studio || studioRes.value.data);
      }
      if (facRes.status === "fulfilled") {
        setFacilities(facRes.value.data.data || []);
      }
      if (upgRes.status === "fulfilled") {
        setUpgrades(upgRes.value.data.purchased || []);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Failed to load Studio HQ lot state." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHQData();
  }, [fetchHQData]);

  const getOwnedFacility = (type) => facilities.find((f) => f.facilityType === type);

  const handleBuildOrUpgrade = async (facilityType) => {
    try {
      setActionBusy(true);
      setFeedback({ type: "", message: "" });
      const res = await api.post("/facilities/build", { facilityType });
      if (res.data?.success) {
        setFeedback({ type: "success", message: res.data.message || "Facility commissioned successfully!" });
        await fetchHQData();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to upgrade facility.",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleToggleRental = async (facilityId, currentRented) => {
    try {
      setActionBusy(true);
      setFeedback({ type: "", message: "" });
      const res = await api.post("/facilities/rental", {
        facilityId,
        isRentedToThirdParty: !currentRented,
      });
      if (res.data?.success) {
        setFeedback({ type: "success", message: res.data.message || "Rental state updated." });
        await fetchHQData();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to update rental status.",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const studioLevel = Number(studio?.studioLevel || 1);
  const studioPrestige = Number(studio?.prestige || 0);
  const studioMoney = Number(studio?.money || 0);

  // Financial aggregation
  const totalWeeklyMaintenance = facilities.reduce((sum, f) => sum + (f.maintenanceCostPerWeek || 0), 0);
  const totalWeeklyRentalIncome = facilities
    .filter((f) => f.isRentedToThirdParty)
    .reduce((sum, f) => sum + (f.rentalIncomePerWeek || 0), 0);
  const netWeeklyRealEstate = totalWeeklyRentalIncome - totalWeeklyMaintenance;

  const currentOwnedSelected = selectedLot ? getOwnedFacility(selectedLot.type) : null;
  const isSelectedLocked = selectedLot && studioLevel < selectedLot.requiredLevel;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <Building2 className="text-emerald-400" size={36} /> Studio Headquarters & Lot Builder
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Expand your studio campus, construct high-tech production facilities, and lease real estate.
            </p>
          </div>

          <button
            onClick={fetchHQData}
            disabled={loading || actionBusy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh HQ
          </button>
        </div>

        {feedback.message && (
          <div
            className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            <Info size={18} />
            {feedback.message}
          </div>
        )}

        {/* Studio Top Progression Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
            <p className="text-xs text-slate-400 uppercase font-semibold">Studio Level</p>
            <p className="mt-2 text-2xl font-bold text-white">Tier {studioLevel} Studio</p>
            <p className="mt-1 text-xs text-slate-500">Unlocks advanced expansion lots</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
            <p className="text-xs text-slate-400 uppercase font-semibold">Prestige Standing</p>
            <p className="mt-2 text-2xl font-bold text-amber-400">{studioPrestige} Prestige</p>
            <p className="mt-1 text-xs text-slate-500">Industry reputation & award standing</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
            <p className="text-xs text-slate-400 uppercase font-semibold">Active Facilities</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {facilities.length} / {LOT_CONFIGS.length} Built
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {facilities.filter((f) => f.isRentedToThirdParty).length} currently leased
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
            <p className="text-xs text-slate-400 uppercase font-semibold">Net Weekly Real Estate</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                netWeeklyRealEstate >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              ₹{netWeeklyRealEstate.toLocaleString()}/wk
            </p>
            <p className="mt-1 text-xs text-slate-500">
              +₹{totalWeeklyRentalIncome.toLocaleString()} lease / -₹{totalWeeklyMaintenance.toLocaleString()} upkeep
            </p>
          </div>
        </div>

        {/* Visual Studio Lot Campus Map */}
        <div className="rounded-3xl border border-slate-800 bg-[#0e1422] p-6 lg:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="text-violet-400" /> Studio Lot Campus Map
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any campus zone to manage building construction, upgrades, and third-party rentals.
              </p>
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
              Campus Capacity: {facilities.length + EXPANSION_SLOTS.length} Lots
            </span>
          </div>

          {/* Isometric / Grid Interactive Campus Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {LOT_CONFIGS.map((lot) => {
              const owned = getOwnedFacility(lot.type);
              const isLocked = studioLevel < lot.requiredLevel;
              const isSelected = selectedLot?.type === lot.type;
              const IconComp = lot.icon;

              return (
                <button
                  key={lot.type}
                  onClick={() => setSelectedLot(lot)}
                  className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between h-56 relative overflow-hidden ${
                    isSelected
                      ? "border-violet-500 ring-2 ring-violet-500/30 bg-linear-to-br from-[#1a233a] to-[#111827] shadow-xl"
                      : "border-slate-800 bg-[#111827] hover:border-slate-700 hover:bg-[#141d2e]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {lot.zone}
                    </span>

                    {owned ? (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Tier {owned.tierLevel} Active
                      </span>
                    ) : isLocked ? (
                      <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock size={10} /> Req. Level {lot.requiredLevel}
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Available Lot
                      </span>
                    )}
                  </div>

                  <div className="my-auto py-2">
                    <div className={`p-3 rounded-xl w-fit mb-2 bg-linear-to-br ${lot.color} border`}>
                      <IconComp size={24} />
                    </div>
                    <h3 className="font-bold text-white text-base">{lot.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{lot.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 w-full text-slate-400">
                    {owned ? (
                      <span>
                        Boost: <strong className="text-emerald-400">+{owned.qualityBoost}%</strong>
                      </span>
                    ) : (
                      <span>
                        Cost: <strong className="text-white">₹{lot.baseCost.toLocaleString()}</strong>
                      </span>
                    )}
                    <span className="text-violet-400 font-semibold flex items-center gap-0.5">
                      Details <ChevronRight size={12} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Expansion Slots Row */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" /> Future Campus Expansion Slots
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXPANSION_SLOTS.map((slot) => {
                const isUnlocked =
                  studioLevel >= slot.requiredLevel && studioPrestige >= slot.requiredPrestige;

                return (
                  <div
                    key={slot.id}
                    className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-300 text-sm">{slot.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Req. Studio Level {slot.requiredLevel} • {slot.requiredPrestige} Prestige
                      </p>
                    </div>

                    {isUnlocked ? (
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold border border-emerald-500/30">
                        Unlocked Slot
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-800 text-slate-500 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                        <Lock size={12} /> Locked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Lot Control Panel */}
        {selectedLot && (
          <div className="rounded-3xl border border-slate-800 bg-[#111827] p-6 lg:p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl bg-linear-to-br ${selectedLot.color} border shrink-0`}>
                  {(() => {
                    const SelectedIcon = selectedLot.icon;
                    return <SelectedIcon size={32} />;
                  })()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-slate-400">{selectedLot.zone}</span>
                    {currentOwnedSelected && (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
                        Tier {currentOwnedSelected.tierLevel} Operational
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-1">{selectedLot.title}</h2>
                  <p className="text-slate-400 text-sm mt-1 max-w-2xl">{selectedLot.description}</p>
                </div>
              </div>

              {/* Actions Button */}
              <div className="flex flex-wrap gap-3">
                {currentOwnedSelected ? (
                  <>
                    <button
                      onClick={() =>
                        handleToggleRental(
                          currentOwnedSelected._id,
                          currentOwnedSelected.isRentedToThirdParty
                        )
                      }
                      disabled={actionBusy}
                      className={`px-5 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
                        currentOwnedSelected.isRentedToThirdParty
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                      }`}
                    >
                      {currentOwnedSelected.isRentedToThirdParty
                        ? "Recall to Studio (End Rental)"
                        : "Lease to 3rd Party (+₹" +
                          currentOwnedSelected.rentalIncomePerWeek.toLocaleString() +
                          "/wk)"}
                    </button>

                    {currentOwnedSelected.tierLevel < 5 && (
                      <button
                        onClick={() => handleBuildOrUpgrade(selectedLot.type)}
                        disabled={actionBusy || studioMoney < selectedLot.baseCost * (currentOwnedSelected.tierLevel + 1)}
                        className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Hammer size={16} /> Upgrade to Tier {currentOwnedSelected.tierLevel + 1} (₹
                        {(selectedLot.baseCost * (currentOwnedSelected.tierLevel + 1)).toLocaleString()})
                      </button>
                    )}
                  </>
                ) : isSelectedLocked ? (
                  <button
                    disabled
                    className="px-6 py-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-sm cursor-not-allowed flex items-center gap-2"
                  >
                    <Lock size={16} /> Requires Studio Level {selectedLot.requiredLevel}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuildOrUpgrade(selectedLot.type)}
                    disabled={actionBusy || studioMoney < selectedLot.baseCost}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Hammer size={16} /> Construct Facility (₹{selectedLot.baseCost.toLocaleString()})
                  </button>
                )}
              </div>
            </div>

            {/* Facility Detailed Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                <p className="text-xs text-slate-400">Quality Boost Effect</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  +{currentOwnedSelected?.qualityBoost || 5}% Film Quality
                </p>
                <p className="text-xs text-slate-500 mt-1">Applied to matching studio productions</p>
              </div>

              <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                <p className="text-xs text-slate-400">Weekly Maintenance Upkeep</p>
                <p className="text-xl font-bold text-red-400 mt-1">
                  -₹{(currentOwnedSelected?.maintenanceCostPerWeek || 10000).toLocaleString()}/wk
                </p>
                <p className="text-xs text-slate-500 mt-1">Deducted automatically during weekly ticks</p>
              </div>

              <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                <p className="text-xs text-slate-400">Third-Party Lease Valuation</p>
                <p className="text-xl font-bold text-green-400 mt-1">
                  +₹{(currentOwnedSelected?.rentalIncomePerWeek || 15000).toLocaleString()}/wk
                </p>
                <p className="text-xs text-slate-500 mt-1">Earned when leased out to external studios</p>
              </div>

              <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                <p className="text-xs text-slate-400">Operational Status</p>
                <p className="text-xl font-bold text-white mt-1">
                  {currentOwnedSelected
                    ? currentOwnedSelected.isRentedToThirdParty
                      ? "Leased Out (Revenue Active)"
                      : "In-House Active (Boost Active)"
                    : "Not Yet Built"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {currentOwnedSelected?.isRentedToThirdParty
                    ? "Producing weekly rental cashflow"
                    : "Providing quality boost to active movies"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudioHQ;
