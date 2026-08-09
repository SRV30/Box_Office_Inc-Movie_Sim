import { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Layers, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import DashboardLayout from '../../layouts/DashboardLayout';

const PRODUCTION_STAGES = [
  'script',
  'pre_production',
  'filming',
  'post_production',
  'released',
];

const ProductionQueue = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('remainingWeeks');

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/movies/active');
      setMovies(res.data.movies || []);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const sortedMovies = useMemo(() => {
    const result = [...movies];
    switch (sortBy) {
      case 'remainingWeeks':
        return result.sort(
          (a, b) => (a.remainingWeeks ?? 0) - (b.remainingWeeks ?? 0),
        );
      case 'budget':
        return result.sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0));
      case 'progress':
        return result.sort(
          (a, b) => (b.productionProgress ?? 0) - (a.productionProgress ?? 0),
        );
      default:
        return result;
    }
  }, [movies, sortBy]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">
              Production Queue
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Active project management and scheduling.
            </p>
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

        {/* Content Section */}
        {loading ? (
          <div className="text-white text-center py-20 font-bold">
            Accessing Production Servers...
          </div>
        ) : movies.length === 0 ? (
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-20 text-center text-slate-500">
            No active productions in the queue.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMovies.map((movie) => {
              const currentStageIndex = PRODUCTION_STAGES.indexOf(movie.status);

              return (
                <Link
                  key={movie._id}
                  to={`/movies/${movie._id}`}
                  className="block bg-[#111827] border border-slate-800 rounded-2xl p-6 hover:border-violet-600 transition-all group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Grid for main details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 grow">
                      <div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">
                          Movie Project
                        </div>
                        <div className="text-xl font-black text-white truncate group-hover:text-violet-400 transition-colors uppercase italic">
                          {movie.title}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">
                          Current Stage
                        </div>
                        <div className="text-white font-bold flex items-center gap-2 capitalize">
                          <Layers size={14} className="text-violet-500" />
                          {movie.status
                            ? movie.status.replace('_', ' ')
                            : 'N/A'}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">
                          Time Remaining
                        </div>
                        <div className="text-white font-bold flex items-center gap-2 uppercase tracking-tighter">
                          <Clock size={14} className="text-blue-500" />
                          {movie.remainingWeeks ?? 0} Weeks
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">
                          Production Progress
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-green-500 h-full transition-all duration-300"
                              style={{
                                width: `${movie.productionProgress ?? 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-white font-bold text-xs">
                            {movie.productionProgress ?? 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Chevron Indicator */}
                    <div className="hidden lg:flex items-center justify-end">
                      <ChevronRight
                        size={20}
                        className="text-slate-700 group-hover:text-violet-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Stage Badges Progress Bar */}
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800/60">
                    {PRODUCTION_STAGES.map((stage, index) => {
                      let stageClass = 'bg-slate-800 text-slate-500';

                      if (index < currentStageIndex) {
                        stageClass =
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                      } else if (index === currentStageIndex) {
                        stageClass = 'bg-violet-600 text-white font-black';
                      }

                      return (
                        <span
                          key={stage}
                          className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider transition-colors ${stageClass}`}
                        >
                          {stage.replace('_', ' ')}
                        </span>
                      );
                    })}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProductionQueue;
