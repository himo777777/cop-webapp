const DOCTORS = [
  "Dr Andersson", "Dr Bergstrom", "Dr Claesson", "Dr Danielsson", "Dr Eriksson",
  "Dr Fredriksson", "Dr Gustafsson", "Dr Holm", "Dr Isaksson", "Dr Johansson",
  "Dr Karlsson", "Dr Lindberg", "Dr Magnusson", "Dr Nilsson", "Dr Olsson",
];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export async function getFairness() {
  await new Promise(r => setTimeout(r, 400));

  const doctors = DOCTORS.map((name, i) => {
    const jour = rand(2, 8);
    const helg = rand(1, 5);
    const natt = rand(1, 6);
    return { id: `doc${i}`, name, jour, helg, natt, total: jour + helg + natt };
  });

  // Rättvisepoäng: baserat på standardavvikelse av total
  const totals = doctors.map(d => d.total);
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  const variance = totals.reduce((a, b) => a + (b - avg) ** 2, 0) / totals.length;
  const stddev = Math.sqrt(variance);
  const maxStddev = 5;
  const score = Math.max(0, Math.round(100 - (stddev / maxStddev) * 100));

  return {
    doctors,
    fairness_score: score,
    avg_total: Math.round(avg * 10) / 10,
    stddev: Math.round(stddev * 10) / 10,
    period: "Senaste 3 manaderna",
    trend: [
      { month: "Jan", score: rand(70, 95) },
      { month: "Feb", score: rand(70, 95) },
      { month: "Mar", score },
    ],
  };
}
