import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useFetch } from '../useFetch.js';
import { api } from '../api.js';
import { Icon, SessionCard, LawCard, Empty, ErreurReseau, SkeletonGrid } from '../components/ui.jsx';

const STATS = [
  ['users-three', 'stat.deputes'], ['scroll', 'stat.textes'],
  ['calendar-check', 'stat.seances'], ['users', 'stat.groupes'],
];

function AnnonceCard({ a }) {
  const { t, lang, fmtDate } = useI18n();
  const badge = a.priorite === 'urgente'
    ? <span className="badge badge--danger"><Icon n="warning" /> {lang === 'ar' ? 'عاجل' : 'Urgent'}</span>
    : a.priorite === 'importante'
      ? <span className="badge badge--gold">{lang === 'ar' ? 'هام' : 'Important'}</span> : null;
  return (
    <article className="card card--flat">
      {badge && <div style={{ marginBlockEnd: 'var(--space-3)' }}>{badge}</div>}
      <h3 className="font-heading text-xl text-primary" style={{ marginBlockEnd: 'var(--space-2)' }}>{a.titre}</h3>
      <p className="text-sm text-secondary">{a.contenu}</p>
      <div className="text-xs text-gold font-semibold" style={{ marginBlockStart: 'var(--space-3)' }}>
        <Icon n="calendar-blank" /> {fmtDate(a.date_publication)}
      </div>
    </article>
  );
}

export default function Accueil() {
  const { t } = useI18n();
  const stats = useFetch(() => api('/api/public/stats'), []);
  const seances = useFetch(() => api('/api/public/agenda?statut=prevue'), []);
  const lois = useFetch(() => api('/api/public/lois'), []);
  const annonces = useFetch(() => api('/api/public/annonces'), []);
  const s = stats.data;
  const valeurs = s ? [s.deputes_actifs, s.textes_en_cours, s.seances_tenues, s.groupes_parlementaires] : null;

  return (
    <>
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__overlay" />
        <div className="hero__pattern" />
        <div className="hero__content animate-in">
          <h1 className="hero__title">{t('marque.nom')}<br />{t('marque.pays')}</h1>
          <div className="hero__separator" />
          <p className="hero__subtitle">{t('accueil.hero_sous')}</p>
        </div>
      </section>

      <div className="hero__stats animate-in animate-in-1" style={{ marginBlockStart: 'calc(-1 * var(--space-16))' }}>
        {STATS.map(([ic, cle], i) => (
          <div className="stat-card" key={cle}>
            <div className="stat-card__icon"><Icon n={ic} /></div>
            <div className="stat-card__number">
              {valeurs ? valeurs[i] : <span className="skeleton" style={{ display: 'inline-block', width: 42, height: 34, borderRadius: 6 }} />}
            </div>
            <div className="stat-card__label">{t(cle)}</div>
          </div>
        ))}
      </div>

      <section className="section"><div className="container">
        <div className="section__header">
          <div><h2 className="section-title">{t('accueil.prochaines')}</h2><p className="section-subtitle">{t('agenda.sous_titre')}</p></div>
          <Link to="/agenda" className="section__link">{t('accueil.tout_agenda')} <Icon n="arrow-right" /></Link>
        </div>
        {seances.error ? <ErreurReseau onRetry={seances.reload} />
          : seances.data === undefined ? <SkeletonGrid />
            : seances.data.seances.length
              ? <div className="grid-3">{seances.data.seances.slice(0, 3).map((x) => <SessionCard key={x.id} s={x} />)}</div>
              : <Empty icon="calendar-x" />}
      </div></section>

      <section className="section section--gray"><div className="container">
        <div className="section__header">
          <div><h2 className="section-title">{t('accueil.derniers_textes')}</h2><p className="section-subtitle">{t('lois.sous_titre')}</p></div>
          <Link to="/lois" className="section__link">{t('accueil.tous_textes')} <Icon n="arrow-right" /></Link>
        </div>
        {lois.error ? <ErreurReseau onRetry={lois.reload} />
          : lois.data === undefined ? <SkeletonGrid />
            : lois.data.lois.length
              ? <div className="grid-3">{lois.data.lois.slice(0, 3).map((l) => <LawCard key={l.id} l={l} />)}</div>
              : <Empty icon="scroll" />}
      </div></section>

      <section className="section"><div className="container">
        <div className="section__header"><div><h2 className="section-title">{t('accueil.actualites')}</h2></div></div>
        {annonces.error ? <ErreurReseau onRetry={annonces.reload} />
          : annonces.data === undefined ? <SkeletonGrid />
            : annonces.data.annonces.length
              ? <div className="grid-3">{annonces.data.annonces.slice(0, 3).map((a) => <AnnonceCard key={a.id} a={a} />)}</div>
              : <Empty />}
      </div></section>
    </>
  );
}
