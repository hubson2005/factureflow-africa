import { useState } from "react";
import { Warehouse, Plus, Loader2, PackageSearch, AlertTriangle } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { Header } from "../components/shell/Header";
import { useStockLevels, useWarehouses, useCreateWarehouse, useCreateStockMovement } from "../modules/stock/useStock";
import { useProducts } from "../modules/products/useProducts";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

export default function Stock() {
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
  const { data: levels, isLoading: levelsLoading, isError } = useStockLevels();
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);

  const hasWarehouse = !warehousesLoading && (warehouses || []).length > 0;
  const isLoading = warehousesLoading || levelsLoading;

  return (
    <>
      {showWarehouseForm && <WarehouseForm onClose={() => setShowWarehouseForm(false)} isFirst={!hasWarehouse} />}
      {showMovementForm && <MovementForm onClose={() => setShowMovementForm(false)} warehouses={warehouses || []} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <Header title="Stock" />
        {hasWarehouse && (
          <button onClick={() => setShowMovementForm(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
            border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font, flexShrink: 0 }}>
            <Plus size={15} /> Mouvement manuel
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 }}>
          <Loader2 size={18} color={palette.primary.solid} className="animate-spin" />
          <span style={{ fontSize: 13, color: colors.gray[600] }}>Chargement du stock...</span>
        </div>
      ) : isError ? (
        <p style={{ textAlign: "center", color: palette.danger.solid, fontSize: 13, padding: "40px 0" }}>
          Erreur de chargement.
        </p>
      ) : !hasWarehouse ? (
        <EmptyWarehouseState onCreate={() => setShowWarehouseForm(true)} />
      ) : (
        <StockTable levels={levels || []} />
      )}
    </>
  );
}

function EmptyWarehouseState({ onCreate }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      textAlign: "center", padding: "56px 20px", background: colors.white,
      border: "1px solid " + colors.gray[200], borderRadius: radius.lg,
    }}>
      <div style={{ width: 48, height: 48, borderRadius: radius.md, background: palette.primary[50],
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Warehouse size={22} color={palette.primary.solid} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Aucun entrepot configure</p>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: colors.gray[600], maxWidth: 340 }}>
          Creez votre premier entrepot pour commencer a suivre votre stock. Le
          stock d'un produit se decremente automatiquement des qu'une facture
          le contenant est emise.
        </p>
      </div>
      <button onClick={onCreate} style={{
        marginTop: 4, display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
        borderRadius: radius.md, background: palette.primary.solid, color: colors.white,
        border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
        <Plus size={15} /> Creer un entrepot
      </button>
    </div>
  );
}

function StockTable({ levels }) {
  if (levels.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center",
        padding: "56px 20px", background: colors.white, border: "1px solid " + colors.gray[200], borderRadius: radius.lg }}>
        <PackageSearch size={28} color={colors.gray[400]} />
        <p style={{ margin: 0, fontSize: 13, color: colors.gray[600], maxWidth: 320 }}>
          Aucun mouvement de stock pour le moment. Les quantites apparaissent ici
          des qu'une facture est emise pour un produit suivi en stock, ou apres
          un mouvement manuel. Pensez a activer le suivi de stock sur vos
          produits, dans la fiche Produit.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {levels.map((l) => {
        const threshold = l.product?.stock_alert_threshold ?? 0;
        const low = Number(l.quantity) <= threshold;
        return (
          <div key={l.id} className="ff-card" style={{ background: colors.white, borderRadius: radius.lg,
            padding: 16, border: "1px solid " + colors.gray[100], boxShadow: shadow.card,
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{l.product?.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.gray[500] }}>
                {l.warehouse?.name}{l.product?.sku && " · " + l.product.sku}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
                {Number(l.quantity).toLocaleString("fr-FR")} {l.product?.unit}
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4, width: "fit-content",
                padding: "3px 9px", borderRadius: radius.full, fontSize: 11, fontWeight: 700,
                background: low ? palette.danger[50] : palette.green[50],
                color: low ? palette.danger.solid : palette.green.text,
              }}>
                {low && <AlertTriangle size={11} />}
                {low ? "Seuil bas" : "OK"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WarehouseForm({ onClose, isFirst }) {
  const createWarehouse = useCreateWarehouse();
  const [name, setName] = useState(isFirst ? "Entrepot principal" : "");
  const [address, setAddress] = useState("");

  function handleSubmit() {
    if (!name.trim()) return;
    createWarehouse.mutate({ name, address, isDefault: isFirst }, {
      onSuccess: () => onClose(),
      onError: (err) => alert("Erreur : " + err.message),
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, width: "100%", maxWidth: 380, boxShadow: shadow.lg }}>
        <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>
          {isFirst ? "Creer votre premier entrepot" : "Nouvel entrepot"}
        </p>
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Nom</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Entrepot principal"
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: "9px 12px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Adresse (optionnel)</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 16, padding: "9px 12px", borderRadius: radius.md,
            border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, color: colors.gray[700], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={createWarehouse.isPending || !name.trim()} style={{
            padding: "9px 14px", borderRadius: radius.md, border: "none", background: palette.primary.solid,
            color: colors.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
            opacity: createWarehouse.isPending || !name.trim() ? 0.6 : 1 }}>
            {createWarehouse.isPending ? "Creation..." : "Creer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MovementForm({ onClose, warehouses }) {
  const { data: products } = useProducts();
  const createMovement = useCreateStockMovement();
  const trackedProducts = (products || []).filter((p) => p.track_stock);
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [type, setType] = useState("entree");
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState("");

  function handleSubmit() {
    if (!productId || !warehouseId || quantity <= 0) return;
    createMovement.mutate({ productId, warehouseId, type, quantity: Number(quantity), comment }, {
      onSuccess: () => onClose(),
      onError: (err) => alert("Erreur : " + err.message),
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, width: "100%", maxWidth: 380, boxShadow: shadow.lg }}>
        <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: colors.gray[900] }}>Mouvement de stock manuel</p>

        {trackedProducts.length === 0 ? (
          <p style={{ fontSize: 12.5, color: colors.gray[600], margin: "0 0 14px" }}>
            Aucun produit n'a le suivi de stock active. Activez-le dans la fiche
            d'un produit (onglet Produits) avant d'enregistrer un mouvement.
          </p>
        ) : (
          <>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Produit</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}
              style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: "9px 10px", borderRadius: radius.md,
                border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }}>
              <option value="">Choisir un produit...</option>
              {trackedProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Entrepot</label>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
              style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: "9px 10px", borderRadius: radius.md,
                border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }}>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: radius.md,
                    border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }}>
                  <option value="entree">Entree</option>
                  <option value="sortie">Sortie</option>
                  <option value="ajustement">Ajustement (quantite finale)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Quantite</label>
                <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: radius.md,
                    border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray[600] }}>Commentaire (optionnel)</label>
            <input value={comment} onChange={(e) => setComment(e.target.value)}
              style={{ width: "100%", marginTop: 4, marginBottom: 16, padding: "9px 12px", borderRadius: radius.md,
                border: "1px solid " + colors.gray[200], fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
          </>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 14px", borderRadius: radius.md, border: "1px solid " + colors.gray[200],
            background: colors.white, color: colors.gray[700], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
            Annuler
          </button>
          {trackedProducts.length > 0 && (
            <button onClick={handleSubmit} disabled={createMovement.isPending || !productId || !warehouseId} style={{
              padding: "9px 14px", borderRadius: radius.md, border: "none", background: palette.primary.solid,
              color: colors.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
              opacity: createMovement.isPending || !productId || !warehouseId ? 0.6 : 1 }}>
              {createMovement.isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
