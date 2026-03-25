import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import {
  Send, CheckCircle2, AlertTriangle, Loader2, Users, CalendarOff, ArrowRight
} from "lucide-react";

const ABSENCE_TYPES = [
  { value: "sjuk", label: "Sjukdom" },
  { value: "semester", label: "Semester" },
  { value: "vab", label: "VAB" },
  { value: "utbildning", label: "Utbildning" },
  { value: "konferens", label: "Konferens" },
];

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-colors";

export default function AbsencePage() {
  const { api } = useAuth();
  const { clinicId, config } = useClinic();
  const [doctors, setDoctors] = useState([]);
  const [chains, setChains] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [doctorId, setDoctorId] = useState("");
  const [absenceType, setAbsenceType] = useState("sjuk");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [chainScheduleId, setChainScheduleId] = useState("");
  const [chainDoctorId, setChainDoctorId] = useState("");
  const [chainStartDate, setChainStartDate] = useState("");
  const [chainEndDate, setChainEndDate] = useState("");
  const [chainAbsenceType, setChainAbsenceType] = useState("sjuk");
  const [runningChain, setRunningChain] = useState(false);
  const [chainResult, setChainResult] = useState(null);

  useEffect(() => {
    if (config?.doctors) setDoctors(config.doctors);
  }, [config]);

  useEffect(() => {
    api("/absence/chains").then(setChains).catch(() => setChains([]));
    api("/schedules").then(setSchedules).catch(() => setSchedules([]));
  }, [api, clinicId]);

  const handleAbsence = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null); setResult(null);
    try {
      const res = await api("/absence", {
        method: "POST",
        body: JSON.stringify({ clinic_id: clinicId, doctor_id: doctorId, absence_type: absenceType, start_date: startDate, end_date: endDate, reason, reoptimize: true }),
      });
      setResult(res);
      setDoctorId(""); setStartDate(""); setEndDate(""); setReason("");
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  };

  const handleRunChain = async () => {
    setRunningChain(true); setChainResult(null);
    try {
      const res = await api("/absence/chain", {
        method: "POST",
        body: JSON.stringify({
          schedule_id: chainScheduleId,
          doctor_id: chainDoctorId,
          absence_type: chainAbsenceType,
          start_date: chainStartDate,
          end_date: chainEndDate || chainStartDate,
          auto_select: true,
        }),
      });
      setChainResult(res);
      api("/absence/chains").then(setChains).catch(() => {});
    } catch (e) { setChainResult({ error: e.message }); }
    setRunningChain(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1200px] mx-auto">
      <p className="text-[13px] text-slate-500">Registrera frånvaro och kör ersättningskedjor för automatisk omplanering.</p>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Register absence */}
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold text-slate-700 flex items-center gap-2 mb-5">
            <CalendarOff size={15} className="text-amber-500" />
            Registrera frånvaro
          </h2>

          <form onSubmit={handleAbsence} className="space-y-3.5">
            <FormField label="Läkare">
              <select value={doctorId} onChange={e => setDoctorId(e.target.value)} required className={inputClass}>
                <option value="">Välj läkare...</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.role})</option>)}
              </select>
            </FormField>

            <FormField label="Typ">
              <select value={absenceType} onChange={e => setAbsenceType(e.target.value)} className={inputClass}>
                {ABSENCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Från">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={inputClass} />
              </FormField>
              <FormField label="Till">
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className={inputClass} />
              </FormField>
            </div>

            <FormField label="Anledning (valfritt)">
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="T.ex. planerad operation" className={inputClass} />
            </FormField>

            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-[13px] rounded-lg transition-colors mt-1">
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {submitting ? "Registrerar..." : "Registrera frånvaro"}
            </button>
          </form>

          {result && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-[13px] text-emerald-700 flex items-start gap-2">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>Frånvaro registrerad för {result.doctor_name}. {result.affected_schedules?.length || 0} scheman påverkade.</span>
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-[13px] text-red-600 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
          )}
        </div>

        {/* Replacement chain */}
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold text-slate-700 flex items-center gap-2 mb-5">
            <Users size={15} className="text-violet-500" />
            Ersättningskedja
          </h2>

          <div className="space-y-3.5">
            <FormField label="Schema">
              <select value={chainScheduleId} onChange={e => setChainScheduleId(e.target.value)} className={inputClass}>
                <option value="">Välj schema...</option>
                {schedules.map(s => (
                  <option key={s.schedule_id} value={s.schedule_id}>
                    {new Date(s.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })} — {s.schedule_id.slice(0,12)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Frånvarande läkare">
              <select value={chainDoctorId} onChange={e => setChainDoctorId(e.target.value)} className={inputClass}>
                <option value="">Välj läkare...</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.role})</option>)}
              </select>
            </FormField>

            <FormField label="Frånvarotyp">
              <select value={chainAbsenceType} onChange={e => setChainAbsenceType(e.target.value)} className={inputClass}>
                {ABSENCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Från">
                <input type="date" value={chainStartDate} onChange={e => setChainStartDate(e.target.value)} className={inputClass} />
              </FormField>
              <FormField label="Till">
                <input type="date" value={chainEndDate} onChange={e => setChainEndDate(e.target.value)} className={inputClass} />
              </FormField>
            </div>

            <button onClick={handleRunChain} disabled={runningChain || !chainScheduleId || !chainDoctorId || !chainStartDate}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-medium text-[13px] rounded-lg transition-colors">
              {runningChain ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {runningChain ? "Kör kedja..." : "Kör ersättningskedja"}
            </button>

            {chainResult && !chainResult.error && (
              <div className="p-3 bg-violet-50 border border-violet-100 rounded-lg space-y-2">
                <p className="text-[13px] font-medium text-violet-700">Kedja: {chainResult.status}</p>
                {chainResult.schedule_changes?.map((c, i) => {
                  const depth = c.cascade_depth || 0;
                  const isAtlWarn = c.atl_ok === false;
                  return (
                    <div key={i} className={`text-[12px] flex items-start gap-2 ${depth > 0 ? "ml-4 border-l-2 border-violet-200 pl-2" : ""}`}>
                      <ArrowRight size={11} className="shrink-0 mt-0.5 text-violet-500" />
                      <div>
                        <span className="font-medium text-violet-700">{c.function}</span>
                        <span className="text-violet-500"> dag {c.date}: </span>
                        <span className="text-slate-600">{c.absent_doctor}</span>
                        <span className="text-violet-500"> → </span>
                        <span className="font-medium text-violet-700">{c.replacement_name || c.replacement_doctor}</span>
                        {c.replacement_old_function && c.replacement_old_function !== "LEDIG" && (
                          <span className="text-amber-600 text-[11px] ml-1">(lamnade {c.replacement_old_function})</span>
                        )}
                        {depth > 0 && <span className="text-[10px] text-slate-400 ml-1">kaskad {depth}</span>}
                        {isAtlWarn && <span className="text-[10px] text-amber-600 ml-1 font-medium">ATL-varning</span>}
                      </div>
                    </div>
                  );
                })}
                {chainResult.failed_slots?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-violet-200">
                    <p className="text-[11px] font-medium text-amber-600">Ej fyllda pass:</p>
                    {chainResult.failed_slots.map((f, i) => (
                      <div key={i} className="text-[11px] text-amber-500">{f.function} dag {f.day}: {f.reason}</div>
                    ))}
                  </div>
                )}
                {chainResult.notifications?.length > 0 && (
                  <p className="text-[11px] text-violet-500 mt-1">{chainResult.notifications.length} notifieringar</p>
                )}
              </div>
            )}
            {chainResult?.error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-[13px] text-red-600">{chainResult.error}</div>
            )}
          </div>

          {/* History */}
          {chains.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Senaste kedjor</h3>
              <div className="space-y-1.5">
                {chains.slice(0, 5).map(c => (
                  <div key={c.chain_id} className="flex items-center justify-between text-[12px] bg-slate-50 px-3 py-2 rounded-lg">
                    <span className="text-slate-600">{c.doctor_id} — {c.absence_date || "?"}</span>
                    <span className={`font-medium ${c.status === "completed" ? "text-emerald-600" : "text-amber-500"}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
