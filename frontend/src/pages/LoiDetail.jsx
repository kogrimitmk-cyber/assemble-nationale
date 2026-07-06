import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useFetch } from '../useFetch.js';
import { api } from '../api.js';
import { toast } from '../components/Toaster.jsx';
import { Icon, BadgeType, BadgePriorite, BadgeStatut, ProgressLaw, DocRow, Empty, ErreurReseau, SkeletonGrid } from '../components/ui.jsx';

export default function LoiDetail() {
  const { ref } = useParams();
  const { t, fmtDate } = useI18n();
  const [tab, setTab] = useState('articles');
  const { data, error, reload } = useFetch(() => api('/api/public/lois/' + encodeURIComponent(ref)), [ref]);

  if (error) return <main className="container" style={{ paddingBlock: 'var(--space-16)' }}>{error.statut === 404 ? <Empty /> : <ErreurReseau onRetry={reload} />}</main>;
  if (data === undefined) return <main className="container" style={{ paddingBlock: 'var(--space-10)' }}><SkeletonGrid n={2} cols={2} /></main>;

  const { loi, etapes, articles, documents } = data;
  return (
    <main className="container" style={{ paddingBlock: 'var(--space-8) var(--space-16)' }}>
      <div className="breadcrumb" style={{ marginBlockEnd: 'var(--space-6)' }}>
        <Link to="/">{t('nav.accueil')}</Link> <span className="breadcrumb__sep">/</span>
        <Link to="/lois">{t('nav.lois')}</Link> <span className="breadcrumb__sep">/</span>
        <span>{loi.numero_reference}</span>
      </div>

      <div className="card card--no-hover" style={{ marginBlockEnd: 'var(--space-8)', padding: 'var(--space-8)' }}>
        <div className="flex items-center gap-2 flex-wrap" style={{ marginBlockEnd: 'var(--space-4)' }}>
          <BadgeType ty={loi.type_texte} /> <BadgePriorite p={loi.priorite} /> <BadgeStatut s={loi.statut} />
          <span className="text-sm text-muted" style={{ marginInlineStart: 'auto' }}>{t('commun.ref')}: {loi.numero_reference}</span>
        </div>
        <h1 className="section-title" style={{ fontSize: 'var(--text-4xl)', marginBlockEnd: 'var(--space-8)' }}>{loi.titre}</h1>
        <ProgressLaw statut={loi.statut} />
      </div>

      <div className="layout-content">
        <div>
          {loi.resume && <div className="card card--flat" style={{ marginBlockEnd: 'var(--space-6)' }}><p className="text-secondary" style={{ margin: 0, lineHeight: 1.8 }}>{loi.resume}</p></div>}
          <div className="tabs">
            <button className={`tab${tab === 'articles' ? ' tab--active' : ''}`} onClick={() => setTab('articles')}>{t('loi.articles')} ({articles.length})</button>
            <button className={`tab${tab === 'documents' ? ' tab--active' : ''}`} onClick={() => setTab('documents')}>{t('loi.documents')} ({documents.length})</button>
          </div>
          {tab === 'articles' ? (
            articles.length ? articles.map((a) => (
              <div key={a.id} className="card card--flat" style={{ marginBlockEnd: 'var(--space-4)' }}>
                <h4 className="font-semibold text-primary">{a.numero}{a.titre ? ' — ' + a.titre : ''}</h4>
                {a.contenu && <p className="text-sm text-secondary" style={{ lineHeight: 1.8, marginBlockStart: 'var(--space-2)', marginBlockEnd: 0 }}>{a.contenu}</p>}
              </div>
            )) : <Empty title={t('loi.aucun_article')} text=" " />
          ) : (
            documents.length ? documents.map((d) => <DocRow key={d.id} d={d} onDownload={() => toast(t('commun.demo'))} />) : <Empty />
          )}
        </div>

        <div>
          <div className="card card--flat" style={{ marginBlockEnd: 'var(--space-6)' }}>
            <h3 className="font-semibold text-lg" style={{ marginBlockEnd: 'var(--space-4)', borderBlockEnd: '2px solid var(--gold-500)', paddingBlockEnd: 'var(--space-2)' }}>Informations</h3>
            <div className="flex flex-col gap-4 text-sm">
              <div><div className="text-muted font-semibold">{t('lois.commission_en_charge')}</div><div className="flex items-center gap-2"><Icon n="scales" /> {loi.commission_nom || '—'}</div></div>
              <div><div className="text-muted font-semibold">{t('lois.rapporteur')}</div><div>{loi.rapporteur_nom || '—'}</div></div>
              <div><div className="text-muted font-semibold">{t('lois.depose_par')}</div><div>{loi.depose_par || '—'}</div></div>
              <div><div className="text-muted font-semibold">{t('lois.date_depot')}</div><div>{fmtDate(loi.date_depot)}</div></div>
            </div>
          </div>
          <div className="card card--flat">
            <h3 className="font-semibold text-lg" style={{ marginBlockEnd: 'var(--space-6)', borderBlockEnd: '2px solid var(--gold-500)', paddingBlockEnd: 'var(--space-2)' }}>{t('loi.etapes')}</h3>
            {etapes.length ? (
              <div className="timeline">
                {etapes.map((e, i) => (
                  <div key={e.id} className={`timeline__item timeline__item--${i === etapes.length - 1 ? 'active' : 'done'}`}>
                    <div className="timeline__dot" />
                    <div className="timeline__title">{e.libelle}</div>
                    <div className="timeline__date">{fmtDate(e.date_etape)}</div>
                    {e.description && <div className="timeline__content">{e.description}</div>}
                  </div>
                ))}
              </div>
            ) : <Empty />}
          </div>
        </div>
      </div>
    </main>
  );
}
