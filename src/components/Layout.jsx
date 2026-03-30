import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  CalendarDays, LayoutDashboard, UserX, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, Zap, Building2,
  Sparkles, MessageCircle, TrendingUp, ArrowLeftRight, CalendarHeart, Scale,
  Bell, CheckCheck, FileBarChart, Banknote, Stethoscope, Clock, Notebook,
  ChevronDown, Activity
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Schema",
    items: [
      { id: "schedule",    label: "Schema",        icon: CalendarDays },
      { id: "dashboard",   label: "Dashboard",     icon: LayoutDashboard },
      { id: "base-schedule", label: "Grundschema", icon: Notebook },
    ]
  },
  {
    label: "Personal",
    items: [
      { id: "absence",   label: "Frånvaro",   icon: UserX },
      { id: "swaps",     label: "Bytestavla", icon: ArrowLeftRight },
      { id: "wishes",    label: "Önskemål",   icon: CalendarHeart },
      { id: "fairness",  label: "Rättvisa",   icon: Scale },
      { id: "comp-time", label: "Komp-tid",   icon: Clock },
    ]
  },
  {
    label: "Operationer",
    items: [
      { id: "op-plan",  label: "OP-planering",  icon: Stethoscope },
    ]
  },
  {
    label: "Analys",
    items: [
      { id: "reports",    label: "Rapporter",     icon: FileBarChart },
      { id: "payroll",    label: "Löneunderlag",  icon: Banknote },
      { id: "ai-predict", label: "Prediktioner",  icon: TrendingUp },
    ]
  },
  {
    label: "AI",
    items: [
      { id: "ai-rules", label: "AI-regler",    icon: Sparkles },
      { id: "ai-chat",  label: "Schema-chatt", icon: MessageCircle },
    ]
  },
  {
    label: "Administration",
    adminOnly: true,
    items: [
      { id: "onboarding", label: "Ny klinik",      icon: Building2, adminOnly: true },
      { id: "admin",      label: "Administration",  icon: Settings,  adminOnly: true },
    ]
  },
];

// Flat list for quick lookup
const NAV_FLAT = NAV_GROUPS.flatMap(g => g.items);

// COP logo mark
function COPLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="11" width="18" height="2" rx="1" fill="white" opacity="0.9"/>
      <rect x="11" y="3" width="2" height="18" rx="1" fill="white" opacity="0.9"/>
      <rect x="8" y="8" width="8" height="8" rx="4" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  );
}

