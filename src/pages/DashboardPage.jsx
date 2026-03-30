import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { useClinic } from "../context/ClinicContext";
import {
  Users, ShieldCheck, ShieldAlert, TrendingUp, AlertTriangle,
  CheckCircle2, RefreshCw, Activity, Calendar, Stethoscope,
  ArrowUp, ArrowDown, Minus
} from "lucide-react";

const CHART_COLORS = ["#1560D4", "#0891B2", "#7C3AED", "#059669", "#D97706", "#DC2626", "#6366f1"];

/* ── Metric card ─────────────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, sub, accent = "blue", trend }) {
  const accentMap = {
    blue:   { iconBg: "#EBF2FF", iconColor: "#1560D4" },
    green:  { iconBg: "#ECFDF5", iconColor: "#059669" },
    red:    { iconBg: "#FEF2F2", iconColor: "#DC2626" },
    teal:   { iconBg: "#E0F7FB", iconColor: "#0891B2" },
    violet: { iconBg: "#F5F3FF", iconColor: "#7C3AED" },
    amber:  { iconBg: "#FFFBEB", iconColor: "#D97706" },
  };
  const a = accentMap[accent] || accentMap.blue;

  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const trendColor = trend === "up" ? "#059669" : trend === "down" ? "#DC2626" : "#8E9EB5";

  return (
    <div className={`metric-card accent-${accent} p-5`}>
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: a.iconBg }}
        >
          <Icon size={19} style={{ color: a.iconColor }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1" style={{ color: trendColor }}>
            <TrendIcon size={12} />
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#8E9EB5" }}>
          {label}
        </p>
        <p className="text-[26px] font-bold mt-1 tabular-nums leading-none" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        {sub && (
          <p className="text-[11px] mt-1.5 truncate" style={{ color: "#8E9EB5" }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ── Chart tooltip ───────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2.5 text-[12px]"
      style={{
        background: "white",
        border: "1px solid #DDE4F0",
        borderRadius: 10,
        boxShadow: "0 4px 16px rgba(14,41,87,0.12)",
      }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ── Section header ──────────────────────────────────────────────── */
