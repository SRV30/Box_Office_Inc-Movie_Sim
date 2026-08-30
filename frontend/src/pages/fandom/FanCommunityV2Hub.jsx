import React, { useState, useEffect } from "react";

export const FanCommunityV2Hub = ({ gameStateId }) => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameStateId) fetchCommunities();
  }, [gameStateId]);

  const fetchCommunities = async () => {
    try {
      const res = await fetch(`/api/v2/fandom/${gameStateId}`);
      const data = await res.json();
      if (data.success) {
        setCommunities(data.communities);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleReviewBomb = async (targetId, campaignType) => {
    try {
      const res = await fetch("/api/v2/fandom/review-bomb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameStateId,
          targetId,
          campaignType,
          triggerReason: "Controversial casting / plot twist",
        }),
      });
      const data = await res.json();
      if (data.success) fetchCommunities();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-pink-500/20 backdrop-blur-md">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 bg-clip-text text-transparent">
          🔥 Fan Communities, Theories & Review-Bombing Hub
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor fan clubs, community sentiment, viral theories, campaigns and organized review-bombing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500">Loading fan communities...</p>
        ) : communities.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800">
            <p className="text-slate-400">No active fan communities registered in this game state yet.</p>
          </div>
        ) : (
          communities.map((c) => (
            <div key={c._id} className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-4 shadow-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">{c.targetType}</span>
                <h3 className="text-lg font-bold text-slate-100">{c.fanClubName}</h3>
                <p className="text-xs text-slate-400">Target: {c.targetName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Members:</span>
                  <span className="font-bold text-slate-200">{c.memberCount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Sentiment:</span>
                  <span className={`font-bold ${c.sentimentScore > 60 ? "text-emerald-400" : "text-rose-400"}`}>
                    {c.sentimentScore}%
                  </span>
                </div>
              </div>

              {c.reviewBombingState?.isReviewBombing && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-rose-300 block">🚨 ACTIVE REVIEW BOMBING</span>
                  <p className="text-slate-300">Type: {c.reviewBombingState.campaignType}</p>
                  <p className="text-slate-400 italic">{c.reviewBombingState.triggerReason}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Viral Fan Theories:</p>
                {c.activeFanTheories?.map((th) => (
                  <div key={th.id} className="p-2 bg-slate-950/40 rounded border border-slate-800 text-xs">
                    <p className="font-bold text-pink-300">{th.title}</p>
                    <p className="text-slate-400">{th.description}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleReviewBomb(c.targetId, "HATE_CAMPAIGN")}
                  className="flex-1 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 py-1.5 rounded text-xs transition"
                >
                  Trigger Hate Bomb
                </button>
                <button
                  onClick={() => handleReviewBomb(c.targetId, "PRAISE_CAMPAIGN")}
                  className="flex-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 py-1.5 rounded text-xs transition"
                >
                  Trigger Praise Bomb
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FanCommunityV2Hub;
