/**
 * COP AI API — wrapper-funktioner for AI-endpoints.
 * Alla funktioner tar `api` (fran useAuth) som forsta argument.
 */

export async function parseRule(api, clinicId, ruleText) {
  return api("/api/ai/rules/parse", {
    method: "POST",
    body: JSON.stringify({ clinic_id: clinicId, rule_text: ruleText }),
  });
}

export async function chatMessage(api, clinicId, userId, message) {
  return api("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ clinic_id: clinicId, user_id: userId, message }),
  });
}

export async function explainShift(api, scheduleId, doctorId, shiftDate) {
  return api("/api/ai/explain", {
    method: "POST",
    body: JSON.stringify({ schedule_id: scheduleId, doctor_id: doctorId, shift_date: shiftDate }),
  });
}

export async function predictAbsence(api, clinicId, periodStart, periodEnd) {
  return api("/api/ai/predict/absence", {
    method: "POST",
    body: JSON.stringify({ clinic_id: clinicId, period_start: periodStart, period_end: periodEnd }),
  });
}

export async function checkConflicts(api, clinicId, newRule) {
  return api("/api/ai/conflicts/check", {
    method: "POST",
    body: JSON.stringify({ clinic_id: clinicId, new_rule: newRule }),
  });
}
