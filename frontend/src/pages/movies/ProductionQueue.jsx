import { useCallback, useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Clock, IndianRupee, Layers, ArrowUpDown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const ProductionQueue = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("remainingWeeks");
const productionStages = [
  "script",
  "pre_production",
  "filming",
  "post_production",
  "released",
];
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/movies/active");
      setMovies(res.data.movies || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const sortedMovies = useMemo(() => {
    let result = [...movies];
    switch(sortBy) {
        case "remainingWeeks": result.sort((a, b) => a.remainingWeeks - b.remainingWeeks); break;
        case "budget": result.sort((a, b) => b.budget - a.budget); break;
        case "progress": result.sort((a, b) => b.productionProgress - a.productionProgress); break;
        default: break;
    }
    return result;
  }, [movies, sortBy]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Production Queue</h1>
                <p className="text-slate-400 mt-1 text-sm sm:text-base">Active project management and scheduling.</p>
            </div>
            <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#111827] border border-slate-800 rounded-xl px-4 py-2 text-white text-sm font-bold outline-none focus:border-violet-600 self-start sm:self-auto w-full sm:w-auto cursor-pointer"
            >
                <option value="remainingWeeks">Sort: Remaining Time</option>
                <option value="budget">Sort: Highest Budget</option>
                <option value="progress">Sort: Progress %</option>
            </select>
        </div>

        {loading ? (
            <div className="text-white text-center py-20 font-bold">Accessing Production Servers...</div>
        ) : movies.length === 0 ? (
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-20 text-center text-slate-500">
                No active productions in the queue.
            </div>
        ) : (
            <div className="space-y-4">
                {sortedMovies.map((movie) => {
    const currentStageIndex = productionStages.indexOf(movie.status);

    return (
                    <Link
                        key={movie._id}
                        to={`/movies/${movie._id}`}
                        className="block bg-[#111827] border border-slate-800 rounded-2xl p-6 hover:border-violet-600 transition-all group"
                    >
                        <div className="grid md:grid-cols-4 gap-6 items-center">
                            <div className="col-span-1">
                                <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">Movie Project</div>
                                <div className="text-xl font-black text-white truncate group-hover:text-violet-400 transition-colors uppercase italic">{movie.title}</div>
                            </div>

                            <div className="col-span-1">
                                <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">Current Stage</div>
                                <div className="text-white font-bold flex items-center gap-2">
                                    <Layers size={14} className="text-violet-500" />
                                    {movie.status.replace('_', ' ')}
                                </div>
                            </div>

                            <div className="col-span-1">
                                <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">Time Remaining</div>
                                <div className="text-white font-bold flex items-center gap-2 uppercase tracking-tighter">
                                    <Clock size={14} className="text-blue-500" />
                                    {movie.remainingWeeks} Weeks
                                </div>
                            </div>

                            <div className="col-span-1 flex justify-between items-center">
                                <div>
                                    <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">Production Progress</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-green-500 h-full" style={{ width: `${movie.productionProgress}%` }} />
                                        </div>
                                        <span className="text-white font-bold text-xs">{movie.productionProgress}%</span>
                                    
                                    </div>
<div className="flex flex-wrap gap-2 mt-4">
  {productionStages.map((stage, index) => {
    let stageClass =
      "bg-slate-700 text-slate-400";

    if (index < currentStageIndex) {
      stageClass =
        "bg-green-600 text-white";
    } else if (index === currentStageIndex) {
      stageClass =
        "bg-blue-600 text-white";
    }

    return (
      <span
        key={stage}
        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${stageClass}`}
      >
        {stage.replace("_", " ")}
      </span>
    );
  })}
</div>
                                </div>
                                <ChevronRight size={20} className="text-slate-700 group-hover:text-violet-500 transition-colors" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProductionQueue;
