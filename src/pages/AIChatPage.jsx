import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { chatMessage } from "../api/ai";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";

const QUICK_ACTIONS = [
  "Vem jobbar idag?",
  "Mitt schema denna vecka",
  "Byt pass",
  "Hur manga jourer har jag?",
];

export default function AIChatPage() {
  const { api, user } = useAuth();
  const { clinicId } = useClinic();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || !clinicId) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const result = await chatMessage(api, clinicId, user?.username || "anon", msg);
      setMessages(prev => [...prev, {
        role: "ai",
        text: result.response_sv || "Inget svar",
        action: result.action,
        suggestions: result.suggestions || [],
        intent: result.intent,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", text: `Fel: ${e.message}`, error: true }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-52px)]">
      {/* Header */}
      <div className="px-4 lg:px-6 py-3 border-b border-slate-200 bg-white shrink-0">
        <h1 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles size={18} className="text-violet-500" /> Schema-chatt
        </h1>
        <p className="text-[12px] text-slate-400">Stall fragor om schemat eller gor andringar via chatt.</p>
      </div>

      {/* Quick actions */}
      <div className="px-4 lg:px-6 py-2 flex gap-2 flex-wrap shrink-0 bg-slate-50/50">
        {QUICK_ACTIONS.map(q => (
          <button key={q} onClick={() => send(q)}
            className="text-[11px] px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-colors">
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Bot size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-[14px] font-medium">Hej! Fraga mig om schemat.</p>
            <p className="text-[12px] mt-1">Jag kan visa schema, byta pass och svara pa fragor.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] ${m.role === "user"
              ? "bg-violet-600 text-white rounded-2xl rounded-br-md px-4 py-2.5"
              : `${m.error ? "bg-red-50 border border-red-100" : "bg-white border border-slate-200"} rounded-2xl rounded-bl-md px-4 py-2.5`
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                {m.role === "user" ? <User size={12} /> : <Bot size={12} className="text-violet-500" />}
                <span className="text-[10px] opacity-70">{m.role === "user" ? "Du" : "COP AI"}</span>
              </div>
              <p className={`text-[13px] ${m.role === "user" ? "" : "text-slate-700"}`}>{m.text}</p>
              {m.action && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-emerald-600 flex items-center gap-1">
                  <CheckCircle size={12} /> Handling: {m.action.type}
                </div>
              )}
              {m.suggestions?.length > 0 && (
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {m.suggestions.map((s, j) => (
                    <button key={j} onClick={() => send(s)}
                      className="text-[10px] px-2 py-1 bg-violet-50 text-violet-600 rounded-full hover:bg-violet-100 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 size={16} className="animate-spin text-violet-500" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 lg:px-6 py-3 border-t border-slate-200 bg-white shrink-0">
        <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Skriv ett meddelande..."
            className="flex-1 text-[13px] border border-slate-200 rounded-lg px-4 py-2.5 bg-white focus:border-violet-400 focus:ring-1 focus:ring-violet-100 outline-none"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition-colors">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
