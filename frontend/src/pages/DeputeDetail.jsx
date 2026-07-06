import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useFetch } from '../useFetch.js';
import { api } from '../api.js';
import { Icon, Empty, ErreurReseau, SkeletonGrid } from '../components/ui.jsx';

export default function DeputeDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const { data, error, reload } = useFetch(() => api('/api/public/deputes/' + encodeURIComponent(id)), [id]);

  if (error) return <main className="container" style={{ paddingBlock: 'var(--space-16)' }}>{error.statut === 404 ? <Empty /> : <ErreurReseau onRetry={reload} />}</main>;
  if (data === undefined) return <main className="container" style={{ paddingBlock: 'var(--space-10)' }}><SkeletonGrid n={2} cols={2} /></main>;

  const { depute: p, commissions, taux_presence } = data;
  const init = ((p.prenom[0] || '') + (p.nom[0] || '')).toUpperCase();
  return (
    <main className="container" style={{ paddingBlock: 'var(--space-8) var(--space-16)' }}>
      <div className="breadcrumb" style={{ marginBlockEnd: 'var(--space-6)' }}>
        <Link to="/">{t('nav.accueil')}</Link> <span className="breadcrumb__sep">/</span>
        <Link to="/deputes">{t('nav.deputes')}</Link> <span className="breadcrumb__sep">/</span>
        <span>{p.prenom} {p.nom}</span>
      </div>
      <div className="layout-content--reversed">
        <div className="deputy-card card--no-hover">
          <div className="deputy-card__photo" style={{ width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 700, color: 'var(--blue-800)', background: 'var(--blue-100)' }}>{init}</div>
          <div className="deputy-card__name" style={{ fontSize: 'var(--text-xl)' }}>{p.prenom} {p.nom}</div>
          <div className="text-sm text-gold font-semibold">{p.fonction || ''}</div>
          <div className="deputy-card__separator" />
          <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>{p.numero_id}</div>
          <Link to="/citoyen" className="btn btn--primary btn--sm btn--full" style={{ marginBlockStart: 'var(--space-4)' }}><Icon n="paper-plane-tilt" /> {t('deputes.ecrire')}</Link>
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid-2">
            <div className="card card--flat"><div className="text-muted font-semibold text-sm">{t('deputes.circonscription')}</div><div className="font-heading text-2xl text-primary">{p.province || '—'}</div></div>
            <div className="card card--flat"><div className="text-muted font-semibold text-sm">{t('deputes.groupe')}</div><div className="font-heading text-2xl text-primary">{p.groupe_parlementaire || '—'}</div></div>
          </div>
          <div className="card card--flat">
            <h3 className="font-semibold text-lg" style={{ borderBlockEnd: '2px solid var(--gold-500)', paddingBlockEnd: 'var(--space-2)', marginBlockEnd: 'var(--space-4)' }}>{t('deputes.commissions')}</h3>
            {commissions.length ? commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between" style={{ padding: 'var(--space-2) 0', borderBlockEnd: '1px solid var(--color-border)' }}>
                <span className="font-semibold text-sm">{c.nom}</span>
                <span className={`badge badge--${c.role_commission === 'rapporteur' ? 'gold' : 'neutral'}`}>{t('bo.role_' + c.role_commission)}</span>
              </div>
            )) : <Empty />}
          </div>
          {taux_presence !== null && (
            <div className="card card--flat">
              <div className="petition-bar">
                <div className="petition-bar__header"><span className="petition-bar__count">{t('deputes.taux_presence')}</span><span className="petition-bar__percent">{taux_presence}%</span></div>
                <div className="petition-bar__track"><div className="petition-bar__fill" style={{ width: taux_presence + '%' }} /></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
