import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import {
  ArrowLeftRight, Loader2, RefreshCw, Plus, X, CheckCircle2,
  AlertTriangle
} from "lucide-react";

const STATUS_CONFIG = {
  "pending": { label: "Väntar", cls: "bg-amber-100 text-amber-700" },
  "peer_approved": { label: "Motpart godkänd", cls: "bg-blue-100 text-blue-700" },
  "admin_approved": { label: "Godkänd", cls: "bg-emerald-100 text-emerald-700" },
  "rejected": { label: "Avvisad", cls: "bg-red-100 text-red-700" },
  "cancelled": { label: "Avbruten", cls: "bg-slate-100 text-slate-500" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: "bg-slate-100 text-slate-600" };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

function SwapCard({ swap, user, onRespond, onCancel, isAdmin }) {
  const isRequester = swap.requester_id === user?.username;
  const isPeer = swap.target_id === user?.username;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={swap.status} />
            <span className="text-[11px] text-slate-400">{swap.created_at ? new Date(swap.created_at).toLocaleDateString("sv-SE") : ""}</span>
          </div>
          <p className="text-[13px] font-medium text-slate-800">
            {swap.requester_name || swap.requester_id}
            <span className="text-slate-400 mx-2">vill byta med</span>
            {swap.target_name || swap.target_id}
          </p>
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            <span className="font-medium">{swap.requester_date}</span>
            <ArrowLeftRight size={12} className="text-slate-400" />
            <span className="font-medium">{swap.target_date}</span>
          </div>
          {swap.shift_from && swap.shift_to && (
            <p className="text-[11px] text-slate-400">
              Pass: <span className="font-medium text-slate-600">{swap.shift_from}</span> ↔ <span className="font-medium text-slate-600">{swap.shift_to}</span>
            </p>
          )}
          {swap.note && <p className="text-[11px] text-slate-500 italic">"{swap.note}"</p>}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {isPeer && swap.status === "pending" && (
            <>
              <button onClick={() => onRespond(swap.id, "peer", "approve")}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                <CheckCircle2 size={11} /> Acceptera
              </button>
              <button onClick={() => onRespond(swap.id, "peer", "reject")}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">
                <X size={11} /> Avvisa
              </button>
            </>
          )}
          {isAdmin && swap.status === "peer_approved" && (
            <>
              <button onClick={() => onRespond(swap.id, "admin", "approve")}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <CheckCircle2 size={11} /> Admin OK
              </button>
              <button onClick={() => onRespond(swap.id, "admin", "reject")}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">
                <X size={11} /> Avvisa
              </button>
            </>
          )}
          {isRequester && swap.status === "pending" && (
            <button onClick={() => onCancel(swap.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg hover:border-red-200">
              <X size={11} /> Avbryt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SwapsPage() {
  const { api, user } = useAuth();
  const { clinicId } = useClinic();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [form, setForm] = useState({ target_id: "", requester_date: "", target_date: "", shift_from: "", shift_to: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const isAdmin = user?.role === "admin";

  const loadSwaps = async () => {
    setLoading(true);
    try {
      const data = await api(`/swap-requests?clinic_id=${clinicId || "kristianstad"}`);
      setSwaps(Array.isArray(data) ? data : data?.swap_requests || []);
    } catch (e) {
      console.error("Swap-requests load failed:", e);
      setSwaps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (api && clinicId) loadSwaps(); }, [api, clinicId]);

  const handleSubmit = async () => {
    if (!form.target_id || !form.requester_date || !form.target_date) {
      setFormError("Fyll i motpart, ditt datum och motpartens datum");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api("/swap-requests", {
        method: "POST",
        body: JSON.stringify({ clinic_id: clinicId || "kristianstad", requester_id: user?.username, ...form }),
      });
      setForm({ target_id: "", requester_date: "", target_date: "", shift_from: "", shift_to: "", note: "" });
      setShowForm(false);
      await loadSwaps();
    } catch {
      setFormError("Kunde inte skapa bytesförfrågan — kontrollera att datum och motpart är korrekt");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (swapId, actor, decision) => {
    setActionLoading(swapId);
    try {
      const endpoint = actor === "peer" ? `/swap-requests/${swapId}/peer-respond` : `/swap-requests/${swapId}/admin-respond`;
      await api(endpoint, { method: "POST", body: JSON.stringify({ decision, user_id: user?.username, clinic_id: clinicId || "kristianstad" }) });
      await loadSwaps();
    } catch (e) { console.error("Respond failed:", e); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async (swapId) => {
    setActionLoading(swapId);
    try {
      await api(`/swap-requests/${swapId}/cancel`, { method: "POST", body: JSON.stringify({ user_id: user?.username }) });
      await loadSwaps();
    } catch (e) { console.error("Cancel failed:", e); }
    finally { setActionLoading(null); }
  };

  const filtered = swaps.filter(s => {
    if (filter === "mine") return s.requester_id === user?.username || s.target_id === user?.username;
    if (filter === "pending_action") {
      return (s.target_id === user?.username && s.status === "pending") || (isAdmin && s.status === "peer_approved");
    }
    return true;
  });

  const pendingActionCount = swaps.filter(s =>
    (s.target_id === user?.username && s.status === "pending") || (isAdmin && s.status === "peer_approved")
  ).length;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[900px] mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-blue-500" /> Bytestavla
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">Skicka och hantera bytesbegäran av schemapass</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadSwaps} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
            <Plus size={12} /> Nytt bytesförslag
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-4 space-y-3">
          <h3 className="text-[13px] font-semibold text-slate-700">Ny bytesförfrågan</h3>
          {formError && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
              <AlertTriangle size={12} className="text-red-600" />
              <span className="text-[12px] text-red-700">{formError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Motpartens ID *</label>
              <input value={form.target_id} onChange={e => setForm(f => ({ ...f, target_id: e.target.value }))}
                placeholder="t.ex. dr_andersson"
                className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:border-blue-400 outline-none" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Ditt datum *</label>
              <input type="date" value={form.requester_date} onChange={e => setForm(f => ({ ...f, requester_date: e.target.value }))}
                className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Motpartens datum *</label>
              <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
                className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Ditt pass</label>
              <input value={form.shift_from} onChange={e => setForm(f => ({ ...f, shift_from: e.target.value }))}
                placeholder="t.ex. JOUR_P"
                className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Motpartens pass</label>
              <input value={form.shift_to} onChange={e => setForm(f => ({ ...f, shift_to: e.target.value }))}
                placeholder="t.ex. MOTT"
                className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Meddelande</label>
              <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Valfritt meddelande..."
                className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Skicka förfrågan
            </button>
            <button onClick={() => { setShowForm(false); setFormError(null); }}
              className="px-3 py-2 text-[12px] text-slate-500 hover:text-slate-700">
              Avbryt
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Totalt</p>
          <p className="text-[20px] font-bold text-slate-800">{swaps.length}</p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Kräver åtgärd</p>
          <p className={`text-[20px] font-bold ${pendingActionCount > 0 ? "text-amber-600" : "text-slate-800"}`}>{pendingActionCount}</p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Godkända</p>
          <p className="text-[20px] font-bold text-emerald-600">{swaps.filter(s => s.status === "admin_approved").length}</p>
        </div>
      </div>

      <div className="flex gap-1">
        {[
          { id: "all", label: "Alla" },
          { id: "mine", label: "Mina" },
          { id: "pending_action", label: `Kräver åtgärd${pendingActionCount > 0 ? ` (${pendingActionCount})` : ""}` },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-2.5 py-1.5 text-[11px] rounded-lg ${filter === f.id ? "bg-slate-200 text-slate-800 font-medium" : "text-slate-400 hover:text-slate-600"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 size={28} className="animate-spin text-blue-500 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <ArrowLeftRight size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-[13px] text-slate-500">
            {filter === "pending_action" ? "Inga bytesförfrågningar kräver din åtgärd just nu" : "Inga bytesförfrågningar att visa"}
          </p>
          {filter === "all" && <p className="text-[12px] text-slate-400 mt-1">Klicka "Nytt bytesförslag" för att skapa din första bytesförfrågan</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(swap => (
            <div key={swap.id} className="relative">
              {actionLoading === swap.id && (
                <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-xl">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                </div>
              )}
              <SwapCard swap={swap} user={user} onRespond={handleRespond} onCancel={handleCancel} isAdmin={isAdmin} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
