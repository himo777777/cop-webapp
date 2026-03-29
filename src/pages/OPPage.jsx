import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import {
  Stethoscope, Loader2, RefreshCw, CheckCircle2, AlertTriangle,
  Calendar, Clock, User, TrendingUp, Activity
} from "lucide-react";

const PROCEDURE_LABELS = {
  "HOFT_PRIMA": "Höft primär TEP",
  "HOFT_REV": "Höft revision",
  "KNA_PRIMA": "Knä primär TEP",
  "KNA_REV": "Knä revision",
  "AXEL": "Axelkirurgi",
  "HAND": "Handkirurgi",
  "RYGG": "Rygkirurgi",
  "TRAUMA": "Trauma/Akut",
  "ARTROSKOPI": "Artroskopi",
  "BARN": "Barnortopedi",
};

const URGENCY_COLORS = {
  "akut": "bg-red-100 text-red-700",
  "hog": "bg-orange-100 text-orange-700",
  "normal": "bg-blue-100 text-blue-700",
  "elektiv": "bg-slate-100 text-slate-600",
};

const URGENCY_LABELS = {
  "akut": "Akut",
  "hog": "Hög",
  "normal": "Normal",
  "elektiv": "Elektiv",
};

function StatCard({ label, value, sub, color = "text-slate-800" }) {
  return (
    <div className="card p-3">
      <p className="text-[10px] text-slate-400 uppercase font-semibold">{label}</p>
      <p className={`text-[22px] font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function OPPage() {
  const { api } = useAuth();
  const { clinicId } = useClinic();
  const [matches, setMatches] = useState([]);
  const [utilization, setUtilization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [tab, setTab] = useState("matches"); // matches | utilization
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [matchResult, setMatchResult] = useState(null);

  const loadUtilization = async () => {
    try {
      const data = await api(`/op/utilization?clinic_id=${clinicId || "kristianstad"}&date=${date}`);
      setUtilization(data || null);
    } catch (e) {
      console.error("OP utilization failed:", e);
    }
  };

  const loadMatches = async () => {
    setLoading(true);
    try {
      const data = await api(`/op/matches?clinic_id=${clinicId || "kristianstad"}&date=${date}`);
      setMatches(Array.isArray(data) ? data : data?.matches || []);
    } catch (e) {
      console.error("OP matches failed:", e);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    setMatching(true);
    try {
      const result = await api("/op/match", {
        method: "POST",
        body: JSON.stringify({ clinic_id: clinicId || "kristianstad", date }),
      });
      setMatchResult(result);
      await loadMatches();
    } catch (e) {
      setMatchResult({ error: "Matchning misslyckades — kontrollera att schema och OP-lista finns" });
    } finally {
      setMatching(false);
    }
  };

  useEffect(() => {
    if (api && clinicId) {
      loadMatches();
      loadUtilization();
    }
  }, [api, clinicId]);

  const handleRefresh = () => {
    loadMatches();
    loadUtilization();
  };

  const totalSlots = utilization?.total_slots || 0;
  const usedSlots = utilization?.used_slots || 0;
  const utilizationPct = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <Stethoscope size={18} className="text-violet-500" /> OP-planering
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">Matcha kirurger mot OP-program och följ beläggning</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-lg px-2 py-1.5" />
          <button onClick={handleRefresh} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Uppdatera
          </button>
          <button onClick={handleMatch} disabled={matching}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-white bg-violet-600 hover:bg-violet-700 rounded-lg">
            {matching ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Kör matchning
          </button>
        </div>
      </div>

      {/* Match result banner */}
      {matchResult && (
        <div className={`card p-3 flex items-start gap-2 ${matchResult.error ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
          {matchResult.error
            ? <><AlertTriangle size={14} className="text-red-600 mt-0.5" /><span className="text-[12px] text-red-700">{matchResult.error}</span></>
            : <><CheckCircle2 size={14} className="text-emerald-600 mt-0.5" /><span className="text-[12px] text-emerald-700 font-medium">
                Matchning klar — {matchResult.matched || 0} kirurger matchade, {matchResult.unmatched || 0} utan OP-pass
              </span></>
          }
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="OP-pass matchade" value={matches.length} />
        <StatCard label="Beläggning" value={`${utilizationPct}%`}
          color={utilizationPct >= 90 ? "text-red-600" : utilizationPct >= 75 ? "text-orange-500" : "text-emerald-600"} />
        <StatCard label="Lediga salar" value={(totalSlots - usedSlots) || "—"} />
        <StatCard label="Akuta ingrepp" value={matches.filter(m => m.urgency === "akut").length}
          color="text-red-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[{ id: "matches", label: "Matchade OP-pass" }, { id: "utilization", label: "Salsbeläggning" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 size={28} className="animate-spin text-violet-500 mx-auto" /></div>
      ) : tab === "matches" ? (
        matches.length === 0 ? (
          <div className="card p-10 text-center">
            <Activity size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-[13px] text-slate-500">Inga matchade OP-pass för valt datum</p>
            <p className="text-[12px] text-slate-400 mt-1">Kör matchning eller välj ett datum med schemalagda kirurger</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase border-b border-slate-100">
                  <th className="text-left py-2 px-3">Tid</th>
                  <th className="text-left py-2 px-3">Kirurg</th>
                  <th className="text-left py-2 px-3">Ingrepp</th>
                  <th className="text-left py-2 px-3">Sal</th>
                  <th className="text-left py-2 px-3">Prioritet</th>
                  <th className="text-right py-2 px-3">Duration</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{m.start_time || "—"}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <User size={11} className="text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{m.doctor_name || m.doctor_id || "—"}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium">
                        {PROCEDURE_LABELS[m.procedure_code] || m.procedure_code || m.procedure || "—"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{m.room || m.sal || "—"}</td>
                    <td className="py-2 px-3">
                      {m.urgency && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${URGENCY_COLORS[m.urgency] || "bg-slate-100 text-slate-600"}`}>
                          {URGENCY_LABELS[m.urgency] || m.urgency}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600 font-mono text-[11px]">
                      {m.duration_minutes ? `${m.duration_minutes} min` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Utilization tab */
        <div className="space-y-4">
          {utilization ? (
            <>
              {/* Utilization bar */}
              <div className="card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-slate-700">Total salsbeläggning</span>
                  <span className={`text-[13px] font-bold ${utilizationPct >= 90 ? "text-red-600" : utilizationPct >= 75 ? "text-orange-500" : "text-emerald-600"}`}>
                    {utilizationPct}%
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${utilizationPct >= 90 ? "bg-red-500" : utilizationPct >= 75 ? "bg-orange-400" : "bg-emerald-500"}`}
                    style={{ width: `${utilizationPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">{usedSlots} av {totalSlots} OP-timmar bokade</p>
              </div>

              {/* Per-room breakdown */}
              {utilization.rooms && utilization.rooms.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <span className="text-[12px] font-semibold text-slate-700">Per OP-sal</span>
                  </div>
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-[10px] text-slate-400 uppercase">
                        <th className="text-left py-2 px-3">Sal</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-right py-2 px-3">Bokade timmar</th>
                        <th className="text-right py-2 px-3">Kapacitet</th>
                        <th className="text-right py-2 px-3">Beläggning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utilization.rooms.map((r, i) => {
                        const pct = r.capacity > 0 ? Math.round((r.booked / r.capacity) * 100) : 0;
                        return (
                          <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-700">{r.room || r.name}</td>
                            <td className="py-2 px-3">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r.available ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                                {r.available ? "Tillgänglig" : "Fullbokad"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600">{r.booked || 0} h</td>
                            <td className="py-2 px-3 text-right text-slate-600">{r.capacity || 0} h</td>
                            <td className="py-2 px-3 text-right">
                              <span className={`font-semibold ${pct >= 90 ? "text-red-600" : pct >= 75 ? "text-orange-500" : "text-emerald-600"}`}>
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="card p-10 text-center">
              <TrendingUp size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-[13px] text-slate-500">Ingen beläggningsdata för valt datum</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
