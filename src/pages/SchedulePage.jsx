import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { explainShift } from "../api/ai";
import {
  ChevronLeft, ChevronRight, Plus, Filter, Download, FileText,
  Loader2, AlertTriangle, Check, CalendarRange, Settings2, Clock,
  X, HelpCircle, CheckCircle2, XCircle, RefreshCw, History, FlaskConical
} from "lucide-react";

/* ── Function color system ────────────────────────────────────────── */
const COLOR_PALETTES = {
  OP:       { bg: "#EBF2FF", fg: "#1560D4", border: "#C7D9FF" },
  AVD:      { bg: "#FFFBEB", fg: "#92400E", border: "#FDE68A" },
  MOTT:     { bg: "#ECFDF5", fg: "#065F46", border: "#A7F3D0" },
  AKUT:     { bg: "#FFF7ED", fg: "#9A3412", border: "#FDBA74" },
  JOUR_P:   { bg: "#FEF2F2", fg: "#991B1B", border: "#FECACA" },
  JOUR_B:   { bg: "#FFF1F2", fg: "#9F1239", border: "#FECDD3" },
  ADMIN:    { bg: "#F5F3FF", fg: "#5B21B6", border: "#DDD6FE" },
  LEDIG:    { bg: "transparent", fg: "#C5D0E4", border: "transparent" },
  SEMESTER: { bg: "#FEFCE8", fg: "#A16207", border: "#FEF08A" },
  BVC:      { bg: "#ECFDF5", fg: "#065F46", border: "#A7F3D0" },
  MVC:      { bg: "#EFF6FF", fg: "#1E40AF", border: "#BFDBFE" },
  LAB:      { bg: "#F5F3FF", fg: "#5B21B6", border: "#DDD6FE" },
  TELEFON:  { bg: "#F0F9FF", fg: "#075985", border: "#BAE6FD" },
  VIDEO:    { bg: "#F0FDF4", fg: "#14532D", border: "#BBF7D0" },
};

function getFuncStyle(funcId) {
  if (!funcId || funcId === "LEDIG") return { bg: "transparent", fg: "#C5D0E4", border: "transparent", label: "–" };
  if (COLOR_PALETTES[funcId]) return { ...COLOR_PALETTES[funcId], label: funcId.replace(/_/g, "\u00A0") };
  const prefix = funcId.split("_")[0];
  const palette = COLOR_PALETTES[prefix] || { bg: "#F2F5FA", fg: "#4A5568", border: "#DDE4F0" };
  const suffix = funcId.slice(prefix.length + 1);
  const shortSuffix = suffix.length > 5 ? suffix.slice(0, 4) + "." : suffix;
  return { ...palette, label: shortSuffix ? `${prefix}\u00A0${shortSuffix}` : prefix };
}

const ROLES = {
  "ÖL":         { color: "#1560D4", label: "ÖL" },
  "SP":         { color: "#7C3AED", label: "SP" },
  "ST_SEN":     { color: "#059669", label: "ST+" },
  "ST_TIDIG":   { color: "#0891B2", label: "ST" },
  "UL":         { color: "#D97706", label: "UL" },
  "DL":         { color: "#1560D4", label: "DL" },
  "SSK":        { color: "#059669", label: "SSK" },
  "USK":        { color: "#0891B2", label: "USK" },
  "FT":         { color: "#7C3AED", label: "FT" },
  "PSY":        { color: "#DC2626", label: "PSY" },
};

const WEEKDAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

