import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import {
  ShieldCheck, Database, Users, Plus, Loader2, AlertTriangle, CheckCircle2,
  Stethoscope, Scale, Clock, Settings2, Trash2, Save, ToggleLeft, ToggleRight
} from "lucide-react";

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
  const [newDoc, setNewDoc] = useState({ id: "", name: "", role: "SP", employment_rate: 1.0, can_primary_call: false, can_backup_call: false, competencies: "" });

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
  };

  const removeDoctor = (id) => setDoctors(prev => prev.filter(d => d.id !== id));

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await api(`/config/${clinicId}/doctors`, { method: "PATCH", body: JSON.stringify(doctors) });
      setMsg({ type: "success", text: `${doctors.length} läkare sparade` });
      onSaved?.();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[13px] font-semibold text-slate-700">{doctors.length} läkare</h3>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-[6px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[12px] font-medium rounded-lg">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Spara
        </button>
      </div>

      {/* Doctor list */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {doctors.map(d => (
          <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-[12px]">
            <span className="font-mono text-slate-400 w-10">{d.id}</span>
            <span className="font-medium text-slate-700 flex-1 truncate">{d.name}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{d.role}</span>
            <span className="text-slate-400 w-10 text-right">{Math.round((d.employment_rate || d.employment_percent || 1) * 100)}%</span>
            <span className={`w-2 h-2 rounded-full ${d.can_primary_call ? "bg-red-400" : "bg-slate-200"}`} title="Primärjour" />
            <span className={`w-2 h-2 rounded-full ${d.can_backup_call ? "bg-amber-400" : "bg-slate-200"}`} title="Bakjour" />
            <button onClick={() => removeDoctor(d.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

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
        <TabButton active={tab === "settings"} icon={Settings2} label="System" onClick={() => setTab("settings")} />
      </div>

      {/* Tab content */}
      <div className="card p-5">
        {tab === "doctors" && <DoctorsTab api={api} clinicId={clinicId} config={config} onSaved={handleSaved} />}
        {tab === "rules" && <RulesTab api={api} clinicId={clinicId} config={config} onSaved={handleSaved} />}
        {tab === "users" && <UsersTab api={api} />}
        {tab === "settings" && <SettingsTab api={api} health={health} dbStatus={dbStatus} />}
      </div>
    </div>
  );
}
