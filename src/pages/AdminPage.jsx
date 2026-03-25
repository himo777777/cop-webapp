import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck, Database, Users, Plus, Loader2, AlertTriangle, CheckCircle2
} from "lucide-react";

const ROLES = [
  { value: "admin", label: "Administratör" },
  { value: "scheduler", label: "Schemaläggare" },
  { value: "doctor", label: "Läkare" },
  { value: "viewer", label: "Läsare" },
];

const inputClass = "w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-colors";

export default function AdminPage() {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [health, setHealth] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);

  const [newUser, setNewUser] = useState({ username: "", password: "", full_name: "", email: "", role: "viewer" });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api("/auth/users").then(setUsers).catch(() => setUsers([]));
    api("/health").then(setHealth).catch(() => {});
    api("/db/status").then(setDbStatus).catch(() => setDbStatus(null));
  }, [api]);

  const createUser = async (e) => {
    e.preventDefault();
    setCreating(true); setMsg(null);
    try {
      await api("/auth/users", { method: "POST", body: JSON.stringify(newUser) });
      setNewUser({ username: "", password: "", full_name: "", email: "", role: "viewer" });
      setMsg({ type: "success", text: "Användare skapad" });
      api("/auth/users").then(setUsers).catch(() => {});
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setCreating(false);
  };

  const roleBadge = (role) => {
    const colors = { admin: "bg-blue-100 text-blue-700", scheduler: "bg-violet-100 text-violet-700", doctor: "bg-teal-100 text-teal-700", viewer: "bg-slate-100 text-slate-600" };
    return colors[role] || colors.viewer;
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Status cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><ShieldCheck size={18} /></div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">API</p>
            <p className="text-[14px] font-semibold text-slate-700">{health?.status === "healthy" ? "Aktiv" : "Kontrollerar..."}</p>
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
          <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><Users size={18} /></div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Användare</p>
            <p className="text-[14px] font-semibold text-slate-700">{users.length} registrerade</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* User list */}
        <div className="lg:col-span-3 card p-5">
          <h2 className="text-[13px] font-semibold text-slate-700 mb-4">Användare</h2>
          <div className="space-y-1">
            {users.map(u => (
              <div key={u.user_id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-500 shrink-0">
                  {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-slate-700 truncate">{u.full_name}</div>
                  <div className="text-[11px] text-slate-400">{u.username} · {u.email}</div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge(u.role)}`}>
                  {u.role}
                </span>
                <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-emerald-400" : "bg-slate-300"}`} title={u.is_active ? "Aktiv" : "Inaktiv"} />
              </div>
            ))}
            {users.length === 0 && <p className="text-[13px] text-slate-400 py-4 text-center">Inga användare hittade</p>}
          </div>
        </div>

        {/* Create user */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-[13px] font-semibold text-slate-700 mb-4">Skapa användare</h2>
          <form onSubmit={createUser} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Fullständigt namn</label>
              <input value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))}
                required className={inputClass} placeholder="Anna Andersson" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Användarnamn</label>
              <input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
                required className={inputClass} placeholder="anna.andersson" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">E-post</label>
              <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                className={inputClass} placeholder="anna@klinik.se" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Lösenord</label>
              <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                required className={inputClass} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Roll</label>
              <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} className={inputClass}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <button type="submit" disabled={creating}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-[13px] rounded-lg transition-colors mt-1">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {creating ? "Skapar..." : "Skapa användare"}
            </button>

            {msg && (
              <div className={`flex items-center gap-2 p-2.5 rounded-lg text-[12px] ${
                msg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
              }`}>
                {msg.type === "success" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                {msg.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
