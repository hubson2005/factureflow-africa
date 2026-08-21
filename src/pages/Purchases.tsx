import { useState } from "react";
import { Truck, Plus, Loader2, PackageCheck, Trash2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useSuppliers, useCreateSupplier, usePurchases, useCreatePurchase, useReceivePurchase } from "../modules/purchases/usePurchases";
import { useWarehouses } from "../modules/stock/useStock";
import { useProducts } from "../modules/products/useProducts";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const STATUS_LABELS = { brouillon: "Brouillon", commande: "Commande", receptionne: "Receptionne", annule: "Annule" };
const STATUS_COLORS = { brouillon: "gray", commande: "yellow", receptionne: "green", annule: "danger" };

export default function Purchases() {
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: warehouses } = useWarehouses();
  const { data: purchases, isLoading: purchasesLoading, isError } = usePurchases();
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  const hasSupplier = !suppliersLoading && (suppliers || []).length > 0;
  const hasWarehouse = (warehouses || []).length > 0;
  const isLoading = suppliersLoading || purchasesLoading;

  return (
    <>
      {showSupplierForm && <SupplierForm onClose={() => setShowSupplierForm(false)} />}
      {showPurchaseForm && (
        <PurchaseForm onClose={() => setShowPurchaseForm(false)} suppliers={suppliers || []} warehouses={warehouses || []} />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <Header title="Achats" />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowSupplierForm(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            borderRadius: radius.md, background: colors.white, color: colors.gray[700],
            border: "1px solid " + colors.gray[200], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
            <Plus size={15} /> Fournisseur
          </button>
          {hasSupplier && hasWarehouse && (
            <button onClick={() => setShowPurchaseForm(true)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
              borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
              <Plus size={15} /> Commande
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement des achats...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign: "center", color: palette.danger.solid, fontSize: 13, padding: "40px 0" }}>Erreur de chargement.</p>
      ) : !hasSupplier ? (
        <EmptyState
          title="Aucun fournisseur enregistre"
          text="Ajoutez votre premier fournisseur pour commencer a passer des commandes d'approvisionnement."
          cta="Ajouter un fournisseur"
          onClick={() => setShowSupplierForm(true)}
        />
      ) : !hasWarehouse ? (
        <EmptyState
          title="Aucun entrepot configure"
          text="Un entrepot de reception est necessaire avant de creer une commande. Configurez-le depuis la page Stock."
          cta="Aller sur Stock"
          onClick={() => { window.location.href = "/stock"; }}
        />
      ) : (purchases || []).length === 0 ? (
        <EmptyState
          title="Aucune commande fournisseur"
          text="Creez votre premiere commande d'achat. La reception ajoutera automatiquement les quantites au stock."
          cta="Creer une commande"
          onClick={() => setShowPurchaseForm(true)}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(purchases || []).map((p) => <PurchaseCard key={p.id} purchase={p} />)}
        </div>
      )}
    </>
  );
}

function EmptyState({ title, text, cta, onClick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
      padding: "56px 20px", background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg }}>
      <div style={{ width: 48, height: 48, borderRadius: radius.md, background: palette.primary[50],
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Truck size={22} color={palette.primary.solid} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{title}</p>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: colors.gray[600], maxWidth: 340 }}>{text}</p>
      </div>
      <button onClick={onClick} style={{
        marginTop: 4, display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
        borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
        border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
        <Plus size={15} /> {cta}
      </button>
    </div>
  );
}

