import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, AlertCircle, TrendingUp, FileText, RefreshCw, Target, Send as SendIcon } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { supabase } from "../lib/supabaseClient";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const SUGGESTIONS = [
  { icon: Target, label: "Que dois-je faire aujourd'hui ?", color: "primary" },
  { icon: AlertCircle, label: "Relancer les impayes", color: "danger" },
  { icon: TrendingUp, label: "Analyser mes ventes", color: "primary" },
  { icon: FileText, label: "Resume de mes devis", color: "blue" },
  { icon: RefreshCw, label: "Resume des performances", color: "green" },
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Bonjour ! Je suis votre assistant FactureFlow, connecte a vos vraies donnees. Je peux analyser vos ventes, identifier vos impayes ou resumer vos performances. Comment puis-je vous aider ?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const newMessages = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expiree, reconnectez-vous.");

      const res = await fetch(
        "https://pufeqrduffcgneaxhuix.supabase.co/functions/v1/assistant-ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + session.access_token,
          },
          body: JSON.stringify({ message: text, history: newMessages.slice(0, -1) }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
          suggestedActions: Array.isArray(data.suggested_actions) ? data.suggested_actions : [],
        },
      ]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [...prev, { role: "assistant", text: "Desole, une erreur est survenue. Reessayez dans un instant." }]);
    } finally {
      setLoading(false);
    }
  }

  // Clic sur un bouton d'action: on retire les actions du message (evite double-clic /
  // double envoi) puis on envoie le message de confirmation comme si l'utilisateur l'avait tape.
  function handleActionClick(messageIndex, action) {
    if (loading) return;
    setMessages((prev) =>
      prev.map((m, i) => (i === messageIndex ? { ...m, suggestedActions: [] } : m))
    );
    sendMessage(action.confirm_message);
  }

  return (
    <>
      <Header title="Assistant IA" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "calc(100vh - 200px)", minHeight: 400 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SUGGESTIONS.map((s) => {
            const pal = palette[s.color];
            const Icon = s.icon;
            return (
              <button key={s.label} onClick={() => sendMessage(s.label)} disabled={loading} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
                borderRadius: radius.full, border: "1px solid " + pal[100],
                background: pal[50], color: pal.solid, fontSize: 12.5, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", fontFamily: font, opacity: loading ? 0.6 : 1,
              }}>
                <Icon size={13} /> {s.label}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12,
          background: colors.white, borderRadius: radius.lg, padding: 16,
          border: "1px solid " + colors.gray[100], boxShadow: shadow.card }}>
          {messages.map((m, i) => {
            const isAssistant = m.role === "assistant";
            const hasActions = isAssistant && m.suggestedActions && m.suggestedActions.length > 0;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6,
                alignItems: isAssistant ? "flex-start" : "flex-end" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start",
                  flexDirection: isAssistant ? "row" : "row-reverse", width: "100%" }}>
                  {isAssistant && (
                    <div style={{ width: 32, height: 32, borderRadius: radius.full, background: colors.gray[900],
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Bot size={16} color={colors.white} />
                    </div>
                  )}
                  <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: radius.lg,
                    background: isAssistant ? colors.gray[50] : palette.primary.solid,
                    color: isAssistant ? colors.gray[900] : colors.white,
                    fontSize: 13.5, lineHeight: "20px", fontFamily: font, whiteSpace: "pre-wrap" }}>
                    {m.text}
                  </div>
                </div>

                {hasActions && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 42 }}>
                    {m.suggestedActions.map((action, ai) => (
                      <button
                        key={ai}
                        onClick={() => handleActionClick(i, action)}
                        disabled={loading}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
                          borderRadius: radius.md, border: "none",
                          background: palette.primary.solid, color: colors.white,
                          fontSize: 13, fontWeight: 600, fontFamily: font,
                          cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                        }}
                      >
                        <SendIcon size={13} /> {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: radius.full, background: colors.gray[900],
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={16} color={colors.white} />
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: colors.gray[300] }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: 12, color: palette.danger.solid }}>{"Erreur: " + error}</p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Posez votre question..." disabled={loading}
            style={{ flex: 1, border: "1px solid " + colors.gray[200], borderRadius: radius.md,
              padding: "12px 16px", fontSize: 14, fontFamily: font, outline: "none",
              background: colors.white, color: colors.gray[900] }} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} style={{
            width: 46, height: 46, borderRadius: radius.md, border: "none",
            background: input.trim() && !loading ? palette.primary.solid : colors.gray[200],
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed", flexShrink: 0 }}>
            <Send size={18} color={input.trim() && !loading ? colors.white : colors.gray[400]} />
          </button>
        </div>
      </div>
    </>
  );
}