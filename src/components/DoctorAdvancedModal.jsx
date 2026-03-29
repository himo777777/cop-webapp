/**
 * DoctorAdvancedModal — Konfigurerar avancerade schemaläggningsinställningar per läkare.
 * Hanterar: varannan vecka, fasta veckodagar, min/max passtyp, halvdagar,
 * återkommande aktiviteter och explicit dagar/vecka.
 */
import { useState } from "react";
import {
  X, Save, Plus, Trash2, Calendar, Clock,
  Repeat, LayoutGrid, AlignLeft, Activity
} from "lucide-react";

const WEEKDAYS = [
  { value: "monday",    label: "Måndag" },
  { value: "tuesday",   label: "Tisdag" },
  { value: "wednesday", label: "Onsdag" },
  { value: "thursday",  label: "Torsdag" },
  { value: "friday",    label: "Fredag" },
];

const FUNC_OPTIONS = [
  { value: "",              label: "— Välj funktion —" },
  { value: "OP_CSK",        label: "OP CSK" },
  { value: "OP_Hässleholm", label: "OP Hässleholm" },
  { value: "MOTT_CSK",      label: "Mottagning CSK" },
  { value: "MOTT_Hässleholm", label: "Mottagning Hässleholm" },
  { value: "AVD_CSK",       label: "Avdelning CSK" },
  { value: "AVD_Hässleholm","label": "Avdelning Hässleholm" },
  { value: "AKUT_CSK",      label: "Akut CSK" },
  { value: "ADMIN",         label: "Admin" },
  { value: "FORSKNING",     label: "Forskning" },
  { value: "HANDLEDNING",   label: "Handledning" },
  { value: "UTBILDNING",    label: "Utbildning" },
  { value: "LEDIG",         label: "Ledig" },
];

const SHIFT_PREFIXES = [
  { value: "OP",          label: "OP (operation)" },
  { value: "MOTT",        label: "MOTT (mottagning)" },
  { value: "AVD",         label: "AVD (avdelning)" },
  { value: "AKUT",        label: "AKUT" },
  { value: "ADMIN",       label: "Admin" },
  { value: "FORSKNING",   label: "Forskning" },
  { value: "HANDLEDNING", label: "Handledning" },
  { value: "UTBILDNING",  label: "Utbildning" },
  { value: "JOUR_P",      label: "Primärjour" },
  { value: "JOUR_B",      label: "Bakjour" },
];

const input  = "w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-colors";
const label  = "block text-[11px] font-medium text-slate-500 mb-1";
const section = "card p-4 space-y-3";

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
      <Icon size={14} className="text-blue-500" />
      <span className="text-[13px] font-semibold text-slate-700">{title}</span>
    </div>
  );
}

