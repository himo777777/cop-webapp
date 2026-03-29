import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import {
  Clock, Loader2, RefreshCw, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle2, User
} from "lucide-react";

const BALANCE_THRESHOLD_WARN = -8;  // hours
const BALANCE_THRESHOLD_CRIT = -16;

function BalanceBadge({ hours }) {
  if (hours === null || hours === undefined) return <span className="text-slate-400">—</span>;
  const h = parseFloat(hours);
  if (h > 4) return (
    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
      <TrendingUp size={12} /> +{h.toFixed(1)} h
    </span>
  );
  if (h < BALANCE_THRESHOLD_CRIT) return (
    <span className="flex items-center gap-1 text-red-700 font-semibold">
      <TrendingDown size={12} /> {h.toFixed(1)} h
    </span>
  );
  if (h < BALANCE_THRESHOLD_WARN) return (
    <span className="flex items-center gap-1 text-orange-600 font-semibold">
      <AlertTriangle size={12} /> {h.toFixed(1)} h
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-slate-600">
      <Minus size={12} /> {h >= 0 ? "+" : ""}{h.toFixed(1)} h
    </span>
  );
}

function SummaryCard({ label, value, color = "text-slate-800", sub }) {
  return (
    <div className="card p-3">
      <p className="text-[10px] text-slate-400 uppercase font-semibold">{label}</p>
      <p className={`text-[22px] font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CompTimePage() {
  const { api } = useAuth();
  const { clinicId } = useClinic();
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("balance_asc"); // balance_asc | balance_desc | name

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await api(`/comp-time/overview/all?clinic_id=${clinicId || "kristianstad"}`);
      setOverview(Array.isArray(data) ? data : data?.doctors || []);
    } catch (e) {
      console.error("Comp-time overview failed:", e);
      setOverview([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (api && clinicId) loadOverview();
  }, [api, clinicId]);

  const filtered = overview
    .filter(d => !search || (d.doctor_name || d.doctor_id || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "balance_asc") return (a.balance_hours || 0) - (b.balance_hours || 0);
      if (sortBy === "balance_desc") return (b.balance_hours || 0) - (a.balance_hours || 0);
      return (a.doctor_name || a.doctor_id || "").localeCompare(b.doctor_name || b.doctor_id || "");
    });

  const criticalCount = overview.filter(d => (d.balance_hours || 0) < BALANCE_THRESHOLD_CRIT).length;
  const warnCount = overview.filter(d => {
    const h = d.balance_hours || 0;
    return h >= BALANCE_THRESHOLD_CRIT && h < BALANCE_THRESHOLD_WARN;
  }).length;
  const totalBalance = overview.reduce((s, d) => s + (d.balance_hours || 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" /> Komp-tid & Saldoöversikt
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">Följ komp-tid och OB-saldo per läkare</p>
        </div>
        <button onClick={loadOverview} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Uppdatera
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Läkare totalt" value={overview.length} />
        <SummaryCard
          label="Kritiska saldon"
          value={criticalCount}
          color={criticalCount > 0 ? "text-red-600" : "text-slate-800"}
          sub="< −16 h"
        />
        <SummaryCard
          label="Varningsläge"
          value={warnCount}
          color={warnCount > 0 ? "text-orange-500" : "text-slate-800"}
          sub="−16 h till −8 h"
        />
        <SummaryCard
          label="Klinikens nettosaldo"
          value={`${totalBalance >= 0 ? "+" : ""}${totalBalance.toFixed(0)} h`}
          color={totalBalance < -20 ? "text-red-600" : totalBalance > 20 ? "text-emerald-600" : "text-slate-800"}
        />
      </div>

      {/* Alert banners */}
      {criticalCount > 0 && (
        <div className="card p-3 bg-red-50 border-red-200 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-600 shrink-0" />
          <p className="text-[12px] text-red-700 font-medium">
            {criticalCount} läkare har negativt saldo under −16 timmar — planera komp-uttag snarast
          </p>
        </div>
      )}

      {/* Filter + sort */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Sök läkare..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-[12px] border border-slate-200 rounded-lg px-3 py-1.5 w-48 focus:border-blue-400 outline-none"
        />
        <div className="flex gap-1 ml-auto">
          {[
            { id: "balance_asc", label: "Lägst saldo" },
            { id: "balance_desc", label: "Högst saldo" },
            { id: "name", label: "A–Ö" },
          ].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)}
              className={`px-2.5 py-1 text-[11px] rounded-lg ${sortBy === s.id ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main table */}
      {loading ? (
        <div className="text-center py-12"><Loader2 size={28} className="animate-spin text-amber-500 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Clock size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-[13px] text-slate-500">Ingen komp-tid data tillgänglig</p>
          <p className="text-[12px] text-slate-400 mt-1">Kontrollera att schema är genererat för aktuell period</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase border-b border-slate-100">
                <th className="text-left py-2.5 px-3">Läkare</th>
                <th className="text-right py-2.5 px-3">Ackumulerat saldo</th>
                <th className="text-right py-2.5 px-3">Planerade komp-uttag</th>
                <th className="text-right py-2.5 px-3">Jourpasss (period)</th>
                <th className="text-right py-2.5 px-3">OB-timmar</th>
                <th className="text-center py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const balance = d.balance_hours || 0;
                let statusEl;
                if (balance < BALANCE_THRESHOLD_CRIT) {
                  statusEl = (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                      <AlertTriangle size={9} /> Kritisk
                    </span>
                  );
                } else if (balance < BALANCE_THRESHOLD_WARN) {
                  statusEl = (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
                      <AlertTriangle size={9} /> Varning
                    </span>
                  );
                } else if (balance > 8) {
                  statusEl = (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                      <CheckCircle2 size={9} /> OK
                    </span>
                  );
                } else {
                  statusEl = (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                      <Minus size={9} /> Balans
                    </span>
                  );
                }

                return (
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-500 shrink-0">
                          {(d.doctor_name || d.doctor_id || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{d.doctor_name || d.doctor_id}</p>
                          {d.role && <p className="text-[10px] text-slate-400 capitalize">{d.role}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <BalanceBadge hours={balance} />
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {d.planned_comp_hours !== undefined ? `${parseFloat(d.planned_comp_hours).toFixed(1)} h` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {d.jour_count !== undefined ? d.jour_count : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {d.ob_hours !== undefined ? `${parseFloat(d.ob_hours).toFixed(1)} h` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-center">{statusEl}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-400 inline-block" /> Kritisk: saldo under −16 h</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-400 inline-block" /> Varning: saldo −8 h till −16 h</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" /> OK: saldo över +8 h</span>
      </div>
    </div>
  );
}
