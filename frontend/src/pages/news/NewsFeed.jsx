import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import NewsTrendIndicator from "../../components/news/NewsTrendIndicator";

const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = filterType ? `&type=${filterType}` : "";
      const res = await api.get(`/news?page=${page}&limit=10${typeParam}`);
      setNews(res.data.news || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      console.error("Failed to fetch news:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleFilterChange = (type) => {
    setFilterType(type);
    setPage(1);
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case "box_office":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "review":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "trend":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "event":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "rivalry":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "award":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "scandal":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "relationship":
      case "celebrity":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "streaming":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "franchise":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "social":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      box_office: "Box Office",
      review: "Review",
      trend: "Trend Alert",
      event: "Industry Event",
      rivalry: "Rivalry",
      award: "Awards",
      scandal: "Scandal",
      relationship: "Relationships",
      celebrity: "Celebrity",
      streaming: "Streaming",
      franchise: "Franchise",
      business: "Business",
      social: "Social Media",
    };
    return labels[type] || "General";
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === "positive") return "text-emerald-400";
    if (sentiment === "negative") return "text-rose-400";
    return "text-slate-400";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Industry News</h1>
            <p className="mt-2 text-slate-400">The latest scoops, releases, and trends from Hollywood.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: "All News", value: "" },
              { label: "Box Office", value: "box_office" },
              { label: "Reviews", value: "review" },
              { label: "Trends", value: "trend" },
              { label: "Scandals", value: "scandal" },
              { label: "Awards", value: "award" },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => handleFilterChange(btn.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  filterType === btn.value
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid layout containing news list and trends sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 animate-pulse">
                    <div className="h-4 bg-slate-800 rounded w-1/4 mb-3"></div>
                    <div className="h-6 bg-slate-800 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : news.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">No News Available</h2>
                <p className="text-slate-400">Run some weekly simulation ticks to populate the industry wire.</p>
              </div>
            ) : (
              news.map((item) => (
                <Link
                  key={item._id}
                  to={`/news/${item._id}`}
                  className="block bg-slate-950/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 hover:border-slate-700/80 transition-all duration-300 hover:translate-y-[-2px] group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeColor(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </span>
                      {item.sentiment && (
                        <span className={`text-xs font-medium capitalize ${getSentimentColor(item.sentiment)}`}>
                          {item.sentiment}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Week {item.week}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-200">
                    {item.headline}
                  </h3>
                  <p className="mt-3 text-slate-400 leading-relaxed text-sm md:text-base line-clamp-2">{item.body}</p>
                  {(item.source?.name || item.reach) && (
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                      {item.source?.name && <span>{item.source.name}</span>}
                      {item.reach > 0 && <span>Reach: {item.reach}</span>}
                      {item.source?.credibility > 0 && <span>Credibility: {item.source.credibility}%</span>}
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>

          <div className="lg:col-span-1">
            <NewsTrendIndicator newsItems={news} />
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Previous
            </button>
            <span className="text-slate-400 text-sm font-medium px-4">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewsFeed;
