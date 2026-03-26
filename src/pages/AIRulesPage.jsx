import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { parseRule, checkConflicts } from "../api/ai";
import {
  Sparkles, Plus, Trash2, Loader2, AlertTriangle, CheckCircle2, ShieldAlert
} from "lucide-react";

function ConfidenceBadge({ value }) {
  const color = value >= 0.8 ? "bg-emerald-100 text-emerald-700" : value >= 0.5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{Math.round(value * 100)}%</span>;
}

export default function AIRulesPage() {
  const { api } = useAuth();
  const { clinicId } = useClinic();
  const [ruleText, setRuleText] = useState("");
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(null);

  const handleSubmit = async () => {
    if (!ruleText.trim() || !clinicId) return;
    setLoading(true); setError(null); setLastResult(null); setConflict(null);
    try {
      const result = await parseRule(api, clinicId, ruleText);
      setLastResult(result);
      if (result.error) { setError(result.error); setLoading(false); return; }
      if (result.confidence < 0.5) { setError("AI:n ar mycket osaker pa tolkningen. Forsok omformulera."); }

      // Check conflicts
      if (result.constraint) {
        const conflictResult = await checkConflicts(api, clinicId, result.constraint);
        if (conflictResult.conflicts?.length > 0) setConflict(conflictResult);
      }

      if (result.constraint) {
        setRules(prev => [...prev, { text: ruleText, constraint: result.constraint, confidence: result.confidence, explanation: result.explanation_sv }]);
        setRuleText("");
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[900px] mx-auto">
      <div>
        <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles size={18} className="text-violet-500" /> AI-regler
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">Skriv regler pa svenska — AI:n oversatter till schemalaggarens constraints.</p>
      </div>

      {/* Input */}
      <div className="card p-4 space-y-3">
        <textarea
          value={ruleText} onChange={e => setRuleText(e.target.value)}
          placeholder="Skriv en regel, t.ex. 'Dr Andersson ska aldrig jobba natt efter helgdag'"
          rows={3}
          className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-slate-700 focus:border-violet-400 focus:ring-1 focus:ring-violet-100 outline-none resize-none"
        />
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-400">{ruleText.length} tecken</span>
          <button onClick={handleSubmit} disabled={loading || !ruleText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-[12px] font-semibold rounded-lg transition-colors">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {loading ? "Analyserar..." : "Lagg till regel"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 text-red-700 rounded-lg text-[13px]">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Conflict alert */}
      {conflict && (
        <div className="card border-red-200 bg-red-50/50 p-4 space-y-2">
          <h3 className="text-[13px] font-semibold text-red-700 flex items-center gap-2">
            <ShieldAlert size={15} /> Regelkonflikt
          </h3>
          {conflict.conflicts.map((c, i) => (
            <div key={i} className="text-[12px] text-red-600">
              <span className={`font-bold mr-1 ${c.severity === "high" ? "text-red-700" : "text-amber-600"}`}>[{c.severity}]</span>
              {c.description}
            </div>
          ))}
          {conflict.suggestions_sv?.map((s, i) => (
            <div key={i} className="text-[12px] text-slate-600 flex items-start gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" /> {s}
            </div>
          ))}
          <button onClick={() => setConflict(null)} className="text-[11px] text-slate-500 hover:text-slate-700">Stang</button>
        </div>
      )}

      {/* Last result */}
      {lastResult?.constraint && !error && (
        <div className="card border-emerald-200 bg-emerald-50/30 p-3 flex items-start gap-3">
          <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-medium text-emerald-700">{lastResult.constraint.name}</span>
              <ConfidenceBadge value={lastResult.confidence} />
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lastResult.constraint.is_hard ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-600"}`}>
                {lastResult.constraint.is_hard ? "HARD" : "MJUK"}
              </span>
            </div>
            <p className="text-[12px] text-slate-600">{lastResult.explanation_sv}</p>
          </div>
        </div>
      )}

      {/* Rules list */}
      {rules.length > 0 && (
        <div className="card p-4">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Tillagda regler ({rules.length})</h3>
          <div className="space-y-2">
            {rules.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-slate-700 truncate">{r.constraint.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">"{r.text}"</div>
                </div>
                <ConfidenceBadge value={r.confidence} />
                <button onClick={() => setRules(prev => prev.filter((_, j) => j !== i))}
                  className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
