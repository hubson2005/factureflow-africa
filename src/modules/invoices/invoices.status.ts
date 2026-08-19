export const STATUS_LABELS: Record<string,string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyee",
  partiellement_payee: "Partiel",
  payee: "Payee",
  en_retard: "En retard",
};

export const STATUS_FILTERS = ["Toutes","envoyee","partiellement_payee","payee","en_retard"] as const;