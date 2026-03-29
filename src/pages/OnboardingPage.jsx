/**
 * OnboardingPage — AI-driven klinik-setup.
 * AI:n intervjuar admin i en chatt och bygger hela konfigurationen.
 */
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import {
  MessageCircle, Send, Check, Loader2, Building2,
  ArrowRight, AlertCircle, RefreshCw
} from "lucide-react";

const STEPS = [
  "Grundinfo",
  "Personal",
  "Funktioner",
  "Utbildning",
  "Jourschema",
  "Specialregler",
  "Sammanfattning",
];

export default function OnboardingPage() {
  const { api } = useAuth();
  const { switchClinic } = useClinic();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [partialConfig, setPartialConfig] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [finalConfig, setFinalConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const chatRef = useRef(null);

  // Starta konversationen
  useEffect(() => {
    if (messages.length === 0) {
      sendMessage("Hej! Jag vill konfigurera en ny klinik i schemasystemet.");
    }
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await api("/api/ai/onboarding", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          chat_history: newMessages,
          partial_config: partialConfig,
        }),
      });

      const aiMsg = {
        role: "assistant",
        content: res.message_sv || res.response_sv || "...",
      };
      setMessages([...newMessages, aiMsg]);

      if (res.current_step) setCurrentStep(res.current_step);
      if (res.config_so_far) setPartialConfig(res.config_so_far);
      if (res.is_complete) {
        setIsComplete(true);
        setFinalConfig(res.final_config || res.config_so_far);
      }
    } catch (err) {
      setMessages([...newMessages, {
        role: "assistant",
        content: "Något gick fel. Försök igen eller omformulera ditt svar.",
      }]);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const config = await api("/api/ai/onboarding/generate", {
        method: "POST",
        body: JSON.stringify({ final_config: finalConfig, config_so_far: partialConfig }),
      });
      setFinalConfig(config);
    } catch (err) {
      console.error("Generate failed:", err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!finalConfig) return;
    setSaving(true);
    const clinicId = (finalConfig.name || "ny-klinik")
      .toLowerCase().replace(/[^a-zåäö0-9]/g, "-").replace(/-+/g, "-");
    try {
      await api(`/api/ai/onboarding/save?clinic_id=${encodeURIComponent(clinicId)}`, {
        method: "POST",
        body: JSON.stringify(finalConfig),
      });
      setSaved(true);
      switchClinic(clinicId);
    } catch (err) {
      console.error("Save failed:", err);
    }
    setSaving(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Building2 size={20} className="text-blue-600" />
          <h1 className="text-lg font-bold text-slate-800">Ny klinik — AI-onboarding</h1>
        </div>
        <p className="text-sm text-slate-500">
          Berätta om din klinik så konfigurerar AI:n schemasystemet åt dig.
          Inga formulär — bara en konversation.
        </p>
      </div>

      {/* Steg-indikator */}
      <div className="flex gap-1 mb-4">
        {STEPS.map((step, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${
              i + 1 < currentStep ? "bg-green-400" :
              i + 1 === currentStep ? "bg-blue-500" :
              "bg-slate-200"
            }`} />
            <p className={`text-[10px] mt-1 text-center ${
              i + 1 <= currentStep ? "text-slate-600 font-medium" : "text-slate-400"
            }`}>{step}</p>
          </div>
        ))}
      </div>

      {/* Chattfönster */}
      <div className="card overflow-hidden flex flex-col" style={{ height: "55vh" }}>
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}>
                {msg.content.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-1.5" : ""}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl px-4 py-2.5">
                <Loader2 size={16} className="animate-spin text-blue-500" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        {!isComplete ? (
          <div className="border-t border-slate-100 p-3 flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Skriv ditt svar..."
              rows={2}
              className="flex-1 resize-none text-[13px] border border-slate-200 rounded-xl px-3 py-2 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        ) : (
          <div className="border-t border-slate-100 p-4 bg-green-50">
            <div className="flex items-center gap-2 text-green-700 mb-3">
              <Check size={16} />
              <span className="text-[13px] font-semibold">Konfigurationen är klar!</span>
            </div>
            <div className="flex gap-2">
              {!saved ? (
                <>
                  <button onClick={handleGenerate} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg">
                    <RefreshCw size={13} /> Generera konfiguration
                  </button>
                  {finalConfig && (
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[13px] font-medium rounded-lg">
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Spara och aktivera klinik
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-green-700 text-[13px] font-medium">
                  <Check size={16} /> Kliniken är skapad och aktiv! Byt till schemasidan för att börja.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Config-preview (om den finns) */}
      {finalConfig && !saved && (
        <div className="card mt-4 p-4">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-2">Förhandsgranskning</h3>
          <div className="grid grid-cols-3 gap-3 text-[12px]">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-400 mb-1">Klinik</p>
              <p className="font-medium text-slate-700">{finalConfig.name || "—"}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-400 mb-1">Sites</p>
              <p className="font-medium text-slate-700">{(finalConfig.sites || []).join(", ") || "—"}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-400 mb-1">Läkare</p>
              <p className="font-medium text-slate-700">{(finalConfig.doctors || []).length} st</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-400 mb-1">Operationssalar</p>
              <p className="font-medium text-slate-700">{(finalConfig.operating_rooms || []).length} st</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-400 mb-1">Regler</p>
              <p className="font-medium text-slate-700">{(finalConfig.constraint_rules || []).length} st</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-400 mb-1">Schemacykel</p>
              <p className="font-medium text-slate-700">{finalConfig.schedule_cycle_weeks || 10} veckor</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
