// Validation souple du numéro fiscal ivoirien.
// Deux formats coexistent en pratique chez les entreprises de Côte d'Ivoire :
//
// 1. NCC (Numéro de Compte Contribuable) — utilisé par la DGI pour la fiscalité.
//    Format officiel : 7 chiffres + 1 lettre de clé (ex: 1234567A).
//
// 2. RCCM (Registre du Commerce et du Crédit Mobilier) — délivré à la création
//    de l'entreprise, antérieur ou complémentaire au NCC selon les cas.
//    Format courant : CI-[VILLE]-[ANNÉE]-[TYPE]-[NUMÉRO]
//    ex: CI-ABJ-2018-B-28355
//
// Comme les deux formats sont légitimement utilisés selon le type et l'âge de
// l'entreprise, la validation reste indicative (avertissement) plutôt que
// bloquante : on ne veut jamais empêcher la création d'un client à cause d'un
// format qu'on n'aurait pas anticipé.

const NCC_REGEX = /^\d{7}[A-Za-z]$/;
const RCCM_REGEX = /^CI-[A-Za-z]{2,4}-\d{4}-[A-Za-z]-\d{3,6}$/;

/**
 * Vérifie un numéro fiscal ivoirien (NCC ou RCCM).
 * @param {string} value
 * @returns {{ isValid: boolean, format: 'NCC'|'RCCM'|null, message: string }}
 */
export function validateIvorianTaxNumber(value) {
  const trimmed = (value || '').trim();

  if (!trimmed) {
    return { isValid: true, format: null, message: '' };
  }

  if (NCC_REGEX.test(trimmed)) {
    return { isValid: true, format: 'NCC', message: 'Format NCC valide' };
  }

  if (RCCM_REGEX.test(trimmed.toUpperCase())) {
    return { isValid: true, format: 'RCCM', message: 'Format RCCM valide' };
  }

  return {
    isValid: false,
    format: null,
    message: 'Format inhabituel — vérifiez (NCC: 1234567A, ou RCCM: CI-ABJ-2018-B-28355)',
  };
}