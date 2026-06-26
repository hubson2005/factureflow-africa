import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GREEN = [34, 197, 94];
const DARK = [17, 23, 42];
const GRAY = [139, 147, 167];

/**
 * Génère un PDF A4 pour un devis ou une facture.
 *
 * @param {Object} params
 * @param {'devis'|'facture'} params.type
 * @param {Object} params.company - { name, address, phone, email, logo_url, currency }
 * @param {Object} params.client - { name, company_name, address, email, phone, tax_number }
 * @param {Object} params.document - { number, date, due_date|valid_until, subtotal, tax_total, total, notes, status }
 * @param {Array}  params.items - [{ description, quantity, unit_price, tax_rate }]
 * @param {Object} [params.paymentSummary] - { amountPaid, amountDue } — factures uniquement
 */
export async function generateDocumentPdf({ type, company, client, document, items, paymentSummary }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  const title = type === 'devis' ? 'DEVIS' : 'FACTURE';

  // ── En-tête : logo / nom entreprise (gauche), titre + numéro (droite) ──
  let logoLoaded = false;
  if (company.logo_url) {
    try {
      const imgData = await loadImageAsDataUrl(company.logo_url);
      doc.addImage(imgData, 'PNG', margin, 12, 24, 24);
      logoLoaded = true;
    } catch (e) {
      logoLoaded = false;
    }
  }

  const textX = logoLoaded ? margin + 30 : margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text(company.name || '', textX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  let infoY = 24;
  if (company.address) { doc.text(company.address, textX, infoY); infoY += 4.5; }
  if (company.phone) { doc.text(company.phone, textX, infoY); infoY += 4.5; }
  if (company.email) { doc.text(company.email, textX, infoY); infoY += 4.5; }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...GREEN);
  doc.text(title, pageWidth - margin, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(document.number, pageWidth - margin, 27, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Date : ${formatDate(document.date)}`, pageWidth - margin, 33, { align: 'right' });
  if (document.due_date) {
    doc.text(`Échéance : ${formatDate(document.due_date)}`, pageWidth - margin, 38, { align: 'right' });
  } else if (document.valid_until) {
    doc.text(`Valide jusqu'au : ${formatDate(document.valid_until)}`, pageWidth - margin, 38, { align: 'right' });
  }

  // ── Ligne de séparation ──
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.6);
  doc.line(margin, 46, pageWidth - margin, 46);

  // ── Bloc client ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text('FACTURÉ À', margin, 56);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(client.name || '', margin, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  let clientY = 67;
  if (client.company_name) { doc.text(client.company_name, margin, clientY); clientY += 4.5; }
  if (client.address) { doc.text(client.address, margin, clientY); clientY += 4.5; }
  if (client.email) { doc.text(client.email, margin, clientY); clientY += 4.5; }
  if (client.phone) { doc.text(client.phone, margin, clientY); clientY += 4.5; }
  if (client.tax_number) { doc.text(`N° fiscal : ${client.tax_number}`, margin, clientY); clientY += 4.5; }

  // ── Tableau des lignes ──
  const tableStartY = Math.max(clientY + 8, 85);
  const currency = company.currency || 'XOF';

  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Qté', 'Prix unitaire', 'TVA', 'Total']],
    body: items.map((it) => {
      const lineSub = Number(it.quantity) * Number(it.unit_price);
      const lineTotal = lineSub * (1 + Number(it.tax_rate) / 100);
      return [
        it.description,
        String(it.quantity),
        `${formatMoney(it.unit_price)} ${currency}`,
        `${it.tax_rate}%`,
        `${formatMoney(lineTotal)} ${currency}`,
      ];
    }),
    margin: { left: margin, right: margin },
    headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 32, halign: 'right' },
    },
  });

  let finalY = doc.lastAutoTable.finalY + 8;

  // ── Totaux ──
  const totalsX = pageWidth - margin - 60;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text('Sous-total', totalsX, finalY);
  doc.setTextColor(...DARK);
  doc.text(`${formatMoney(document.subtotal)} ${currency}`, pageWidth - margin, finalY, { align: 'right' });

  finalY += 6;
  doc.setTextColor(...GRAY);
  doc.text('TVA', totalsX, finalY);
  doc.setTextColor(...DARK);
  doc.text(`${formatMoney(document.tax_total)} ${currency}`, pageWidth - margin, finalY, { align: 'right' });

  finalY += 8;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.4);
  doc.line(totalsX - 5, finalY - 4, pageWidth - margin, finalY - 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GREEN);
  doc.text('TOTAL', totalsX, finalY);
  doc.text(`${formatMoney(document.total)} ${currency}`, pageWidth - margin, finalY, { align: 'right' });

  // ── Résumé paiement (factures uniquement) ──
  if (paymentSummary) {
    finalY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('Montant payé', totalsX, finalY);
    doc.setTextColor(...DARK);
    doc.text(`${formatMoney(paymentSummary.amountPaid)} ${currency}`, pageWidth - margin, finalY, { align: 'right' });

    finalY += 6;
    doc.setTextColor(...GRAY);
    doc.text('Reste à payer', totalsX, finalY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(Number(paymentSummary.amountDue) > 0 ? 249 : 34, Number(paymentSummary.amountDue) > 0 ? 115 : 197, Number(paymentSummary.amountDue) > 0 ? 22 : 94);
    doc.text(`${formatMoney(paymentSummary.amountDue)} ${currency}`, pageWidth - margin, finalY, { align: 'right' });
  }

  // ── Notes ──
  if (document.notes) {
    finalY += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('Notes', margin, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    const splitNotes = doc.splitTextToSize(document.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, finalY + 5);
    finalY += 5 + splitNotes.length * 4.5;
  }

  // ── Zone signature ──
  const pageHeight = doc.internal.pageSize.getHeight();
  const signatureY = Math.max(finalY + 20, pageHeight - 45);
  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.2);
  doc.line(pageWidth - margin - 60, signatureY, pageWidth - margin, signatureY);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Signature', pageWidth - margin - 30, signatureY + 5, { align: 'center' });

  // ── Pied de page ──
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`${company.name || ''} — Document généré par FactureFlow Africa`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
}

export function downloadDocumentPdf(doc, filename) {
  doc.save(filename);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR');
}

// toLocaleString('fr-FR') insère un caractère "espace fine insécable" (U+202F)
// comme séparateur de milliers. La police Helvetica intégrée à jsPDF ne le
// supporte pas et l'affiche comme un caractère cassé (visuellement un "/").
// On le remplace par un espace normal, visuellement identique mais compatible.
function formatMoney(value, options = {}) {
  return Number(value)
    .toLocaleString('fr-FR', { maximumFractionDigits: 0, ...options })
    .replace(/[\u202F\u00A0]/g, ' ');
}

function loadImageAsDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = window.document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}