import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { listWishes, createWish, getWishConflicts } from "../api/wishes";
import {
  CalendarHeart, Plus, Loader2, AlertTriangle, Clock, X, CheckCircle2
} from "lucide-react";

const TYPES = [
  { value: "ledig", label: "Ledig" },
  { value: "foredrar_morgon", label: "Foredrar morgon" },
  { value: "foredrar_op", label: "Foredrar OP" },
  { value: "inte_nattjour", label: "Inte nattjour" },
  { value: "fritext", label: "Ovrigt" },
];

export default function WishesPage() {
  const { user } = useAuth();
  const [wishes, setWishes] = useState([]);
  const [conflicts, setConflicts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { date }
  const [form, setForm] = useState({ type: "ledig", priority: "onskemol", note: "" });

  useEffect(() => {
    Promise.all([listWishes(), getWishConflicts()])
      .then(([w, c]) => { setWishes(w); setConflicts(c); })
      .finally(() => setLoading(false));
  }, []);

  // Bygg 4 veckors kalender
  const weeks = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() + 1); // Mandag
    const result = [];
    for (let w = 0; w < 4; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + w * 7 + d);
        days.push(date);
      }
      result.push(days);
    }
    return result;
  }, []);

  const wishByDate = useMemo(() => {
    const map = {};
    wishes.forEach(w => { map[w.date] = (map[w.date] || []).concat(w); });
    return map;
  }, [wishes]);

  const handleCreate = async () => {
    if (!modal) return;
    await createWish({
      doctor_id: user?.username || "anon",
      doctor_name: user?.full_name || "Du",
      date: modal.date,
      ...form,
    });
    const [w, c] = await Promise.all([listWishes(), getWishConflicts()]);
    setWishes(w); setConflicts(c);
    setModal(null);
    setForm({ type: "ledig", priority: "onskemol", note: "" });
  };

  const DAYS = ["Man", "Tis", "Ons", "Tor", "Fre", "Lor", "Son"];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[900px] mx-auto">
      <div>
        <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
          <CalendarHeart size={18} className="text-pink-500" /> Onskemol
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">Skicka in onskemol infor nasta schemaperiod.</p>
      </div>

      {/* Deadline */}
      {conflicts?.days_left != null && (
        <div className="card p-3 flex items-center gap-2 border-amber-200 bg-amber-50/50">
          <Clock size={14} className="text-amber-600" />
          <span className="text-[12px] text-amber-700 font-medium">{conflicts.days_left} dagar kvar att skicka onskemol (deadline {conflicts.deadline})</span>
        </div>
      )}

      {/* Conflicts */}
      {conflicts?.conflicts?.length > 0 && (
        <div className="card border-red-200 bg-red-50/50 p-3 space-y-1">
          <h3 className="text-[12px] font-semibold text-red-700 flex items-center gap-1.5"><AlertTriangle size={13} /> Potentiella konflikter</h3>
          {conflicts.conflicts.map((c, i) => (
            <p key={i} className="text-[11px] text-red-600">{c.message}</p>
          ))}
        </div>
      )}

      {/* Calendar */}
      {loading ? <div className="text-center py-8"><Loader2 size={24} className="animate-spin text-pink-500 mx-auto" /></div> : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>{DAYS.map(d => <th key={d} className="text-[11px] font-semibold text-slate-500 py-2 px-1 text-center">{d}</th>)}</tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, di) => {
                    const dateStr = day.toISOString().split("T")[0];
                    const dayWishes = wishByDate[dateStr] || [];
                    const isWeekend = di >= 5;
                    const isToday = dateStr === new Date().toISOString().split("T")[0];
                    return (
                      <td key={di} className={`p-1 border border-slate-100 align-top h-20 ${isWeekend ? "bg-slate-50" : ""}`}
                        onClick={() => setModal({ date: dateStr })}>
                        <div className="cursor-pointer hover:bg-blue-50 rounded p-1 h-full">
                          <div className={`text-[11px] font-medium ${isToday ? "text-blue-600" : "text-slate-600"}`}>
                            {day.getDate()}
                          </div>
                          {dayWishes.map((w, j) => (
                            <div key={j} className={`text-[9px] mt-0.5 px-1 py-0.5 rounded truncate ${
                              w.priority === "viktigt" ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600"
                            }`}>{w.doctor_name?.split(" ")[1]}: {TYPES.find(t => t.value === w.type)?.label || w.type}</div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="card p-4">
        <h3 className="text-[13px] font-semibold text-slate-700 mb-2">{wishes.length} inskickade onskemol</h3>
        <div className="space-y-1">
          {wishes.slice(0, 8).map(w => (
            <div key={w.id} className="flex items-center gap-2 text-[12px]">
              <span className="text-slate-500 w-20">{w.date}</span>
              <span className="font-medium text-slate-700">{w.doctor_name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${w.priority === "viktigt" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                {TYPES.find(t => t.value === w.type)?.label || w.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between">
              <h3 className="text-[14px] font-semibold text-slate-800">Onskemol for {modal.date}</h3>
              <button onClick={() => setModal(null)}><X size={16} className="text-slate-400" /></button>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Typ</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Prioritet</label>
              <div className="flex gap-2">
                {[["viktigt", "Viktigt (semester, lakarbesok)"], ["onskemol", "Onskemol (flexibelt)"]].map(([v, l]) => (
                  <button key={v} onClick={() => setForm(p => ({ ...p, priority: v }))}
                    className={`flex-1 py-2 text-[12px] rounded-lg border ${form.priority === v ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Kommentar</label>
              <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                placeholder="Valfri kommentar..." className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2" />
            </div>
            <button onClick={handleCreate}
              className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white text-[12px] font-medium rounded-lg">
              Skicka onskemol
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