function PurchaseCard({ purchase }) {
  const receive = useReceivePurchase();
  const pal = palette[STATUS_COLORS[purchase.status] || "gray"];
  const canReceive = purchase.status === "commande";

  function handleReceive() {
    receive.mutate(purchase.id, { onError: (err) => alert("Erreur : " + err.message) });
  }

  return (
    <div style={{ background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
            {purchase.supplier?.name}
            {purchase.reference && <span style={{ color: colors.gray[500], fontWeight: 500 }}> · {purchase.reference}</span>}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.gray[500] }}>
            Entrepot : {purchase.warehouse?.name}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "3px 10px", borderRadius: radius.full, fontSize: 11, fontWeight: 700,
            background: pal[50] || pal.solid + "22", color: pal.text || pal.solid }}>
            {STATUS_LABELS[purchase.status] || purchase.status}
          </span>
          {canReceive && (
            <button onClick={handleReceive} disabled={receive.isPending} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: radius.md,
              border: "none", background: palette.green.solid, color: colors.white, fontSize: 12, fontWeight: 700,
              cursor: receive.isPending ? "not-allowed" : "pointer", fontFamily: font, opacity: receive.isPending ? 0.6 : 1 }}>
              {receive.isPending ? <Loader2 size={13} className="animate-spin" /> : <PackageCheck size={13} />}
              Receptionner
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {(purchase.items || []).map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0",
            borderTop: "1px solid " + colors.gray[100] }}>
            <span style={{ color: colors.gray[700] }}>{item.product?.name}</span>
            <span style={{ color: colors.gray[500] }}>
              {Number(item.quantity_received)} / {Number(item.quantity)} recu · {Number(item.unit_price).toLocaleString("fr-FR")} FCFA/u
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupplierForm({ onClose }) {
  const createSupplier = useCreateSupplier();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit() {
    if (!name.trim()) return;
    createSupplier.mutate({ name, phone, email }, { onSuccess: onClose, onError: (err) => alert("Erreur : " + err.message) });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, width: "100%", maxWidth: 380, boxShadow: shadow.lg }}>
        <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Nouveau fournisseur</p>
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Nom *</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: "9px 12px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Telephone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: "9px 12px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 16, padding: "9px 12px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, color: colors.gray[700], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Annuler</button>
          <button onClick={handleSubmit} disabled={createSupplier.isPending || !name.trim()} style={{
            padding: "9px 14px", borderRadius: radius.md, border: "none", background: palette.primary.solid,
            color: colors.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
            opacity: createSupplier.isPending || !name.trim() ? 0.6 : 1 }}>
            {createSupplier.isPending ? "Creation..." : "Creer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PurchaseForm({ onClose, suppliers, warehouses }) {
  const { data: products } = useProducts();
  const createPurchase = useCreatePurchase();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [reference, setReference] = useState("");
  const [items, setItems] = useState([{ id: "1", productId: "", quantity: 1, unitPrice: 0 }]);

  function updateItem(id, field, value) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }
  function addItem() { setItems((prev) => [...prev, { id: Date.now().toString(), productId: "", quantity: 1, unitPrice: 0 }]); }
  function removeItem(id) { setItems((prev) => prev.filter((i) => i.id !== id)); }

  const isValid = supplierId && warehouseId && items.some((i) => i.productId && i.quantity > 0);

  function handleSubmit() {
    createPurchase.mutate({ supplierId, warehouseId, reference, items }, {
      onSuccess: onClose,
      onError: (err) => alert("Erreur : " + err.message),
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: colors.gray[50], borderRadius: radius.lg, width: "100%", maxWidth: 480,
        maxHeight: "90vh", overflowY: "auto", boxShadow: shadow.hover }}>
        <div style={{ padding: "16px 20px", background: colors.white, borderBottom: "1px solid " + colors.gray[100] }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Nouvelle commande fournisseur</p>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Fournisseur</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                  fontSize: 13, fontFamily: font, outline: "none", background: colors.white, boxSizing: "border-box" }}>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Entrepot de reception</label>
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
                style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                  fontSize: 13, fontFamily: font, outline: "none", background: colors.white, boxSizing: "border-box" }}>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Reference (optionnel)</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="BC-2026-001"
              style={{ width: "100%", marginTop: 4, padding: "9px 12px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                fontSize: 13, fontFamily: font, outline: "none", background: colors.white, boxSizing: "border-box" }} />
          </div>

          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 700, color: colors.gray[600], textTransform: "uppercase" }}>Articles</p>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: 10, background: colors.white,
              borderRadius: radius.md, border: "1px solid " + colors.gray[200] }}>
              <select value={item.productId} onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                style={{ padding: "8px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                  fontSize: 13, fontFamily: font, outline: "none", background: colors.white }}>
                <option value="">Choisir un produit...</option>
                {(products || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                  placeholder="Qte" style={{ flex: 1, padding: "8px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                    fontSize: 13, fontFamily: font, outline: "none" }} />
                <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                  placeholder="Prix unitaire" style={{ flex: 1, padding: "8px 10px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
                    fontSize: 13, fontFamily: font, outline: "none" }} />
                {items.length > 1 && (
                  <button onClick={() => removeItem(item.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 6 }}>
                    <Trash2 size={15} color={palette.danger.solid} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button onClick={addItem} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
            borderRadius: radius.md, border: "1px dashed " + colors.gray[300], background: "none", color: colors.gray[600],
            fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: font, alignSelf: "flex-start" }}>
            <Plus size={13} /> Ajouter une ligne
          </button>
        </div>

        <div style={{ display: "flex", padding: "16px 20px", background: colors.white, borderTop: "1px solid " + colors.gray[100], gap: 8 }}>
          <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, color: colors.gray[700], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={!isValid || createPurchase.isPending} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px 16px", borderRadius: radius.md, border: "none",
            background: isValid && !createPurchase.isPending ? palette.primary.solid : colors.gray[200],
            color: isValid && !createPurchase.isPending ? colors.white : colors.gray[400],
            fontSize: 13, fontWeight: 700, cursor: isValid ? "pointer" : "not-allowed", fontFamily: font }}>
            {createPurchase.isPending ? <><Loader2 size={15} className="animate-spin" /> Creation...</> : "Creer la commande"}
          </button>
        </div>
      </div>
    </div>
  );
}
