import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useFetch } from '../useFetch.js';
import { api } from '../api.js';
import { toast } from '../components/Toaster.jsx';
import { Icon, Empty, ErreurReseau, SkeletonGrid } from '../components/ui.jsx';

function MessageForm() {
  const { t, lang } = useI18n();
  const ref = useFetch(() => api('/api/public/deputes'), []);
  const coms = useFetch(() => api('/api/public/commissions'), []);
  const [versDepute, setVers] = useState(true);
  const [envoye, setEnvoye] = useState(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ nom: '', contact: '', province: '', depute: '', commission: '', sujet: '', message: '' });
  const maj = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (envoye) return (
    <div className="success-state">
      <div className="success-state__icon"><Icon n="check-circle" /></div>
      <h3 className="success-state__title">{t('citoyen.envoye_titre')}</h3>
      <p className="success-state__text">{t('citoyen.envoye_texte')}</p>
      <div className="success-state__ref">{envoye}</div>
      <button className="btn btn--secondary" onClick={() => setEnvoye(null)}>{t('citoyen.nouveau_message')}</button>
    </div>
  );

  const soumettre = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api('/api/public/messages', { method: 'POST', auth: false, body: {
        nom_complet: f.nom, contact: f.contact, province: f.province, sujet: f.sujet, message: f.message,
        depute_id: versDepute ? f.depute || null : null,
        commission_id: !versDepute ? f.commission || null : null,
      } });
      setEnvoye(r.reference);
    } catch (err) { toast(err.message); setBusy(false); }
  };

  return (
    <>
      <h3 className="font-semibold text-lg" style={{ borderBlockEnd: '2px solid var(--gold-500)', paddingBlockEnd: 'var(--space-2)', marginBlockEnd: 'var(--space-4)' }}>{t('citoyen.form_titre')}</h3>
      <form className="flex flex-col gap-4" onSubmit={soumettre}>
        <div className="grid-2">
          <div className="form-group"><label className="form-label">{t('citoyen.nom')} <span className="required">*</span></label><input className="form-input" required value={f.nom} onChange={maj('nom')} /></div>
          <div className="form-group"><label className="form-label">{t('citoyen.contact')}</label><input className="form-input" value={f.contact} onChange={maj('contact')} /></div>
        </div>
        <div className="form-group"><label className="form-label">{t('citoyen.province')}</label>
          <select className="form-select" value={f.province} onChange={maj('province')}>
            <option value="">{t('citoyen.choisir_province')}</option>
            {(ref.data?.provinces || []).map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">{t('citoyen.destinataire')}</label>
          <div className="tabs" style={{ marginBlockEnd: 'var(--space-3)' }}>
            <button type="button" className={`tab${versDepute ? ' tab--active' : ''}`} onClick={() => setVers(true)}>{t('citoyen.dest_depute')}</button>
            <button type="button" className={`tab${!versDepute ? ' tab--active' : ''}`} onClick={() => setVers(false)}>{t('citoyen.dest_commission')}</button>
          </div>
          {versDepute ? (
            <select className="form-select" value={f.depute} onChange={maj('depute')}>
              <option value="">{t('citoyen.choisir_depute')}</option>
              {(ref.data?.deputes || []).map((d) => <option key={d.id} value={d.id}>{d.prenom} {d.nom}{d.province ? ' — ' + d.province : ''}</option>)}
            </select>
          ) : (
            <select className="form-select" value={f.commission} onChange={maj('commission')}>
              <option value="">{t('citoyen.choisir_commission')}</option>
              {(coms.data?.commissions || []).map((c) => <option key={c.id} value={c.id}>{lang === 'ar' && c.nom_ar ? c.nom_ar : c.nom}</option>)}
            </select>
          )}
        </div>
        <div className="form-group"><label className="form-label">{t('citoyen.sujet')} <span className="required">*</span></label><input className="form-input" required value={f.sujet} onChange={maj('sujet')} /></div>
        <div className="form-group"><label className="form-label">{t('citoyen.message')} <span className="required">*</span></label><textarea className="form-textarea" required placeholder={t('citoyen.message_ph')} value={f.message} onChange={maj('message')} /></div>
        <button className="btn btn--primary btn--full btn--lg" type="submit" disabled={busy}><Icon n="paper-plane-tilt" /> {busy ? t('commun.envoi') : t('citoyen.envoyer')}</button>
      </form>
    </>
  );
}

