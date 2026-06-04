import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DollarSign, Star, Users, Building } from "lucide-react";

import api from "../../api/axios";
import { setUser } from "../../features/auth/authSlice";

import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/common/StatCard";

const Dashboard = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");

        dispatch(setUser(res.data.user));
      } catch (error) {
        console.error(error);
      }
    };

    fetchUser();
  }, [dispatch]);

  const simulateWeek = async () => {
    try {
      setLoading(true);

      const res = await api.post("/simulation/next-week");

      // Update local studio state to reflect new money/week without reload
      if (user && user.studio) {
        dispatch(
          setUser({
            ...user,
            studio: {
              ...user.studio,
              money: res.data.money,
            },
          })
        );
      }

      alert(`Week ${res.data.currentWeek} Simulated!`);
    } catch (error) {
      alert(error?.response?.data?.message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Banner */}
        <div className="rounded-3xl bg-linear-to-r from-violet-700 to-purple-500 p-8">
          <h1 className="text-4xl font-bold text-white">
            Build Your Dream Studio
          </h1>

          <p className="text-slate-100 mt-3">
            Create Blockbusters. Become a Legend.
          </p>
        </div>

        <button
          onClick={simulateWeek}
          disabled={loading}
          className="
  bg-violet-600
  hover:bg-violet-700
  px-6
  py-3
  rounded-xl
  text-white
  font-semibold
"
        >
          {loading ? "Simulating..." : "Simulate Week"}
        </button>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            title="Money"
            value={`₹${user?.studio?.money ?? 0}`}
            icon={<DollarSign />}
          />

          <StatCard
            title="Prestige"
            value={user?.studio?.prestige ?? 0}
            icon={<Star />}
          />

          <StatCard
            title="Fans"
            value={user?.studio?.fans ?? 0}
            icon={<Users />}
          />

          <StatCard
            title="Studio Level"
            value={user?.studio?.studioLevel ?? 1}
            icon={<Building />}
          />
        </div>

        {/* Bottom Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-[#111827] rounded-2xl p-6 border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-4">
              Studio Overview
            </h2>

            <div className="space-y-3 text-slate-300">
              <p>Studio: {user?.studio?.name}</p>

              <p>Money: ₹{user?.studio?.money}</p>

              <p>Prestige: {user?.studio?.prestige}</p>

              <p>Fans: {user?.studio?.fans}</p>

              <p>Level: {user?.studio?.studioLevel}</p>
            </div>
          </div>

          <div className="bg-[#111827] rounded-2xl p-6 border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-4">
              Recent Events
            </h2>

            <div className="space-y-4 text-slate-300">
              <div>🎬 Welcome to CineVerse Empire</div>

              <div>🏢 Studio Founded</div>

              <div>📅 Week 1 Started</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
