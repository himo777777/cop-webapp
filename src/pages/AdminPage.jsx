import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import {
  ShieldCheck, Database, Users, Plus, Loader2, AlertTriangle, CheckCircle2,
  Stethoscope, Scale, Clock, Settings2, Trash2, Save, ToggleLeft, ToggleRight,
  Upload, CalendarOff, FileSpreadsheet, ScrollText, RefreshCw
} from "lucide-react";
import DoctorAdvancedModal from "../components/DoctorAdvancedModal";

const inputClass = "w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-colors";
const DOCTOR_ROLES = [
  { value: "ÖL", label: "Överläkare" }, { value: "SP", label: "Specialist" },
  { value: "ST_SEN", label: "ST (senior)" }, { value: "ST_TIDIG", label: "ST (tidig)" },
  { value: "UL", label: "Underläkare" },
];
const USER_ROLES = [
  { value: "admin", label: "Administratör" }, { value: "scheduler", label: "Schemaläggare" },
  { value: "doctor", label: "Läkare" }, { value: "viewer", label: "Läsare" },
];

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
      active ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
    }`}>
      <Icon size={15} /> {label}
    </button>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-lg text-[12px] ${
      msg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
    }`}>
      {msg.type === "success" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {msg.text}
    </div>
  );
}

/* ── DOCTORS TAB ─── */
function DoctorsTab({ api, clinicId, config, onSaved }) {
  const [doctors, setDoctors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [newDoc, setNewDoc] = useState({ id: "", name: "", role: "SP", employment_rate: 1.0, can_primary_call: false, can_backup_call: false, competencies: "" });
  const [advancedDoc, setAdvancedDoc] = useState(null);

  useEffect(() => {
    if (config?.doctors) setDoctors(config.doctors.map(d => ({ ...d, competencies: Array.isArray(d.competencies) ? d.competencies : [] })));
  }, [config]);

  const addDoctor = () => {
    if (!newDoc.id || !newDoc.name) return;
    const doc = {
      ...newDoc,
      employment_rate: parseFloat(newDoc.employment_rate) || 1.0,
      competencies: typeof newDoc.competencies === "string" ? newDoc.competencies.split(",").map(s => s.trim()).filter(Boolean) : [],
      exempt_from_call: false, supervisor_id: null, site_preference: null,
      required_procedures: {}, completed_procedures: {},
    };
    setDoctors(prev => [...prev, doc]);
    setNewDoc({ id: "", name: "", role: "SP", employment_rate: 1.0, can_primary_call: false, can_backup_call: false, competencies: "" });
    setDirty(true);
  };

  const removeDoctor = (id) => {
    setDoctors(prev => prev.filter(d => d.id !== id));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await api(`/config/${clinicId}/doctors`, { method: "PATCH", body: JSON.stringify(doctors) });
      setMsg({ type: "success", text: `${doctors.length} läkare sparade` });
      setDirty(false);
      onSaved?.();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[13px] font-semibold text-slate-700">{doctors.length} läkare</h3>
        <button onClick={save} disabled={saving}
          className={`flex items-center gap-1.5 px-3 py-[6px] text-white text-[12px] font-medium rounded-lg transition-all ${
            dirty
              ? "bg-blue-600 hover:bg-blue-700 animate-pulse shadow-md"
              : "bg-blue-600 hover:bg-blue-700"
          } disabled:opacity-50`}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Spara
        </button>
      </div>

      {/* Unsaved changes warning */}
      {dirty && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[12px] font-medium text-amber-700">Du har osparade ändringar</span>
        </div>
      )}

      {/* Doctor list */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {doctors.map(d => (
          <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-[12px]">
            <span className="font-mono text-slate-400 w-10">{d.id}</span>
            <span className="font-medium text-slate-700 flex-1 truncate">{d.name}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{d.role}</span>
            <span className="text-slate-400 w-10 text-right">{Math.round((d.employment_rate || d.employment_percent || 1) * 100)}%</span>
            {d.schedule_pattern && d.schedule_pattern !== "weekly" && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700" title="Schemamönster">
                {d.schedule_pattern === "biweekly_even" ? "2v:J" : "2v:U"}
              </span>
            )}
            <span className={`w-2 h-2 rounded-full ${d.can_primary_call ? "bg-red-400" : "bg-slate-200"}`} title="Primärjour" />
            <span className={`w-2 h-2 rounded-full ${d.can_backup_call ? "bg-amber-400" : "bg-slate-200"}`} title="Bakjour" />
            <button
              onClick={() => setAdvancedDoc(d)}
              className="text-slate-300 hover:text-blue-500 transition-colors"
              title="Avancerade inställningar"
            >
              <Settings2 size={13} />
            </button>
            <button onClick={() => removeDoctor(d.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {/* Advanced modal */}
      {advancedDoc && (
        <DoctorAdvancedModal
          doctor={advancedDoc}
          onClose={() => setAdvancedDoc(null)}
          onSave={(id, patch) => {
            setDoctors(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
            setAdvancedDoc(null);
            setDirty(true);
          }}
        />
      )}

      {/* Add form */}
      <div className="card p-3 border-dashed border-slate-300">
        <div className="grid grid-cols-6 gap-2 items-end">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">ID</label>
            <input value={newDoc.id} onChange={e => setNewDoc(p => ({ ...p, id: e.target.value }))} className={inputClass} placeholder="SP9" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] text-slate-400 mb-1">Namn</label>
            <input value={newDoc.name} onChange={e => setNewDoc(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="Dr Namn" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Roll</label>
            <select value={newDoc.role} onChange={e => setNewDoc(p => ({ ...p, role: e.target.value }))} className={inputClass}>
              {DOCTOR_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Tjänst %</label>
            <input type="number" min="0.1" max="1" step="0.1" value={newDoc.employment_rate}
              onChange={e => setNewDoc(p => ({ ...p, employment_rate: e.target.value }))} className={inputClass} />
          </div>
          <button onClick={addDoctor} className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium rounded-lg">
            <Plus size={13} /> Lägg till
          </button>
        </div>
      </div>

      <Toast msg={msg} />
    </div>
  );
}

/* ── RULES TAB ─── */
function RulesTab({ api, clinicId, config, onSaved }) {
  const [rules, setRules] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (config?.constraint_rules) setRules(config.constraint_rules.map(r => ({ ...r })));
  }, [config]);

  const toggleRule = (idx) => {
    setRules(prev => prev.map((r, i) => i === idx ? { ...r, enabled: !r.enabled } : r));
  };

  const setWeight = (idx, w) => {
    setRules(prev => prev.map((r, i) => i === idx ? { ...r, weight: parseInt(w) || 5 } : r));
  };

  const toggleHard = (idx) => {
    setRules(prev => prev.map((r, i) => i === idx ? { ...r, is_hard: !r.is_hard } : r));
  };

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await api(`/config/${clinicId}/rules`, { method: "PATCH", body: JSON.stringify(rules) });
      setMsg({ type: "success", text: "Regler sparade" });
      onSaved?.();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setSaving(false);
  };

  const categoryColors = { atl: "text-red-600 bg-red-50", staffing: "text-blue-600 bg-blue-50", fairness: "text-violet-600 bg-violet-50", preference: "text-emerald-600 bg-emerald-50" };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[13px] font-semibold text-slate-700">{rules.length} regler</h3>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-[6px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[12px] font-medium rounded-lg">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Spara
        </button>
      </div>

      <div className="space-y-2">
        {rules.map((rule, idx) => (
          <div key={rule.id} className={`card p-3 flex items-center gap-3 ${!rule.enabled ? "opacity-50" : ""}`}>
            <button onClick={() => toggleRule(idx)} className="shrink-0">
              {rule.enabled ? <ToggleRight size={20} className="text-blue-600" /> : <ToggleLeft size={20} className="text-slate-300" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-slate-700">{rule.name}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${categoryColors[rule.category] || "text-slate-500 bg-slate-50"}`}>
                  {rule.category.toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">{rule.id}</span>
            </div>

            <button onClick={() => toggleHard(idx)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${rule.is_hard ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-600"}`}>
              {rule.is_hard ? "HARD" : "MJUK"}
            </button>

            {!rule.is_hard && (
              <div className="flex items-center gap-2 shrink-0">
                <input type="range" min="1" max="10" value={rule.weight} onChange={e => setWeight(idx, e.target.value)}
                  className="w-20 accent-blue-600" />
                <span className="text-[11px] font-mono text-slate-500 w-4">{rule.weight}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Toast msg={msg} />
    </div>
  );
}

/* ── USERS TAB ─── */
function UsersTab({ api }) {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", full_name: "", email: "", role: "viewer" });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadUsers = useCallback(() => {
    api("/auth/users").then(setUsers).catch(() => setUsers([]));
  }, [api]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const createUser = async (e) => {
    e.preventDefault(); setCreating(true); setMsg(null);
    try {
      await api("/auth/users", { method: "POST", body: JSON.stringify(newUser) });
      setNewUser({ username: "", password: "", full_name: "", email: "", role: "viewer" });
      setMsg({ type: "success", text: "Användare skapad" });
      loadUsers();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setCreating(false);
  };

  const roleBadge = (role) => {
    const c = { admin: "bg-blue-100 text-blue-700", scheduler: "bg-violet-100 text-violet-700", doctor: "bg-teal-100 text-teal-700", viewer: "bg-slate-100 text-slate-600" };
    return c[role] || c.viewer;
  };

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 space-y-1">
        {users.map(u => (
          <div key={u.user_id || u.username} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-500 shrink-0">
              {u.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-slate-700 truncate">{u.full_name}</div>
              <div className="text-[11px] text-slate-400">{u.username}</div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge(u.role)}`}>{u.role}</span>
          </div>
        ))}
      </div>

      <div className="lg:col-span-2 card p-4">
        <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Ny användare</h3>
        <form onSubmit={createUser} className="space-y-2.5">
          <input value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))}
            required className={inputClass} placeholder="Namn" />
          <input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
            required className={inputClass} placeholder="Användarnamn" />
          <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
            className={inputClass} placeholder="E-post" />
          <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
            required className={inputClass} placeholder="Lösenord" />
          <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} className={inputClass}>
            {USER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button type="submit" disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-[12px] rounded-lg">
            {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Skapa
          </button>
        </form>
        <Toast msg={msg} />
      </div>
    </div>
  );
}

/* ── VACATION TAB (Bulk-import semester) ─── */
function VacationTab({ api, clinicId, config }) {
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [msg, setMsg] = useState(null);

  const doctors = config?.doctors || [];

  // Parse CSV text: expects "doctor_id,start_date,end_date" or "doctor_id,date"
  const parseCSV = (text) => {
    const lines = text.trim().split("\n").filter(l => l.trim() && !l.startsWith("#"));
    const parsed = [];
    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map(s => s.trim().replace(/"/g, ""));
      if (parts.length < 2) continue;
      // Skip header row
      if (parts[0].toLowerCase().includes("doctor") || parts[0].toLowerCase().includes("lakare") || parts[0].toLowerCase().includes("id")) continue;

      const doctorId = parts[0];
      const startDate = parts[1];
      const endDate = parts[2] || parts[1]; // If no end date, single day

      // Expand date range into individual days
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        parsed.push({
          doctor_id: doctorId,
          doctor_name: doctors.find(doc => doc.id === doctorId)?.name || doctorId,
          date: d.toISOString().split("T")[0],
          absence_type: parts[3] || "semester",
        });
      }
    }
    return parsed;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseCSV(text);
      setRows(parsed);
      setResults(null);
      if (parsed.length === 0) {
        setMsg({ type: "error", text: "Kunde inte tolka filen. Format: doctor_id,start_date,end_date" });
      } else {
        setMsg({ type: "success", text: `${parsed.length} semesterdagar tolkade fran ${file.name}` });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setProgress({ done: 0, total: rows.length });
    const outcomes = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        await api("/absence", {
          method: "POST",
          body: JSON.stringify({
            clinic_id: clinicId || "kristianstad",
            doctor_id: row.doctor_id,
            start_date: row.date,
            end_date: row.date,
            absence_type: row.absence_type,
            reason: "Bulk-import semester",
          }),
        });
        outcomes.success++;
      } catch (e) {
        outcomes.failed++;
        if (outcomes.errors.length < 5) {
          outcomes.errors.push(`${row.doctor_id} ${row.date}: ${e.message || "fel"}`);
        }
      }
      setProgress({ done: i + 1, total: rows.length });
    }

    setResults(outcomes);
    setImporting(false);
    setMsg(outcomes.failed === 0
      ? { type: "success", text: `${outcomes.success} semesterdagar importerade!` }
      : { type: "error", text: `${outcomes.success} lyckades, ${outcomes.failed} misslyckades` }
    );
  };

  // Group rows by doctor for preview
  const groupedByDoctor = {};
  rows.forEach(r => {
    if (!groupedByDoctor[r.doctor_id]) groupedByDoctor[r.doctor_id] = { name: r.doctor_name, days: [] };
    groupedByDoctor[r.doctor_id].days.push(r.date);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-slate-700 flex items-center gap-2">
            <CalendarOff size={16} className="text-amber-500" /> Bulk-import semester
          </h3>
          <p className="text-[12px] text-slate-500 mt-0.5">Ladda upp en CSV-fil med semesterperioder for hela kliniken.</p>
        </div>
      </div>

      {/* File format info */}
      <div className="card p-3 bg-slate-50 border-slate-200">
        <p className="text-[11px] font-semibold text-slate-600 mb-1">CSV-format (semikolon eller komma):</p>
        <code className="text-[10px] text-blue-700 bg-blue-50 px-2 py-1 rounded block">
          doctor_id;start_date;end_date;typ<br />
          SP1;2026-06-15;2026-07-10;semester<br />
          OL2;2026-07-01;2026-07-21;semester<br />
          ST3;2026-08-03;2026-08-03;utbildning
        </code>
      </div>

      {/* Upload */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium rounded-lg cursor-pointer">
          <Upload size={14} /> Valj CSV-fil
          <input type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} className="hidden" />
        </label>
        {rows.length > 0 && (
          <span className="text-[12px] text-slate-600">
            <FileSpreadsheet size={13} className="inline mr-1" />
            {rows.length} dagar for {Object.keys(groupedByDoctor).length} lakare
          </span>
        )}
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="card p-3 max-h-[240px] overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase">
                <th className="text-left py-1">Lakare</th>
                <th className="text-left py-1">Period</th>
                <th className="text-left py-1">Dagar</th>
                <th className="text-left py-1">Typ</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedByDoctor).map(([id, { name, days }]) => {
                const sorted = [...days].sort();
                return (
                  <tr key={id} className="border-t border-slate-100">
                    <td className="py-1.5 font-medium text-slate-700">{name}</td>
                    <td className="py-1.5 text-slate-500">{sorted[0]} — {sorted[sorted.length - 1]}</td>
                    <td className="py-1.5 text-slate-500">{days.length}</td>
                    <td className="py-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">semester</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Import button + progress */}
      {rows.length > 0 && (
        <div className="space-y-2">
          <button onClick={handleImport} disabled={importing}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[13px] font-medium rounded-lg">
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? `Importerar ${progress.done}/${progress.total}...` : `Importera ${rows.length} semesterdagar`}
          </button>

          {importing && (
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className={`card p-3 ${results.failed > 0 ? "border-amber-200 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>
          <p className="text-[13px] font-semibold">{results.success} lyckades, {results.failed} misslyckades</p>
          {results.errors.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {results.errors.map((e, i) => <p key={i} className="text-[11px] text-red-600">{e}</p>)}
            </div>
          )}
        </div>
      )}

      <Toast msg={msg} />
    </div>
  );
}

/* ── AUDIT TAB ─── */
function AuditTab({ api, clinicId }) {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logData, statsData] = await Promise.all([
        api(`/audit?clinic_id=${clinicId || "kristianstad"}&limit=200`),
        api(`/audit/stats?clinic_id=${clinicId || "kristianstad"}`),
      ]);
      setEntries(Array.isArray(logData) ? logData : logData?.entries || []);
      setStats(statsData || null);
    } catch (e) {
      console.error("Audit load failed:", e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [api, clinicId]);

  useEffect(() => { load(); }, [load]);

  const ACTION_COLORS = {
    "schedule.generate": "bg-emerald-100 text-emerald-700",
    "schedule.adjust": "bg-blue-100 text-blue-700",
    "absence.create": "bg-amber-100 text-amber-700",
    "absence.delete": "bg-red-100 text-red-700",
    "config.update": "bg-violet-100 text-violet-700",
    "user.login": "bg-slate-100 text-slate-600",
    "user.create": "bg-teal-100 text-teal-700",
  };

  const uniqueActions = [...new Set(entries.map(e => e.action || e.event_type))].filter(Boolean);
  const filtered = entries.filter(e => !actionFilter || (e.action || e.event_type) === actionFilter);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-[13px] font-semibold text-slate-700">Audit-logg</h3>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Uppdatera
        </button>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Object.entries(stats.by_action || {}).slice(0, 4).map(([action, count]) => (
            <div key={action} className="card p-2.5 text-center">
              <p className="text-[10px] text-slate-400 truncate">{action}</p>
              <p className="text-[16px] font-bold text-slate-700">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action filter */}
      <div className="flex gap-2 items-center flex-wrap">
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }}
          className="text-[12px] border border-slate-200 rounded-lg px-2 py-1.5 focus:border-blue-400 outline-none">
          <option value="">Alla händelser</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-[11px] text-slate-400">{filtered.length} poster</span>
      </div>

      {loading ? (
        <div className="text-center py-8"><Loader2 size={24} className="animate-spin text-slate-400 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center">
          <ScrollText size={28} className="text-slate-300 mx-auto mb-2" />
          <p className="text-[12px] text-slate-400">Inga audit-poster att visa</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase bg-slate-50">
                  <th className="text-left py-2 px-3">Tid</th>
                  <th className="text-left py-2 px-3">Händelse</th>
                  <th className="text-left py-2 px-3">Användare</th>
                  <th className="text-left py-2 px-3">Detaljer</th>
                  <th className="text-left py-2 px-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((e, i) => {
                  const action = e.action || e.event_type || "";
                  const cls = ACTION_COLORS[action] || "bg-slate-100 text-slate-600";
                  const ts = e.timestamp || e.created_at || "";
                  const formattedTs = ts ? new Date(ts).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "medium" }) : "—";
                  return (
                    <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500 font-mono whitespace-nowrap">{formattedTs}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${cls}`}>{action || "—"}</span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-700">{e.user_id || e.performed_by || "system"}</td>
                      <td className="py-2 px-3 text-slate-500 max-w-[300px] truncate" title={JSON.stringify(e.details || e.metadata || {})}>
                        {e.description || (e.details ? JSON.stringify(e.details).slice(0, 80) : "—")}
                      </td>
                      <td className="py-2 px-3 text-slate-400 font-mono">{e.ip_address || e.ip || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 justify-center pt-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">
                Föregående
              </button>
              <span className="text-[11px] text-slate-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                className="px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">
                Nästa
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── SETTINGS TAB ─── */
function SettingsTab({ api, health, dbStatus }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <div className="card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><ShieldCheck size={18} /></div>
        <div>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">API</p>
          <p className="text-[14px] font-semibold text-slate-700">{health?.status === "healthy" ? "Aktiv" : "..."}</p>
          <p className="text-[10px] text-slate-400">v{health?.version || "?"} | {Math.round((health?.uptime_seconds || 0) / 60)}m</p>
        </div>
      </div>
      <div className="card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Database size={18} /></div>
        <div>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Databas</p>
          <p className="text-[14px] font-semibold text-slate-700">{dbStatus?.backend || "In-memory"}</p>
        </div>
      </div>
      <div className="card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><Clock size={18} /></div>
        <div>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Scheman</p>
          <p className="text-[14px] font-semibold text-slate-700">{health?.schedules_generated || 0} genererade</p>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN ─── */
export default function AdminPage() {
  const { api } = useAuth();
  const { clinicId, config } = useClinic();
  const [tab, setTab] = useState("doctors");
  const [health, setHealth] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);

  useEffect(() => {
    api("/health").then(setHealth).catch(() => {});
    api("/db/status").then(setDbStatus).catch(() => setDbStatus(null));
  }, [api]);

  // Reload config after save
  const { switchClinic } = useClinic();
  const handleSaved = () => { if (clinicId) switchClinic(clinicId); };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        <TabButton active={tab === "doctors"} icon={Stethoscope} label="Läkare" onClick={() => setTab("doctors")} />
        <TabButton active={tab === "rules"} icon={Scale} label="Regler" onClick={() => setTab("rules")} />
        <TabButton active={tab === "users"} icon={Users} label="Användare" onClick={() => setTab("users")} />
        <TabButton active={tab === "vacation"} icon={CalendarOff} label="Semester" onClick={() => setTab("vacation")} />
        <TabButton active={tab === "audit"} icon={ScrollText} label="Audit-logg" onClick={() => setTab("audit")} />
        <TabButton active={tab === "settings"} icon={Settings2} label="System" onClick={() => setTab("settings")} />
      </div>

      {/* Tab content */}
      <div className="card p-5">
        {tab === "doctors" && <DoctorsTab api={api} clinicId={clinicId} config={config} onSaved={handleSaved} />}
        {tab === "rules" && <RulesTab api={api} clinicId={clinicId} config={config} onSaved={handleSaved} />}
        {tab === "users" && <UsersTab api={api} />}
        {tab === "vacation" && <VacationTab api={api} clinicId={clinicId} config={config} />}
        {tab === "audit" && <AuditTab api={api} clinicId={clinicId} />}
        {tab === "settings" && <SettingsTab api={api} health={health} dbStatus={dbStatus} />}
      </div>
    </div>
  );
}