export default function DoctorAdvancedModal({ doctor, onClose, onSave }) {
  const [form, setForm] = useState({
    schedule_pattern:       doctor.schedule_pattern       || "weekly",
    work_days_per_week:     doctor.work_days_per_week     ?? "",
    fixed_weekdays:         doctor.fixed_weekdays         || {},
    min_shifts_per_week:    doctor.min_shifts_per_week    || {},
    max_shifts_per_week:    doctor.max_shifts_per_week    || {},
    half_day_schedule:      doctor.half_day_schedule      || {},
    recurring_activities:   doctor.recurring_activities   || [],
    current_rotation_block: doctor.current_rotation_block || {},
  });

  // --- Fixed weekdays helpers ---
  const setFixedDay = (wd, val) =>
    setForm(f => ({ ...f, fixed_weekdays: val ? { ...f.fixed_weekdays, [wd]: val } : Object.fromEntries(Object.entries(f.fixed_weekdays).filter(([k]) => k !== wd)) }));

  // --- Min/max shifts helpers ---
  const setShiftLimit = (type, prefix, val) =>
    setForm(f => ({
      ...f,
      [type]: val ? { ...f[type], [prefix]: parseInt(val) || 1 } : Object.fromEntries(Object.entries(f[type]).filter(([k]) => k !== prefix))
    }));

  // --- Half day helpers ---
  const setHalfDay = (wd, period, val) =>
    setForm(f => {
      const current = f.half_day_schedule[wd] || {};
      const updated = val ? { ...current, [period]: val } : Object.fromEntries(Object.entries(current).filter(([k]) => k !== period));
      if (Object.keys(updated).length === 0) {
        const { [wd]: _, ...rest } = f.half_day_schedule;
        return { ...f, half_day_schedule: rest };
      }
      return { ...f, half_day_schedule: { ...f.half_day_schedule, [wd]: updated } };
    });

  // --- Recurring activities helpers ---
  const addActivity = () =>
    setForm(f => ({ ...f, recurring_activities: [...f.recurring_activities, { weekday: "monday", time: "09:00-10:00", activity: "" }] }));
  const removeActivity = (i) =>
    setForm(f => ({ ...f, recurring_activities: f.recurring_activities.filter((_, idx) => idx !== i) }));
  const updateActivity = (i, key, val) =>
    setForm(f => ({ ...f, recurring_activities: f.recurring_activities.map((a, idx) => idx === i ? { ...a, [key]: val } : a) }));

  const handleSave = () => {
    const patch = {
      ...form,
      work_days_per_week: form.work_days_per_week === "" ? null : parseInt(form.work_days_per_week),
    };
    onSave(doctor.id, patch);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Avancerade schemainställningar</p>
            <h2 className="text-[15px] font-bold text-slate-800">{doctor.name}</h2>
            <p className="text-[11px] text-slate-500">{doctor.id} · {doctor.role}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* 1. Schemmönster */}
          <div className={section}>
            <SectionHeader icon={Repeat} title="Schemamönster" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Periodicitet</label>
                <select value={form.schedule_pattern} onChange={e => setForm(f => ({ ...f, schedule_pattern: e.target.value }))} className={input}>
                  <option value="weekly">Varje vecka</option>
                  <option value="biweekly_even">Varannan vecka — jämna (v2, v4...)</option>
                  <option value="biweekly_odd">Varannan vecka — udda (v1, v3...)</option>
                </select>
              </div>
              <div>
                <label className={label}>Dagar per vecka (explicit)</label>
                <input
                  type="number" min="1" max="5" value={form.work_days_per_week}
                  onChange={e => setForm(f => ({ ...f, work_days_per_week: e.target.value }))}
                  className={input} placeholder="Tom = beräknas från tjänstgrad"
                />
                <p className="text-[10px] text-slate-400 mt-1">Lämna tom för automatisk beräkning från tjänstgrad</p>
              </div>
            </div>
          </div>

          {/* 2. Fasta veckodagar */}
          <div className={section}>
            <SectionHeader icon={Calendar} title="Fasta veckodagar" />
            <p className="text-[11px] text-slate-500">Läkaren schemaläggs alltid på angiven funktion dessa dagar.</p>
            <div className="space-y-2">
              {WEEKDAYS.map(({ value: wd, label: wdLabel }) => (
                <div key={wd} className="flex items-center gap-3">
                  <span className="text-[12px] text-slate-600 w-20">{wdLabel}</span>
                  <select
                    value={form.fixed_weekdays[wd] || ""}
                    onChange={e => setFixedDay(wd, e.target.value)}
                    className={`${input} flex-1`}
                  >
                    {FUNC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {form.fixed_weekdays[wd] && (
                    <button onClick={() => setFixedDay(wd, "")} className="text-slate-300 hover:text-red-500 shrink-0">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Min/max passtyp per vecka */}
          <div className={section}>
            <SectionHeader icon={LayoutGrid} title="Min / Max passtyp per vecka" />
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] font-medium text-emerald-700 mb-2">Minimum</p>
                {SHIFT_PREFIXES.slice(0, 6).map(({ value: pfx, label: pfxLabel }) => (
                  <div key={pfx} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] text-slate-500 w-28">{pfxLabel}</span>
                    <input
                      type="number" min="0" max="5"
                      value={form.min_shifts_per_week[pfx] || ""}
                      onChange={e => setShiftLimit("min_shifts_per_week", pfx, e.target.value)}
                      className={`${input} w-16 text-center`} placeholder="—"
                    />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-medium text-red-700 mb-2">Maximum</p>
                {SHIFT_PREFIXES.slice(0, 6).map(({ value: pfx, label: pfxLabel }) => (
                  <div key={pfx} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] text-slate-500 w-28">{pfxLabel}</span>
                    <input
                      type="number" min="0" max="5"
                      value={form.max_shifts_per_week[pfx] || ""}
                      onChange={e => setShiftLimit("max_shifts_per_week", pfx, e.target.value)}
                      className={`${input} w-16 text-center`} placeholder="—"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Halvdagar */}
          <div className={section}>
            <SectionHeader icon={Clock} title="Halvdagsschema (AM / PM)" />
            <p className="text-[11px] text-slate-500">Ange om en specifik veckodag är uppdelad i förmiddag och eftermiddag.</p>
            <div className="space-y-2">
              {WEEKDAYS.map(({ value: wd, label: wdLabel }) => {
                const hd = form.half_day_schedule[wd] || {};
                const hasAM = !!hd.am;
                const hasPM = !!hd.pm;
                if (!hasAM && !hasPM && !form.fixed_weekdays[wd]) return null; // visa bara relevanta dagar
                return (
                  <div key={wd} className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center">
                    <span className="text-[12px] text-slate-600">{wdLabel}</span>
                    <div>
                      <label className={label}>Förmiddag (AM)</label>
                      <select value={hd.am || ""} onChange={e => setHalfDay(wd, "am", e.target.value)} className={input}>
                        {FUNC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Eftermiddag (PM)</label>
                      <select value={hd.pm || ""} onChange={e => setHalfDay(wd, "pm", e.target.value)} className={input}>
                        {FUNC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
              {Object.keys(form.half_day_schedule).length === 0 && Object.keys(form.fixed_weekdays).length === 0 && (
                <p className="text-[11px] text-slate-400 italic">Sätt fasta veckodagar ovan för att konfigurera halvdagar.</p>
              )}
            </div>
          </div>

          {/* 5. Återkommande aktiviteter */}
          <div className={section}>
            <SectionHeader icon={Activity} title="Återkommande aktiviteter" />
            <p className="text-[11px] text-slate-500">Fasta ronder, konferenser eller möten som alltid ska passa in i schemat.</p>
            <div className="space-y-2">
              {form.recurring_activities.map((act, i) => (
                <div key={i} className="grid grid-cols-[130px_150px_1fr_28px] gap-2 items-center bg-slate-50 px-3 py-2 rounded-lg">
                  <select value={act.weekday} onChange={e => updateActivity(i, "weekday", e.target.value)} className={input}>
                    {WEEKDAYS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                  </select>
                  <input
                    value={act.time} onChange={e => updateActivity(i, "time", e.target.value)}
                    className={input} placeholder="10:00-11:00"
                  />
                  <input
                    value={act.activity} onChange={e => updateActivity(i, "activity", e.target.value)}
                    className={input} placeholder="Infektionsrond / Handledarmöte..."
                  />
                  <button onClick={() => removeActivity(i)} className="text-slate-300 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                onClick={addActivity}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-[12px] text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus size={12} /> Lägg till aktivitet
              </button>
            </div>
          </div>

          {/* 6. AT-block (visa om roll är AT) */}
          {doctor.role === "AT" && (
            <div className={section}>
              <SectionHeader icon={AlignLeft} title="AT-block rotation" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>Blocktyp (funktion)</label>
                  <select
                    value={form.current_rotation_block.block_type || ""}
                    onChange={e => setForm(f => ({ ...f, current_rotation_block: { ...f.current_rotation_block, block_type: e.target.value } }))}
                    className={input}
                  >
                    {FUNC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Startdatum</label>
                  <input
                    type="date"
                    value={form.current_rotation_block.start_date || ""}
                    onChange={e => setForm(f => ({ ...f, current_rotation_block: { ...f.current_rotation_block, start_date: e.target.value } }))}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>Slutdatum</label>
                  <input
                    type="date"
                    value={form.current_rotation_block.end_date || ""}
                    onChange={e => setForm(f => ({ ...f, current_rotation_block: { ...f.current_rotation_block, end_date: e.target.value } }))}
                    className={input}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-slate-600 hover:text-slate-800 font-medium">
            Avbryt
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg"
          >
            <Save size={13} /> Spara inställningar
          </button>
        </div>

      </div>
    </div>
  );
}