function SectionHeader({ title, sub, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Function badge ──────────────────────────────────────────────── */
const FUNC_COLORS = {
  OP:     { bg: "#EBF2FF", fg: "#1560D4", border: "#C7D9FF" },
  AVD:    { bg: "#FFFBEB", fg: "#92400E", border: "#FDE68A" },
  MOTT:   { bg: "#ECFDF5", fg: "#065F46", border: "#A7F3D0" },
  AKUT:   { bg: "#FFF7ED", fg: "#9A3412", border: "#FDBA74" },
  JOUR_P: { bg: "#FEF2F2", fg: "#991B1B", border: "#FECACA" },
  JOUR_B: { bg: "#FFF1F2", fg: "#9F1239", border: "#FECDD3" },
  ADMIN:  { bg: "#F5F3FF", fg: "#5B21B6", border: "#DDD6FE" },
};

function funcColors(f) {
  const prefix = f?.split("_")[0] || "";
  return FUNC_COLORS[f] || FUNC_COLORS[prefix] || { bg: "#F2F5FA", fg: "#4A5568", border: "#DDE4F0" };
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { api } = useAuth();
  const { config } = useClinic();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      api("/statistics").then(setStats).catch(() => setStats(null)),
      api("/health").then(setHealth).catch(() => setHealth(null)),
    ]).finally(() => setLoading(false));
    loadTodaySchedule();
  }, [api]);

  const loadTodaySchedule = useCallback(async () => {
    try {
      const schedules = await api("/schedules");
      if (schedules.length > 0) {
        const s = await api(`/schedule/${schedules[0].schedule_id}`);
        setTodaySchedule(s);
      } else setTodaySchedule(null);
    } catch { setTodaySchedule(null); }
  }, [api]);

  useEffect(() => { refresh(); }, [refresh]);

  const callData = useMemo(() => {
    if (!stats?.call_distribution) return [];
    return Object.values(stats.call_distribution)
      .map(d => ({ name: d.name.replace("Dr ", ""), primary: d.primary, backup: d.backup }))
      .sort((a, b) => (b.primary + b.backup) - (a.primary + a.backup))
      .slice(0, 12);
  }, [stats]);

  const roleData = useMemo(() => {
    if (!config?.doctors) return [];
    const c = {};
    config.doctors.forEach(d => { c[d.role] = (c[d.role] || 0) + 1; });
    return Object.entries(c).map(([role, count]) => ({ name: role, value: count }));
  }, [config]);

  const workloadData = useMemo(() => {
    if (!stats?.workload_balance) return [];
    return Object.values(stats.workload_balance)
      .map(d => ({ name: d.name.replace("Dr ", ""), pct: d.utilization }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 12);
  }, [stats]);

  const todayStaffing = useMemo(() => {
    if (!todaySchedule?.schedule || !config?.doctors) return null;
    const today = new Date().toISOString().split("T")[0];
    const doctorMap = {};
    config.doctors.forEach(d => { doctorMap[d.id] = d; });

    const assignments = [];
    const functionCounts = {};

    Object.entries(todaySchedule.schedule).forEach(([docId, dayMap]) => {
      const func = dayMap[today];
      if (func && func !== "LEDIG" && func !== "SEMESTER") {
        const doc = doctorMap[docId];
        if (doc) {
          assignments.push({ docName: doc.name, role: doc.role, func });
          const prefix = func.split("_")[0];
          functionCounts[prefix] = (functionCounts[prefix] || 0) + 1;
        }
      }
    });

    const idle = [];
    Object.entries(todaySchedule.schedule).forEach(([docId, dayMap]) => {
      if (dayMap[today] === "LEDIG") {
        const doc = doctorMap[docId];
        if (doc) idle.push(doc.name);
      }
    });

    return { assignments, functionCounts, idle };
  }, [todaySchedule, config]);

  const violations = stats?.atl_violations?.length || 0;
  const today = new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-4 lg:p-6 max-w-[1440px] mx-auto space-y-5">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold capitalize" style={{ color: "var(--text-primary)" }}>
            {today}
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {config?.name || "Klinik"} · Schemaöversikt
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all"
          style={{
            background: "white",
            border: "1px solid var(--card-border)",
            color: "var(--text-secondary)",
            boxShadow: "0 1px 2px rgba(14,41,87,0.04)",
          }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Uppdatera
        </button>
      </div>

      {/* ── Metrics ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={Users}
          label="Läkare"
          value={loading ? "–" : config?.num_doctors || "–"}
          sub={config ? `${config.num_rooms || 0} operationssalar` : "Laddar..."}
          accent="blue"
        />
        <MetricCard
          icon={violations === 0 ? ShieldCheck : ShieldAlert}
          label="ATL-status"
          value={loading ? "–" : violations === 0 ? "OK" : violations}
          sub={violations === 0 ? "Inga regelbrott" : "Brott detekterade"}
          accent={violations === 0 ? "green" : "red"}
        />
        <MetricCard
          icon={Activity}
          label="Systemstatus"
          value={loading ? "–" : health ? "Online" : "–"}
          sub={health ? `Uppe ${Math.round((health.uptime_seconds || 0) / 60)} min` : "Kontrollerar..."}
          accent="teal"
        />
        <MetricCard
          icon={Calendar}
          label="Scheman totalt"
          value={loading ? "–" : health?.schedules_generated || 0}
          sub="Genererade av AI"
          accent="violet"
        />
      </div>

      {/* ── Dagens beläggning ─────────────────────────────────── */}
      {todayStaffing && (
        <div className="card p-5">
          <SectionHeader
            title="Dagens beläggning"
            sub={`${todayStaffing.assignments.length} läkare i tjänst · ${todayStaffing.idle.length} lediga`}
          />

          {/* Function summary badges */}
          {Object.keys(todayStaffing.functionCounts).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(todayStaffing.functionCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([func, count]) => {
                  const c = funcColors(func);
                  return (
                    <div
                      key={func}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}
                    >
                      <Stethoscope size={10} />
                      {func}
                      <span
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: c.fg, color: "white" }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Staffing table */}
          {todayStaffing.assignments.length > 0 ? (
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #EEF2F8" }}>
              <table className="w-full grid-table text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#8E9EB5" }}>Läkare</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#8E9EB5" }}>Roll</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#8E9EB5" }}>Funktion</th>
                  </tr>
                </thead>
                <tbody>
                  {todayStaffing.assignments.map((a, i) => {
                    const c = funcColors(a.func);
                    return (
                      <tr key={i}>
                        <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{a.docName}</td>
                        <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{a.role}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
                            style={{ background: c.bg, color: c.fg }}
                          >
                            {a.func}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="py-8 text-center rounded-xl"
              style={{ background: "#F8FAFD", border: "1px solid #EEF2F8" }}
            >
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Ingen bemanning schemalagd idag</p>
            </div>
          )}

          {/* Idle doctors */}
          {todayStaffing.idle.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #EEF2F8" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#8E9EB5" }}>
                Lediga idag
              </p>
              <div className="flex flex-wrap gap-1.5">
                {todayStaffing.idle.map((name, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "#F2F5FA", color: "var(--text-secondary)", border: "1px solid #DDE4F0" }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Charts row ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Call distribution */}
        <div className="card p-5">
          <SectionHeader title="Jourfördelning" sub="Primär- och bakjour per läkare" />
          {callData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={callData} layout="vertical" margin={{ left: 0, right: 12 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#8E9EB5" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#4A5568" }} width={60} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(21,96,212,0.03)" }} />
                <Bar dataKey="primary" stackId="a" fill="#1560D4" name="Primärjour" radius={[0, 0, 0, 0]} />
                <Bar dataKey="backup"  stackId="a" fill="#0891B2" name="Bakjour"    radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Generera ett schema för att se jourfördelning" />}
        </div>

        {/* Role distribution */}
        <div className="card p-5">
          <SectionHeader title="Rollfördelning" sub="Personal per befattning" />
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={95}
                  dataKey="value" paddingAngle={2}
                  stroke="none"
                >
                  {roleData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
          {/* Legend */}
          {roleData.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
              {roleData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Workload chart ────────────────────────────────────── */}
      <div className="card p-5">
        <SectionHeader title="Arbetsbelastning" sub="Utnyttjandegrad per läkare (%)" />
        {workloadData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={workloadData} margin={{ left: 0, right: 12, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#8E9EB5" }} angle={-35} textAnchor="end" height={50} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8E9EB5" }} domain={[0, 100]} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(21,96,212,0.03)" }} />
              <Bar dataKey="pct" name="Utnyttjande %" radius={[4, 4, 0, 0]}>
                {workloadData.map((d, i) => (
                  <Cell key={i} fill={d.pct > 90 ? "#DC2626" : d.pct > 75 ? "#D97706" : "#1560D4"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState text="Generera ett schema för att se arbetsbelastning" />}
      </div>

      {/* ── ATL status ───────────────────────────────────────── */}
      {violations > 0 && (
        <div
          className="card p-5"
          style={{ borderColor: "#FECACA", background: "#FFF5F5" }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEE2E2" }}>
              <AlertTriangle size={16} style={{ color: "#DC2626" }} />
            </div>
            <div>
              <h3 className="text-[13px] font-bold" style={{ color: "#991B1B" }}>ATL-brott ({violations})</h3>
              <p className="text-[11px]" style={{ color: "#DC2626" }}>Schemat bryter mot arbetstidslagen</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {stats.atl_violations.map((v, i) => (
              <div
                key={i}
                className="flex items-start gap-2 px-3 py-2 rounded-lg text-[12px]"
                style={{ background: "#FEE2E2" }}
              >
                <span className="font-semibold shrink-0" style={{ color: "#991B1B" }}>{v.doctor_name}:</span>
                <span style={{ color: "#B91C1C" }}>{v.violation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {violations === 0 && stats && (
        <div
          className="card p-4 flex items-center gap-3"
          style={{ borderColor: "#A7F3D0", background: "#F0FDF4" }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#ECFDF5" }}>
            <CheckCircle2 size={16} style={{ color: "#059669" }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "#065F46" }}>Inga ATL-brott</p>
            <p className="text-[11px]" style={{ color: "#059669" }}>Schemat följer arbetstidslagen fullt ut</p>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text = "Ingen data tillgänglig" }) {
  return (
    <div
      className="h-[220px] flex flex-col items-center justify-center rounded-xl"
      style={{ background: "#F8FAFD", border: "1px dashed #DDE4F0" }}
    >
      <TrendingUp size={24} style={{ color: "#DDE4F0" }} className="mb-2" />
      <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{text}</p>
    </div>
  );
}