/* ── Cell component ───────────────────────────────────────────────── */
function Cell({ func, draggable, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isOver, onClick }) {
  const f = getFuncStyle(func);
  const isEmpty = !func || func === "LEDIG";
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`
        schedule-cell rounded-md px-1 py-[5px] text-[10px] font-semibold text-center select-none leading-none cursor-pointer
        ${isDragging ? "opacity-40 scale-90" : ""}
        ${isOver ? "drag-over" : ""}
      `}
      style={{
        background: f.bg,
        color: f.fg,
        border: `1px solid ${f.border || "transparent"}`,
        opacity: isEmpty ? 0.35 : 1,
      }}
    >
      {f.label}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function SchedulePage() {
  const { api, token } = useAuth();
  const { clinics, clinicId, switchClinic, config } = useClinic();
  const [schedules, setSchedules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [dragSrc, setDragSrc] = useState(null);
  const [dropTgt, setDropTgt] = useState(null);
  const [explain, setExplain] = useState(null); // {loading, data, docId, date}
  const [showGenDialog, setShowGenDialog] = useState(false);
  const [genWeeks, setGenWeeks] = useState(2);
  const [genTimeLimit, setGenTimeLimit] = useState(30);
  const [genProgress, setGenProgress] = useState(null); // { jobId, elapsed }
  const [reoptimizing, setReoptimizing] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [diff, setDiff] = useState(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  // Simulator
  const [showSimulator, setShowSimulator] = useState(false);
  const [simScenario, setSimScenario] = useState("absence");
  const [simDoctorId, setSimDoctorId] = useState("");
  const [simDays, setSimDays] = useState(5);
  const [simResult, setSimResult] = useState(null);
  const [simRunning, setSimRunning] = useState(false);

  // Load schedules when clinic changes
  useEffect(() => {
    if (!clinicId) return;
    setSelectedId(null);
    setSchedule(null);
    api("/schedules").then(setSchedules).catch(() => setSchedules([]));
  }, [api, clinicId]);

  useEffect(() => {
    if (schedules.length && !selectedId) setSelectedId(schedules[0]?.schedule_id);
  }, [schedules]);

  const loadSchedule = useCallback((id) => {
    if (!id) return;
    setError(null);
    api(`/schedule/${id}`).then(setSchedule).catch(e => setError(e.message));
  }, [api]);

  useEffect(() => { loadSchedule(selectedId); }, [selectedId, loadSchedule]);

  const doctorMap = useMemo(() => {
    if (!config?.doctors) return {};
    const m = {};
    config.doctors.forEach(d => { m[d.id] = d; });
    return m;
  }, [config]);

  const weekData = useMemo(() => {
    if (!schedule?.schedule) return null;
    const sched = schedule.schedule;
    const startDate = new Date(schedule.start_date);
    const totalDays = schedule.num_weeks * 7;
    const dayStart = weekOffset * 7;
    const dayEnd = Math.min(dayStart + 7, totalDays);

    const dates = [];
    for (let i = dayStart; i < dayEnd; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    const rows = [];
    for (const [docId, dayMap] of Object.entries(sched)) {
      const doc = doctorMap[docId] || { id: docId, name: docId, role: "?" };
      const cells = dates.map(d => dayMap[d.toISOString().split("T")[0]] || "LEDIG");
      rows.push({ doc, cells });
    }

    const order = { "ÖL": 0, "SP": 1, "ST_SEN": 2, "ST_TIDIG": 3, "UL": 4 };
    rows.sort((a, b) => (order[a.doc.role] ?? 9) - (order[b.doc.role] ?? 9) || (a.doc.name || "").localeCompare(b.doc.name || ""));

    return { dates, rows, dayStart, totalDays };
  }, [schedule, doctorMap, weekOffset]);

  const filteredRows = useMemo(() => {
    if (!weekData) return [];
    return roleFilter === "ALL" ? weekData.rows : weekData.rows.filter(r => r.doc.role === roleFilter);
  }, [weekData, roleFilter]);

  const maxWeek = schedule ? schedule.num_weeks - 1 : 0;

  const weekLabel = weekData?.dates?.length
    ? `${weekData.dates[0].toLocaleDateString("sv-SE", { day: "numeric", month: "short" })} – ${weekData.dates.at(-1).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}`
    : "";

  /* ── Generate with job polling ─── */
  const generate = async () => {
    setGenerating(true); setError(null); setShowGenDialog(false);
    const startTime = Date.now();
    try {
      const res = await api("/schedule/generate", {
        method: "POST",
        body: JSON.stringify({ clinic_id: clinicId, num_weeks: genWeeks, time_limit_seconds: genTimeLimit }),
      });

      // If schedule returned directly (sync solve)
      if (res.schedule_id && res.schedule) {
        setSelectedId(res.schedule_id);
        setSchedules(await api("/schedules"));
        setWeekOffset(0);
        setGenerating(false);
        return;
      }

      // Async solve — poll job status
      const jobId = res.job_id;
      const scheduleId = res.schedule_id;
      if (!jobId) { setSelectedId(scheduleId); setSchedules(await api("/schedules")); setWeekOffset(0); setGenerating(false); return; }

      const poll = async () => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        setGenProgress({ jobId, elapsed });
        try {
          const job = await api(`/job/${jobId}`);
          if (job.status === "completed") {
            setGenProgress(null);
            setSelectedId(scheduleId || job.schedule_id);
            setSchedules(await api("/schedules"));
            setWeekOffset(0);
            setGenerating(false);
          } else if (job.status === "failed" || job.status === "infeasible") {
            setGenProgress(null);
            setError(job.error || `Schema ${job.status}`);
            setGenerating(false);
          } else {
            setTimeout(poll, 2000);
          }
        } catch (e) {
          setGenProgress(null); setError(e.message); setGenerating(false);
        }
      };
      setTimeout(poll, 1500);
    } catch (e) { setError(e.message); setGenerating(false); setGenProgress(null); }
  };

  /* ── Reoptimize with job polling ─── */
  const reoptimize = async () => {
    setReoptimizing(true); setError(null);
    const startTime = Date.now();
    try {
      const res = await api("/schedule/reoptimize", {
        method: "POST",
        body: JSON.stringify({ schedule_id: selectedId, time_limit_seconds: 30 }),
      });

      // If schedule returned directly (sync solve)
      if (res.schedule_id && res.schedule) {
        setSelectedId(res.schedule_id);
        setSchedules(await api("/schedules"));
        setReoptimizing(false);
        return;
      }

      // Async solve — poll job status
      const jobId = res.job_id;
      const scheduleId = res.schedule_id;
      if (!jobId) { setSelectedId(scheduleId); setSchedules(await api("/schedules")); setReoptimizing(false); return; }

      const poll = async () => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        setGenProgress({ jobId, elapsed });
        try {
          const job = await api(`/job/${jobId}`);
          if (job.status === "completed") {
            setGenProgress(null);
            setSelectedId(scheduleId || job.schedule_id);
            setSchedules(await api("/schedules"));
            setReoptimizing(false);
          } else if (job.status === "failed" || job.status === "infeasible") {
            setGenProgress(null);
            setError(job.error || `Schema ${job.status}`);
            setReoptimizing(false);
          } else {
            setTimeout(poll, 2000);
          }
        } catch (e) {
          setGenProgress(null); setError(e.message); setReoptimizing(false);
        }
      };
      setTimeout(poll, 1500);
    } catch (e) { setError(e.message); setReoptimizing(false); setGenProgress(null); }
  };

  /* ── Version history ─── */
  const fetchVersions = async () => {
    if (!selectedId) return;
    setVersionsLoading(true);
    setDiff(null);
    setSelectedVersion(null);
    try {
      const res = await api(`/schedule/${selectedId}/versions`);
      setVersions(res.versions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setVersionsLoading(false);
    }
  };

  const compareVersions = async (v1Index) => {
    if (!selectedId || !versions.length) return;
    setDiff(null);
    const v1 = versions[v1Index];
    const v2 = versions[0]; // latest
    if (!v1 || !v2 || v1.version === v2.version) return;

    try {
      const res = await api(`/schedule/${selectedId}/diff/${v1.version}/${v2.version}`);
      setDiff(res);
      setSelectedVersion(v1Index);
    } catch (e) {
      setError(e.message);
    }
  };

  /* ── Drag & drop swap ─── */
  const onDragStart = (docId, ci) => (e) => {
    setDragSrc({ docId, ci });
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (docId, ci) => (e) => {
    if (!dragSrc || dragSrc.ci !== ci || dragSrc.docId === docId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTgt({ docId, ci });
  };
  const onDragEnd = () => { setDragSrc(null); setDropTgt(null); };
  const onDrop = (targetDoc, ci) => async (e) => {
    e.preventDefault();
    if (!dragSrc || dragSrc.ci !== ci || dragSrc.docId === targetDoc) { onDragEnd(); return; }
    try {
      const res = await api("/schedule/adjust", {
        method: "POST",
        body: JSON.stringify({
          schedule_id: selectedId,
          adjustment_type: "swap",
          doctor_id: dragSrc.docId,
          day: weekData.dayStart + ci,
          swap_with_doctor_id: targetDoc,
        }),
      });
      showToast(res.adjustment, res.warnings);
      loadSchedule(selectedId);
    } catch (err) { showToast(err.message, [], true); }
    onDragEnd();
  };

  const showToast = (text, warnings = [], isError = false) => {
    setToast({ text, warnings, isError });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── Explain shift ─── */
  const handleExplain = async (docId, dateStr) => {
    setExplain({ loading: true, data: null, docId, date: dateStr });
    try {
      const data = await explainShift(api, selectedId, docId, dateStr);
      setExplain({ loading: false, data, docId, date: dateStr });
    } catch (e) {
      setExplain({ loading: false, data: { error: e.message }, docId, date: dateStr });
    }
  };

  /* ── Export ─── */
  const exportPdf = async () => {
    if (!schedule) return;
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    try {
      const res = await fetch(`${apiBase}/export/schedule/${selectedId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = `schema_${selectedId}.pdf`; a.click(); URL.revokeObjectURL(a.href);
      } else { showToast("PDF-export misslyckades", [], true); }
    } catch { showToast("PDF-export ej tillganglig", [], true); }
  };

  const exportSchedule = async () => {
    if (!schedule) return;
    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiBase}/schedule/${selectedId}/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `schema_${selectedId}.xlsx`;
        a.click();
        URL.revokeObjectURL(a.href);
        return;
      }
    } catch {}
    // CSV fallback
    if (!weekData) return;
    const start = new Date(schedule.start_date);
    const allDates = Array.from({ length: schedule.num_weeks * 7 }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); return d;
    });
    const header = ["Läkare", "Roll", ...allDates.map(d => d.toISOString().split("T")[0])];
    const csvRows = Object.entries(schedule.schedule).map(([docId, dayMap]) => {
      const doc = doctorMap[docId] || { name: docId, role: "?" };
      return [doc.name, doc.role, ...allDates.map(d => dayMap[d.toISOString().split("T")[0]] || "LEDIG")];
    });
    const csv = [header, ...csvRows].map(r => r.map(c => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `schema_${selectedId}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* ── Staffing summary ─── */
  const staffing = useMemo(() => {
    if (!weekData) return {};
    const out = {};
    weekData.dates.forEach((_, di) => {
      const c = {};
      filteredRows.forEach(r => { const f = r.cells[di]; if (f !== "LEDIG" && f !== "SEMESTER") c[f] = (c[f] || 0) + 1; });
      out[di] = c;
    });
    return out;
  }, [weekData, filteredRows]);

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>Schema</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {config ? `${config.num_doctors} läkare · ${config.num_rooms} operationssalar · ${schedule?.num_weeks || "–"} veckor` : "Laddar konfiguration..."}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={selectedId || ""} onChange={e => { setSelectedId(e.target.value); setWeekOffset(0); }}
            className="text-[12px] rounded-lg px-3 py-[7px] outline-none"
            style={{ border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text-primary)" }}>
            {schedules.length === 0 && <option value="">Inga scheman</option>}
            {schedules.map(s => (
              <option key={s.schedule_id} value={s.schedule_id}>
                {new Date(s.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} ({s.num_weeks}v)
              </option>
            ))}
          </select>

          <div className="relative">
            <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="text-[12px] rounded-lg pl-7 pr-3 py-[7px] appearance-none outline-none"
              style={{ border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text-primary)" }}>
              <option value="ALL">Alla roller</option>
              <option value="ÖL">Överläkare</option>
              <option value="SP">Specialist</option>
              <option value="ST_SEN">ST (senior)</option>
              <option value="ST_TIDIG">ST (tidig)</option>
              <option value="UL">Underläkare</option>
            </select>
          </div>

          {schedule && (
            <>
              <button onClick={() => setShowSimulator(s => !s)}
                className="flex items-center gap-1.5 px-3 py-[7px] text-[12px] font-medium rounded-lg border transition-colors"
                style={showSimulator
                  ? { background: "#0891B2", color: "white", borderColor: "#0891B2" }
                  : { background: "var(--card-bg)", color: "#0891B2", borderColor: "#BAE6FD" }}>
                <FlaskConical size={13} /> Simulator
              </button>
              <button onClick={() => { setShowVersions(!showVersions); if (!showVersions) fetchVersions(); }}
                className="flex items-center gap-1.5 px-3 py-[7px] text-[12px] font-medium rounded-lg border transition-colors"
                style={{ background: "var(--card-bg)", color: "#D97706", borderColor: "#FDE68A" }}>
                <History size={13} />
                {showVersions ? "Dölj" : "Historik"}
              </button>
              <button onClick={reoptimize} disabled={reoptimizing}
                className="flex items-center gap-1.5 px-3 py-[7px] text-[12px] font-medium rounded-lg border transition-colors disabled:opacity-50"
                style={{ background: "var(--card-bg)", color: "#7C3AED", borderColor: "#DDD6FE" }}>
                {reoptimizing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {reoptimizing ? "Reoptimerar..." : "Reoptimera"}
              </button>
              <button onClick={exportSchedule}
                className="flex items-center gap-1.5 px-3 py-[7px] text-[12px] font-medium rounded-lg border transition-colors"
                style={{ background: "var(--card-bg)", color: "var(--text-secondary)", borderColor: "var(--card-border)" }}>
                <Download size={13} /> Excel
              </button>
              <button onClick={exportPdf}
                className="flex items-center gap-1.5 px-3 py-[7px] text-[12px] font-medium rounded-lg border transition-colors"
                style={{ background: "var(--card-bg)", color: "#DC2626", borderColor: "#FECACA" }}>
                <FileText size={13} /> PDF
              </button>
            </>
          )}

          <button onClick={() => generating ? null : setShowGenDialog(true)} disabled={generating}
            className="flex items-center gap-1.5 px-4 py-[7px] text-white text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-50"
            style={{ background: "var(--primary)", boxShadow: "0 2px 8px rgba(21,96,212,0.25)" }}>
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} strokeWidth={2.5} />}
            {generating ? (genProgress ? `Optimerar... ${genProgress.elapsed}s` : "Startar...") : "Nytt schema"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 text-red-700 rounded-lg text-[13px]">
          <AlertTriangle size={15} /> {error}
        </div>
      )}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] transition-all ${
          toast.isError ? "bg-red-50 border border-red-100 text-red-700" : "bg-emerald-50 border border-emerald-100 text-emerald-700"
        }`}>
          {toast.isError ? <AlertTriangle size={14} /> : <Check size={14} />}
          {toast.text}
          {toast.warnings?.length > 0 && <span className="text-amber-600 ml-1 text-[12px]">({toast.warnings.join("; ")})</span>}
        </div>
      )}

      {/* Version history panel */}
      {showVersions && schedule && (
        <div className="card p-4 border-amber-200 bg-amber-50/30">
          <div className="flex items-center gap-2 mb-3">
            <History size={15} className="text-amber-600" />
            <span className="text-[13px] font-semibold text-slate-700">Versionshistorik</span>
          </div>

          {versionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="animate-spin text-amber-600" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-[12px] text-slate-500 py-4 text-center">Inga versioner tillgängliga</div>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                {versions.map((v, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-md border transition-colors cursor-pointer ${
                      selectedVersion === idx
                        ? "bg-white border-amber-300 border-2"
                        : "bg-white border-slate-200 hover:border-amber-200"
                    }`}
                    onClick={() => compareVersions(idx)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[12px] font-semibold text-slate-700">Version {v.version}</span>
                        <span className="text-[11px] text-slate-500 ml-2">
                          {new Date(v.timestamp).toLocaleString("sv-SE")}
                        </span>
                      </div>
                      {idx === 0 && <span className="text-[10px] font-medium px-2 py-1 rounded bg-emerald-100 text-emerald-700">Aktuell</span>}
                    </div>
                    {v.summary && <div className="text-[11px] text-slate-600 mt-1">{v.summary}</div>}
                  </div>
                ))}
              </div>

              {diff && selectedVersion !== null && (
                <div className="border-t border-amber-200 pt-3">
                  <div className="text-[12px] font-semibold text-slate-700 mb-2">Ändringar från version {versions[selectedVersion].version} till aktuell</div>
                  {diff.summary && <div className="text-[11px] text-slate-600 mb-2">{diff.summary}</div>}
                  {diff.changed_assignments && diff.changed_assignments.length > 0 ? (
                    <div className="space-y-1 max-h-[150px] overflow-y-auto">
                      {diff.changed_assignments.map((change, idx) => {
                        const doc = doctorMap[change.doctor_id];
                        const docName = doc?.name || change.doctor_id;
                        return (
                          <div key={idx} className="text-[11px] text-slate-700 p-2 bg-white/60 rounded border border-amber-100">
                            <span className="font-medium">{docName}</span>
                            <span className="text-slate-500 mx-1">{change.day}:</span>
                            <span className="text-red-600">{change.old_func}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="text-emerald-600">{change.new_func}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 text-center py-2">Inga ändringar mellan versioner</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Generate dialog */}
      {showGenDialog && (
        <div className="card p-4 border-blue-200 bg-blue-50/30">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 size={15} className="text-blue-600" />
            <span className="text-[13px] font-semibold text-slate-700">Genereringsinstallningar</span>
          </div>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Antal veckor</label>
              <select value={genWeeks} onChange={e => setGenWeeks(Number(e.target.value))}
                className="text-[12px] border border-slate-200 rounded-lg px-3 py-[7px] bg-white">
                {[1,2,3,4,6,8].map(n => <option key={n} value={n}>{n} veckor</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Tidsgrans (sekunder)</label>
              <select value={genTimeLimit} onChange={e => setGenTimeLimit(Number(e.target.value))}
                className="text-[12px] border border-slate-200 rounded-lg px-3 py-[7px] bg-white">
                {[10,15,30,60,120].map(n => <option key={n} value={n}>{n}s</option>)}
              </select>
            </div>
            <button onClick={generate}
              className="flex items-center gap-1.5 px-4 py-[7px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-lg transition-colors">
              <Plus size={13} /> Generera
            </button>
            <button onClick={() => setShowGenDialog(false)}
              className="px-3 py-[7px] text-[12px] text-slate-500 hover:text-slate-700">Avbryt</button>
          </div>
        </div>
      )}

      {/* Week nav */}
      {schedule && (
        <div className="card flex items-center justify-between px-4 py-2.5">
          <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0}
            className="p-1.5 rounded-lg disabled:opacity-20 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--primary-light)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Vecka {weekOffset + 1} av {schedule.num_weeks}</span>
            <span className="text-[12px] ml-3" style={{ color: "var(--text-muted)" }}>{weekLabel}</span>
          </div>
          <button onClick={() => setWeekOffset(w => Math.min(maxWeek, w + 1))} disabled={weekOffset >= maxWeek}
            className="p-1.5 rounded-lg disabled:opacity-20 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--primary-light)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Grid */}
      {weekData && filteredRows.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[720px] grid-table">
              <thead>
                <tr>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-3 py-2.5 w-44 sticky left-0 z-10 backdrop-blur-sm"
                    style={{ background: "var(--nav-bg)", color: "rgba(255,255,255,0.5)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                    Läkare
                  </th>
                  {weekData.dates.map((d, i) => {
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <th key={i} className="text-center px-1.5 py-2"
                        style={{ background: isWeekend ? "rgba(14,41,87,0.04)" : "var(--nav-bg)" }}>
                        <div className="text-[11px] font-semibold" style={{ color: isWeekend ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.75)" }}>
                          {WEEKDAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                        </div>
                        <div className="text-[10px] font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>{d.getDate()}/{d.getMonth() + 1}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const role = ROLES[row.doc.role] || { color: "#94a3b8", label: "?" };
                  return (
                    <tr key={row.doc.id} className="transition-colors"
                      style={{ borderBottom: "1px solid var(--card-border)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--primary-light)"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td className="px-3 py-[5px] sticky left-0 z-10" style={{ background: "var(--card-bg)", borderRight: "1px solid var(--card-border)" }}>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-[24px] h-[17px] rounded text-[9px] font-bold text-white shrink-0"
                            style={{ background: role.color }}>{role.label}</span>
                          <span className="text-[12px] font-medium truncate max-w-[130px]" style={{ color: "var(--text-primary)" }}>{row.doc.name}</span>
                        </div>
                      </td>
                      {row.cells.map((func, ci) => {
                        const isWeekend = weekData.dates[ci]?.getDay() === 0 || weekData.dates[ci]?.getDay() === 6;
                        return (
                          <td key={ci} className="px-[3px] py-[3px]"
                            style={isWeekend ? { background: "rgba(14,41,87,0.02)" } : {}}
                            onDragLeave={() => { if (dropTgt?.docId === row.doc.id && dropTgt?.ci === ci) setDropTgt(null); }}
                          >
                            <Cell func={func} draggable
                              isDragging={dragSrc?.docId === row.doc.id && dragSrc?.ci === ci}
                              isOver={dropTgt?.docId === row.doc.id && dropTgt?.ci === ci}
                              onDragStart={onDragStart(row.doc.id, ci)}
                              onDragOver={onDragOver(row.doc.id, ci)}
                              onDrop={onDrop(row.doc.id, ci)}
                              onDragEnd={onDragEnd}
                              onClick={() => {
                                if (func !== "LEDIG" && selectedId) {
                                  const dateStr = weekData.dates[ci]?.toISOString().split("T")[0];
                                  handleExplain(row.doc.id, dateStr);
                                }
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Staffing strip */}
          <div className="px-3 py-2" style={{ borderTop: "1px solid var(--card-border)", background: "var(--bg-main)" }}>
            <div className="flex items-center gap-4 overflow-x-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ color: "var(--text-muted)" }}>Bemanning</span>
              {weekData.dates.map((_, i) => {
                const c = staffing[i] || {};
                const total = Object.values(c).reduce((a, b) => a + b, 0);
                const jp = c["JOUR_P"] || 0;
                const jb = c["JOUR_B"] || 0;
                return (
                  <div key={i} className="text-center shrink-0 min-w-[55px]">
                    <span className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>{total}</span>
                    {(jp > 0 || jb > 0) && <span className="text-[10px] ml-0.5" style={{ color: "#DC2626" }}>J{jp}+{jb}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : !schedule ? (
        <div className="card text-center py-20" style={{ borderStyle: "dashed", background: "transparent" }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "var(--primary-light)" }}>
            <CalendarRange size={28} style={{ color: "var(--primary)" }} strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Inget schema valt</p>
          <p className="text-[13px] mt-1.5" style={{ color: "var(--text-muted)" }}>Generera ett nytt schema eller välj ett befintligt ovan.</p>
        </div>
      ) : null}

      {/* Legend — dynamic from schedule functions */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {schedule && (() => {
          const funcs = new Set();
          Object.values(schedule.schedule || {}).forEach(days => Object.values(days).forEach(f => { if (f !== "LEDIG") funcs.add(f); }));
          return [...funcs].sort().map(key => {
            const f = getFuncStyle(key);
            return <span key={key} className="text-[9px] font-semibold px-2 py-[3px] rounded-md" style={{ background: f.bg, color: f.fg, border: `1px solid ${f.border}` }}>{f.label}</span>;
          });
        })()}
        <span className="text-[10px] ml-2 self-center" style={{ color: "var(--text-muted)" }}>Klicka på en cell för förklaring. Dra för att byta pass.</span>
      </div>

      {/* Explain modal */}
      {explain && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setExplain(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-[14px] font-semibold text-slate-800 flex items-center gap-2">
                <HelpCircle size={16} className="text-violet-500" /> Forklaring
              </h3>
              <button onClick={() => setExplain(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="text-[11px] text-slate-400">{explain.docId} | {explain.date}</div>
            {explain.loading ? (
              <div className="py-8 text-center"><Loader2 size={24} className="animate-spin text-violet-500 mx-auto" /></div>
            ) : explain.data?.error ? (
              <div className="text-[13px] text-red-600">{explain.data.error}</div>
            ) : (
              <>
                <p className="text-[13px] text-slate-700">{explain.data?.explanation_sv}</p>
                {explain.data?.constraints_applied?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-500 mb-1">Tillampade regler</h4>
                    {explain.data.constraints_applied.map((c, i) => (
                      <div key={i} className="text-[12px] text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> {c}
                      </div>
                    ))}
                  </div>
                )}
                {explain.data?.alternatives_considered?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-500 mb-1">Forkastade alternativ</h4>
                    {explain.data.alternatives_considered.map((a, i) => (
                      <div key={i} className="text-[12px] text-red-500 flex items-start gap-1.5">
                        <XCircle size={12} className="mt-0.5 shrink-0" />
                        <span>{a.doctor}: {a.reason_rejected}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Simulator panel */}
      {showSimulator && (
        <div className="card p-4 space-y-4 border-teal-200 bg-teal-50/30">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-slate-800 flex items-center gap-2">
              <FlaskConical size={16} className="text-teal-600" /> Schema-simulator
            </h3>
            <button onClick={() => setShowSimulator(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <p className="text-[12px] text-slate-500">Simulera hur schemat påverkas av ett scenario utan att ändra det aktiva schemat.</p>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Scenario</label>
              <select value={simScenario} onChange={e => setSimScenario(e.target.value)}
                className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-2 focus:border-teal-400 outline-none bg-white">
                <option value="absence">Sjukfrånvaro — täck upp</option>
                <option value="extra_doctor">Lägg till extra läkare</option>
                <option value="remove_doctor">Ta bort läkare tillfälligt</option>
                <option value="high_demand">Hög belastning (+30% jour)</option>
                <option value="understaffed">Underbemanning</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Läkar-ID (valfritt)</label>
              <input value={simDoctorId} onChange={e => setSimDoctorId(e.target.value)}
                placeholder="t.ex. SP1"
                className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-2 focus:border-teal-400 outline-none bg-white" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Dagar att simulera</label>
              <input type="number" min="1" max="30" value={simDays} onChange={e => setSimDays(parseInt(e.target.value) || 5)}
                className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-2 focus:border-teal-400 outline-none bg-white" />
            </div>
          </div>

          <button
            onClick={async () => {
              if (!selectedId) return;
              setSimRunning(true);
              setSimResult(null);
              try {
                const result = await api("/simulate", {
                  method: "POST",
                  body: JSON.stringify({
                    schedule_id: selectedId,
                    clinic_id: clinicId || "kristianstad",
                    scenario: simScenario,
                    doctor_id: simDoctorId || undefined,
                    days: simDays,
                  }),
                });
                setSimResult(result);
              } catch (e) {
                setSimResult({ error: "Simulering misslyckades — " + (e.message || "okänt fel") });
              } finally {
                setSimRunning(false);
              }
            }}
            disabled={simRunning || !selectedId}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-[12px] font-medium rounded-lg">
            {simRunning ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
            {simRunning ? "Simulerar..." : "Kör simulering"}
          </button>

          {simResult && (
            <div className={`card p-4 space-y-3 ${simResult.error ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50/50"}`}>
              {simResult.error ? (
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle size={14} /> <span className="text-[12px]">{simResult.error}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={14} /> <span className="text-[13px] font-semibold">Simulering klar</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {simResult.coverage_pct !== undefined && (
                      <div className="card p-2.5 bg-white">
                        <p className="text-[10px] text-slate-400">Täckning</p>
                        <p className={`text-[18px] font-bold ${simResult.coverage_pct >= 90 ? "text-emerald-600" : simResult.coverage_pct >= 70 ? "text-orange-500" : "text-red-600"}`}>
                          {simResult.coverage_pct}%
                        </p>
                      </div>
                    )}
                    {simResult.uncovered_slots !== undefined && (
                      <div className="card p-2.5 bg-white">
                        <p className="text-[10px] text-slate-400">Otäckta pass</p>
                        <p className={`text-[18px] font-bold ${simResult.uncovered_slots === 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {simResult.uncovered_slots}
                        </p>
                      </div>
                    )}
                    {simResult.overtime_hours !== undefined && (
                      <div className="card p-2.5 bg-white">
                        <p className="text-[10px] text-slate-400">Övertid (h)</p>
                        <p className="text-[18px] font-bold text-slate-800">{simResult.overtime_hours}</p>
                      </div>
                    )}
                    {simResult.fairness_delta !== undefined && (
                      <div className="card p-2.5 bg-white">
                        <p className="text-[10px] text-slate-400">Rättvisa Δ</p>
                        <p className={`text-[18px] font-bold ${Math.abs(simResult.fairness_delta) < 0.1 ? "text-emerald-600" : "text-orange-500"}`}>
                          {simResult.fairness_delta > 0 ? "+" : ""}{simResult.fairness_delta?.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                  {simResult.recommendations?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-600 mb-1">Rekommendationer:</p>
                      {simResult.recommendations.map((r, i) => (
                        <div key={i} className="text-[12px] text-slate-700 flex items-start gap-1.5">
                          <Check size={11} className="text-emerald-600 mt-0.5 shrink-0" /> {r}
                        </div>
                      ))}
                    </div>
                  )}
                  {simResult.warnings?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-amber-700 mb-1">Varningar:</p>
                      {simResult.warnings.map((w, i) => (
                        <div key={i} className="text-[12px] text-amber-700 flex items-start gap-1.5">
                          <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {w}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
