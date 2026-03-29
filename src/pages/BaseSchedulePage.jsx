import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import {
  Notebook, Loader2, RefreshCw, Play, CheckCircle2,
  AlertTriangle, Calendar, GitFork, Download, ChevronRight
} from "lucide-react";

const WEEKDAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
const SHIFT_COLORS = {
  "JOUR_P": "bg-red-100 text-red-700",
  "JOUR_B": "bg-orange-100 text-orange-700",
  "MOTT": "bg-blue-100 text-blue-700",
  "OP": "bg-violet-100 text-violet-700",
  "AVD": "bg-emerald-100 text-emerald-700",
  "KOMP": "bg-slate-100 text-slate-500",
  "LEDIG": "bg-slate-50 text-slate-400",
};

function ShiftBadge({ code }) {
  if (!code) return null;
  const cls = SHIFT_COLORS[code] || "bg-slate-100 text-slate-600";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cls}`}>{code}</span>
  );
}

export default function BaseSchedulePage() {
  const { api } = useAuth();
  const { clinicId } = useClinic();
  const [baseSchedule, setBaseSchedule] = useState(null);
  const [deviations, setDeviations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState("base"); // base | deviations | effective
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [effectiveSchedule, setEffectiveSchedule] = useState(null);
  const [effectiveLoading, setEffectiveLoading] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);

  const loadBase = async () => {
    setLoading(true);
    try {
      const data = await api(`/base-schedule?clinic_id=${clinicId || "kristianstad"}`);
      setBaseSchedule(data || null);
    } catch (e) {
      console.error("Base schedule load failed:", e);
      setBaseSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  const loadDeviations = async () => {
    try {
      const data = await api(`/deviations?clinic_id=${clinicId || "kristianstad"}`);
      setDeviations(Array.isArray(data) ? data : data?.deviations || []);
    } catch (e) {
      setDeviations([]);
    }
  };

  const loadEffective = async () => {
    setEffectiveLoading(true);
    try {
      const data = await api(`/schedule/effective?clinic_id=${clinicId || "kristianstad"}&date=${effectiveDate}`);
      setEffectiveSchedule(data || null);
    } catch (e) {
      setEffectiveSchedule(null);
    } finally {
      setEffectiveLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const result = await api("/base-schedule/generate", {
        method: "POST",
        body: JSON.stringify({ clinic_id: clinicId || "kristianstad" }),
      });
      setGenerateResult(result);
      await loadBase();
    } catch (e) {
      setGenerateResult({ error: "Generering misslyckades — kontrollera att läkarlista och regler är konfigurerade" });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (api && clinicId) {
      loadBase();
      loadDeviations();
    }
  }, [api, clinicId]);

  useEffect(() => {
    if (tab === "effective" && api && clinicId) loadEffective();
  }, [tab, effectiveDate]);

  const doctors = baseSchedule?.doctors || [];
  const weeks = baseSchedule?.weeks || [];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <Notebook size={18} className="text-teal-500" /> Grundschema
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">Hantera grundschema, avvikelser och effektivt schema</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={loadBase} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Ladda om
          </button>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-white bg-teal-600 hover:bg-teal-700 rounded-lg">
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            Generera grundschema
          </button>
        </div>
      </div>

      {/* Generate result */}
      {generateResult && (
        <div className={`card p-3 flex items-start gap-2 ${generateResult.error ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
          {generateResult.error
            ? <><AlertTriangle size={14} className="text-red-600 mt-0.5" /><span className="text-[12px] text-red-700">{generateResult.error}</span></>
            : <><CheckCircle2 size={14} className="text-emerald-600 mt-0.5" /><span className="text-[12px] text-emerald-700 font-medium">
                Grundschema genererat — {generateResult.weeks || 0} veckor, {generateResult.assignments || 0} tilldelningar skapade
              </span></>
          }
        </div>
      )}

      {/* Stats strip */}
      {baseSchedule && (
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="card p-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Läkare</p>
            <p className="text-[20px] font-bold text-slate-800">{doctors.length}</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Schema-veckor</p>
            <p className="text-[20px] font-bold text-slate-800">{weeks.length || baseSchedule.cycle_weeks || "—"}</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Avvikelser</p>
            <p className="text-[20px] font-bold text-slate-800">{deviations.length}</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Giltig from</p>
            <p className="text-[14px] font-bold text-slate-800">{baseSchedule.valid_from || "—"}</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Version</p>
            <p className="text-[14px] font-bold text-slate-800">v{baseSchedule.version || 1}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: "base", label: "Grundschema", icon: Notebook },
          { id: "deviations", label: `Avvikelser (${deviations.length})`, icon: GitFork },
          { id: "effective", label: "Effektivt schema", icon: Calendar },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="text-center py-12"><Loader2 size={28} className="animate-spin text-teal-500 mx-auto" /></div>
      ) : tab === "base" ? (
        !baseSchedule ? (
          <div className="card p-10 text-center">
            <Notebook size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-[13px] text-slate-500">Inget grundschema finns ännu</p>
            <p className="text-[12px] text-slate-400 mt-1">Klicka "Generera grundschema" för att skapa ett grundschema från AI-regler och läkarlista</p>
          </div>
        ) : (
          <div className="space-y-3">
            {doctors.length > 0 && (
              <div className="card overflow-x-auto">
                <table className="w-full text-[11px] min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase border-b border-slate-100">
                      <th className="text-left py-2 px-3 sticky left-0 bg-slate-50">Läkare</th>
                      {WEEKDAYS.slice(0, 5).map(d => (
                        <th key={d} className="text-center py-2 px-2">{d.slice(0, 3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doc, i) => (
                      <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap sticky left-0 bg-white">
                          {doc.name || doc.doctor_id}
                        </td>
                        {[0,1,2,3,4].map(day => {
                          const shift = doc.default_week?.[day] || doc.shifts?.[day];
                          return (
                            <td key={day} className="py-2 px-2 text-center">
                              <ShiftBadge code={shift} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {doctors.length === 0 && (
              <div className="card p-6 text-center text-[12px] text-slate-500">
                Grundschema finns men innehåller inga läkartilldelningar ännu
              </div>
            )}
          </div>
        )
      ) : tab === "deviations" ? (
        deviations.length === 0 ? (
          <div className="card p-10 text-center">
            <GitFork size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-[13px] text-slate-500">Inga avvikelser registrerade</p>
            <p className="text-[12px] text-slate-400 mt-1">Avvikelser skapas automatiskt vid semestrar, tjänstledigheter och manuella ändringar</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase border-b border-slate-100">
                  <th className="text-left py-2 px-3">Läkare</th>
                  <th className="text-left py-2 px-3">Datum</th>
                  <th className="text-left py-2 px-3">Typ</th>
                  <th className="text-left py-2 px-3">Ersätter</th>
                  <th className="text-left py-2 px-3">Nytt pass</th>
                  <th className="text-left py-2 px-3">Anledning</th>
                </tr>
              </thead>
              <tbody>
                {deviations.map((dev, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-700">{dev.doctor_name || dev.doctor_id}</td>
                    <td className="py-2 px-3 text-slate-600">{dev.date}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        dev.type === "absence" ? "bg-red-100 text-red-700" :
                        dev.type === "swap" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {dev.type === "absence" ? "Frånvaro" : dev.type === "swap" ? "Byte" : dev.type || "Manuell"}
                      </span>
                    </td>
                    <td className="py-2 px-3"><ShiftBadge code={dev.original_shift} /></td>
                    <td className="py-2 px-3"><ShiftBadge code={dev.new_shift} /></td>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">{dev.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Effective schedule tab */
        <div className="space-y-4">
          <div className="card p-3 flex flex-wrap items-center gap-3">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-[12px] text-slate-500">Visa effektivt schema för:</span>
            <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)}
              className="text-[12px] border border-slate-200 rounded-lg px-2 py-1" />
            <button onClick={loadEffective} disabled={effectiveLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-medium rounded-lg">
              <ChevronRight size={11} /> Hämta
            </button>
          </div>

          {effectiveLoading ? (
            <div className="text-center py-8"><Loader2 size={24} className="animate-spin text-teal-500 mx-auto" /></div>
          ) : !effectiveSchedule ? (
            <div className="card p-10 text-center">
              <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-[13px] text-slate-500">Välj ett datum för att se effektivt schema</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-slate-700">
                  Effektivt schema — {effectiveDate}
                </span>
                {effectiveSchedule.deviations_applied > 0 && (
                  <span className="text-[11px] text-amber-600">
                    {effectiveSchedule.deviations_applied} avvikelse(r) tillämpade
                  </span>
                )}
              </div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase">
                    <th className="text-left py-2 px-3">Läkare</th>
                    <th className="text-left py-2 px-3">Pass</th>
                    <th className="text-left py-2 px-3">Källa</th>
                  </tr>
                </thead>
                <tbody>
                  {(effectiveSchedule.assignments || []).map((a, i) => (
                    <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">{a.doctor_name || a.doctor_id}</td>
                      <td className="py-2 px-3"><ShiftBadge code={a.shift} /></td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          a.source === "deviation" ? "bg-amber-100 text-amber-700" : "bg-teal-50 text-teal-700"
                        }`}>
                          {a.source === "deviation" ? "Avvikelse" : "Grundschema"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
