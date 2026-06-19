export const getExpiryStatus = (expiry_date) => {
  if (!expiry_date) return null;
  const now = new Date();
  const exp = new Date(expiry_date);
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)   return { label: 'Expiré',      color: 'text-destructive',  bg: 'bg-destructive/10' };
  if (diffDays <= 30) return { label: diffDays + 'j', color: 'text-orange-500',  bg: 'bg-orange-500/10'  };
  return {
    label: exp.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    color: 'text-green-600',
    bg:    'bg-green-500/10',
  };
};
