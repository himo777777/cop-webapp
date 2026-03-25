import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, User, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const fillCreds = (u, p) => { setUsername(u); setPassword(p); setError(""); };

  return (
    <div className="min-h-screen flex bg-[#0c1222]">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] relative flex-col justify-between p-12 overflow-hidden">
        {/* Ambient orbs */}
        <div className="login-orb absolute -top-20 -left-20 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[100px]" />
        <div className="login-orb-2 absolute bottom-20 right-0 w-[300px] h-[300px] bg-indigo-500/6 rounded-full blur-[80px]" />

        <div className="relative z-10">
          {/* Logo mark */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 12a6 6 0 0112 0"/>
                <path d="M4 12a8 8 0 0116 0" opacity=".4"/>
                <circle cx="12" cy="12" r="1.5" fill="white" stroke="none"/>
                <line x1="12" y1="14" x2="12" y2="19"/>
                <line x1="10" y1="17.5" x2="14" y2="17.5"/>
              </svg>
            </div>
            <span className="text-white/90 text-lg font-semibold tracking-tight">COP</span>
          </div>

          <h1 className="text-[40px] leading-[1.15] font-bold text-white tracking-tight">
            Schemaläggning<br />
            <span className="text-blue-400">för ortopedkliniker</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-400 max-w-sm">
            Constraint-optimerad schemaläggning som respekterar ATL,
            jourlinjer och ST-handledning — automatiskt.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-600">
          Clinical Operations Protocol v1.0
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 12a6 6 0 0112 0"/>
                <circle cx="12" cy="12" r="1.5" fill="white" stroke="none"/>
                <line x1="12" y1="14" x2="12" y2="19"/>
                <line x1="10" y1="17.5" x2="14" y2="17.5"/>
              </svg>
            </div>
            <span className="text-white/90 text-lg font-semibold">COP</span>
          </div>

          <h2 className="text-[22px] font-semibold text-white mb-1">Logga in</h2>
          <p className="text-sm text-slate-500 mb-8">Ange dina uppgifter för att fortsätta</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-400 mb-1.5">Användarnamn</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
                <input
                  value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-slate-600 focus:border-blue-500/40 focus:bg-white/[0.07] transition-all"
                  placeholder="Användarnamn"
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-400 mb-1.5">Lösenord</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-slate-600 focus:border-blue-500/40 focus:bg-white/[0.07] transition-all"
                  placeholder="••••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-red-500/[0.08] border border-red-500/15 rounded-lg">
                <AlertCircle className="text-red-400 shrink-0" size={14} />
                <span className="text-red-300 text-[13px]">{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? "Loggar in..." : "Logga in"}
            </button>
          </form>

          {/* Quick access */}
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">Snabbåtkomst</p>
            <div className="flex gap-2">
              {[
                { u: "admin", p: "cop-admin-2026", label: "Admin", desc: "Full åtkomst" },
                { u: "scheduler", p: "schema-2026", label: "Schemaläggare", desc: "Schema & frånvaro" },
                { u: "viewer", p: "viewer-2026", label: "Läsare", desc: "Enbart läsning" },
              ].map(c => (
                <button key={c.u} onClick={() => fillCreds(c.u, c.p)}
                  className="flex-1 py-2.5 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] transition-all text-center group">
                  <div className="text-[12px] font-medium text-slate-300 group-hover:text-white transition-colors">{c.label}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
