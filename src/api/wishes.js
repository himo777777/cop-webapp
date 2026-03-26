const MOCK_WISHES = [
  { id: "w1", doctor_id: "SP1", doctor_name: "Dr Fredriksson", date: "2026-04-15", type: "ledig", priority: "viktigt", note: "Lakarbesk", created: "2026-04-01" },
  { id: "w2", doctor_id: "OL1", doctor_name: "Dr Andersson", date: "2026-04-15", type: "ledig", priority: "viktigt", note: "Barnkalas", created: "2026-04-02" },
  { id: "w3", doctor_id: "ST1", doctor_name: "Dr Nilsson", date: "2026-04-16", type: "foredrar_op", priority: "onskemol", note: "Vill operera med handledare", created: "2026-04-03" },
  { id: "w4", doctor_id: "SP3", doctor_name: "Dr Holm", date: "2026-04-14", type: "inte_nattjour", priority: "onskemol", note: "", created: "2026-04-03" },
  { id: "w5", doctor_id: "OL2", doctor_name: "Dr Bergstrom", date: "2026-04-15", type: "ledig", priority: "viktigt", note: "Semester", created: "2026-04-04" },
  { id: "w6", doctor_id: "SP7", doctor_name: "Dr Lindberg", date: "2026-04-17", type: "foredrar_morgon", priority: "onskemol", note: "", created: "2026-04-05" },
];

let wishes = [...MOCK_WISHES];
const delay = (ms) => new Promise(r => setTimeout(r, ms));

export async function listWishes(period) { await delay(300); return period ? wishes.filter(w => w.date.startsWith(period)) : [...wishes]; }

export async function createWish(data) {
  await delay(300);
  const w = { id: `w${Date.now()}`, ...data, created: new Date().toISOString().slice(0, 10) };
  wishes = [w, ...wishes];
  return w;
}

export async function getWishConflicts() {
  await delay(500);
  const byDate = {};
  wishes.forEach(w => { byDate[w.date] = (byDate[w.date] || 0) + 1; });
  const conflicts = Object.entries(byDate).filter(([_, c]) => c >= 2).map(([date, count]) => ({
    date, count, message: `${count} lakare vill ha ledigt ${date} — kan bli svart att bemanna`,
    severity: count >= 3 ? "high" : "medium",
  }));
  return { conflicts, deadline: "2026-04-10", days_left: 3 };
}
