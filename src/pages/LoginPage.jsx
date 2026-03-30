import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, User, AlertCircle, ArrowRight, Loader2, ShieldCheck, Calendar, Activity } from "lucide-react";

function FeaturePill({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Icon size={13} style={{ color: "#6AABF7" }} />
      <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>{text}</span>
    </div>
  );
}

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try { await login(username, password); }
    catch (err) { setError(err.message); }
  };

  const fillCreds = (u, p) => { setUsername(u); setPassword(p); setError(""); };

  return (
    <div className="min-h-screen flex" style={{ background: "#080F1E" }}>

      {/* ── Left panel — branding ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative flex-col justify-between p-12 overflow-hidden">
        {/* Background mesh gradient */}
        <div
          className="login-orb absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(21,96,212,0.12) 0%, transparent 70%)" }}
        />
        <div
          className="login-orb-2 absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 70%)" }}
        />
        <div
          className="login-orb-3 absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)" }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: 44, height: 44,
                background: "linear-gradient(135deg, #1560D4 0%, #0891B2 100%)",
                boxShadow: "0 4px 20px rgba(21,96,212,0.4)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="2" rx="1" fill="white" opacity="0.95"/>
                <rect x="11" y="3" width="2" height="18" rx="1" fill="white" opacity="0.95"/>
                <rect x="7.5" y="7.5" width="9" height="9" rx="4.5" fill="none" stroke="white" strokeWidth="1.5" opacity="0.45"/>
              </svg>
            </div>
            <div>
              <div className="text-[16px] font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>COP Engine</div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>by AnatoTech AB</div>
            </div>
          </div>

          <h1 className="text-[36px] leading-[1.1] font-bold tracking-tight" style={{ color: "white" }}>
            Schemaläggning<br />
            <span style={{
              background: "linear-gradient(90deg, #5B9EF5, #22D3EE)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              för sjukvården
            </span>
          </h1>

          <p className="mt-5 text-[14px] leading-relaxed max-w-[340px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            AI-optimerad schemaläggning som respekterar ATL, jourlinjer
            och ST-handledning — automatiskt och rättvist.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-col gap-2">
            <FeaturePill icon={ShieldCheck} text="ATL-compliant i realtid" />
            <FeaturePill icon={Calendar}    text="Stöd för alla kliniktyper" />
            <FeaturePill icon={Activity}    text="26+ schemaläggningsregler" />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <div className="h-px mb-5" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%)" }} />
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            Clinical Operations Protocol · v1.0 · © 2026 AnatoTech AB
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      {/* ── Right panel — login form ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 38, height: 38, background: "linear-gradient(135deg, #1560D4, #0891B2)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="2" rx="1" fill="white"/>
                <rect x="11" y="3" width="2" height="18" rx="1" fill="white"/>
              </svg>
            </div>
            <span className="text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>COP Engine</span>
          </div>

          {/* Form heading */}
          <h2 className="text-[22px] font-bold mb-1" style={{ color: "white" }}>Logga in</h2>
          <p className="text-[13px] mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>Ange dina inloggningsuppgifter</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Användarnamn
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                  autoComplete="username"
                  placeholder="Användarnamn"
                  className="w-full pl-10 pr-4 py-2.5 text-[13px] rounded-xl transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.85)",
                    outline: "none",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(21,96,212,0.6)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Lösenord
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-[13px] rounded-xl transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.85)",
                    outline: "none",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(21,96,212,0.6)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}
              >
                <AlertCircle size={14} style={{ color: "#F87171" }} />
                <span className="text-[12px]" style={{ color: "#FCA5A5" }}>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all mt-2"
              style={{
                background: loading ? "rgba(21,96,212,0.5)" : "linear-gradient(135deg, #1560D4 0%, #0E47A1 100%)",
                color: "white",
                boxShadow: loading ? "none" : "0 4px 16px rgba(21,96,212,0.35)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {loading ? "Loggar in..." : "Logga in"}
            </button>
          </form>

          {/* Quick access */}
          <div className="mt-8">
            <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.07)" }} />
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>
              Demokonton
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { u: "admin",     p: "cop-admin-2026", label: "Admin",         role: "Full åtkomst" },
                { u: "scheduler", p: "schema-2026",    label: "Schemaläggare", role: "Schema & frånvaro" },
                { u: "viewer",    p: "viewer-2026",    label: "Läsare",        role: "Enbart läsning" },
              ].map(c => (
                <button
                  key={c.u}
                  onClick={() => fillCreds(c.u, c.p)}
                  className="py-2.5 px-2 rounded-xl text-center transition-all group"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                >
                  <div className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>{c.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{c.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
