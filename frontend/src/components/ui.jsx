import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';

export const Icon = ({ n }) => <i className={`ph ph-${n}`} aria-hidden="true" />;

/* ── Soulignement décoratif or (double filet, encoche centrale) ──
   Reproduit l'ornement des maquettes sous les titres de page. */
export function FiletOr({ width = 320 }) {
  return (
    <svg viewBox="0 0 320 16" width={width} height={width * 16 / 320} fill="none"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
         style={{ display: 'block', maxWidth: '100%', marginBlockStart: 'var(--space-2)' }}>
      <path d="M2 3 H318" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 9 H140 Q150 9 155 12.5 Q160 16 165 12.5 Q170 9 180 9 H318"
            stroke="#D4A843" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/* ── États ─────────────────────────────────────────────────── */
export function Empty({ title, text, icon = 'tray' }) {
  const { t } = useI18n();
  return (
    <div className="empty-state">
      <div className="empty-state__icon"><Icon n={icon} /></div>
      <h3 className="empty-state__title">{title || t('commun.vide_titre')}</h3>
      <p className="empty-state__text">{text || t('commun.vide_texte')}</p>
    </div>
  );
}

export function ErreurReseau({ onRetry }) {
  const { t } = useI18n();
  return (
    <div className="empty-state">
      <div className="empty-state__icon" style={{ background: 'var(--red-100)', color: 'var(--red-600)' }}>
        <Icon n="wifi-slash" />
      </div>
      <h3 className="empty-state__title">{t('commun.erreur_titre')}</h3>
      <p className="empty-state__text">{t('commun.erreur_texte')}</p>
      {onRetry && <button className="btn btn--secondary" onClick={onRetry}><Icon n="arrow-clockwise" /> {t('commun.reessayer')}</button>}
    </div>
  );
}

export function SkeletonGrid({ n = 3, cols = 3 }) {
  return (
    <div className={`grid-${cols}`}>
      {Array.from({ length: n }).map((_, i) => <div key={i} className="skeleton skeleton--card" />)}
    </div>
  );
}

/* Bloc de contenu asynchrone : gère chargement / erreur / rendu. */
export function Async({ etat, erreur, onRetry, skeleton, children }) {
  if (erreur) return <ErreurReseau onRetry={onRetry} />;
  if (etat === undefined) return skeleton || <SkeletonGrid />;
  return children;
}

/* ── Badges ────────────────────────────────────────────────── */
const STATUT_BADGE = {
  depose: 'neutral', en_commission: 'primary', en_debat: 'primary', au_vote: 'gold',
  adopte: 'success', promulgue: 'success', rejete: 'danger', retire: 'muted',
};
export function BadgeStatut({ s }) {
  const { t } = useI18n();
  return <span className={`badge badge--${STATUT_BADGE[s] || 'neutral'}`}>{t('statut.' + s)}</span>;
}
export function BadgePriorite({ p }) {
  const { t } = useI18n();
  if (p === 'urgence_nationale') return <span className="badge badge--danger"><Icon n="warning" /> {t('priorite.' + p)}</span>;
  if (p === 'prioritaire') return <span className="badge badge--gold"><Icon n="star" /> {t('priorite.' + p)}</span>;
  return null;
}
export function BadgeType({ ty }) {
  const { t } = useI18n();
  return ty === 'proposition'
    ? <span className="badge badge--neutral">{t('lois.type_proposition')}</span>
    : <span className="badge badge--primary">{t('lois.type_projet')}</span>;
}
export function BadgeSeance({ s }) {
  const { t } = useI18n();
  const m = { prevue: 'primary', en_cours: 'success', terminee: 'muted', annulee: 'danger' };
  return <span className={`badge badge--${m[s] || 'neutral'}`}>{t('seance.' + s)}</span>;
}

/* ── Progression législative (5 étapes) ────────────────────── */
const STATUT_ETAPE = { depose: 0, en_commission: 1, en_debat: 2, au_vote: 3, adopte: 4, promulgue: 5, rejete: 3, retire: 1 };
const ETAPES = ['etape.depot', 'etape.commission', 'etape.pleniere', 'etape.vote', 'etape.promulgation'];
export function ProgressLaw({ statut, compact = false }) {
  const { t } = useI18n();
  const idx = STATUT_ETAPE[statut] ?? 0;
  return (
    <div className={`progress-law${compact ? ' progress-law--compact' : ''}`}>
      {ETAPES.map((lk, i) => {
        const cls = i < idx ? ' progress-law__step--done' : i === idx ? ' progress-law__step--active' : '';
        return (
          <div key={lk} className={`progress-law__step${cls}`}>
            <div className="progress-law__dot">{i < idx && <Icon n="check" />}</div>
            {!compact && <div className="progress-law__label">{t(lk)}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ── Cartes ────────────────────────────────────────────────── */
export function SessionCard({ s }) {
  const { t, fmtDate, fmtTime } = useI18n();
  const badge = s.type_evenement === 'seance_pleniere'
    ? <span className="badge badge--primary">{t('seance.seance_pleniere')}</span>
    : s.type_evenement === 'commission'
      ? <span className="badge badge--gold">{t('seance.commission')}</span>
      : <span className="badge badge--neutral">{t('seance.' + s.type_evenement)}</span>;
  const odj = (s.ordre_du_jour || '').split('\n').filter(Boolean).slice(0, 3);
  return (
    <div className="session-card">
      <div className="session-card__header">{badge}
        <div className="session-card__date"><Icon n="calendar-blank" /> {fmtDate(s.date_debut, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      </div>
      <h3 className="session-card__title">{s.titre}</h3>
      <div className="session-card__meta">
        <span><Icon n="clock" /> {fmtTime(s.date_debut)}{s.date_fin ? ' - ' + fmtTime(s.date_fin) : ''}</span>
        {s.lieu && <span><Icon n="map-pin" /> {s.lieu}</span>}
        <BadgeSeance s={s.statut} />
      </div>
      {odj.length > 0 && (
        <div className="session-card__agenda"><h5>{t('agenda.ordre_du_jour')} :</h5>
          <ul>{odj.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
      )}
    </div>
  );
}

export function LawCard({ l }) {
  const { t, fmtDate } = useI18n();
  return (
    <div className={`law-card${l.priorite === 'urgence_nationale' ? ' law-card--urgent' : ''}`}>
      <div className="law-card__badges"><BadgeType ty={l.type_texte} /> <BadgePriorite p={l.priorite} /></div>
      <h3 className="law-card__title">{l.titre}</h3>
      <div className="law-card__ref">{t('commun.ref')}: {l.numero_reference}</div>
      {l.commission_nom && <div className="law-card__commission"><Icon n="scales" /> {l.commission_nom}</div>}
      <ProgressLaw statut={l.statut} compact />
      <Link to={`/lois/${encodeURIComponent(l.numero_reference)}`} className="law-card__cta">
        {t('lois.consulter')} <Icon n="arrow-right" />
      </Link>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t('lois.date_depot')} {fmtDate(l.date_depot)}</div>
    </div>
  );
}

export function DocRow({ d, onDownload }) {
  const { t } = useI18n();
  const badge = d.acces === 'public'
    ? <span className="badge badge--success">{t('documents.acces_public')}</span>
    : d.acces === 'interne'
      ? <span className="badge badge--gold"><Icon n="lock-simple" /> {t('documents.acces_interne')}</span>
      : <span className="badge badge--danger"><Icon n="lock-key" /> {t('documents.acces_confidentiel')}</span>;
  return (
    <div className={`doc-row${d.acces !== 'public' ? ' doc-row--restricted' : ''}`}>
      <div className="doc-row__icon"><Icon n="file-pdf" /></div>
      <div className="doc-row__info">
        <div className="doc-row__title">{d.titre}</div>
        <div className="doc-row__meta">
          <span>{t('doc.' + d.categorie)}</span>
          {d.loi_ref && <span>{d.loi_ref}</span>}
          {d.taille_ko && <span><Icon n="file-archive" /> {(d.taille_ko / 1024).toFixed(1)} {t('commun.mo')}</span>}
          {badge}
        </div>
      </div>
      <div className="doc-row__actions">
        <button className="btn btn--secondary btn--sm" onClick={onDownload}><Icon n="download-simple" /> {t('documents.telecharger')}</button>
      </div>
    </div>
  );
}
