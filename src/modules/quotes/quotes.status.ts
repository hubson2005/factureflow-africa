export const STATUS_LABELS: Record<string,string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

export const STATUS_FILTERS = ["Tous","brouillon","envoye","accepte","refuse","expire"] as const;