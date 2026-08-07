import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Loader2 } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useClients, useCreateClient } from "../modules/clients/useClients";
import { ClientCard } from "../modules/clients/components/ClientCard";
import { ClientsToolbar } from "../modules/clients/components/ClientsToolbar";
import type { ClientFilter } from "../modules/clients/components/ClientsToolbar";
import { NewClientForm } from "../modules/clients/components/NewClientForm";

const PALETTE_ROTATION = ["primary","blue","green","purple","yellow","danger"] as const;

export default function Clients() {
  const navigate = useNavigate();
  const { data: clients, isLoading, isError } = useClients();
  const createClient = useCreateClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClientFilter>("Tous");
  const [showForm, setShowForm] = useState(false);

  const mapped = useMemo(() => {
    if (!clients) return [];
    return clients.map((c: any, i: number) => ({
      id: c.id,
      name: c.name,
      initials: (c.name || "?").substring(0,2).toUpperCase(),
      color: PALETTE_ROTATION[i % PALETTE_ROTATION.length],
      email: c.email || "",
      phone: c.phone || "",
      city: c.address || "—",
      totalInvoices: 0,
      totalAmount: "0",
      lastInvoice: "—",
      status: "Actif" as const,
    }));
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mapped.filter(c => {
      const matchFilter = filter === "Tous" || c.status === filter;
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [mapped, search, filter]);

  function handleSave(data: any) {
    createClient.mutate(data, {
      onSuccess: () => setShowForm(false),
      onError: (err: any) => alert("Erreur : " + err.message),
    });
  }

  return (
    <>
      {showForm && <NewClientForm onClose={()=>setShowForm(false)} onSave={handleSave}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <Header title="Clients" />
        <button onClick={()=>setShowForm(true)} style={{
          display:"flex", alignItems:"center", gap:6, padding:"9px 14px",
          borderRadius:radius.md, background:palette.primary.solid, color:colors.white,
          border:"none", fontSize:13, fontWeight:700, cursor:"pointer",
          fontFamily:"'Inter',-apple-system,sans-serif", flexShrink:0 }}>
          <UserPlus size={15}/> Ajouter
        </button>
      </div>

      {isLoading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin"/>
          <span style={{ fontSize:13, color:colors.gray[600] }}>Chargement des clients...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign:"center", color:palette.danger.solid, fontSize:13, padding:"40px 0" }}>
          Erreur de chargement. Verifiez votre connexion.
        </p>
      ) : (
        <>
          <ClientsToolbar
            search={search} onSearchChange={setSearch}
            filter={filter} onFilterChange={setFilter}
            total={mapped.length} filteredCount={filtered.length}
          />
          <div style={{ marginTop:16 }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign:"center", color:colors.gray[600], fontSize:13, padding:"40px 0" }}>
                {mapped.length === 0 ? "Aucun client pour le moment. Ajoutez votre premier client !" : "Aucun resultat."}
              </p>
            ) : filtered.map(c => (
              <ClientCard key={c.id} client={c}
                onView={(id)=>navigate("/clients/"+id)}
                onEdit={(id)=>navigate("/clients/"+id+"?edit=1")}/>
            ))}
          </div>
        </>
      )}
    </>
  );
}