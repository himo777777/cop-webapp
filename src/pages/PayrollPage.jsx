import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import {
  Banknote, Loader2, RefreshCw, Download, CheckCircle2, AlertTriangle, Calendar
} from "lucide-react";

const PAY_CODE_LABEL = {
  "JOUR_P": "Primärjour",
  "JOUR_B": "Bakjour",
  "OB_KVÄLL": "OB Kväll",
  "OB_NATT": "OB Natt",
  "OB_HELG": "OB Helg",
  "KOMP": "Komp-uttag",
  "OP": "OP-pass",
  "MOTT": "Mottagning",
  "AVD": "Avdelning",
};

export default function PayrollPage() {
  const { api } = useAuth();
  const { clinicId } = useClinic();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [groupBy, setGroupBy] = useState("doctor"); // "doctor" | "date"

  // Default period — current 2-week pay period
  const getPeriod = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 13);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };
  const defaultPeriod = getPeriod();
  const [start, setStart] = useState(defaultPeriod.start);
  const [end, setEnd] = useState(defaultPeriod.end);

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const data = await api(`/payroll/generate?clinic_id=${clinicId || "kristianstad"}&start=${start}&end=${end}`);
      setEntries(data?.entries || []);
      setSummary(data?.summary || null);
    } catch (e) {
      console.error("Payroll load failed:", e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await api("/payroll/validate", {
        method: "POST",
        body: JSON.stringify({ clinic_id: clinicId || "kristianstad", start, end }),
      });
      setValidation(result);
    } catch (e) {
      setValidation({ valid: false, errors: ["Kunde inte validera — kontrollera att schema finns"] });
    } finally {
      setValidating(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const data = await api(`/payroll/export?clinic_id=${clinicId || "kristianstad"}&start=${start}&end=${end}&format=${format}`);
      const content = data?.content || "";
      const blob = new Blob([content], { type: format === "paxml" ? "text/xml" : "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loneunderlag_${start}_${end}.${format === "paxml" ? "xml" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => { if (api && clinicId) loadPayroll(); }, [api, clinicId]);

  // Group entries by doctor
  const byDoctor = {};
  entries.forEach(e => {
    if (!byDoctor[e.doctor_id]) byDoctor[e.doctor_id] = { name: e.doctor_name, entries: [] };
    byDoctor[e.doctor_id].entries.push(e);
  });

  const totalHours = entries.reduce((s, e) => s + (e.hours || 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <Banknote size={18} className="text-emerald-500" /> Löneunderlag
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">Generera och exportera löneunderlag per period</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleValidate} disabled={validating}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            {validating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Validera
          </button>
          <button onClick={() => handleExport("csv")} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} CSV
          </button>
          <button onClick={() => handleExport("paxml")} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} PA-XML
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <Calendar size={14} className="text-slate-400" />
        <span className="text-[12px] text-slate-500">Period:</span>
        <input type="date" value={start} onChange={e => setStart(e.target.value)}
          className="text-[12px] border border-slate-200 rounded-lg px-2 py-1" />
        <span className="text-[12px] text-slate-400">—</span>
        <input type="date" value={end} onChange={e => setEnd(e.target.value)}
          className="text-[12px] border border-slate-200 rounded-lg px-2 py-1" />
        <button onClick={loadPayroll} disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium rounded-lg">
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Hämta
        </button>
        <div className="ml-auto flex gap-1">
          {["doctor", "date"].map(g => (
            <button key={g} onClick={() => setGroupBy(g)}
              className={`px-2.5 py-1 text-[11px] rounded-lg ${groupBy === g ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}>
              {g === "doctor" ? "Per läkare" : "Per datum"}
            </button>
          ))}
        </div>
      </div>

      {/* Validation result */}
      {validation && (
        <div className={`card p-3 flex items-start gap-2 ${validation.valid ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          {validation.valid
            ? <><CheckCircle2 size={14} className="text-emerald-600 mt-0.5" /><span className="text-[12px] text-emerald-700 font-medium">Löneunderlaget är giltigt — inga fel hittades</span></>
            : <><AlertTriangle size={14} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-[12px] text-red-700 font-medium">{validation.errors?.length} fel hittade</p>
                  {(validation.errors || []).map((e, i) => <p key={i} className="text-[11px] text-red-600">{e}</p>)}
                </div></>
          }
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><Loader2 size={28} className="animate-spin text-emerald-500 mx-auto" /></div>
      ) : entries.length === 0 ? (
        <div className="card p-10 text-center">
          <Banknote size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-[13px] text-slate-500">Inget schema för vald period</p>
          <p className="text-[12px] text-slate-400 mt-1">Generera ett schema först under Schema-sidan</p>
        </div>
      ) : (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Rader</p>
              <p className="text-[20px] font-bold text-slate-800">{entries.length}</p>
            </div>
            <div className="card p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Totalt timmar</p>
              <p className="text-[20px] font-bold text-slate-800">{totalHours.toFixed(1)}</p>
            </div>
            <div className="card p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Läkare</p>
              <p className="text-[20px] font-bold text-slate-800">{Object.keys(byDoctor).length}</p>
            </div>
            <div className="card p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Lönekoder</p>
              <p className="text-[20px] font-bold text-slate-800">{new Set(entries.map(e => e.pay_code)).size}</p>
            </div>
          </div>

          {/* Table by doctor */}
          {groupBy === "doctor" && (
            <div className="space-y-3">
              {Object.entries(byDoctor).map(([docId, { name, entries: docEntries }]) => {
                const docHours = docEntries.reduce((s, e) => s + (e.hours || 0), 0);
                return (
                  <div key={docId} className="card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                      <span className="text-[13px] font-semibold text-slate-700">{name || docId}</span>
                      <span className="text-[11px] text-slate-500">{docHours.toFixed(1)} h totalt</span>
                    </div>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="text-[10px] text-slate-400 uppercase bg-white">
                          <th className="text-left py-1.5 px-3">Datum</th>
                          <th className="text-left py-1.5 px-3">Lönekod</th>
                          <th className="text-right py-1.5 px-3">Timmar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {docEntries.map((e, i) => (
                          <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                            <td className="py-1.5 px-3 text-slate-600">{e.date}</td>
                            <td className="py-1.5 px-3">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                                {PAY_CODE_LABEL[e.pay_code] || e.pay_code}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-right font-medium text-slate-700">{(e.hours || 0).toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table by date */}
          {groupBy === "date" && (
            <div className="card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase">
                    <th className="text-left py-2 px-3">Datum</th>
                    <th className="text-left py-2 px-3">Läkare</th>
                    <th className="text-left py-2 px-3">Lönekod</th>
                    <th className="text-right py-2 px-3">Timmar</th>
                  </tr>
                </thead>
                <tbody>
                  {[...entries].sort((a, b) => a.date.localeCompare(b.date)).map((e, i) => (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="py-1.5 px-3 text-slate-600">{e.date}</td>
                      <td className="py-1.5 px-3 font-medium text-slate-700">{e.doctor_name || e.doctor_id}</td>
                      <td className="py-1.5 px-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                          {PAY_CODE_LABEL[e.pay_code] || e.pay_code}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right">{(e.hours || 0).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
