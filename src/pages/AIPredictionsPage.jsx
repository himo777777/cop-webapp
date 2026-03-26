import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { predictAbsence } from "../api/ai";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { TrendingUp, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";

const RISK_COLORS = { high: "bg-red-100 text-red-700 border-red-200", medium: "bg-amber-100 text-amber-700 border-amber-200", low: "bg-emerald-100 text-emerald-700 border-emerald-200" };
const RISK_EMOJI = { high: "!!!", medium: "!", low: "" };

export default function AIPredictionsPage() {
  const { api } = useAuth();
  const { clinicId } = useClinic();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!start || !end || !clinicId) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await predictAbsence(api, clinicId, start, end);
      if (r.error) setError(r.error);
      else setResult(r);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const chartData = result?.predictions?.map(p => ({
    date: p.date?.slice(5) || "?",
    risk: p.risk_level === "high" ? 3 : p.risk_level === "medium" ? 2 : 1,
  })) || [];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1000px] mx-auto">
      <div>
        <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp size={18} className="text-violet-500" /> Franvaroprediktioner
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">AI analyserar historisk franvaro och forutsager riskperioder.</p>
      </div>

      {/* Controls */}
      <div className="card p-4 flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Fran</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-lg px-3 py-2 bg-white" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Till</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-lg px-3 py-2 bg-white" />
        </div>
        <button onClick={analyze} disabled={loading || !start || !end}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-[12px] font-semibold rounded-lg">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
          {loading ? "Analyserar..." : "Analysera"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 text-red-700 rounded-lg text-[13px]">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {result && (
        <>
          {/* Overall risk */}
          <div className={`card p-4 flex items-center gap-3 border ${RISK_COLORS[result.overall_risk] || "border-slate-200"}`}>
            <ShieldCheck size={20} />
            <div>
              <span className="text-[13px] font-semibold">Samlad riskbedomning: {result.overall_risk?.toUpperCase()}</span>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card p-4">
              <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Risknivaer per dag</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={v => ["", "Lag", "Medel", "Hog"][v]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="risk" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Predictions */}
          {result.predictions?.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {result.predictions.map((p, i) => (
                <div key={i} className={`card p-3 border ${RISK_COLORS[p.risk_level] || "border-slate-200"}`}>
                  <div className="text-[12px] font-semibold">{p.date} {RISK_EMOJI[p.risk_level]}</div>
                  <div className="text-[11px] mt-1 opacity-80">{p.reason}</div>
                </div>
              ))}
            </div>
          )}

          {/* Patterns & Recommendations */}
          {result.patterns_sv?.length > 0 && (
            <div className="card p-4">
              <h3 className="text-[13px] font-semibold text-slate-700 mb-2">Monster</h3>
              {result.patterns_sv.map((p, i) => <p key={i} className="text-[12px] text-slate-600">{p}</p>)}
            </div>
          )}
          {result.recommendations_sv?.length > 0 && (
            <div className="card p-4 border-violet-200 bg-violet-50/30">
              <h3 className="text-[13px] font-semibold text-violet-700 mb-2">Rekommendationer</h3>
              {result.recommendations_sv.map((r, i) => (
                <div key={i} className="text-[12px] text-violet-600 flex items-start gap-1.5">
                  <ShieldCheck size={12} className="mt-0.5 shrink-0" /> {r}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
