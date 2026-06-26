// ==================================================================
// FactureFlow Africa — Design Tokens (JS) — v2
// Miroir de design-tokens.css — orange = couleur de marque,
// palette élargie par catégorie. Pour usage en style inline.
// ==================================================================

export const palette = {
  primary: { 50: '#FFF4EC', 100: '#FFE3C7', solid: '#F97316', text: '#D85F0A' },
  blue:    { 50: '#EAF1FE', 100: '#D6E4FD', solid: '#2F6FED', text: '#2F6FED' },
  green:   { 50: '#EAFBF0', 100: '#D2F5DF', solid: '#16A34A', text: '#16A34A' },
  danger:  { 50: '#FBEAEA', 100: '#F7D6D6', solid: '#E0383E', text: '#E0383E' },
  purple:  { 50: '#F3EEFE', 100: '#E5D9FD', solid: '#8B5CF6', text: '#8B5CF6' },
  yellow:  { 50: '#FEF7E0', 100: '#FCEBB8', solid: '#EAB308', text: '#C28A04' },
  gray:    { 50: '#F1F3F3', 100: '#E4E7E7', solid: '#5B6666', text: '#5B6666' },
};

export const colors = {
  white: '#FFFFFF',
  black: '#0B0D0E',
  gray: { 50: '#F8FAFA', 100: '#F1F3F3', 200: '#E4E7E7', 300: '#CBD2D2', 400: '#9CA6A6', 600: '#5B6666', 900: '#14181A' },
};

// Statuts métiers (factures)
export const status = {
  'Payée':   palette.green,
  'Impayée': palette.danger,
  'Envoyée': palette.gray,
};

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  title:    { fontSize: 28, lineHeight: '36px', fontWeight: 700 },
  subtitle: { fontSize: 18, lineHeight: '26px', fontWeight: 600 },
  body:     { fontSize: 14, lineHeight: '20px', fontWeight: 500 },
  caption:  { fontSize: 12, lineHeight: '16px', fontWeight: 400 },
};

export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 };
export const radius = { sm: 8, md: 12, lg: 16, full: 9999 };
export const shadow = {
  card:  '0 1px 2px rgba(15,18,20,0.04), 0 4px 12px rgba(15,18,20,0.05)',
  hover: '0 2px 4px rgba(15,18,20,0.06), 0 8px 20px rgba(15,18,20,0.08)',
};
export const transition = { fast: '150ms ease', base: '220ms cubic-bezier(0.4,0,0.2,1)' };