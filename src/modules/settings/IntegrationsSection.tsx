import React, { useState } from "react";
import { Plus, Copy, Trash2, Check, Loader2, Key, Webhook, AlertTriangle } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import {
  useApiKeys, useGenerateApiKey, useRevokeApiKey,
  useWebhookEndpoints, useCreateWebhookEndpoint, useToggleWebhookEndpoint, useDeleteWebhookEndpoint,
} from "./useIntegrations";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const EVENT_OPTIONS = [
  { value: "invoice.created", label: "Facture créée" },
  { value: "invoice.updated", label: "Facture modifiée" },
  { value: "payment.received", label: "Paiement reçu" },
  { value: "client.created", label: "Client créé" },
  { value: "client.updated", label: "Client modifié" },
];

function Section({ title, icon: Icon, children }: any) {
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: 24,
      border: "1px solid " + colors.gray[100], boxShadow: shadow.card,
      display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {Icon && <Icon size={16} color={colors.gray[700]} />}
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function ApiKeysSection({ companyId }: { companyId: string }) {
  const { data: keys, isLoading } = useApiKeys(companyId);
  const generate = useGenerateApiKey();
  const revoke = useRevokeApiKey();
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    if (!newKeyName.trim()) return;
    generate.mutate({ companyId, name: newKeyName }, {
      onSuccess: (data: any) => { setRevealedKey(data.plain_key); setNewKeyName(""); },
      onError: (err: any) => alert("Erreur : " + err.message),
    });
  }

  function handleCopy() {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Section title="Clés API" icon={Key}>
      <p style={{ margin: "-8px 0 4px", fontSize: 12.5, color: colors.gray[600] }}>
        Utilisées pour connecter FactureFlow à un système externe (ERP, script de synchronisation).
        Header à envoyer : <code style={{ background: colors.gray[100], padding: "1px 5px", borderRadius: 4 }}>Authorization: Bearer &lt;clé&gt;</code>
      </p>

      {revealedKey && (
        <div style={{ background: palette.primary[50], border: "1px solid " + palette.primary.solid + "33",
          borderRadius: radius.md, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: palette.primary.text }}>
            <AlertTriangle size={13} /> Copie cette clé maintenant — elle ne sera plus jamais affichée
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <code style={{ flex: 1, background: colors.white, padding: "8px 10px", borderRadius: radius.md,
              fontSize: 12.5, border: "1px solid " + colors.gray[200], overflowX: "auto", whiteSpace: "nowrap" }}>
              {revealedKey}
            </code>
            <button onClick={handleCopy} style={{ padding: "0 12px", borderRadius: radius.md, border: "none",
              background: copied ? palette.green.solid : palette.primary.solid, color: colors.white, cursor: "pointer" }}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          <button onClick={() => setRevealedKey(null)} style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 600,
            color: colors.gray[600], background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            J'ai copié la clé, fermer
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Nom de la clé (ex: Sync Odoo production)"
          style={{ flex: 1, padding: "10px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            fontSize: 13.5, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white }} />
        <button onClick={handleGenerate} disabled={!newKeyName.trim() || generate.isPending} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: radius.md, border: "none",
          background: newKeyName.trim() ? palette.primary.solid : colors.gray[200],
          color: newKeyName.trim() ? colors.white : colors.gray[400],
          fontSize: 13, fontWeight: 700, cursor: newKeyName.trim() ? "pointer" : "not-allowed", fontFamily: font, flexShrink: 0 }}>
          {generate.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Générer
        </button>
      </div>

      {isLoading ? (
        <Loader2 size={16} className="animate-spin" color={palette.primary.solid} />
      ) : keys && keys.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {keys.map((k: any) => (
            <div key={k.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[100] }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>
                  {k.name} {k.revoked && <span style={{ color: palette.danger.solid, fontWeight: 700 }}>(révoquée)</span>}
                </p>
                <p style={{ margin: 0, fontSize: 11.5, color: colors.gray[400] }}>
                  {k.key_prefix}••••••••· créée le {new Date(k.created_at).toLocaleDateString("fr-FR")}
                  {k.last_used_at && ` · dernière utilisation ${new Date(k.last_used_at).toLocaleDateString("fr-FR")}`}
                </p>
              </div>
              {!k.revoked && (
                <button onClick={() => confirm("Révoquer cette clé ? Toute intégration l'utilisant cessera de fonctionner.") && revoke.mutate(k.id)}
                  style={{ padding: "6px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                    background: colors.white, cursor: "pointer" }}>
                  <Trash2 size={13} color={palette.danger.solid} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[500] }}>Aucune clé API pour le moment.</p>
      )}
    </Section>
  );
}

function WebhooksSection({ companyId }: { companyId: string }) {
  const { data: endpoints, isLoading } = useWebhookEndpoints(companyId);
  const create = useCreateWebhookEndpoint();
  const toggle = useToggleWebhookEndpoint();
  const del = useDeleteWebhookEndpoint();
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(EVENT_OPTIONS.map((e) => e.value));

  function toggleEvent(v: string) {
    setSelectedEvents((prev) => prev.includes(v) ? prev.filter((e) => e !== v) : [...prev, v]);
  }

  function handleCreate() {
    if (!url.trim() || selectedEvents.length === 0) return;
    create.mutate({ companyId, url: url.trim(), events: selectedEvents }, {
      onSuccess: () => setUrl(""),
      onError: (err: any) => alert("Erreur : " + err.message),
    });
  }

  return (
    <Section title="Webhooks sortants" icon={Webhook}>
      <p style={{ margin: "-8px 0 4px", fontSize: 12.5, color: colors.gray[600] }}>
        FactureFlow notifiera cette URL à chaque événement sélectionné (signature HMAC-SHA256 incluse dans le header X-FactureFlow-Signature).
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://votre-erp.exemple.com/webhooks/factureflow"
          style={{ padding: "10px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            fontSize: 13.5, fontFamily: font, color: colors.gray[900], outline: "none", background: colors.white }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {EVENT_OPTIONS.map((e) => {
            const active = selectedEvents.includes(e.value);
            return (
              <button key={e.value} onClick={() => toggleEvent(e.value)} style={{
                padding: "5px 11px", borderRadius: radius.full, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: font,
                border: "1px solid " + (active ? palette.primary.solid : colors.gray[200]),
                background: active ? palette.primary[50] : colors.white,
                color: active ? palette.primary.text : colors.gray[500] }}>
                {e.label}
              </button>
            );
          })}
        </div>
        <button onClick={handleCreate} disabled={!url.trim() || selectedEvents.length === 0 || create.isPending} style={{
          alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: radius.md, border: "none",
          background: url.trim() ? palette.primary.solid : colors.gray[200],
          color: url.trim() ? colors.white : colors.gray[400],
          fontSize: 13, fontWeight: 700, cursor: url.trim() ? "pointer" : "not-allowed", fontFamily: font }}>
          {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Ajouter le webhook
        </button>
      </div>

      {isLoading ? (
        <Loader2 size={16} className="animate-spin" color={palette.primary.solid} />
      ) : endpoints && endpoints.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {endpoints.map((ep: any) => (
            <div key={ep.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[100], gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: colors.gray[900],
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.url}</p>
                <p style={{ margin: 0, fontSize: 11, color: colors.gray[400] }}>{(ep.events || []).length} événement(s) actif(s)</p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => toggle.mutate({ id: ep.id, active: !ep.active })} style={{
                  padding: "5px 10px", borderRadius: radius.full, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: font,
                  background: ep.active ? palette.green[50] : colors.gray[100],
                  color: ep.active ? palette.green.solid : colors.gray[500] }}>
                  {ep.active ? "Actif" : "Inactif"}
                </button>
                <button onClick={() => confirm("Supprimer ce webhook ?") && del.mutate(ep.id)}
                  style={{ padding: "6px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                    background: colors.white, cursor: "pointer" }}>
                  <Trash2 size={13} color={palette.danger.solid} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 12.5, color: colors.gray[500] }}>Aucun webhook configuré.</p>
      )}
    </Section>
  );
}

export default function IntegrationsSection({ companyId }: { companyId: string }) {
  return (
    <>
      <ApiKeysSection companyId={companyId} />
      <WebhooksSection companyId={companyId} />
    </>
  );
}