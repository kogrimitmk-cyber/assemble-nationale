import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useFetch } from '../useFetch.js';
import { api } from '../api.js';
import { Icon, SessionCard, BadgeSeance, Empty, ErreurReseau, SkeletonGrid } from '../components/ui.jsx';

/* ── Carte compacte « Séances à venir » (maquette W2) ──────── */
function SeanceMini({ s }) {
  const { t, locale, fmtTime } = useI18n();
  const [ouvert, setOuvert] = useState(false);
  const d = new Date(String(s.date_debut).replace(' ', 'T'));
  const mois = new Intl.DateTimeFormat(locale, { month: 'short' }).format(d);
  const odj = (s.ordre_du_jour || '').split('\n').filter(Boolean);
  const badgeType = s.type_evenement === 'seance_pleniere'
    ? <span className="badge badge--primary">{t('seance.seance_pleniere')}</span>
    : s.type_evenement === 'commission'
      ? <span className="badge badge--gold">{t('seance.commission')}</span>
      : <span className="badge badge--neutral">{t('seance.' + s.type_evenement)}</span>;

  return (
    <div className={`seance-mini${s.statut === 'en_cours' ? ' seance-mini--encours' : ''}`}>
      <div className="seance-mini__date">
        <div className="seance-mini__jour">{d.getDate()}</div>
        <div className="seance-mini__mois">{mois}</div>
        <div className="seance-mini__heure">{fmtTime(s.date_debut)}</div>
      </div>
      <div className="seance-mini__corps">
        <div className="seance-mini__badges">{badgeType} <BadgeSeance s={s.statut} /></div>
        <div className="seance-mini__titre">{s.titre}</div>
        {s.lieu && <div className="seance-mini__lieu"><Icon n="map-pin" /> {s.lieu}</div>}
        {ouvert && odj.length > 0 && (
          <ul className="seance-mini__odj">{odj.map((p, i) => <li key={i}>{p}</li>)}</ul>
        )}
        {odj.length > 0 && (
          <button className="seance-mini__plus" onClick={() => setOuvert(!ouvert)}>
            {t('agenda.ordre_du_jour')} <Icon n={ouvert ? 'caret-up' : 'caret-down'} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Calendrier mensuel naviguable (maquette W2) ───────────── */
function Calendrier({ seances }) {
  const { t, locale } = useI18n();
  const now = new Date();
  const [ref, setRef] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const an = ref.getFullYear(), mo = ref.getMonth();
  const nbJours = new Date(an, mo + 1, 0).getDate();
  const decal = (new Date(an, mo, 1).getDay() + 6) % 7;
  const parJour = {};
  for (const s of seances) {
    const d = new Date(String(s.date_debut).replace(' ', 'T'));
    if (d.getFullYear() === an && d.getMonth() === mo) (parJour[d.getDate()] ||= []).push(s);
  }
  const jours = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, i + 1)));
  const titre = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(ref);
  const estMoisCourant = an === now.getFullYear() && mo === now.getMonth();
  const aVenir = seances.filter((s) => s.statut === 'prevue' || s.statut === 'en_cours').slice(0, 6);

  return (
    <div className="agenda-layout">
      <div className="calendar">
        <div className="calendar__header">
          <div className="calendar__titre-groupe">
            <div className="calendar__title" style={{ textTransform: 'capitalize' }}>{titre}</div>
            <div className="calendar__legende-inline">
              <span className="calendar__legend-item"><span className="calendar__dot calendar__dot--plenary" /> {t('seance.seance_pleniere')}</span>
              <span className="calendar__legend-item"><span className="calendar__dot calendar__dot--commission" /> {t('seance.commission')}</span>
            </div>
          </div>
          <div className="calendar__nav">
            <button className="calendar__nav-btn" aria-label="Mois précédent"
                    onClick={() => setRef(new Date(an, mo - 1, 1))}><Icon n="caret-left" /></button>
            <button className="calendar__nav-btn calendar__nav-btn--today"
                    onClick={() => setRef(new Date(now.getFullYear(), now.getMonth(), 1))}>{t('agenda.aujourdhui')}</button>
            <button className="calendar__nav-btn" aria-label="Mois suivant"
                    onClick={() => setRef(new Date(an, mo + 1, 1))}><Icon n="caret-right" /></button>
          </div>
        </div>
        <div className="calendar__weekdays">{jours.map((n) => <div key={n} className="calendar__weekday">{n}</div>)}</div>
        <div className="calendar__days">
          {Array.from({ length: decal }).map((_, i) => <div key={'v' + i} className="calendar__day calendar__day--other-month" />)}
          {Array.from({ length: nbJours }, (_, k) => k + 1).map((j) => (
            <div key={j} className={`calendar__day${estMoisCourant && j === now.getDate() ? ' calendar__day--today' : ''}`}>
              <span>{j}</span>
              <div className="calendar__dots">
                {(parJour[j] || []).slice(0, 3).map((s, i) => (
                  <span key={i} className={`calendar__dot calendar__dot--${s.type_evenement === 'seance_pleniere' ? 'plenary' : 'commission'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="agenda-sidebar__title">{t('agenda.a_venir')}</div>
        <div className="agenda-sidebar__list">
          {aVenir.length ? aVenir.map((s) => <SeanceMini key={s.id} s={s} />) : <Empty icon="calendar-x" />}
        </div>
      </div>
    </div>
  );
}

/* ── Page Agenda ───────────────────────────────────────────── */
export default function Agenda() {
  const { t } = useI18n();
  const [vue, setVue] = useState('calendrier');
  const [type, setType] = useState('');
  const [statut, setStatut] = useState('');
  const q = new URLSearchParams();
  if (type) q.set('type', type);
  if (statut) q.set('statut', statut);
  const { data, error, reload } = useFetch(() => api('/api/public/agenda?' + q), [type, statut]);

  const chipType = (val, dot, label) => (
    <button className={`chip${type === val ? ' chip--actif' : ''}`}
            onClick={() => setType(type === val ? '' : val)}>
      <span className={`calendar__dot calendar__dot--${dot}`} /> {label}
    </button>
  );
  const segStatut = (val, label) => (
    <button className={`segmente__btn${statut === val ? ' segmente__btn--actif' : ''}`}
            onClick={() => setStatut(val)}>{label}</button>
  );

  return (
    <main className="container" style={{ paddingBlock: 'var(--space-10) var(--space-16)' }}>
      <div className="page-header" style={{ background: 'transparent', border: 'none', paddingBlockEnd: 0 }}>
        <div className="breadcrumb"><Link to="/">{t('nav.accueil')}</Link> <span className="breadcrumb__sep">/</span> <span>{t('nav.agenda')}</span></div>
        <h1 className="section-title">{t('agenda.titre')}</h1>
        <p className="section-subtitle">{t('agenda.sous_titre')}</p>
      </div>

      <div className="agenda-filtres">
        <div className="agenda-filtres__groupe">
          <div className="agenda-filtres__label">{t('agenda.type_seance')}</div>
          <div className="chips">
            {chipType('seance_pleniere', 'plenary', t('seance.seance_pleniere'))}
            {chipType('commission', 'commission', t('seance.commission'))}
          </div>
        </div>
        <div className="agenda-filtres__groupe">
          <div className="agenda-filtres__label">{t('agenda.statut')}</div>
          <div className="segmente">
            {segStatut('', t('agenda.f_toutes'))}
            {segStatut('prevue', t('agenda.f_avenir'))}
            {segStatut('terminee', t('agenda.f_terminees'))}
          </div>
        </div>
        <div className="agenda-filtres__groupe">
          <div className="agenda-filtres__label">{t('agenda.vue')}</div>
          <div className="segmente">
            <button className={`segmente__btn${vue === 'calendrier' ? ' segmente__btn--actif' : ''}`}
                    onClick={() => setVue('calendrier')}>{t('agenda.vue_calendrier')}</button>
            <button className={`segmente__btn${vue === 'liste' ? ' segmente__btn--actif' : ''}`}
                    onClick={() => setVue('liste')}>{t('agenda.vue_liste')}</button>
          </div>
        </div>
      </div>

      <div style={{ marginBlockStart: 'var(--space-6)' }}>
        {error ? <ErreurReseau onRetry={reload} />
          : data === undefined ? <SkeletonGrid />
            : vue === 'calendrier' ? <Calendrier seances={data.seances} />
              : data.seances.length ? <div className="grid-2">{data.seances.map((s) => <SessionCard key={s.id} s={s} />)}</div>
                : <Empty icon="calendar-x" />}
      </div>
    </main>
  );
}