export default function Layout({ page, setPage, children }) {
  const { user, logout, api } = useAuth();
  const { clinics, clinicId, switchClinic } = useClinic();
  const { connected } = useWebSocket("system");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifications = useCallback(async () => {
    if (!api || !user?.username) return;
    setNotifLoading(true);
    try {
      const data = await api(`/notifications/${user.username}?unread_only=false`);
      setNotifications(Array.isArray(data) ? data : data?.notifications || []);
    } catch { setNotifications([]); }
    finally { setNotifLoading(false); }
  }, [api, user?.username]);

  const markRead = async (notifId) => {
    try {
      await api(`/notifications/${notifId}/read?user_id=${user?.username || "anon"}`, { method: "PUT" });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    for (const n of notifications.filter(n => !n.read)) {
      try { await api(`/notifications/${n.id}/read?user_id=${user?.username || "anon"}`, { method: "PUT" }); } catch {}
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    loadNotifications();
    const iv = setInterval(loadNotifications, 60000);
    return () => clearInterval(iv);
  }, [loadNotifications]);

  const navigate = (id) => { setPage(id); setMobileOpen(false); };
  const currentLabel = NAV_FLAT.find(n => n.id === page)?.label || "Schema";

  const isAdmin = user?.role === "admin";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-main)" }}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(11,30,56,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed lg:relative z-50 h-full flex flex-col shrink-0
          transition-all duration-250 ease-in-out
          ${collapsed ? "w-[64px]" : "w-[232px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ background: "var(--nav-bg)", borderRight: "1px solid var(--nav-border)" }}
      >
        {/* Brand header */}
        <div
          className={`flex items-center h-[58px] shrink-0 ${collapsed ? "justify-center px-0" : "px-4"}`}
          style={{ borderBottom: "1px solid var(--nav-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center shrink-0 rounded-xl"
              style={{
                width: 34, height: 34,
                background: "linear-gradient(135deg, #1560D4 0%, #0891B2 100%)",
                boxShadow: "0 2px 10px rgba(21,96,212,0.35)",
              }}
            >
              <COPLogo size={16} />
            </div>
            {!collapsed && (
              <div>
                <div className="text-[13px] font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.93)" }}>
                  COP Engine
                </div>
                <div className="text-[10px] mt-[-1px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Schemaoptimering
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clinic selector (non-collapsed) */}
        {!collapsed && clinics?.length > 1 && (
          <div className="px-3 pt-3 pb-1">
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Building2 size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
              <select
                value={clinicId || ""}
                onChange={e => switchClinic(e.target.value)}
                className="flex-1 bg-transparent text-[11px] font-medium outline-none cursor-pointer"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {clinics.map(c => <option key={c.clinic_id} value={c.clinic_id}>{c.name}</option>)}
              </select>
              <ChevronDown size={10} style={{ color: "rgba(255,255,255,0.3)" }} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {NAV_GROUPS.map(group => {
            if (group.adminOnly && !isAdmin) return null;
            const visibleItems = group.items.filter(i => !i.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                {!collapsed && (
                  <div
                    className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.22)" }}
                  >
                    {group.label}
                  </div>
                )}
                {collapsed && <div className="h-2" />}
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const active = page === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`
                        sidebar-item w-full flex items-center gap-2.5 text-[12.5px] font-medium
                        ${collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2"}
                        ${active ? "sidebar-item-active" : ""}
                      `}
                      style={{
                        color: active
                          ? "var(--nav-active-text)"
                          : "rgba(255,255,255,0.5)",
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--nav-hover-bg)"; e.currentTarget.style.color = "rgba(255,255,255,0.82)"; }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = ""; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}}
                    >
                      <Icon
                        size={16}
                        strokeWidth={active ? 2.2 : 1.7}
                        className="sidebar-icon shrink-0"
                        style={{ color: active ? "var(--nav-active-text)" : undefined }}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className={`p-3 space-y-2 ${collapsed ? "flex flex-col items-center" : ""}`}
          style={{ borderTop: "1px solid var(--nav-border)" }}
        >
          {/* Live dot */}
          <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : "px-1"}`}>
            <span
              className={`w-[6px] h-[6px] rounded-full shrink-0 ${connected ? "status-pulse" : ""}`}
              style={{ background: connected ? "#34D399" : "#F87171" }}
            />
            {!collapsed && (
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
                {connected ? "Realtid aktiv" : "Frånkopplad"}
              </span>
            )}
          </div>

          {/* User row */}
          {!collapsed ? (
            <div className="flex items-center gap-2 px-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, #1560D4, #0891B2)", color: "white" }}
              >
                {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
                  {user?.full_name || user?.username}
                </div>
                <div className="text-[10px] capitalize" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {user?.role}
                </div>
              </div>
              <button
                onClick={logout}
                title="Logga ut"
                className="p-1 rounded transition-colors"
                style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              title="Logga ut"
              className="p-1.5 rounded transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              <LogOut size={14} />
            </button>
          )}

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center py-1 rounded transition-colors"
            style={{ color: "rgba(255,255,255,0.2)" }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header
          className="flex items-center h-[54px] px-4 lg:px-6 shrink-0"
          style={{
            background: "white",
            borderBottom: "1px solid #DDE4F0",
            boxShadow: "0 1px 0 rgba(14,41,87,0.04)",
          }}
        >
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden mr-3 p-1.5 rounded-lg transition-colors"
            style={{ color: "#8E9EB5" }}
          >
            <Menu size={18} />
          </button>

          {/* Page title */}
          <div className="flex-1 flex items-center gap-2.5">
            <span className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {currentLabel}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) loadNotifications(); }}
                className="relative p-2 rounded-lg transition-colors"
                style={{ color: "#8E9EB5" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#F2F5FA"; e.currentTarget.style.color = "#4A5568"; }}
                onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "#8E9EB5"; }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                    style={{ background: "#DC2626" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 w-[320px] z-50 overflow-hidden"
                    style={{
                      background: "white",
                      border: "1px solid var(--card-border)",
                      borderRadius: 14,
                      boxShadow: "0 8px 30px rgba(14,41,87,0.14)",
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: "1px solid #EEF2F8" }}
                    >
                      <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        Notifieringar
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="flex items-center gap-1 text-[11px] font-medium"
                          style={{ color: "var(--primary)" }}
                        >
                          <CheckCheck size={11} /> Markera alla
                        </button>
                      )}
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {notifLoading ? (
                        <div className="py-10 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>Laddar...</div>
                      ) : notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell size={22} className="mx-auto mb-2" style={{ color: "#DDE4F0" }} />
                          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Inga notifieringar</span>
                        </div>
                      ) : (
                        notifications.slice(0, 15).map(n => (
                          <button
                            key={n.id}
                            onClick={() => { if (!n.read) markRead(n.id); }}
                            className="w-full text-left px-4 py-3 transition-colors"
                            style={{
                              borderBottom: "1px solid #F8FAFD",
                              background: !n.read ? "#F0F6FF" : "white",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#F8FAFD"}
                            onMouseLeave={e => e.currentTarget.style.background = !n.read ? "#F0F6FF" : "white"}
                          >
                            <div className="flex items-start gap-2.5">
                              {!n.read && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                  style={{ background: "var(--primary)" }}
                                />
                              )}
                              <div className="min-w-0">
                                <p
                                  className="text-[12px] truncate"
                                  style={{ fontWeight: !n.read ? 600 : 400, color: !n.read ? "var(--text-primary)" : "var(--text-secondary)" }}
                                >
                                  {n.title || n.message || n.type}
                                </p>
                                {n.body && (
                                  <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{n.body}</p>
                                )}
                                <p className="text-[10px] mt-1" style={{ color: "#C5D0E4" }}>{n.created_at || n.timestamp || ""}</p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Live status chip */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium"
              style={{
                background: connected ? "#F0FDF4" : "#FEF2F2",
                color: connected ? "#059669" : "#DC2626",
                border: `1px solid ${connected ? "#BBF7D0" : "#FECACA"}`,
              }}
            >
              <Activity size={11} />
              {connected ? "Live" : "Offline"}
            </div>

            {/* User chip */}
            <div
              className="hidden sm:flex items-center gap-2 pl-3"
              style={{ borderLeft: "1px solid #EEF2F8" }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ background: "linear-gradient(135deg, #1560D4, #0891B2)", color: "white" }}
              >
                {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
                {user?.full_name?.split(" ")[0]}
              </span>
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
