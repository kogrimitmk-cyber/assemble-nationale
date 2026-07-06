import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useFetch } from '../useFetch.js';
import { api } from '../api.js';
import { Icon, Empty, ErreurReseau, SkeletonGrid } from '../components/ui.jsx';

function VoteCard({ s }) {
  const { t, fmtDate } = useI18n();
  const total = s.pour + s.contre + s.abstention || 1;
  const pc = (v) => Math.round((v / total) * 100);
  const adopte = s.pour > s.contre;
  const g = `conic-gradient(var(--green-600) 0% ${pc(s.pour)}%, var(--red-600) ${pc(s.pour)}% ${pc(s.pour) + pc(s.contre)}%, var(--neutral-400) ${pc(s.pour) + pc(s.contre)}% 100%)`;
  const Row = ({ lbl, cls, v }) => (
    <div className="vote-bar__row">
      <div className="vote-bar__label">{lbl}</div>
      <div className="vote-bar__track"><div className={`vote-bar__fill vote-bar__fill--${cls}`} style={{ width: pc(v) + '%' }} /></div>
      <div className="vote-bar__value">{v} <span className="text-muted">({pc(v)}%)</span></div>
    </div>
  );
  return (
    <div className="vote-card">
      <div className="vote-card__header">
        <div>
          <div className="text-sm font-semibold text-muted"><Icon n="calendar-blank" /> {fmtDate(s.date_cloture)}{s.numero_reference ? ' — ' + s.numero_reference : ''}</div>
          <h3 className="font-semibold text-lg" style={{ marginBlockStart: 'var(--space-1)' }}>{s.loi_titre || s.titre}</h3>
        </div>
        <span className={`badge badge--${adopte ? 'success' : 'danger'}`}>{adopte ? t('scrutins.adopte') : t('scrutins.rejete')}</span>
      </div>
      <div className="vote-card__results">
        <div className="vote-donut" style={{ background: g }}>
          <div className="vote-donut__center" style={{ background: 'var(--white)', width: 80, height: 80, borderRadius: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="vote-donut__total">{total}</div><div className="vote-donut__label">{t('scrutins.votants')}</div>
          </div>
        </div>
        <div className="vote-bar">
          <Row lbl={t('scrutins.pour')} cls="pour" v={s.pour} />
          <Row lbl={t('scrutins.contre')} cls="contre" v={s.contre} />
          <Row lbl={t('scrutins.abstention')} cls="abstention" v={s.abstention} />
        </div>
      </div>
    </div>
  );
}

export default function Votes() {
  const { t } = useI18n();
  const { data, error, reload } = useFetch(() => api('/api/public/scrutins'), []);
  return (
    <main className="container" style={{ paddingBlock: 'var(--space-10) var(--space-16)' }}>
      <div className="page-header" style={{ background: 'transparent', border: 'none', paddingBlockEnd: 0 }}>
        <div className="breadcrumb"><Link to="/">{t('nav.accueil')}</Link> <span className="breadcrumb__sep">/</span> <span>{t('nav.scrutins')}</span></div>
        <h1 className="section-title">{t('scrutins.titre')}</h1>
        <p className="section-subtitle">{t('scrutins.sous_titre')}</p>
      </div>
      <div className="info-banner info-banner--info" style={{ marginBlockEnd: 'var(--space-8)' }}>
        <div className="info-banner__icon"><Icon n="info" /></div>
        <div><strong>{t('scrutins.dev_titre')}</strong><br />{t('scrutins.dev_texte')}</div>
      </div>
      {error ? <ErreurReseau onRetry={reload} />
        : data === undefined ? <SkeletonGrid n={2} cols={2} />
          : data.scrutins.length
            ? <div className="grid-2">{data.scrutins.map((s) => <VoteCard key={s.id} s={s} />)}</div>
            : <Empty title={t('scrutins.archives_titre')} text={t('scrutins.archives_texte')} icon="archive-box" />}
    </main>
  );
}
