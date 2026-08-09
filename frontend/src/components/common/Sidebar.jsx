import {
  LayoutDashboard,
  Film,
  Users,
  Building2,
  TrendingUp,
  FileBarChart,
  Pen,
  Bell,
  ShieldCheck,
  Settings,
  Layers,
  Scale,
  IndianRupee,
  X,
  Newspaper,
  Swords,
  Trophy,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Industry News",
      path: "/news",
      icon: Newspaper,
    },
    {
      name: "Rival Studios",
      path: "/rivals",
      icon: Swords,
    },
    {
      name: "Leaderboard",
      path: "/leaderboard",
      icon: Trophy,
    },
    {
      name: "Historic Records",
      path: "/records",
      icon: Trophy,
    },
    {
      name: "Movies",
      path: "/movies",
      icon: Film,
    },
    {
      name: "Ready for Release",
      path: "/movies/ready",
      icon: Film,
    },
    {
      name: "Library",
      path: "/movies/library",
      icon: Film,
    },
    {
      name: "Production Queue",
      path: "/movies/queue",
      icon: Layers,
    },
    {
      name: "TV Production",
      path: "/tv-shows",
      icon: Layers,
    },
    {
      name: "Comparison",
      path: "/movies/comparison",
      icon: Scale,
    },
    {
      name: "Scripts",
      path: "/scripts",
      icon: Film,
    },
    {
      name: "Writers",
      path: "/writers",
      icon: Pen,
    },
    {
      name: "Directors",
      path: "/directors",
      icon: Users,
    },
    {
      name: "Actors",
      path: "/actors",
      icon: Users,
    },
    {
      name: "Crew Market",
      path: "/crew",
      icon: Users,
    },
    {
      name: "Owned Crew",
      path: "/crew/owned",
      icon: Building2,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
    },
    {
      name: "Talent Academy",
      path: "/talent/academy",
      icon: Users,
    },
    {
      name: "Studio Stats",
      path: "/studio/stats",
      icon: Building2,
    },
    {
      name: "Financials",
      path: "/studio/history",
      icon: IndianRupee,
    },
    {
      name: "Merchandising",
      path: "/studio/merchandise",
      icon: TrendingUp,
    },
    {
      name: "Awards History",
      path: "/studio/awards",
      icon: Trophy,
    },
    {
      name: "Studio Upgrades",
      path: "/studio/upgrades",
      icon: Building2,
    },
    {
      name: "Crew Union",
      path: "/studio/union",
      icon: Scale,
    },
    {
      name: "Franchises",
      path: "/studio/franchises",
      icon: Layers,
    },
    {
      name: "Market",
      path: "/market",
      icon: TrendingUp,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: FileBarChart,
    },
    {
      name: "Auth Monitor",
      path: "/auth-monitoring",
      icon: ShieldCheck,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-[#0B1020] border-r border-slate-800 p-6 flex flex-col
          transition-transform duration-300 ease-in-out
          md:static md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex justify-between items-center mb-10 shrink-0">
          <h1 className="text-3xl font-bold text-violet-500">CineVerse</h1>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-2 overflow-y-auto pr-1 flex-1 scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex
                  items-center
                  gap-3
                  p-3
                  rounded-xl
                  transition-all
                  duration-200
                  ${
                    active
                      ? "bg-violet-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }
                `}
              >
                <Icon size={20} />

                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
