import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (n) => Math.round(n).toLocaleString("fr-FR").replace(/\u202F/g, " ");

export function generateQuotePDF(data) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const tvaRate = data.tvaRate ?? 0.18;
  const subtotal = data.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const tva = Math.round(subtotal * tvaRate);
  const total = Math.round(subtotal + tva);

  const OG = [249, 115, 22];
  const BK = [20, 24, 26];
  const GR = [120, 130, 130];
  const LG = [245, 247, 247];
  const WH = [255, 255, 255];

  const STATUS_LABELS = {
    brouillon: "Brouillon", envoye: "Envoye", accepte: "Accepte",
    refuse: "Refuse", expire: "Expire",
  };

  doc.setFillColor(...OG);
  doc.rect(0, 0, W, 30, "F");

  doc.setFillColor(...WH);
  doc.roundedRect(10, 7, 16, 16, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...OG);
  doc.text("F", 18, 18, { align: "center" });

  doc.setTextColor(...WH);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FactureFlow Africa", 30, 14);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(data.companyName || "Mon Entreprise", 30, 21);

  doc.setTextColor(...BK);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("DEVIS", 10, 46);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GR);
  doc.text(data.code, 10, 53);

  doc.setFontSize(8);
  doc.setTextColor(...GR);
  doc.text("Date d'emission", 130, 40);
  doc.text("Valable jusqu'au", 175, 40);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BK);
  doc.text(data.issueDate || "-", 130, 47);
  doc.text(data.validUntil || "\u2014", 175, 47);

  doc.setDrawColor(...OG);
  doc.setLineWidth(0.6);
  doc.line(10, 58, 200, 58);

  doc.setFillColor(...LG);
  doc.roundedRect(10, 63, 88, 34, 2, 2, "F");
  doc.roundedRect(112, 63, 88, 34, 2, 2, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...OG);
  doc.text("DE :", 14, 71);
  doc.text("A :", 116, 71);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BK);
  doc.text(data.companyName || "Mon Entreprise", 14, 78);
  doc.text(data.clientName, 116, 78);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GR);
  let dy = 84;
  if (data.companyPhone) { doc.text(data.companyPhone, 14, dy); dy += 5; }
  if (data.companyEmail) { doc.text(data.companyEmail, 14, dy); }
  let dy2 = 84;
  if (data.clientEmail) { doc.text(data.clientEmail, 116, dy2); dy2 += 5; }
  if (data.clientPhone) { doc.text(data.clientPhone, 116, dy2); }

  autoTable(doc, {
    startY: 104,
    head: [["Description", "Qte", "Prix unit.", "Total HT"]],
    body: data.items.filter((i) => i.description).map((i) => [
      i.description,
      String(i.qty),
      fmt(i.unitPrice) + " FCFA",
      fmt(i.qty * i.unitPrice) + " FCFA",
    ]),
    headStyles: { fillColor: OG, textColor: WH, fontStyle: "bold", fontSize: 9, halign: "center" },
    bodyStyles: { fontSize: 9, textColor: BK },
    alternateRowStyles: { fillColor: LG },
    columnStyles: {
      0: { cellWidth: 90, halign: "left" },
      1: { cellWidth: 15, halign: "center" },
      2: { cellWidth: 42, halign: "right" },
      3: { cellWidth: 42, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 10, right: 10 },
    tableWidth: 190,
  });

  const tY = doc.lastAutoTable.finalY + 6;

  doc.setFillColor(...LG);
  doc.roundedRect(120, tY, 80, 32, 2, 2, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GR);
  doc.text("Sous-total HT", 124, tY + 9);
  doc.setTextColor(...BK);
  doc.text(fmt(subtotal) + " FCFA", 198, tY + 9, { align: "right" });

  doc.setTextColor(...GR);
  doc.text("TVA (" + Math.round(tvaRate * 100) + "%)", 124, tY + 18);
  doc.setTextColor(...BK);
  doc.text(fmt(tva) + " FCFA", 198, tY + 18, { align: "right" });

  doc.setDrawColor(...OG);
  doc.setLineWidth(0.4);
  doc.line(124, tY + 22, 198, tY + 22);

  doc.setFillColor(...OG);
  doc.roundedRect(120, tY + 24, 80, 12, 2, 2, "F");
  doc.setTextColor(...WH);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL TTC", 124, tY + 32);
  doc.text(fmt(total) + " FCFA", 198, tY + 32, { align: "right" });

  if (data.notes) {
    const nY = tY + 42;
    doc.setFillColor(...LG);
    doc.roundedRect(10, nY, 100, 16, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GR);
    doc.text("Notes :", 14, nY + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BK);
    doc.text(data.notes, 14, nY + 13, { maxWidth: 92 });
  }

  doc.setFillColor(...OG);
  doc.rect(0, 285, W, 12, "F");
  doc.setTextColor(...WH);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("FactureFlow Africa - La plateforme de facturation des entreprises africaines", 105, 293, { align: "center" });

  doc.save(data.code + ".pdf");
}