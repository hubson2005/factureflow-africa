import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (n) => Math.round(n).toLocaleString("fr-FR").replace(/\u202F/g, " ");

export function generateReportPDF(data, period, companyName) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;

  const OG = [249, 115, 22];
  const BK = [20, 24, 26];
  const GR = [120, 130, 130];
  const LG = [245, 247, 247];
  const WH = [255, 255, 255];

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
  doc.text(companyName || "Mon Entreprise", 30, 21);

  doc.setTextColor(...BK);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("RAPPORT", 10, 44);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GR);
  doc.text("Periode : " + period, 10, 51);
  doc.text("Genere le " + new Date().toLocaleDateString("fr-FR"), 10, 57);

  doc.setDrawColor(...OG);
  doc.setLineWidth(0.5);
  doc.line(10, 62, 200, 62);

  const stats = [
    { label: "CA total", value: fmt(data.caTotal) + " FCFA" },
    { label: "Factures emises", value: String(data.facturesCount) },
    { label: "Taux de recouvrement", value: data.tauxRecouvrement + "%" },
    { label: "Depenses totales", value: fmt(data.depensesTotal) + " FCFA" },
  ];

  let statY = 68;
  const boxW = 44;
  stats.forEach((s, i) => {
    const x = 10 + i * (boxW + 3);
    doc.setFillColor(...LG);
    doc.roundedRect(x, statY, boxW, 24, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(...GR);
    doc.text(s.label, x + 4, statY + 8, { maxWidth: boxW - 8 });
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BK);
    doc.text(s.value, x + 4, statY + 18, { maxWidth: boxW - 8 });
    doc.setFont("helvetica", "normal");
  });

  let y = statY + 34;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BK);
  doc.text("Evolution du CA (6 derniers mois)", 10, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Mois", "Chiffre d'affaires (FCFA)"]],
    body: data.evolutionData.map((d) => [d.mois, fmt(d.ca * 1000000)]),
    headStyles: { fillColor: OG, textColor: WH, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: BK },
    alternateRowStyles: { fillColor: LG },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "right" },
    },
    didParseCell: (d) => {
      if (d.section === "head" && d.column.index === 1) d.cell.styles.halign = "right";
    },
    margin: { left: 10, right: 10 },
    tableWidth: 190,
  });

  y = doc.lastAutoTable.finalY + 12;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BK);
  doc.text("CA par categorie", 10, y);
  y += 6;

  if (data.categoryData.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GR);
    doc.text("Aucune donnee pour cette periode.", 10, y + 6);
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Categorie", "Montant (FCFA)"]],
      body: data.categoryData.map((c) => [c.name, fmt(c.value)]),
      headStyles: { fillColor: OG, textColor: WH, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: BK },
      alternateRowStyles: { fillColor: LG },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "right" },
      },
      didParseCell: (d) => {
        if (d.section === "head" && d.column.index === 1) d.cell.styles.halign = "right";
      },
      margin: { left: 10, right: 10 },
      tableWidth: 190,
    });
  }

  doc.setFillColor(...OG);
  doc.rect(0, 285, W, 12, "F");
  doc.setTextColor(...WH);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("FactureFlow Africa - La plateforme de facturation des entreprises africaines", 105, 293, { align: "center" });

  doc.save("Rapport-" + period.replace(/\s/g, "-") + "-" + new Date().toISOString().split("T")[0] + ".pdf");
}