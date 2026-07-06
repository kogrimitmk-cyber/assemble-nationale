import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { useFetch } from '../useFetch.js';
import { api } from '../api.js';
import { toast } from '../components/Toaster.jsx';
import { Icon, DocRow, Empty, ErreurReseau, SkeletonGrid } from '../components/ui.jsx';

const CATS = ['loi_adoptee', 'rapport', 'proces_verbal', 'reglement', 'ordre_du_jour', 'autre'];

export default function Documents() {
  const { t } = useI18n();
  const { utilisateur } = useAuth();
  const [q, setQ] = useState('');
  const [debounce, setDebounce] = useState('');
  const [cat, setCat] = useState('');
  const params = new URLSearchParams();
  if (debounce.trim()) params.set('q', debounce.trim());
  if (cat) params.set('categorie', cat);
  const { data, error, reload } = useFetch(() => api('/api/public/documents?' + params, { auth: !!utilisateur }), [debounce, cat, !!utilisateur]);

  const onSearch = (v) => { setQ(v); clearTimeout(window._docTmr); window._docTmr = setTimeout(() => setDebounce(v), 280); };

  return (
    <main className="container" style={{ paddingBlock: 'var(--space-10) var(--space-16)' }}>
      <div className="page-header" style={{ background: 'transparent', border: 'none', paddingBlockEnd: 0 }}>
        <div className="breadcrumb"><Link to="/">{t('nav.accueil')}</Link> <span className="breadcrumb__sep">/</span> <span>{t('nav.documents')}</span></div>
        <h1 className="section-title">{t('documents.titre')}</h1>
        <p className="section-subtitle">{t('documents.sous_titre')}</p>
      </div>
      {!utilisateur && (
        <div className="info-banner info-banner--info" style={{ marginBlockEnd: 'var(--space-6)' }}>
          <div className="info-banner__icon"><Icon n="info" /></div><div>{t('documents.note_connexion')}</div>
        </div>
      )}
      <div className="filter-bar">
        <div className="search-bar">
          <Icon n="magnifying-glass" />
          <input className="search-bar__input" style={{ paddingInlineStart: 'var(--space-12)' }} type="search" placeholder={t('documents.rechercher')} value={q} onChange={(e) => onSearch(e.target.value)} />
        </div>
        <select className="filter-bar__select" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">{t('documents.toutes_categories')}</option>
          {CATS.map((c) => <option key={c} value={c}>{t('doc.' + c)}</option>)}
        </select>
      </div>
      <div className="docs-list" style={{ marginBlockStart: 'var(--space-4)' }}>
        {error ? <ErreurReseau onRetry={reload} />
          : data === undefined ? <SkeletonGrid n={1} />
            : data.documents.length ? data.documents.map((d) => <DocRow key={d.id} d={d} onDownload={() => toast(t('commun.demo'))} />)
              : <Empty icon="folder-open" />}
      </div>
    </main>
  );
}
