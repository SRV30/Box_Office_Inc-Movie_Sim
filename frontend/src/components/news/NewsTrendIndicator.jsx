import { Sparkles, TrendingUp, TrendingDown } from "lucide-react";

const NewsTrendIndicator = ({ newsItems = [] }) => {
  const detectTrends = () => {
    const trends = [];
    newsItems.forEach((item) => {
      const headline = (item.headline || item.title || "").toLowerCase();
      const body = (item.body || item.content || "").toLowerCase();
      
      if (headline.includes("horror") || body.includes("horror")) {
        if (headline.includes("decline") || headline.includes("dead") || headline.includes("drop")) {
          trends.push({ genre: "Horror", impact: "Decline", detail: "Sharp drop in interest", positive: false });
        } else {
          trends.push({ genre: "Horror", impact: "Hot", detail: "Rising interest", positive: true });
        }
      }
      if (headline.includes("fantasy") || body.includes("fantasy")) {
        if (headline.includes("surge") || headline.includes("hot") || headline.includes("gold")) {
          trends.push({ genre: "High Fantasy", impact: "Surging", detail: "Massive box office demand", positive: true });
        }
      }
      if (headline.includes("action") || body.includes("action")) {
        trends.push({ genre: "Action/Sci-Fi", impact: "Stable", detail: "Solid fan support", positive: true });
      }
    });

    // Default trends if none matched
    if (trends.length === 0) {
      trends.push({ genre: "Drama", impact: "Award Favorable", detail: "High prestige potential", positive: true });
      trends.push({ genre: "Comedy", impact: "Slight Rise", detail: "Good family appeal", positive: true });
    }
    return trends;
  };

  const currentTrends = detectTrends();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
        <Sparkles size={16} className="text-indigo-400" /> Industry Trend Radar
      </h3>
      <div className="space-y-3">
        {currentTrends.map((trend, idx) => (
          <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/50">
            <div>
              <p className="text-white font-semibold text-sm">{trend.genre}</p>
              <p className="text-xs text-slate-500">{trend.detail}</p>
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
              trend.positive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
            }`}>
              {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsTrendIndicator;
