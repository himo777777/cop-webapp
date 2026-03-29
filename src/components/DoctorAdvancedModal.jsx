/**
 * DoctorAdvancedModal — Konfigurerar avancerade schemaläggningsinställningar per läkare.
 * Hanterar: varannan vecka, fasta veckodagar, min/max passtyp, halvdagar,
 * återkommande aktiviteter och explicit dagar/vecka.
 */
import { useState } from "react";
import {
  X, Save, Plus, Trash2, Calendar, Clock,
  Repeat, LayoutGrid, AlignLeft, Activity, Stethoscope,
  Shield, Phone, Users
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

// AT-rotation template presets
const AT_ROTATION_TEMPLATES = [
  { label: "Standard (1 trauma, 2 akut, 1 mott, 1 avd)", days: { monday: "AKUT_CSK", tuesday: "AKUT_CSK", wednesday: "MOTT_CSK", thursday: "AVD_CSK", friday: "AKUT_CSK" } },
  { label: "Trauma-fokus (2 trauma, 2 akut, 1 mott)", days: { monday: "AKUT_CSK", tuesday: "AKUT_CSK", wednesday: "MOTT_CSK", thursday: "AKUT_CSK", friday: "AKUT_CSK" } },
  { label: "Anpassad (välj själv)", days: null },
];

// AT weekly function options — more specific for AT rotation
const AT_FUNC_OPTIONS = [
  { value: "",                label: "— Välj —" },
  { value: "AKUT_CSK",       label: "Akutmottagning" },
  { value: "TRAUMA",         label: "Traumamottagning" },
  { value: "MOTT_CSK",       label: "Mottagning" },
  { value: "AVD_CSK",        label: "Avdelning" },
  { value: "OP_CSK",         label: "OP (assistera)" },
  { value: "GIPS",           label: "Gips/Ortopedmottagning" },
  { value: "HANDLEDNING",    label: "Handledning" },
  { value: "UTBILDNING",     label: "Utbildning/Föreläsning" },
];

// ST randning types
const RANDNING_KLINIKER = [
  "Handkirurgi SUS",
  "Ryggkirurgi SUS",
  "Barnortopedi SUS",
  "Tumörortopedi SUS",
  "Idrottsmedicin",
  "Rehab/Smärta",
  "Reumatologi",
  "Radiologi",
  "Annan klinik",
];

const COMPETENCY_OPTIONS = [
  { value: "trauma", label: "Trauma" },
  { value: "hoft", label: "Hoft/Proteskirurgi" },
  { value: "hand", label: "Handkirurgi" },
  { value: "rygg", label: "Ryggkirurgi" },
  { value: "fot", label: "Fotkirurgi" },
  { value: "axel", label: "Axel/Artroskopi" },
  { value: "kna", label: "Knakirurgi" },
  { value: "tumor", label: "Tumorortopedi" },
  { value: "barn", label: "Barnortopedi" },
  { value: "idrottsmedicin", label: "Idrottsmedicin" },
  { value: "osteoporos", label: "Osteoporos" },
  { value: "infektion", label: "Ortopedisk infektion" },
  { value: "rehabilitering", label: "Rehabilitering" },
];

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
    competencies:           doctor.competencies           || [],
    // AT rotation — weekly assignment template
    at_weekly_rotation:     doctor.at_weekly_rotation     || {},
    at_rotation_period:     doctor.at_rotation_period     || { start_date: "", end_date: "", supervisor_id: "" },
    // ST randning + OP-krav
    st_randning:            doctor.st_randning            || [],
    st_min_op_days:         doctor.st_min_op_days         ?? "",
    st_required_op_types:   doctor.st_required_op_types   || [],
    st_target_procedures:   doctor.st_target_procedures   || {},
    // Bakjourslinje
    backup_call_config:     doctor.backup_call_config     || { eligible: false, max_per_month: 4, preferred_days: [] },
    // Konsultschema
    consultation_schedule:  doctor.consultation_schedule  || [],
    // Senior/junior OP-par
    op_pairing:             doctor.op_pairing             || { require_senior_pair: false, preferred_senior_id: "", can_supervise: [] },
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
      st_min_op_days: form.st_min_op_days === "" ? null : parseInt(form.st_min_op_days),
      // Clean empty randning entries
      st_randning: form.st_randning.filter(r => r.klinik && r.start_date),
      // Clean empty procedure targets
      st_target_procedures: Object.fromEntries(
        Object.entries(form.st_target_procedures).filter(([_, v]) => v.goal || v.done)
      ),
      // Bakjour config
      backup_call_config: {
        ...form.backup_call_config,
        max_per_month: parseInt(form.backup_call_config.max_per_month) || 4,
      },
      // Clean empty consultation entries
      consultation_schedule: form.consultation_schedule.filter(c => c.weekday),
      // OP pairing
      op_pairing: {
        ...form.op_pairing,
        can_supervise: form.op_pairing.can_supervise.filter(Boolean),
      },
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

          {/* 6. Subspecialisering / Kompetenser */}
          <div className={section}>
            <SectionHeader icon={Stethoscope} title="Subspecialisering / Kompetenser" />
            <p className="text-[11px] text-slate-500">Ange lakarens subspecialiteter for att optimera OP-tilldelning och jourbesattning.</p>
            <div className="flex flex-wrap gap-2">
              {COMPETENCY_OPTIONS.map(({ value, label: compLabel }) => {
                const selected = form.competencies.includes(value);
                return (
                  <button key={value}
                    onClick={() => setForm(f => ({
                      ...f,
                      competencies: selected
                        ? f.competencies.filter(c => c !== value)
                        : [...f.competencies, value]
                    }))}
                    className={`px-3 py-1.5 text-[11px] rounded-lg border transition-colors ${
                      selected
                        ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                        : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                  >
                    {compLabel}
                  </button>
                );
              })}
            </div>
            {form.competencies.length > 0 && (
              <p className="text-[10px] text-blue-600 mt-1">{form.competencies.length} kompetenser valda</p>
            )}
          </div>

          {/* 7. AT-läkare: Veckorotationsschema */}
          {(doctor.role === "AT" || doctor.role === "UL") && (
            <div className={section}>
              <SectionHeader icon={AlignLeft} title="AT-rotation — Veckoschema" />
              <p className="text-[11px] text-slate-500">
                Konfigurera vilken funktion AT-läkaren ska ha varje dag i veckan. T.ex. 1 dag trauma, 2 dagar akut, 1 dag mottagning.
              </p>

              {/* Quick template */}
              <div>
                <label className={label}>Snabbmall</label>
                <div className="flex flex-wrap gap-1.5">
                  {AT_ROTATION_TEMPLATES.map((tmpl, i) => (
                    <button key={i}
                      onClick={() => { if (tmpl.days) setForm(f => ({ ...f, at_weekly_rotation: { ...tmpl.days } })); }}
                      className="px-2.5 py-1 text-[10px] rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Per-day assignment */}
              <div className="space-y-2">
                {WEEKDAYS.map(({ value: wd, label: wdLabel }) => (
                  <div key={wd} className="flex items-center gap-3">
                    <span className="text-[12px] text-slate-600 w-20 font-medium">{wdLabel}</span>
                    <select
                      value={form.at_weekly_rotation[wd] || ""}
                      onChange={e => setForm(f => ({ ...f, at_weekly_rotation: { ...f.at_weekly_rotation, [wd]: e.target.value || undefined } }))}
                      className={`${input} flex-1`}
                    >
                      {AT_FUNC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* AT period + handledare */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className={label}>Placeringsstart</label>
                  <input type="date" value={form.at_rotation_period.start_date || ""}
                    onChange={e => setForm(f => ({ ...f, at_rotation_period: { ...f.at_rotation_period, start_date: e.target.value } }))}
                    className={input} />
                </div>
                <div>
                  <label className={label}>Placeringslut</label>
                  <input type="date" value={form.at_rotation_period.end_date || ""}
                    onChange={e => setForm(f => ({ ...f, at_rotation_period: { ...f.at_rotation_period, end_date: e.target.value } }))}
                    className={input} />
                </div>
                <div>
                  <label className={label}>Handledare (ID)</label>
                  <input value={form.at_rotation_period.supervisor_id || ""}
                    onChange={e => setForm(f => ({ ...f, at_rotation_period: { ...f.at_rotation_period, supervisor_id: e.target.value } }))}
                    className={input} placeholder="t.ex. SP3" />
                </div>
              </div>

              {/* Summary */}
              {Object.values(form.at_weekly_rotation).filter(Boolean).length > 0 && (
                <div className="bg-blue-50 rounded-lg p-2.5 text-[11px] text-blue-700 space-y-0.5">
                  <p className="font-semibold">Veckans fördelning:</p>
                  {(() => {
                    const counts = {};
                    Object.values(form.at_weekly_rotation).filter(Boolean).forEach(v => { counts[v] = (counts[v] || 0) + 1; });
                    return Object.entries(counts).map(([fn, c]) => (
                      <p key={fn}>{fn.replace(/_/g, " ")}: {c} dag{c > 1 ? "ar" : ""}</p>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {/* 8. ST-läkare: Randning + OP-krav */}
          {(doctor.role === "ST_SEN" || doctor.role === "ST_TIDIG") && (
            <div className={section}>
              <SectionHeader icon={Activity} title="ST-utbildning — Randning och OP-krav" />

              {/* Randningar */}
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500">
                  Randningsperioder: ST-läkaren är borta på annan klinik och ska inte schemaläggas här under dessa perioder.
                </p>
                {form.st_randning.map((r, i) => (
                  <div key={i} className="grid grid-cols-[1fr_110px_110px_28px] gap-2 items-center bg-slate-50 px-3 py-2 rounded-lg">
                    <select value={r.klinik || ""} onChange={e => {
                      const upd = [...form.st_randning];
                      upd[i] = { ...upd[i], klinik: e.target.value };
                      setForm(f => ({ ...f, st_randning: upd }));
                    }} className={input}>
                      <option value="">— Välj klinik —</option>
                      {RANDNING_KLINIKER.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <input type="date" value={r.start_date || ""} onChange={e => {
                      const upd = [...form.st_randning];
                      upd[i] = { ...upd[i], start_date: e.target.value };
                      setForm(f => ({ ...f, st_randning: upd }));
                    }} className={input} />
                    <input type="date" value={r.end_date || ""} onChange={e => {
                      const upd = [...form.st_randning];
                      upd[i] = { ...upd[i], end_date: e.target.value };
                      setForm(f => ({ ...f, st_randning: upd }));
                    }} className={input} />
                    <button onClick={() => setForm(f => ({ ...f, st_randning: f.st_randning.filter((_, j) => j !== i) }))}
                      className="text-slate-300 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, st_randning: [...f.st_randning, { klinik: "", start_date: "", end_date: "" }] }))}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-[12px] text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <Plus size={12} /> Lägg till randningsperiod
                </button>
              </div>

              {/* OP-krav */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-medium text-slate-700">OP-krav per vecka</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Minsta antal OP-dagar / vecka</label>
                    <input type="number" min="0" max="5" value={form.st_min_op_days}
                      onChange={e => setForm(f => ({ ...f, st_min_op_days: e.target.value }))}
                      className={input} placeholder="t.ex. 2" />
                    <p className="text-[10px] text-slate-400 mt-0.5">Solvern garanterar minst detta antal OP-pass per vecka</p>
                  </div>
                  <div>
                    <label className={label}>Krävda OP-typer</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {["hoft", "kna", "axel", "hand", "rygg", "trauma", "artroskopi", "barn"].map(op => {
                        const selected = form.st_required_op_types.includes(op);
                        return (
                          <button key={op}
                            onClick={() => setForm(f => ({
                              ...f,
                              st_required_op_types: selected
                                ? f.st_required_op_types.filter(x => x !== op)
                                : [...f.st_required_op_types, op]
                            }))}
                            className={`px-2 py-1 text-[10px] rounded-lg border transition-colors ${
                              selected ? "bg-violet-50 border-violet-300 text-violet-700 font-semibold" : "border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            {op.charAt(0).toUpperCase() + op.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Procedure target tracking */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-medium text-slate-700">Måluppfyllnad (antal ingrepp under ST)</p>
                <p className="text-[10px] text-slate-400">Registrera mål och utfört antal per ingrepp. Solvern prioriterar OP-dagar med kvarvarande behov.</p>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 uppercase font-semibold">
                  <span>Ingrepp</span><span>Mål</span><span>Utfört</span>
                </div>
                {["Höftprotes primär", "Knäprotes primär", "Artoskopi knä", "Axelkirurgi", "Handkirurgi", "Frakturkirurgi"].map(proc => {
                  const key = proc.toLowerCase().replace(/\s/g, "_");
                  const target = form.st_target_procedures[key] || { goal: "", done: "" };
                  return (
                    <div key={key} className="grid grid-cols-3 gap-2 items-center">
                      <span className="text-[11px] text-slate-600">{proc}</span>
                      <input type="number" min="0" value={target.goal || ""} placeholder="—"
                        onChange={e => setForm(f => ({
                          ...f,
                          st_target_procedures: {
                            ...f.st_target_procedures,
                            [key]: { ...f.st_target_procedures[key], goal: parseInt(e.target.value) || "" }
                          }
                        }))}
                        className={`${input} text-center`} />
                      <input type="number" min="0" value={target.done || ""} placeholder="—"
                        onChange={e => setForm(f => ({
                          ...f,
                          st_target_procedures: {
                            ...f.st_target_procedures,
                            [key]: { ...f.st_target_procedures[key], done: parseInt(e.target.value) || "" }
                          }
                        }))}
                        className={`${input} text-center`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 9. Bakjourslinje — Senior (ÖL/SP) */}
          {(doctor.role === "SP" || doctor.role === "ÖL") && (
            <div className={section}>
              <SectionHeader icon={Shield} title="Bakjourslinje" />
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.backup_call_config.eligible || false}
                    onChange={e => setForm(f => ({ ...f, backup_call_config: { ...f.backup_call_config, eligible: e.target.checked }}))}
                    className="rounded border-slate-300" />
                  Kan gå bakjour
                </label>
              </div>
              {form.backup_call_config.eligible && (
                <div className="space-y-3">
                  <div>
                    <label className={label}>Max bakjourer per manad</label>
                    <input type="number" min="1" max="10" value={form.backup_call_config.max_per_month || ""}
                      onChange={e => setForm(f => ({ ...f, backup_call_config: { ...f.backup_call_config, max_per_month: e.target.value }}))}
                      className={`${input} w-24`} />
                  </div>
                  <div>
                    <label className={label}>Preferensdagar for bakjour</label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map(wd => {
                        const sel = (form.backup_call_config.preferred_days || []).includes(wd.value);
                        return (
                          <button key={wd.value} type="button"
                            onClick={() => setForm(f => {
                              const days = f.backup_call_config.preferred_days || [];
                              return { ...f, backup_call_config: { ...f.backup_call_config, preferred_days: sel ? days.filter(d => d !== wd.value) : [...days, wd.value] }};
                            })}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${sel ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                            {wd.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 10. Konsultschema — Senior */}
          {(doctor.role === "SP" || doctor.role === "ÖL" || doctor.role === "ST_SEN") && (
            <div className={section}>
              <SectionHeader icon={Phone} title="Konsultschema" />
              <p className="text-[11px] text-slate-400 mb-2">Tider da lakaren ar tillganglig for konsultationer fran andra avdelningar</p>
              {form.consultation_schedule.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <select value={entry.weekday || ""} onChange={e => {
                    const arr = [...form.consultation_schedule];
                    arr[i] = { ...arr[i], weekday: e.target.value };
                    setForm(f => ({ ...f, consultation_schedule: arr }));
                  }} className={`${input} flex-1`}>
                    <option value="">-- Dag --</option>
                    {WEEKDAYS.map(wd => <option key={wd.value} value={wd.value}>{wd.label}</option>)}
                  </select>
                  <select value={entry.type || "telefon"} onChange={e => {
                    const arr = [...form.consultation_schedule];
                    arr[i] = { ...arr[i], type: e.target.value };
                    setForm(f => ({ ...f, consultation_schedule: arr }));
                  }} className={`${input} w-36`}>
                    <option value="telefon">Telefonkonsult</option>
                    <option value="rond">Konsultrond</option>
                    <option value="bedside">Bedside-konsult</option>
                  </select>
                  <button onClick={() => setForm(f => ({ ...f, consultation_schedule: f.consultation_schedule.filter((_, idx) => idx !== i) }))}
                    className="p-1.5 text-red-400 hover:text-red-600">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button onClick={() => setForm(f => ({ ...f, consultation_schedule: [...f.consultation_schedule, { weekday: "", type: "telefon" }] }))}
                className="flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-700 font-medium mt-1">
                <Plus size={12} /> Lagg till konsulttid
              </button>
            </div>
          )}

          {/* 11. Senior/Junior OP-parning */}
          <div className={section}>
            <SectionHeader icon={Users} title="OP-parning (Senior/Junior)" />
            {(doctor.role === "AT" || doctor.role === "UL" || doctor.role === "ST_TIDIG") ? (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.op_pairing.require_senior_pair || false}
                    onChange={e => setForm(f => ({ ...f, op_pairing: { ...f.op_pairing, require_senior_pair: e.target.checked }}))}
                    className="rounded border-slate-300" />
                  Krav pa senior (SP/OL) vid OP
                </label>
                {form.op_pairing.require_senior_pair && (
                  <div>
                    <label className={label}>Foredragen senior (valfritt)</label>
                    <input type="text" value={form.op_pairing.preferred_senior_id || ""}
                      onChange={e => setForm(f => ({ ...f, op_pairing: { ...f.op_pairing, preferred_senior_id: e.target.value }}))}
                      placeholder="Lakare-ID, t.ex. doc_005"
                      className={input} />
                  </div>
                )}
              </div>
            ) : (doctor.role === "SP" || doctor.role === "ÖL") ? (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">Vilka roller kan denna lakare handleda pa OP?</p>
                <div className="flex flex-wrap gap-2">
                  {[{ v: "AT", l: "AT-lakare" }, { v: "UL", l: "Underlakare" }, { v: "ST_TIDIG", l: "ST tidig" }].map(r => {
                    const sel = (form.op_pairing.can_supervise || []).includes(r.v);
                    return (
                      <button key={r.v} type="button"
                        onClick={() => setForm(f => {
                          const cur = f.op_pairing.can_supervise || [];
                          return { ...f, op_pairing: { ...f.op_pairing, can_supervise: sel ? cur.filter(x => x !== r.v) : [...cur, r.v] }};
                        })}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${sel ? "bg-green-50 border-green-300 text-green-700" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                        {r.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">OP-parning konfigureras for AT/UL/ST-tidig (krav) och SP/OL (handledning).</p>
            )}
          </div>

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
