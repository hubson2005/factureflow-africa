import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, MessageSquare, Loader2, FileText, Users, Package } from "lucide-react";
import { palette, colors, radius } from "@/theme/tokens";
import { useAuth } from "@/AuthContext";
import { supabase } from "@/supabase";


type SearchResult = {
  id: string;
  kind: "invoice" | "client" | "product";
  label: string;
  sublabel: string;
  path: string;
};


function useGlobalSearch() {
  const { company } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);


    const term = query.trim();
    if (!company || term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }


    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const like = `%${term}%`;
      const [invoicesRes, clientsRes, productsRes] = await Promise.all([
        supabase
          .from("invoices")
          .select("id, invoice_number, total, status")
          .eq("company_id", company.id)
          .ilike("invoice_number", like)
          .limit(5),
        supabase
          .from("clients")
          .select("id, name, company_name")
          .eq("company_id", company.id)
          .or(`name.ilike.${like},company_name.ilike.${like}`)
          .limit(5),
        supabase
          .from("products")
          .select("id, name, unit_price")
          .eq("company_id", company.id)
          .ilike("name", like)
          .limit(5),
      ]);


      const invoiceResults: SearchResult[] = (invoicesRes.data || []).map((inv) => ({
        id: inv.id,
        kind: "invoice",
        label: inv.invoice_number,
        sublabel: `${Number(inv.total).toLocaleString("fr-FR")} ${company.currency || "FCFA"}`,
        path: "/invoices",
      }));
      const clientResults: SearchResult[] = (clientsRes.data || []).map((c) => ({
        id: c.id,
        kind: "client",
        label: c.name,
        sublabel: c.company_name || "",
        path: "/clients",
      }));
      const productResults: SearchResult[] = (productsRes.data || []).map((p) => ({
        id: p.id,
        kind: "product",
        label: p.name,
        sublabel: `${Number(p.unit_price).toLocaleString("fr-FR")} ${company.currency || "FCFA"}`,
        path: "/products",
      }));


      setResults([...invoiceResults, ...clientResults, ...productResults]);
      setLoading(false);
    }, 300);


    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, company]);


  return { query, setQuery, results, loading };
}


const KIND_META: Record<SearchResult["kind"], { icon: typeof FileText; label: string }> = {
  invoice: { icon: FileText, label: "Facture" },
  client: { icon: Users, label: "Client" },
  product: { icon: Package, label: "Produit" },
};


function SearchBox({ autoFocusRef }: { autoFocusRef?: React.RefObject<HTMLInputElement> }) {
  const navigate = useNavigate();
  const { query, setQuery, results, loading } = useGlobalSearch();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const goTo = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");
      navigate(result.path);
    },
    [navigate, setQuery]
  );


  const showDropdown = open && query.trim().length >= 2;


  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.gray[50], border: `1px solid ${colors.gray[200]}`, borderRadius: radius.md, padding: "9px 14px" }}>
        <Search size={15} color={colors.gray[400]} />
        <input
          ref={autoFocusRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher (facture, client, produit...)"
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: colors.gray[900], fontFamily: "inherit" }}
        />
        {loading ? (
          <Loader2 size={14} color={colors.gray[400]} className="ff-spin" />
        ) : (
          <span style={{ fontSize: 11, color: colors.gray[400], border: `1px solid ${colors.gray[200]}`, borderRadius: radius.sm, padding: "1px 6px" }}>⌘K</span>
        )}
      </div>


      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: colors.white,
            border: `1px solid ${colors.gray[200]}`,
            borderRadius: radius.md,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            maxHeight: 340,
            overflowY: "auto",
            zIndex: 50,
          }}
        >
          {loading ? (
            <div style={{ padding: "16px", fontSize: 13, color: colors.gray[400], textAlign: "center" }}>Recherche...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: "16px", fontSize: 13, color: colors.gray[400], textAlign: "center" }}>
              Aucun résultat pour « {query} »
            </div>
          ) : (
            results.map((r) => {
              const meta = KIND_META[r.kind];
              const Icon = meta.icon;
              return (
                <button
                  key={`${r.kind}-${r.id}`}
                  onClick={() => goTo(r)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 14px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    borderBottom: `1px solid ${colors.gray[100]}`,
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: radius.sm, background: colors.gray[50], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} color={colors.gray[600]} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray[900], whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
                    <div style={{ fontSize: 11.5, color: colors.gray[400] }}>{meta.label}{r.sublabel ? ` · ${r.sublabel}` : ""}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


export function Header({ title }: { title?: string }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);


  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Seuil aligne sur celui de app-shell.css / Sidebar.tsx / BottomNav.tsx (1367px) :
        // en dessous, .ff-search-wrap est cache par CSS donc inputRef n'est pas
        // focusable - il faut ouvrir la recherche plein ecran a la place.
        if (window.innerWidth < 1367) {
          setMobileSearchOpen(true);
        } else {
          inputRef.current?.focus();
        }
      }
      if (e.key === "Escape") setMobileSearchOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div>
          {title ? (
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.gray[900] }}>{title}</p>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.gray[900] }}>Bonjour Hubert 👋</p>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: colors.gray[600] }}>FactureFlow Africa</p>
            </>
          )}
        </div>
      </div>


      <div className="ff-search-wrap" style={{ flex: 1, maxWidth: 420, margin: "0 16px" }}>
        <SearchBox autoFocusRef={inputRef} />
      </div>


      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="ff-search-icon-wrap">
          <button
            onClick={() => setMobileSearchOpen(true)}
            style={{ width: 36, height: 36, borderRadius: radius.full, background: colors.white, border: `1px solid ${colors.gray[200]}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Search size={16} color={colors.gray[600]} />
          </button>
        </div>
        <button
          onClick={() => navigate("/notifications")}
          style={{ position: "relative", width: 36, height: 36, borderRadius: radius.full, background: colors.white, border: `1px solid ${colors.gray[200]}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <Bell size={16} color={colors.gray[600]} />
          <span style={{ position: "absolute", top: -2, right: -2, background: palette.danger.solid, color: colors.white, fontSize: 9, fontWeight: 700, borderRadius: radius.full, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
        </button>
        <div className="ff-chat-wrap">
          <button
            onClick={() => navigate("/assistant")}
            style={{ width: 36, height: 36, borderRadius: radius.full, background: colors.white, border: `1px solid ${colors.gray[200]}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <MessageSquare size={16} color={colors.gray[600]} />
          </button>
        </div>
      </div>


      {mobileSearchOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,18,20,0.45)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "16vh 20px 0",
          }}
          onClick={() => setMobileSearchOpen(false)}
        >
          <div style={{ width: "100%", maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <SearchBox />
          </div>
        </div>
      )}
    </div>
  );
}