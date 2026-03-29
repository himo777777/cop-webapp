import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import {
  CalendarHeart, Plus, Loader2, AlertTriangle, Clock, X, CheckCircle2, RefreshCw, Trash2
} from "lucide-react";

const TYPES = [
  { value: "ledig", label: "Ledig" },
  { value: "foredrar_morgon", label: "Foredrar morgon" },
  { value: "foredrar_op", label: "Foredrar OP" },
  { value: "inte_nattjour", label: "Inte nattjour" },
  { value: "fritext", label: "Ovrigt" },
];

export default function WishesPage() {
  const { api, user } = useAuth();
  const { clinicId } = useClinic();
  const [wishes, setWishes] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [collisions, setCollisions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ type: "ledig", priority: "onskemol", note: "" });
  const [deleting, setDeleting] = useState(null);

  // Load wish periods and wishes from real API
  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch wish periods
      const pds = await api(`/wish-periods?clinic_id=${clinicId || "kristianstad"}`);
      setPeriods(pds || []);

      // Find active (open) period
      const open = (pds || []).find(p => p.status === "open");
      setActivePeriod(open || null);

      if (open) {
        // Fetch wishes for this period
        const w = await api(`/wishes?period_id=${open.id}`);
        setWishes(w || []);

        // Fetch collisions
        try {
          const coll = await api(`/wish-periods/${open.id}/collisions`);
          setCollisions(coll);
        } catch {
          setCollisions(null);
        }
      } else {
        // No active period — fetch all wishes as fallback
        try {
          const w = await api("/wishes");
          setWishes(w || []);
        } catch {
          setWishes([]);
        }
      }
    } catch (e) {
      console.error("Failed to load wishes:", e);
      setWishes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (api && clinicId) loadData(); }, [api, clinicId]);

  // Build 4-week calendar
  const weeks = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() + 1);
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
    wishes.forEach(w => {
      const d = w.date || w.wish_date;
      if (d) map[d] = (map[d] || []).concat(w);
    });
    return map;
  }, [wishes]);

  // Create wish via real API
  const handleCreate = async () => {
    if (!modal) return;
    try {
      await api("/wishes", {
        method: "POST",
        body: JSON.stringify({
          period_id: activePeriod?.id || "",
          doctor_id: user?.username || "anon",
          doctor_name: user?.full_name || "Du",
          date: modal.date,
          wish_type: form.type,
          priority: form.priority,
          note: form.note,
          clinic_id: clinicId || "kristianstad",
        }),
      });
      await loadData();
      setModal(null);
      setForm({ type: "ledig", priority: "onskemol", note: "" });
    } catch (e) {
      console.error("Failed to create wish:", e);
    }
  };

  // Delete wish
  const handleDelete = async (wishId) => {
    setDeleting(wishId);
    try {
      await api(`/wishes/${wishId}`, { method: "DELETE" });
      setWishes(prev => prev.filter(w => w.id !== wishId));
    } catch (e) {
      console.error("Failed to delete wish:", e);
    } finally {
      setDeleting(null);
    }
  };

  const DAYS = ["Man", "Tis", "Ons", "Tor", "Fre", "Lor", "Son"];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[900px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <CalendarHeart size={18} className="text-pink-500" /> Onskemol
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {activePeriod ? `Aktiv period: ${activePeriod.name || activePeriod.id}` : "Skicka in onskemol infor nasta schemaperiod."}
          </p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Active period info */}
      {activePeriod?.deadline && (
        <div className="card p-3 flex items-center gap-2 border-amber-200 bg-amber-50/50">
          <Clock size={14} className="text-amber-600" />
          <span className="text-[12px] text-amber-700 font-medium">
            Deadline: {activePeriod.deadline}
          </span>
        </div>
      )}

      {/* Collisions */}
      {collisions?.collisions?.length > 0 && (
        <div className="card border-red-200 bg-red-50/50 p-3 space-y-1">
          <h3 className="text-[12px] font-semibold text-red-700 flex items-center gap-1.5">
            <AlertTriangle size={13} /> Kollisioner ({collisions.collisions.length})
          </h3>
          {collisions.collisions.slice(0, 5).map((c, i) => (
            <p key={i} className="text-[11px] text-red-600">
              {c.date}: {c.count || c.doctors?.length || 0} lakare vill ha ledigt
            </p>
          ))}
        </div>
      )}

      {/* Calendar */}
      {loading ? (
        <div className="text-center py-8"><Loader2 size={24} className="animate-spin text-pink-500 mx-auto" /></div>
      ) : (
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
                          <div className={`text-[11px] font-medium ${isToday ? "text-blue-600 font-bold" : "text-slate-600"}`}>
                            {day.getDate()}
                          </div>
                          {dayWishes.map((w, j) => (
                            <div key={j} className={`text-[9px] mt-0.5 px-1 py-0.5 rounded truncate ${
                              w.priority === "viktigt" ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600"
                            }`}>
                              {(w.doctor_name || w.doctor_id || "").split(" ").pop()}: {TYPES.find(t => t.value === (w.wish_type || w.type))?.label || w.wish_type || w.type}
                            </div>
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
          {wishes.slice(0, 10).map(w => (
            <div key={w.id} className="flex items-center gap-2 text-[12px] group">
              <span className="text-slate-500 w-20">{w.date || w.wish_date}</span>
              <span className="font-medium text-slate-700">{w.doctor_name || w.doctor_id}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${w.priority === "viktigt" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                {TYPES.find(t => t.value === (w.wish_type || w.type))?.label || w.wish_type || w.type}
              </span>
              {w.note && <span className="text-slate-400 truncate max-w-[150px]">{w.note}</span>}
              {(w.doctor_id === user?.username || user?.role === "admin") && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(w.id); }}
                  disabled={deleting === w.id}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all ml-auto">
                  {deleting === w.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create wish modal */}
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
