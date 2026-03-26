import { useState, useEffect } from "react";
import { getFairness } from "../api/fairness";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import { Scale, Loader2, TrendingUp } from "lucide-react";

function ScoreBadge({ score }) {
  const color = score >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : score >= 60 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";
  return (
    <div className={`card p-5 text-center border ${color}`}>
      <div className="text-[36px] font-bold">{score}</div>
      <div className="text-[12px] font-medium mt-1">av 100</div>
      <div className="text-[11px] mt-2 opacity-70">
        {score >= 80 ? "Rattvis fordelning" : score >= 60 ? "Godkant — kan forbattras" : "Orattvis — atgard kravs"}
      </div>
    </div>
  );
}

export default function FairnessPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getFairness().then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="p-6 text-center"><Loader2 size={24} className="animate-spin text-violet-500 mx-auto" /></div>;
  if (!data) return null;

  const chartDocs = data.doctors.slice(0, 15);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
          <Scale size={18} className="text-violet-500" /> Rattvisedashboard
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">{data.period} | Snitt: {data.avg_total} obekvama pass | Standardavvikelse: {data.stddev}</p>
      </div>

      {/* Score + Trend */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ScoreBadge score={data.fairness_score} />
        <div className="lg:col-span-2 card p-4">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <TrendingUp size={14} /> Trend
          </h3>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data.trend}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Jourer</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartDocs} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} tickFormatter={n => n.replace("Dr ","")} />
              <Tooltip />
              <Bar dataKey="jour" fill="#ef4444" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-4">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Helgpass</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartDocs} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} tickFormatter={n => n.replace("Dr ","")} />
              <Tooltip />
              <Bar dataKey="helg" fill="#f59e0b" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-4">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Nattpass</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartDocs} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} tickFormatter={n => n.replace("Dr ","")} />
              <Tooltip />
              <Bar dataKey="natt" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-left">
              <th className="px-3 py-2 font-semibold">Lakare</th>
              <th className="px-3 py-2 font-semibold text-center">Jourer</th>
              <th className="px-3 py-2 font-semibold text-center">Helg</th>
              <th className="px-3 py-2 font-semibold text-center">Natt</th>
              <th className="px-3 py-2 font-semibold text-center">Totalt</th>
            </tr>
          </thead>
          <tbody>
            {data.doctors.sort((a, b) => b.total - a.total).map(d => (
              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-700">{d.name}</td>
                <td className="px-3 py-2 text-center text-red-600">{d.jour}</td>
                <td className="px-3 py-2 text-center text-amber-600">{d.helg}</td>
                <td className="px-3 py-2 text-center text-violet-600">{d.natt}</td>
                <td className="px-3 py-2 text-center font-bold text-slate-800">{d.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
