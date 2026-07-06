export function fmtDate(iso, locale = 'fr-FR', opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (isNaN(d)) return iso;
  try { return new Intl.DateTimeFormat(locale, opts).format(d); }
  catch { return d.toLocaleDateString(); }
}

export const fmtHeure = (iso, locale) => fmtDate(iso, locale, { hour: '2-digit', minute: '2-digit' });

export const initiales = (p) => ((p?.prenom?.[0] || '') + (p?.nom?.[0] || '')).toUpperCase();
