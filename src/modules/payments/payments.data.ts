export type PaymentMethod = "Wave"|"Orange Money"|"MTN Money"|"Virement"|"Especes";
export type PaymentStatus = "Confirme"|"En attente"|"Echec";
export interface Payment {
  id:string; method:PaymentMethod; clientName:string; invoiceCode:string;
  amount:string; status:PaymentStatus; date:string;
}
export const demoPayments: Payment[] = [
  { id:"1", method:"Wave", clientName:"Orange Côte d'Ivoire", invoiceCode:"FACT-00254", amount:"150 000", status:"Confirme", date:"22 Juin 2026" },
  { id:"2", method:"Orange Money", clientName:"MTN CI", invoiceCode:"FACT-00251", amount:"85 000", status:"Confirme", date:"21 Juin 2026" },
  { id:"3", method:"MTN Money", clientName:"SOTRA", invoiceCode:"FACT-00249", amount:"250 000", status:"En attente", date:"20 Juin 2026" },
  { id:"4", method:"Virement", clientName:"CNPS", invoiceCode:"FACT-00248", amount:"500 000", status:"Confirme", date:"20 Juin 2026" },
  { id:"5", method:"Especes", clientName:"AGETU", invoiceCode:"FACT-00247", amount:"75 000", status:"Confirme", date:"19 Juin 2026" },
  { id:"6", method:"Wave", clientName:"SIFCA Group", invoiceCode:"FACT-00246", amount:"320 000", status:"En attente", date:"18 Juin 2026" },
  { id:"7", method:"Virement", clientName:"NSIA Banque", invoiceCode:"FACT-00245", amount:"780 000", status:"Echec", date:"16 Juin 2026" },
];