import { useState, useEffect } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Tv, Play, Search, Film, Users, IndianRupee, Star, Sparkles, Filter } from "lucide-react";

const StreamingCatalogHub = () => {
  const [platforms, setPlatforms] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCatalog();
  }, [selectedPlatform, searchQuery]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedPlatform !== "ALL") params.platformId = selectedPlatform;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get("/streaming/catalog", { params });
      if (res.data.success) {
        setMovies(res.data.movies || []);
        setPlatforms(res.data.platforms || []);
      }
    } catch (err) {
      console.error("Failed to load streaming catalog:", err);
      setError("Unable to load streaming catalog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalSubscribers = platforms.reduce((acc, p) => acc + (p.subscribers || 0), 0);
  const totalExclusives = movies.length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <Tv className="text-indigo-500" size={36} /> Streaming Platforms & Catalog
            </h1>
            <p className="text-slate-400 mt-2">
              Explore streaming network subscribers, content budgets, and active digital exclusives.
            </p>
          </div>
        </div>

        {/* Global Network Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Streaming Networks</span>
            <div className="text-3xl font-black text-indigo-400 mt-2 flex items-center gap-2">
              <Tv size={24} /> {platforms.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active platform partners</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Network Reach</span>
            <div className="text-3xl font-black text-emerald-400 mt-2 flex items-center gap-2">
              <Users size={24} /> {(totalSubscribers / 1_000_000).toFixed(1)}M
            </div>
            <p className="text-xs text-slate-500 mt-1">Combined subscriber base</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Studio Exclusives</span>
            <div className="text-3xl font-black text-amber-400 mt-2 flex items-center gap-2">
              <Film size={24} /> {totalExclusives}
            </div>
            <p className="text-xs text-slate-500 mt-1">Licensed catalog titles</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Digital Market Status</span>
            <div className="text-2xl font-black text-violet-400 mt-2 flex items-center gap-2">
              <Sparkles size={24} /> Active
            </div>
            <p className="text-xs text-slate-500 mt-1">Real-time SVOD simulation</p>
          </div>
        </div>

        {/* Platform Directory Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Filter size={20} className="text-indigo-400" /> Platform Directory & Content Budgets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((plat) => (
              <button
                key={plat.id}
                onClick={() => setSelectedPlatform(selectedPlatform === plat.id ? "ALL" : plat.id)}
                className={`text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  selectedPlatform === plat.id
                    ? "bg-indigo-950/60 border-indigo-500 shadow-lg ring-2 ring-indigo-500/50"
                    : "bg-[#111827] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{plat.name}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                    {plat.popularity}% Pop
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Subscribers:</span>
                    <span className="font-semibold text-slate-200">{(plat.subscribers / 1_000_000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Content Budget:</span>
                    <span className="font-semibold text-emerald-400">₹{(plat.contentBudget / 1_000_000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Catalog Exclusives:</span>
                    <span className="font-semibold text-indigo-400">{plat.exclusiveCount}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Search and Filter Controls */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search streaming exclusives by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-slate-400">Platform Filter:</span>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Platforms ({platforms.length})</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Catalog Movies Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Play size={20} className="text-indigo-400" /> Licensed Streaming Catalog ({movies.length})
          </h2>

          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse font-medium">
              Loading platform streaming catalog...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 bg-rose-950/20 border border-rose-900/50 rounded-2xl">
              {error}
            </div>
          ) : movies.length === 0 ? (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center">
              <Tv size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Streaming Exclusives Found</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {searchQuery || selectedPlatform !== "ALL"
                  ? "Try clearing filters or searching with a different movie title."
                  : "Sell movie distribution rights to streaming platforms upon release to build your streaming catalog."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <div
                  key={movie._id}
                  className="bg-[#111827] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{movie.title}</h3>
                        <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-800/40">
                          {movie.platformName || "Streaming Exclusive"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Quality</span>
                        <span className="text-sm font-bold text-amber-400 flex items-center gap-1 justify-end">
                          <Star size={14} /> {movie.quality || 0}/100
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-900/70 rounded-xl p-3 my-4 border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 block">Deal Revenue</span>
                        <span className="font-bold text-emerald-400 flex items-center mt-0.5">
                          <IndianRupee size={12} /> {((movie.boxOffice || movie.worldwideGross || 0) / 1_000_000).toFixed(2)}M
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Verdict</span>
                        <span className="font-bold text-indigo-300 mt-0.5 block">
                          {movie.verdict || "STREAMING"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Hype at Release</span>
                        <span className="font-semibold text-slate-300 mt-0.5 block">
                          {movie.hype || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Release Week</span>
                        <span className="font-semibold text-slate-300 mt-0.5 block">
                          Week {movie.releaseWeek || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Streaming Status: Active</span>
                    <span className="text-indigo-400 font-medium">Exclusivity Secured</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StreamingCatalogHub;
