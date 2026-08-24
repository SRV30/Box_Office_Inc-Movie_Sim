import { useState } from "react";
import { STANDARD_CONTRACT_WEEKS, getTotalSalary, getSigningFee } from "../../config/contract";

const rarityStyles = {
  Common: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  Uncommon: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  Rare: "bg-sky-500/20 text-sky-300 border border-sky-500/30",
  Epic: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
  Legendary: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
};

const cardStyles = {
  Common: "hover:border-slate-500",
  Uncommon: "hover:border-emerald-500",
  Rare: "hover:border-sky-500",
  Epic: "hover:border-violet-500",
  Legendary: "hover:border-amber-500",
};

const careerStageStyles = {
  EMERGING: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  ESTABLISHED: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  VETERAN: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  LEGACY: "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold shadow-xs",
};

const formatMoney = (amount) => Number(amount || 0).toLocaleString("en-IN");

const ActorCard = ({ actor, index, mode, onHire, onFire, contractWeeks = STANDARD_CONTRACT_WEEKS }) => {
  const avatar = `https://api.dicebear.com/7.x/personas/svg?seed=${actor.avatarSeed}`;
  const canRelease = actor.status === "AVAILABLE";
  const signingFee = getSigningFee(actor.salary);
  const [confirming, setConfirming] = useState(false);
  const hiddenStats = actor.statsRevealed === false || Number(actor.discovered || 0) < 50;
  const renderDiscoveredStat = (stat, formatter = (value) => value) =>
    hiddenStats || stat === null || stat === undefined ? "???" : formatter(stat);

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-br from-[#0f172a] via-[#111827] to-[#0b1120] p-6 transition-all duration-300 hover:-translate-y-1 ${cardStyles[actor.rarity]}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${rarityStyles[actor.rarity]}`}
        >
          {actor.rarity}
        </span>

        {actor.careerStage && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${
              careerStageStyles[actor.careerStage] || "bg-slate-700 text-slate-300"
            }`}
          >
            {actor.careerStageLabel || actor.careerStage}
          </span>
        )}

        <span className="text-xs text-slate-400">Age {Math.floor(Number(actor.age || 0))}</span>
      </div>

      <div className="flex flex-col items-center">
        <img
          src={avatar}
          alt={actor.name}
          className="h-24 w-24 rounded-full border border-slate-700 bg-slate-800"
        />

        <h2 className="mt-4 text-center text-xl font-bold text-white">{actor.name}</h2>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm text-slate-400">{actor.status}</p>
          {actor.stardomTierLabel && (
            <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-xs text-violet-300 font-medium">
              ★ {actor.stardomTierLabel}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Discovery {Math.min(100, Number(actor.discovered || 0))}%
        </p>
      </div>

      <div className="mt-5 space-y-2 text-slate-300">
        <div className="flex justify-between">
          <span>Popularity</span>
          <span>{actor.popularity}</span>
        </div>

        <div className="flex justify-between">
          <span>Acting Skill</span>
          <span>{renderDiscoveredStat(actor.actingSkill)}</span>
        </div>

        <div className="flex justify-between">
          <span>Reliability</span>
          <span>{renderDiscoveredStat(actor.reliability)}</span>
        </div>

        <div className="flex justify-between">
          <span>Fanbase</span>
          <span>{renderDiscoveredStat(actor.fanbase, formatMoney)}</span>
        </div>

        <div className="flex justify-between">
          <span>Morale</span>
          <span>{actor.morale}</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3 text-center">
        <div>
          <p className="text-lg font-bold text-white">{actor.movies || 0}</p>
          <p className="text-xs text-slate-500">Movies</p>
        </div>

        <div>
          <p className="text-lg font-bold text-green-400">{actor.hitMovies || 0}</p>
          <p className="text-xs text-slate-500">Hits</p>
        </div>

        <div>
          <p className="text-lg font-bold text-red-400">{actor.flopMovies || 0}</p>
          <p className="text-xs text-slate-500">Flops</p>
        </div>
      </div>

      <div className="mt-5 space-y-1">
        <p className="text-lg font-bold text-green-400">
          ₹{formatMoney(actor.salary)}
          <span className="ml-1 text-xs text-slate-400">/week</span>
        </p>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Contract Duration</span>
          <span>{contractWeeks} weeks</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Total Salary</span>
          <span className="font-semibold text-green-400">
            ₹{formatMoney(getTotalSalary(actor.salary, contractWeeks))}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Signing Fee</span>
          <span className="font-semibold text-violet-300">
            ₹{formatMoney(signingFee)} <span className="text-xs text-slate-500">one-time</span>
          </span>
        </div>
      </div>

      {mode === "market" &&
        (confirming ? (
          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-center">
              <p className="text-sm text-slate-300">One-time signing fee</p>
              <p className="text-lg font-bold text-violet-300">₹{formatMoney(signingFee)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setConfirming(false);
                  onHire(index);
                }}
                className="rounded-xl bg-violet-600 py-2.5 font-semibold text-white transition hover:bg-violet-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 py-2.5 font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="mt-4 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Hire Actor
          </button>
        ))}

      {mode === "owned" && (
        <div className="mt-4 space-y-2">
          {!canRelease && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              Assigned actors must finish or be replaced before release.
            </p>
          )}

          <button
            onClick={() => onFire(index)}
            disabled={!canRelease}
            className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            Release Actor
          </button>
        </div>
      )}
    </div>
  );
};

export default ActorCard;
