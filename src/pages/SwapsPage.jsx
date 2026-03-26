import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { listSwaps, createSwap, acceptSwap } from "../api/swaps";
import { checkConflicts } from "../api/ai";
import {
  ArrowLeftRight, Plus, Loader2, CheckCircle2, Clock, AlertTriangle, X, User
} from "lucide-react";

const STATUS = {
  open: { label: "Oppen", color: "bg-blue-100 text-blue-700" },
  accepted: { label: "Accepterad", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Genomford", color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Avvisad", color: "bg-red-100 text-red-700" },
};

export default function SwapsPage() {
  const { api, user } = useAuth();
  const { clinicId, config } = useClinic();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSwap, setNewSwap] = useState({ shift: "", date: "", wish: "" });
  const [accepting, setAccepting] = useState(null);
  const [warning, setWarning] = useState(null);

  useEffect(() => { listSwaps().then(setSwaps).finally(() => setLoading(false)); }, []);

  const handleCreate = async () => {
    if (!newSwap.shift || !newSwap.date) return;
    await createSwap({ doctor_id: user?.username || "anon", doctor_name: user?.full_name || "Du", ...newSwap });
    setSwaps(await listSwaps());
    setShowModal(false);
    setNewSwap({ shift: "", date: "", wish: "" });
  };

  const handleAccept = async (id) => {
    setAccepting(id); setWarning(null);
    try {
      // AI-validering
      const swap = swaps.find(s => s.id === id);
      if (swap) {
        const conflict = await checkConflicts(api, clinicId, { type: "swap", shift: swap.shift, date: swap.date });
        if (conflict?.conflicts?.length > 0) {
          setWarning({ id, conflicts: conflict.conflicts, suggestions: conflict.suggestions_sv });
          setAccepting(null);
          return;
        }
      }
    } catch {}
    await acceptSwap(id, user?.username || "anon");
    setSwaps(await listSwaps());
    setAccepting(null);
  };

  const openCount = swaps.filter(s => s.status === "open").length;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[900px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-blue-500" /> Bytestavla
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">{openCount} oppna byten</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-lg">
          <Plus size={14} /> Lagg upp byte
        </button>
      </div>

      {/* Warning */}
      {warning && (
        <div className="card border-amber-200 bg-amber-50 p-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-[13px] font-semibold text-amber-700 flex items-center gap-1.5"><AlertTriangle size={14} /> Constraint-varning</span>
            <button onClick={() => setWarning(null)}><X size={14} className="text-slate-400" /></button>
          </div>
          {warning.conflicts.map((c, i) => <p key={i} className="text-[12px] text-amber-600">{c.description}</p>)}
          <button onClick={async () => { await acceptSwap(warning.id, user?.username); setSwaps(await listSwaps()); setWarning(null); }}
            className="text-[11px] text-amber-700 underline">Acceptera anda</button>
        </div>
      )}

      {/* List */}
      {loading ? <div className="text-center py-8"><Loader2 size={24} className="animate-spin text-blue-500 mx-auto" /></div> : (
        <div className="space-y-2">
          {swaps.map(s => {
            const st = STATUS[s.status] || STATUS.open;
            return (
              <div key={s.id} className="card p-4 flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-500 shrink-0">
                  {s.doctor_name?.split(" ")[1]?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-medium text-slate-700">{s.doctor_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="text-[12px] text-slate-500">
                    <span className="font-medium">{s.shift}</span> — {s.date}
                  </div>
                  {s.wish && <p className="text-[12px] text-slate-400 mt-1">"{s.wish}"</p>}
                  {s.accepted_by && <p className="text-[11px] text-emerald-600 mt-1">Accepterad av {s.accepted_by}</p>}
                </div>
                {s.status === "open" && s.doctor_id !== user?.username && (
                  <button onClick={() => handleAccept(s.id)} disabled={accepting === s.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-medium rounded-lg shrink-0">
                    {accepting === s.id ? <Loader2 size={12} className="animate-spin" /> : "Acceptera"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold text-slate-800">Lagg upp byte</h3>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Pass</label>
              <input value={newSwap.shift} onChange={e => setNewSwap(p => ({ ...p, shift: e.target.value }))}
                placeholder="T.ex. JOUR_P, OP_Hassleholm" className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Datum</label>
              <input type="date" value={newSwap.date} onChange={e => setNewSwap(p => ({ ...p, date: e.target.value }))}
                className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Onskemol</label>
              <textarea value={newSwap.wish} onChange={e => setNewSwap(p => ({ ...p, wish: e.target.value }))}
                placeholder="Beskriv vad du soker..." rows={2} className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 resize-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleCreate} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium rounded-lg">Skapa</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[12px] text-slate-500">Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
