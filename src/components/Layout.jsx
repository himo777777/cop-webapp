import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  CalendarDays, LayoutDashboard, UserX, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Zap, Building2,
  Sparkles, MessageCircle, TrendingUp, ArrowLeftRight, CalendarHeart, Scale
} from "lucide-react";

const NAV = [
  { id: "schedule", label: "Schema", icon: CalendarDays },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "absence", label: "Franvaro", icon: UserX },
  { id: "swaps", label: "Bytestavla", icon: ArrowLeftRight },
  { id: "wishes", label: "Onskemol", icon: CalendarHeart },
  { id: "fairness", label: "Rattvisa", icon: Scale },
  { id: "ai-rules", label: "AI-regler", icon: Sparkles },
  { id: "ai-chat", label: "Schema-chatt", icon: MessageCircle },
  { id: "ai-predict", label: "Prediktioner", icon: TrendingUp },
  { id: "admin", label: "Administration", icon: Settings, adminOnly: true },
];

export default function Layout({ page, setPage, children }) {
  const { user, logout } = useAuth();
  const { clinics, clinicId, switchClinic } = useClinic();
  const { connected } = useWebSocket("system");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV.filter(n => !n.adminOnly || user?.role === "admin");

  const navigate = (id) => { setPage(id); setMobileOpen(false); };

  return (
    <div className="flex h-screen bg-[#f5f7fa] overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 h-full flex flex-col
        bg-[#0f1729] text-white
        transition-all duration-250 ease-in-out
        ${collapsed ? "w-[68px]" : "w-[240px]"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Header */}
        <div className={`flex items-center h-[60px] shrink-0 ${collapsed ? "justify-center" : "px-5"}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/15">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 12a6 6 0 0112 0"/>
                <circle cx="12" cy="12" r="1.5" fill="white" stroke="none"/>
                <line x1="12" y1="14" x2="12" y2="19"/>
                <line x1="10" y1="17.5" x2="14" y2="17.5"/>
              </svg>
            </div>
            {!collapsed && (
              <div>
                <div className="text-[14px] font-semibold tracking-tight text-white/95">COP</div>
                <div className="text-[10px] text-slate-500 -mt-0.5">Schemaoptimering</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 pt-2 space-y-0.5">
          {visibleNav.map(item => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className={`
                  sidebar-item w-full flex items-center gap-3 rounded-lg text-[13px] font-medium
                  ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
                  ${active
                    ? "sidebar-item-active bg-white/[0.08] text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.7} className={active ? "text-blue-400" : ""} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`border-t border-white/[0.06] p-3 space-y-3 ${collapsed ? "flex flex-col items-center" : ""}`}>
          {/* Live status */}
          <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : "px-1.5"}`}>
            <span className={`w-[7px] h-[7px] rounded-full ${connected ? "bg-emerald-400 status-pulse" : "bg-red-400"}`} />
            {!collapsed && (
              <span className="text-[11px] text-slate-500">
                {connected ? "Realtidsansluten" : "Frånkopplad"}
              </span>
            )}
          </div>

          {/* User */}
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-1.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-300 shrink-0">
                {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-slate-300 truncate">{user?.full_name || user?.username}</div>
                <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
              </div>
              <button onClick={logout} className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded" title="Logga ut">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={logout} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors rounded" title="Logga ut">
              <LogOut size={15} />
            </button>
          )}

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center py-1 text-slate-600 hover:text-slate-400 transition-colors">
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center h-[52px] px-4 lg:px-6 bg-white border-b border-slate-200/80 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700 mr-3">
            <Menu size={20} />
          </button>

          <div className="flex-1 flex items-center gap-3">
            <h2 className="text-[14px] font-semibold text-slate-800">
              {visibleNav.find(n => n.id === page)?.label || "Schema"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {clinics?.length > 1 && (
              <div className="hidden sm:flex items-center gap-1.5">
                <Building2 size={12} className="text-slate-400" />
                <select value={clinicId || ""} onChange={e => switchClinic(e.target.value)}
                  className="text-[11px] bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-600 focus:border-blue-400 outline-none">
                  {clinics.map(c => <option key={c.clinic_id} value={c.clinic_id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
              <Zap size={11} className={connected ? "text-emerald-500" : "text-slate-400"} />
              <span>{connected ? "Live" : "Offline"}</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-100">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-500">
                {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <span className="text-[12px] text-slate-600 font-medium">{user?.full_name?.split(" ")[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
