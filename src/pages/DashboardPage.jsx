import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { useClinic } from "../context/ClinicContext";
import {
  Users, ShieldCheck, ShieldAlert, Clock, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw
} from "lucide-react";

const CHART_COLORS = ["#3b82f6", "#7c3aed", "#0d9488", "#d97706", "#ef4444", "#6366f1", "#ec4899"];

function Metric({ icon: Icon, label, value, sub, variant = "default" }) {
  const variants = {
    default: { iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    success: { iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    danger:  { iconBg: "bg-red-50", iconColor: "text-red-500" },
    neutral: { iconBg: "bg-slate-100", iconColor: "text-slate-500" },
    accent:  { iconBg: "bg-violet-50", iconColor: "text-violet-600" },
  };
  const v = variants[variant];
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg ${v.iconBg} ${v.iconColor} flex items-center justify-center shrink-0`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-0.5 tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-[12px]">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { api } = useAuth();
  const { config } = useClinic();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [todayLoading, setTodayLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      api("/statistics").then(setStats).catch(() => setStats(null)),
      api("/health").then(setHealth).catch(() => setHealth(null)),
    ]).finally(() => setLoading(false));
    loadTodaySchedule();
  }, [api]);

  const loadTodaySchedule = useCallback(async () => {
    setTodayLoading(true);
    try {
      const schedules = await api("/schedules");
      if (schedules.length > 0) {
        const schedule = await api(`/schedule/${schedules[0].schedule_id}`);
        setTodaySchedule(schedule);
      } else {
        setTodaySchedule(null);
      }
    } catch {
      setTodaySchedule(null);
    } finally {
      setTodayLoading(false);
    }
  }, [api]);

  useEffect(() => { refresh(); }, [refresh]);

  const callData = useMemo(() => {
    if (!stats?.call_distribution) return [];
    return Object.values(stats.call_distribution)
      .map(d => ({ name: d.name.replace("Dr ", ""), primary: d.primary, backup: d.backup }))
      .sort((a, b) => (b.primary + b.backup) - (a.primary + a.backup))
      .slice(0, 15);
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
      .slice(0, 15);
  }, [stats]);

  const todayStaffing = useMemo(() => {
    if (!todaySchedule?.schedule || !config?.doctors) return null;
    const today = new Date().toISOString().split("T")[0];
    const doctorMap = {};
    config.doctors.forEach(d => { doctorMap[d.id] = d; });

    const assignments = [];
    const functionCounts = {};
    const functionDetails = {};

    Object.entries(todaySchedule.schedule).forEach(([docId, dayMap]) => {
      const func = dayMap[today];
      if (func && func !== "LEDIG" && func !== "SEMESTER") {
        const doc = doctorMap[docId];
        if (doc) {
          assignments.push({ docName: doc.name, role: doc.role, func });
          const prefix = func.split("_")[0];
          functionCounts[prefix] = (functionCounts[prefix] || 0) + 1;
          if (!functionDetails[prefix]) functionDetails[prefix] = [];
          functionDetails[prefix].push(doc.name);
        }
      }
    });

    const idle = [];
    Object.entries(todaySchedule.schedule).forEach(([docId, dayMap]) => {
      const func = dayMap[today];
      if (func === "LEDIG") {
        const doc = doctorMap[docId];
        if (doc) idle.push(doc.name);
      }
    });

    return { assignments, functionCounts, functionDetails, idle };
  }, [todaySchedule, config]);

  const violations = stats?.atl_violations?.length || 0;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex justify-end">
        <button onClick={refresh} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-[6px] text-[12px] text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Uppdatera
        </button>
      </div>
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={Users} label="Läkare" value={config?.num_doctors || "–"} sub={`${config?.num_rooms || 0} operationssalar`} />
        <Metric icon={violations === 0 ? ShieldCheck : ShieldAlert} label="ATL-status" value={violations === 0 ? "OK" : violations}
          sub={violations === 0 ? "Inga brott" : "Åtgärder krävs"} variant={violations === 0 ? "success" : "danger"} />
        <Metric icon={Clock} label="Uptime" value={health ? `${Math.round(health.uptime_seconds / 60)}m` : "–"} sub="Senaste omstart" variant="neutral" />
        <Metric icon={TrendingUp} label="Scheman" value={health?.schedules_generated || 0} sub="Genererade totalt" variant="accent" />
      </div>

      {/* Dagens beläggning */}
      {todaySchedule && todayStaffing && (
        <div className="card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[13px] font-semibold text-slate-700">Dagens beläggning ({new Date().toLocaleDateString("sv-SE")})</h3>
            <button onClick={loadTodaySchedule} disabled={todayLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-700 transition-colors">
              <RefreshCw size={12} className={todayLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Function badges */}
          {Object.keys(todayStaffing.functionCounts).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(todayStaffing.functionCounts).sort((a, b) => b[1] - a[1]).map(([func, count]) => (
                <span key={func} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-semibold text-blue-700">
                  {func} <span className="bg-blue-200 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">{count}</span>
                </span>
              ))}
            </div>
          )}

          {/* Staffing table */}
          {todayStaffing.assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-0 py-2">Läkare</th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Roll</th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Funktion</th>
                  </tr>
                </thead>
                <tbody>
                  {todayStaffing.assignments.map((a, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-0 py-2 font-medium text-slate-700">{a.docName}</td>
                      <td className="px-3 py-2 text-slate-600">{a.role}</td>
                      <td className="px-3 py-2"><span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">{a.func}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-[12px] text-slate-400">Ingen bemanning idag</p>
            </div>
          )}

          {/* Idle section */}
          {todayStaffing.idle.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Lediga idag</p>
              <div className="flex flex-wrap gap-2">
                {todayStaffing.idle.map((name, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">{name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-4">Jourfördelning</h3>
          {callData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={callData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} width={65} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="primary" stackId="a" fill="#3b82f6" name="Primärjour" radius={[0, 0, 0, 0]} />
                <Bar dataKey="backup" stackId="a" fill="#a78bfa" name="Bakjour" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        <div className="card p-5">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-4">Rollfördelning</h3>
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                  dataKey="value" paddingAngle={2} stroke="none"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}>
                  {roleData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Workload */}
      <div className="card p-5">
        <h3 className="text-[13px] font-semibold text-slate-700 mb-4">Arbetsbelastning (utnyttjandegrad %)</h3>
        {workloadData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={workloadData} margin={{ left: 0, right: 10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} angle={-40} textAnchor="end" height={50} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 100]} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="pct" fill="#0d9488" name="Utnyttjande %" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart text="Generera ett schema för att se arbetsbelastning" />}
      </div>

      {/* ATL status */}
      {violations > 0 && (
        <div className="card border-red-200 bg-red-50/50 p-4">
          <h3 className="text-[13px] font-semibold text-red-700 flex items-center gap-2 mb-2.5">
            <AlertTriangle size={15} /> ATL-brott ({violations})
          </h3>
          <div className="space-y-1.5">
            {stats.atl_violations.map((v, i) => (
              <div key={i} className="text-[12px] text-red-600 flex items-start gap-2">
                <span className="font-medium shrink-0">{v.doctor_name}:</span>
                <span>{v.violation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {violations === 0 && stats && (
        <div className="card border-emerald-200 bg-emerald-50/50 p-3 flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="text-[13px] text-emerald-700 font-medium">Inga ATL-brott — schemat följer arbetstidslagen fullt ut.</span>
        </div>
      )}
    </div>
  );
}

function EmptyChart({ text = "Ingen data tillgänglig" }) {
  return <div className="h-[240px] flex items-center justify-center text-[13px] text-slate-400">{text}</div>;
}
