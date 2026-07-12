import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/AuthProvider";
import { useState } from "react";
import {
  LayoutDashboard,
  Code2,
  History,
  BarChart3,
  Trophy,
  User,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/problems", icon: Code2, label: "Problems" },
  { to: "/history", icon: History, label: "History" },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#0a0a0f] transition-all duration-300 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[rgba(255,255,255,0.06)]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm text-white tracking-tight">
              DevPilot <span className="text-[#6c63ff]">AI</span>
            </span>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[rgba(108,99,255,0.12)] text-[#6c63ff]"
                    : "text-[#a0a0b8] hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
  {user?.role === "admin" && (
    <NavLink
      to="/admin"
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-[rgba(108,99,255,0.12)] text-[#6c63ff]"
            : "text-[#a0a0b8] hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
        }`
      }
    >
      <Shield className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span>Admin</span>}
    </NavLink>
  )}
        </nav>

        {/* User section */}
        <div className="border-t border-[rgba(255,255,255,0.06)] p-3">
          <div className="flex items-center gap-3 px-1 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6c63ff] to-[#8b83ff] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{user?.username}</div>
                <div className="text-[11px] text-[#6b6b85] truncate">{user?.email}</div>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[#a0a0b8] hover:text-[#ff5252] hover:bg-[rgba(255,82,82,0.08)] transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 w-6 h-6 rounded-full bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#6b6b85] hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