function PetitionCard({ p, onSigned }) {
  const { t, nombre } = useI18n();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [contact, setContact] = useState('');
  const pct = Math.min(100, Math.round((p.nb_signatures / p.objectif_signatures) * 100));
  const active = p.statut === 'active';

  const signer = async (e) => {
    e.preventDefault();
    try { await api(`/api/public/petitions/${p.id}/signer`, { method: 'POST', auth: false, body: { nom_complet: nom, contact } }); toast(t('citoyen.signee')); onSigned(); }
    catch (err) { toast(err.message); }
  };

  return (
    <div className="petition-card">
      <div className="flex items-center justify-between gap-2">
        <div className="petition-card__title">{p.titre}</div>
        {!active && <span className={`badge badge--${p.statut === 'traitee' ? 'success' : 'muted'}`}>{t(p.statut === 'traitee' ? 'citoyen.petition_traitee' : 'citoyen.petition_cloturee')}</span>}
      </div>
      {p.province && <div className="petition-card__deadline"><Icon n="map-pin" /> {p.province}{p.commission_nom ? ' · ' + p.commission_nom : ''}</div>}
      <div className="petition-bar">
        <div className="petition-bar__header"><span className="petition-bar__count">{nombre(p.nb_signatures)} {t('citoyen.signatures')}</span><span className="petition-bar__percent">{pct}%</span></div>
        <div className="petition-bar__track"><div className={`petition-bar__fill${pct >= 80 ? ' petition-bar__fill--high' : ''}`} style={{ width: pct + '%' }} /></div>
        <div className="petition-bar__percent" style={{ marginBlockStart: 'var(--space-1)' }}>{t('citoyen.objectif')} : {nombre(p.objectif_signatures)}</div>
      </div>
      {active && !ouvert && <button className="btn btn--gold btn--full btn--sm" onClick={() => setOuvert(true)}><Icon n="pencil-simple-line" /> {t('citoyen.signer')}</button>}
      {active && ouvert && (
        <form className="flex flex-col gap-2" onSubmit={signer} style={{ marginBlockStart: 'var(--space-2)' }}>
          <input className="form-input" placeholder={t('citoyen.nom')} required value={nom} onChange={(e) => setNom(e.target.value)} />
          <input className="form-input" placeholder={t('citoyen.contact')} required value={contact} onChange={(e) => setContact(e.target.value)} />
          <button className="btn btn--primary btn--sm btn--full" type="submit">{t('citoyen.signer')}</button>
        </form>
      )}
    </div>
  );
}

export default function Citoyen() {
  const { t } = useI18n();
  const petitions = useFetch(() => api('/api/public/petitions'), []);

  return (
    <main className="container" style={{ paddingBlock: 'var(--space-10) var(--space-16)' }}>
      <div className="page-header" style={{ background: 'transparent', border: 'none', paddingBlockEnd: 0 }}>
        <div className="breadcrumb"><Link to="/">{t('nav.accueil')}</Link> <span className="breadcrumb__sep">/</span> <span>{t('nav.citoyen')}</span></div>
        <h1 className="section-title">{t('citoyen.titre')}</h1>
        <p className="section-subtitle">{t('citoyen.sous_titre')}</p>
      </div>
      <div className="citizen-layout">
        <div className="card card--flat"><MessageForm /></div>
        <div className="card card--flat">
          <h3 className="font-semibold text-lg" style={{ borderBlockEnd: '2px solid var(--gold-500)', paddingBlockEnd: 'var(--space-2)', marginBlockEnd: 'var(--space-4)' }}>{t('citoyen.petitions')}</h3>
          <div className="flex flex-col gap-4">
            {petitions.error ? <ErreurReseau onRetry={petitions.reload} />
              : petitions.data === undefined ? <SkeletonGrid n={1} />
                : petitions.data.petitions.length ? petitions.data.petitions.map((p) => <PetitionCard key={p.id} p={p} onSigned={petitions.reload} />)
                  : <Empty />}
          </div>
        </div>
      </div>
    </main>
  );
}
