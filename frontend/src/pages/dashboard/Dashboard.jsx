import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DollarSign, Star, Users, Building, Calendar, Film, TrendingUp, Trophy, Clock, Zap, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";
import { setUser } from "../../features/auth/authSlice";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import SimulationSummaryModal from "../../components/simulation/SimulationSummaryModal";
import { Skeleton } from "../../components/ui/Skeleton";

const Dashboard = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [simulationSummary, setSimulationSummary] = useState(null);
  const [customWeeks, setCustomWeeks] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, notifRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/notifications")
        ]);
        dispatch(setUser(userRes.data.user));
        setNotifications(notifRes.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  // --- SKELETON LOADING STATE ---
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // --- MAIN DASHBOARD CONTENT ---
  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white">Welcome, {user?.username}</h1>
          <p className="text-gray-400">Manage your studio, track projects, and grow your empire.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Revenue" value={`$${user?.stats?.revenue || 0}`} icon={<DollarSign className="text-green-500" />} />
          <StatCard title="Active Projects" value={user?.stats?.activeProjects || 0} icon={<Film className="text-blue-500" />} />
          <StatCard title="Studio Rating" value={`${user?.stats?.rating || 0}/10`} icon={<Star className="text-yellow-500" />} />
          <StatCard title="Talent Under Contract" value={user?.stats?.talentCount || 0} icon={<Users className="text-purple-500" />} />
        </div>

        {/* Dynamic Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-white">Recent Activity</h2>
            {/* Notifications list goes here */}
            {notifications.map(n => <div key={n.id} className="p-3 border-b border-gray-800">{n.message}</div>)}
          </div>
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
             <h2 className="text-xl font-semibold mb-4 text-white">Quick Actions</h2>
             {/* Add your buttons here */}
          </div>
        </div>

        {/* Summary Modal Trigger */}
        {showSummary && (
          <SimulationSummaryModal 
            data={simulationSummary} 
            onClose={() => setShowSummary(false)} 
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
