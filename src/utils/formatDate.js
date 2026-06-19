/**
 * Returns a localised French date string, e.g. "25 janvier 2025".
 * Returns '—' when no date is supplied.
 */
export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
    ...options,
  });
};

/**
 * Returns a short date string "dd/mm/yy".
 */
export const formatShortDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
};
