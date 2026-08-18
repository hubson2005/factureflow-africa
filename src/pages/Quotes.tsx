import React, { useMemo, useState } from "react";
import { FilePlus, Loader2 } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useQuotes, useCreateQuote, useUpdateQuoteStatus, useSendQuote } from "../modules/quotes/useQuotes";
import { QuoteCard } from "../modules/quotes/components/QuoteCard";
import { QuotesToolbar } from "../modules/quotes/components/QuotesToolbar";
import { NewQuoteForm } from "../modules/quotes/components/NewQuoteForm";
import { useAutoOpenCreate } from "@/hooks/useAutoOpenCreate";

export default function Quotes() {
  const { data: quotes, isLoading, isError } = useQuotes();
  const createQuote = useCreateQuote();
  const updateStatus = useUpdateQuoteStatus();
  const sendQuote = useSendQuote();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Tous");
  const [showForm, setShowForm] = useState(false);

  // Ouvre automatiquement ce formulaire si on arrive ici via le bouton "+" -> "Devis"
  // du menu de creation rapide mobile (BottomNav).
  useAutoOpenCreate(setShowForm);

  const mapped = useMemo(() => {
    if (!quotes) return [];
    return quotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quote_number,
      clientName: q.clients ? q.clients.name : "Client",
      total: Number(q.total),
      status: q.status,
      validUntil: q.valid_until,
      createdAt: q.created_at,
      items: q.quote_items || [],
    }));
  }, [quotes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mapped.filter((quote) => {
      const matchStatus = status === "Tous" || quote.status === status;
      const matchSearch = !q || quote.quoteNumber.toLowerCase().includes(q) || quote.clientName.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [mapped, search, status]);

  function handleSave(data) {
    createQuote.mutate(data, {
      onSuccess: () => setShowForm(false),
      onError: (err) => alert("Erreur : " + err.message),
    });
  }

  function handleAccept(id) { updateStatus.mutate({ id, status: "accepte" }); }
  function handleSend(id) { return sendQuote.mutateAsync(id); }
  function handleRefuse(id) { updateStatus.mutate({ id, status: "refuse" }); }

  return (
    <>
      {showForm && <NewQuoteForm onClose={() => setShowForm(false)} onSave={handleSave} saving={createQuote.isPending} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Header title="Devis" />
        <button onClick={() => setShowForm(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
          borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
          border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
          fontFamily: "'Inter',-apple-system,sans-serif", flexShrink: 0 }}>
          <FilePlus size={15} /> Nouveau
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement des devis...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign: "center", color: palette.danger.solid, fontSize: 13, padding: "40px 0" }}>
          Erreur de chargement.
        </p>
      ) : (
        <>
          <QuotesToolbar
            search={search} onSearchChange={setSearch}
            status={status} onStatusChange={setStatus}
            total={mapped.length} filteredCount={filtered.length}
          />
          <div style={{ marginTop: 16 }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: "center", color: colors.gray[600], fontSize: 13, padding: "40px 0" }}>
                {mapped.length === 0 ? "Aucun devis pour le moment. Creez votre premier devis !" : "Aucun resultat."}
              </p>
            ) : filtered.map((q) => (
              <QuoteCard key={q.id} quote={q} onAccept={handleAccept} onSend={handleSend} onRefuse={handleRefuse} />
            ))}
          </div>
        </>
      )}
    </>
  );
}