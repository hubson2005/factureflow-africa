/**
 * Returns a display label + colour class for a profile's expiry date.
 * Returns null when no expiry_date is set.
 */
export const getExpiryStatus = (expiry_date) => {
  if (!expiry_date) return null;

  const now     = new Date();
  const exp     = new Date(expiry_date);
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)   return { label: 'Expiré', color: 'text-destructive',  bg: 'bg-destructive/10' };
  if (diffDays <= 30) return { label: diffDays + 'j', color: 'text-orange-500', bg: 'bg-orange-500/10' };

  return {
    label: exp.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    color: 'text-green-600',
    bg:    'bg-green-500/10',
  };
};

/**
 * Splits a theme_color string ("bg1|bg2") into its two parts.
 * Falls back to a default dark-purple gradient.
 */
export const parseColors = (themeColor) => {
  if (themeColor && themeColor.includes('|')) {
    const [bg1, bg2] = themeColor.split('|');
    return { bg1, bg2 };
  }
  return { bg1: '#0f0a1e', bg2: '#2d1b69' };
};

/**
 * Converts a 2-letter ISO country code to its flag emoji.
 */
export const flagEmoji = (code) => {
  try {
    return code && code.length === 2
      ? String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397))
      : '🌐';
  } catch {
    return '🌐';
  }
};