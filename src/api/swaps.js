const MOCK_SWAPS = [
  { id: "sw1", doctor_id: "SP1", doctor_name: "Dr Fredriksson", shift: "JOUR_P", date: "2026-04-10", wish: "Vill byta med nagon som kan ta fredag natt", status: "open", created: "2026-04-05" },
  { id: "sw2", doctor_id: "ST2", doctor_name: "Dr Olsson", shift: "OP_Hassleholm", date: "2026-04-08", wish: "Behover ledigt tisdag — lakarbesk", status: "open", created: "2026-04-04" },
  { id: "sw3", doctor_id: "OL3", doctor_name: "Dr Claesson", shift: "MOTT_CSK", date: "2026-04-07", wish: "Kan nagon ta min mottagning mandag?", status: "accepted", accepted_by: "SP4", created: "2026-04-03" },
  { id: "sw4", doctor_id: "SP5", doctor_name: "Dr Johansson", shift: "JOUR_B", date: "2026-04-12", wish: "Byt bakjour lordag", status: "completed", accepted_by: "SP2", created: "2026-04-01" },
  { id: "sw5", doctor_id: "ST4", doctor_name: "Dr Rosen", shift: "AVD_CSK", date: "2026-04-09", wish: "Skulle vilja byta avdelning onsdag", status: "open", created: "2026-04-06" },
];

let swaps = [...MOCK_SWAPS];
const delay = (ms) => new Promise(r => setTimeout(r, ms));

export async function listSwaps() { await delay(300); return [...swaps]; }

export async function createSwap(data) {
  await delay(300);
  const sw = { id: `sw${Date.now()}`, ...data, status: "open", created: new Date().toISOString().slice(0, 10) };
  swaps = [sw, ...swaps];
  return sw;
}

export async function acceptSwap(id, acceptedBy) {
  await delay(300);
  swaps = swaps.map(s => s.id === id ? { ...s, status: "accepted", accepted_by: acceptedBy } : s);
  return swaps.find(s => s.id === id);
}

export async function completeSwap(id) {
  await delay(200);
  swaps = swaps.map(s => s.id === id ? { ...s, status: "completed" } : s);
  return swaps.find(s => s.id === id);
}
