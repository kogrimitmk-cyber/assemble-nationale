import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useFetch } from '../useFetch.js';
import { api } from '../api.js';
import { Icon, LawCard, Empty, ErreurReseau, SkeletonGrid } from '../components/ui.jsx';

const STATUTS = ['', 'depose', 'en_commission', 'en_debat', 'au_vote', 'adopte', 'promulgue'];

export default function Lois() {
  const { t } = useI18n();
  const [statut, setStatut] = useState('');
  const [q, setQ] = useState('');
  const [debounce, setDebounce] = useState('');
  const params = new URLSearchParams();
  if (statut) params.set('statut', statut);
  if (debounce.trim()) params.set('q', debounce.trim());
  const { data, error, reload } = useFetch(() => api('/api/public/lois?' + params), [statut, debounce]);

  const onSearch = (v) => {
    setQ(v);
    clearTimeout(window._loisTmr);
    window._loisTmr = setTimeout(() => setDebounce(v), 280);
  };

  return (
    <main className="container" style={{ paddingBlock: 'var(--space-10) var(--space-16)' }}>
      <div className="page-header" style={{ background: 'transparent', border: 'none', paddingBlockEnd: 0 }}>
        <div className="breadcrumb"><Link to="/">{t('nav.accueil')}</Link> <span className="breadcrumb__sep">/</span> <span>{t('nav.lois')}</span></div>
        <h1 className="section-title">{t('lois.titre')}</h1>
        <p className="section-subtitle">{t('lois.sous_titre')}</p>
      </div>
      <div className="filter-bar">
        <div className="search-bar">
          <Icon n="magnifying-glass" /><i className="search-bar__icon" />
          <input className="search-bar__input" style={{ paddingInlineStart: 'var(--space-12)' }}
                 type="search" placeholder={t('lois.rechercher')} value={q} onChange={(e) => onSearch(e.target.value)} />
        </div>
      </div>
      <div className="filter-bar">
        {STATUTS.map((s) => (
          <button key={s || 'tous'} className="filter-chip"
                  onClick={() => setStatut(s)}
                  style={s === statut ? {} : { background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
            {s ? t('statut.' + s) : t('lois.tous')}
          </button>
        ))}
      </div>
      <div style={{ marginBlockStart: 'var(--space-4)' }}>
        {error ? <ErreurReseau onRetry={reload} />
          : data === undefined ? <SkeletonGrid n={6} />
            : data.lois.length ? <div className="grid-3">{data.lois.map((l) => <LawCard key={l.id} l={l} />)}</div>
              : <Empty icon="scroll" />}
      </div>
    </main>
  );
}
