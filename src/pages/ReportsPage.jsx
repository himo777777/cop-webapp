import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import {
  FileBarChart, Loader2, RefreshCw, Calendar, Users, Activity,
  AlertTriangle, TrendingUp, ChevronDown, ChevronUp, BarChart3
} from "lucide-react";

function MetricCard({ label, value, sub, icon: Icon, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-[18px] font-bold text-slate-800">{value}</p>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function BarChart({ data, maxVal, label }) {
  if (!data || Object.keys(data).length === 0) return null;
  const max = maxVal || Math.max(...Object.values(data), 1);
  return (
    <div className="space-y-1.5">
      {label && <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>}
      {Object.entries(data).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600 w-20 truncate font-medium">{key}</span>
          <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(val / max) * 100}%` }} />
          </div>
          <span className="text-[11px] text-slate-500 w-8 text-right">{val}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { api } = useAuth();
  const { clinicId } = useClinic();
  const [monthly, setMonthly] = useState(null);
  const [jour, setJour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [jourStart, setJourStart] = useState("");
  const [jourEnd, setJourEnd] = useState("");

  // Set default jour period to current 2-week span
  useEffect(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    const end = new Date(start);
    end.setDate(end.getDate() + 13); // 2 weeks
    setJourStart(start.toISOString().split("T")[0]);
    setJourEnd(end.toISOString().split("T")[0]);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, j] = await Promise.all([
        api(`/reports/monthly?clinic_id=${clinicId || "kristianstad"}`).catch(() => null),
        jourStart && jourEnd
          ? api(`/reports/jour?clinic_id=${clinicId || "kristianstad"}&start=${jourStart}&end=${jourEnd}`).catch(() => null)
          : null,
      ]);
      setMonthly(m);
      setJour(j);
    } catch (e) {
      console.error("Failed to load reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (api && clinicId) loadData(); }, [api, clinicId]);

  const loadJour = async () => {
    if (!jourStart || !jourEnd) return;
    try {
      const j = await api(`/reports/jour?clinic_id=${clinicId || "kristianstad"}&start=${jourStart}&end=${jourEnd}`);
      setJour(j);
    } catch {}
  };

  const s = monthly?.summary || {};
  const ob = monthly?.ob_summary || {};
  const atl = monthly?.atl_compliance || {};
  const callDist = monthly?.call_distribution || {};
  const workload = monthly?.workload_balance || {};

  // OB per doctor bar chart data
  const obPerDoc = ob?.per_doctor || {};

  // Jour report by doctor
  const jourByDoc = jour?.by_doctor || {};
  const jourSummary = jour?.summary || {};

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <FileBarChart size={18} className="text-indigo-500" /> Manadsrapporter
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {monthly?.clinic || clinicId} — {monthly?.period || "senaste perioden"}
          </p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Uppdatera
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 size={28} className="animate-spin text-indigo-500 mx-auto" /></div>
      ) : (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Schemalagda pass" value={s.total_scheduled_shifts || 0} icon={Calendar} color="blue" />
            <MetricCard label="Lakare" value={s.total_doctors || 0} icon={Users} color="emerald" />
            <MetricCard label="Genererade scheman" value={s.schedules_generated || 0} icon={Activity} color="violet" />
            <MetricCard label="ATL-overtramp" value={atl.violations || 0}
              icon={AlertTriangle} color={atl.violations > 0 ? "red" : "emerald"}
              sub={atl.violations > 0 ? "Krav pa atgard" : "Inga brott"} />
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {[
              { id: "overview", label: "Oversikt" },
              { id: "ob", label: "OB-kostnader" },
              { id: "jour", label: "Jourfordelning" },
              { id: "atl", label: "ATL" },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveSection(t.id)}
                className={`flex-1 py-2 text-[12px] font-medium rounded-md transition-colors ${
                  activeSection === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}>{t.label}</button>
            ))}
          </div>

          {/* Overview */}
          {activeSection === "overview" && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Call distribution */}
              <div className="card p-4">
                <h3 className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <BarChart3 size={14} className="text-blue-500" /> Jourfordelning
                </h3>
                {Object.keys(callDist).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(callDist).map(([docId, counts]) => (
                      <div key={docId} className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-600 w-16 truncate font-medium">{docId}</span>
                        <div className="flex-1 flex gap-0.5">
                          {counts.primary > 0 && (
                            <div className="h-4 bg-blue-400 rounded-sm" style={{ width: `${counts.primary * 15}px` }}
                              title={`Primarjour: ${counts.primary}`} />
                          )}
                          {counts.backup > 0 && (
                            <div className="h-4 bg-indigo-300 rounded-sm" style={{ width: `${counts.backup * 15}px` }}
                              title={`Bakjour: ${counts.backup}`} />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 w-12 text-right">
                          P:{counts.primary || 0} B:{counts.backup || 0}
                        </span>
                      </div>
                    ))}
                    <div className="flex gap-4 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="w-3 h-2 bg-blue-400 rounded-sm inline-block" /> Primarjour
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="w-3 h-2 bg-indigo-300 rounded-sm inline-block" /> Bakjour
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400">Ingen jourdata tillganglig</p>
                )}
              </div>

              {/* Workload balance */}
              <div className="card p-4">
                <h3 className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-500" /> Arbetsbelastning
                </h3>
                {Object.keys(workload).length > 0 ? (
                  <BarChart data={workload} label="" />
                ) : (
                  <p className="text-[12px] text-slate-400">Ingen belastningsdata tillganglig</p>
                )}
              </div>
            </div>
          )}

          {/* OB costs */}
          {activeSection === "ob" && (
            <div className="card p-5 space-y-4">
              <h3 className="text-[13px] font-semibold text-slate-700">OB-kostnadsfaktorer per lakare</h3>
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-[10px] text-blue-500 font-semibold uppercase">Total OB-faktor</p>
                  <p className="text-[20px] font-bold text-blue-700">{ob.total_ob_cost_factor || 0}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-[10px] text-amber-500 font-semibold uppercase">Standardavvikelse</p>
                  <p className="text-[20px] font-bold text-amber-700">{ob.std_deviation || 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-[10px] text-emerald-500 font-semibold uppercase">Lakare med OB</p>
                  <p className="text-[20px] font-bold text-emerald-700">{Object.keys(obPerDoc).length}</p>
                </div>
              </div>
              <BarChart data={obPerDoc} label="OB per lakare" />
              {ob.std_deviation > 5 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <span className="text-[12px] text-amber-700">Hog spridning i OB-fordelning (stddev {ob.std_deviation}). Overvag att justera jourfordelningen.</span>
                </div>
              )}
            </div>
          )}

          {/* Jour report */}
          {activeSection === "jour" && (
            <div className="space-y-4">
              {/* Period selector */}
              <div className="card p-3 flex items-center gap-3">
                <span className="text-[12px] text-slate-500">Period:</span>
                <input type="date" value={jourStart} onChange={e => setJourStart(e.target.value)}
                  className="text-[12px] border border-slate-200 rounded-lg px-2 py-1" />
                <span className="text-[12px] text-slate-400">—</span>
                <input type="date" value={jourEnd} onChange={e => setJourEnd(e.target.value)}
                  className="text-[12px] border border-slate-200 rounded-lg px-2 py-1" />
                <button onClick={loadJour}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium rounded-lg">
                  Hamta
                </button>
              </div>

              {/* Jour detail table */}
              <div className="card overflow-hidden">
                {Object.keys(jourByDoc).length > 0 ? (
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                        <th className="text-left py-2 px-3">Lakare</th>
                        <th className="text-center py-2 px-2">Primarjour</th>
                        <th className="text-center py-2 px-2">Bakjour</th>
                        <th className="text-center py-2 px-2">Helg</th>
                        <th className="text-center py-2 px-2">Natt</th>
                        <th className="text-center py-2 px-2">Totalt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(jourByDoc).map(([docId, data]) => {
                        const total = (data.primary || 0) + (data.backup || 0);
                        return (
                          <tr key={docId} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-700">{data.name || docId}</td>
                            <td className="text-center py-2 px-2 text-blue-600">{data.primary || 0}</td>
                            <td className="text-center py-2 px-2 text-indigo-600">{data.backup || 0}</td>
                            <td className="text-center py-2 px-2 text-amber-600">{data.weekend || 0}</td>
                            <td className="text-center py-2 px-2 text-violet-600">{data.night || 0}</td>
                            <td className="text-center py-2 px-2 font-semibold">{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center">
                    <BarChart3 size={24} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-[12px] text-slate-400">Valj en period och klicka "Hamta" for att se jourfordelning</p>
                  </div>
                )}
              </div>

              {/* Jour summary */}
              {jourSummary && Object.keys(jourSummary).length > 0 && (
                <div className="card p-4">
                  <h3 className="text-[13px] font-semibold text-slate-700 mb-2">Sammanfattning</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(jourSummary).map(([key, val]) => (
                      <div key={key} className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[10px] text-slate-400 uppercase">{key.replace(/_/g, " ")}</p>
                        <p className="text-[14px] font-bold text-slate-700">{typeof val === "number" ? val : JSON.stringify(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ATL compliance */}
          {activeSection === "atl" && (
            <div className="card p-5 space-y-4">
              <h3 className="text-[13px] font-semibold text-slate-700">ATL-efterlevnad (vila efter jour)</h3>
              {atl.violations === 0 ? (
                <div className="p-6 text-center bg-emerald-50 rounded-xl">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Activity size={20} className="text-emerald-600" />
                  </div>
                  <p className="text-[14px] font-semibold text-emerald-700">Inga ATL-overtramp</p>
                  <p className="text-[12px] text-emerald-600 mt-1">Alla lakare har korrekt vila efter jour</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-[13px] font-semibold text-red-700">{atl.violations} overtramp hittade</p>
                  </div>
                  {(atl.details || []).map((d, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg">
                      <p className="text-[12px] text-slate-700 font-medium">{d.doctor || d.doctor_id}</p>
                      <p className="text-[11px] text-slate-500">{d.description || d.message || JSON.stringify(d)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
