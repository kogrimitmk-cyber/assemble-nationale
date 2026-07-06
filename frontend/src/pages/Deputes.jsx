import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useFetch } from '../useFetch.js';
import { api } from '../api.js';
import { Icon, Empty, ErreurReseau } from '../components/ui.jsx';

function DeputyCard({ d }) {
  const { t } = useI18n();
  const init = ((d.prenom[0] || '') + (d.nom[0] || '')).toUpperCase();
  return (
    <Link to={`/deputes/${d.id}`} className="deputy-card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="deputy-card__photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--blue-800)', background: 'var(--blue-100)' }}>{init}</div>
      <div className="deputy-card__name">{d.prenom} {d.nom}</div>
      <div className="deputy-card__separator" />
      <span className="badge badge--group" style={{ '--badge-group-color': 'var(--blue-800)' }}>{d.groupe_parlementaire || '—'}</span>
      <div className="deputy-card__constituency"><Icon n="map-pin" /> {d.province || '—'}</div>
      <div className="deputy-card__cta">{d.fonction || t('deputes.retour')} <Icon n="arrow-right" /></div>
    </Link>
  );
}

export default function Deputes() {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [debounce, setDebounce] = useState('');
  const [groupe, setGroupe] = useState('');
  const [province, setProvince] = useState('');
  const [commission, setCommission] = useState('');

  const coms = useFetch(() => api('/api/public/commissions'), []);
  const params = new URLSearchParams();
  if (debounce.trim()) params.set('q', debounce.trim());
  if (groupe) params.set('groupe', groupe);
  if (province) params.set('province', province);
  if (commission) params.set('commission', commission);
  const { data, error, reload } = useFetch(() => api('/api/public/deputes?' + params), [debounce, groupe, province, commission]);

  const onSearch = (v) => { setQ(v); clearTimeout(window._depTmr); window._depTmr = setTimeout(() => setDebounce(v), 280); };

  return (
    <main className="container container--wide" style={{ paddingBlock: 'var(--space-10) var(--space-16)' }}>
      <div className="page-header" style={{ background: 'transparent', border: 'none', paddingBlockEnd: 0 }}>
        <div className="breadcrumb"><Link to="/">{t('nav.accueil')}</Link> <span className="breadcrumb__sep">/</span> <span>{t('nav.deputes')}</span></div>
        <h1 className="section-title">{t('deputes.titre')}</h1>
        <p className="section-subtitle">{t('deputes.sous_titre')}</p>
      </div>
      <div className="filter-bar">
        <div className="search-bar">
          <Icon n="magnifying-glass" />
          <input className="search-bar__input" style={{ paddingInlineStart: 'var(--space-12)' }} type="search" placeholder={t('deputes.rechercher')} value={q} onChange={(e) => onSearch(e.target.value)} />
        </div>
        <select className="filter-bar__select" value={groupe} onChange={(e) => setGroupe(e.target.value)}>
          <option value="">{t('deputes.tous_groupes')}</option>
          {(data?.groupes || []).map((g) => <option key={g}>{g}</option>)}
        </select>
        <select className="filter-bar__select" value={province} onChange={(e) => setProvince(e.target.value)}>
          <option value="">{t('deputes.toutes_provinces')}</option>
          {(data?.provinces || []).map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="filter-bar__select" value={commission} onChange={(e) => setCommission(e.target.value)}>
          <option value="">{t('deputes.toutes_commissions')}</option>
          {(coms.data?.commissions || []).map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>
      <p className="text-sm text-muted" style={{ marginBlock: 'var(--space-2) var(--space-4)' }}>
        {data ? `${data.deputes.length} ${t('deputes.resultat')}` : ' '}
      </p>
      {error ? <ErreurReseau onRetry={reload} />
        : data === undefined ? <div className="grid-deputies">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton skeleton--card" />)}</div>
          : data.deputes.length ? <div className="grid-deputies">{data.deputes.map((d) => <DeputyCard key={d.id} d={d} />)}</div>
            : <Empty icon="users" />}
    </main>
  );
}
