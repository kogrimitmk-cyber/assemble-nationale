import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';
import { Icon } from '../components/ui.jsx';

const HERO_BG = 'linear-gradient(160deg, var(--blue-900) 0%, var(--blue-800) 55%, #013a9e 100%)';

function EtapeIdentifiants({ onDefi }) {
  const { t } = useI18n();
  const { login } = useAuth();
  const nav = useNavigate();
  const [id, setId] = useState('');
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState('');
  const [busy, setBusy] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setBusy(true); setErreur('');
    try {
      const r = await login(id, mdp);
      if (r.etape === '2fa') onDefi(r.defi);
      else nav('/espace');
    } catch (err) { setErreur(err.statut === 429 ? err.message : t('auth.erreur')); setBusy(false); }
  };

  return (
    <>
      <h1 className="font-heading text-primary" style={{ fontSize: '1.8rem', marginBlockEnd: 'var(--space-2)' }}>{t('nav.connexion')}</h1>
      <p className="text-secondary" style={{ marginBlockEnd: 'var(--space-8)' }}>{t('auth.sous_titre')}</p>
      <form className="flex flex-col gap-5" onSubmit={soumettre}>
        <div className="form-group"><label className="form-label">{t('auth.identifiant')}</label>
          <input className="form-input" dir="ltr" placeholder={t('auth.identifiant_ph')} autoComplete="username" required value={id} onChange={(e) => setId(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">{t('auth.mdp')}</label>
          <input className="form-input" dir="ltr" type="password" autoComplete="current-password" required value={mdp} onChange={(e) => setMdp(e.target.value)} />
          {erreur && <div className="form-error"><Icon n="warning-circle" /> {erreur}</div>}</div>
        <button className="btn btn--primary btn--full btn--lg" type="submit" disabled={busy}>{t('auth.se_connecter')}</button>
      </form>
      <div className="login-card__security" style={{ marginBlockStart: 'var(--space-6)' }}><Icon n="shield-check" /> {t('auth.note_securite')}</div>
    </>
  );
}

function EtapeOTP({ defi, onRetour }) {
  const { t } = useI18n();
  const { verifierOtp } = useAuth();
  const nav = useNavigate();
  const [vals, setVals] = useState(['', '', '', '', '', '']);
  const [erreur, setErreur] = useState('');
  const refs = useRef([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);

  const setAt = (i, v) => {
    const d = v.replace(/\D/g, '').slice(0, 1);
    const next = [...vals]; next[i] = d; setVals(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => { if (e.key === 'Backspace' && !vals[i] && i > 0) refs.current[i - 1]?.focus(); };
  const onPaste = (e) => {
    const txt = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (txt.length > 1) { e.preventDefault(); const arr = ['', '', '', '', '', '']; txt.split('').forEach((c, j) => { arr[j] = c; }); setVals(arr); refs.current[Math.min(txt.length, 5)]?.focus(); }
  };
  const soumettre = async (e) => {
    e.preventDefault(); setErreur('');
    try { await verifierOtp(defi, vals.join('')); nav('/espace'); }
    catch (err) { setErreur(err.code === 'DEFI_EXPIRE' ? err.message : t('auth.otp_erreur')); setVals(['', '', '', '', '', '']); refs.current[0]?.focus(); }
  };

  return (
    <div className="otp-section">
      <div className="otp-section__icon"><Icon n="device-mobile" /></div>
      <h1 className="font-heading text-primary" style={{ fontSize: '1.6rem' }}>{t('auth.otp_titre')}</h1>
      <p className="otp-section__text">{t('auth.otp_sous_titre')}</p>
      <form onSubmit={soumettre}>
        <div className="otp-inputs" onPaste={onPaste}>
          {vals.map((v, i) => (
            <input key={i} ref={(el) => (refs.current[i] = el)} className={`otp-input${v ? ' filled' : ''}`}
                   inputMode="numeric" maxLength={1} value={v} onChange={(e) => setAt(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} aria-label={`Chiffre ${i + 1}`} />
          ))}
        </div>
        {erreur && <div className="form-error" style={{ justifyContent: 'center', marginBlockStart: 'var(--space-3)' }}><Icon n="warning-circle" /> {erreur}</div>}
        <button className="btn btn--primary btn--full btn--lg" type="submit" style={{ marginBlockStart: 'var(--space-6)' }}>{t('auth.otp_valider')}</button>
        <div className="otp-section__links"><a href="#" onClick={(e) => { e.preventDefault(); onRetour(); }}>{t('auth.otp_retour')}</a></div>
      </form>
    </div>
  );
}

export default function Connexion() {
  const { t } = useI18n();
  const { utilisateur, pret } = useAuth();
  const nav = useNavigate();
  const [defi, setDefi] = useState(null);
  useEffect(() => { if (pret && utilisateur) nav('/espace', { replace: true }); }, [pret, utilisateur, nav]);

  return (
    <div className="login-layout" style={{ minHeight: '100vh' }}>
      <div className="login-visual hide-mobile" style={{ flex: 1, background: HERO_BG, position: 'relative' }}>
        <div className="hero__pattern" />
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'var(--space-12)', color: '#fff' }}>
          <div><Logo size={48} /><div className="text-xl font-bold font-heading" style={{ marginBlockStart: 'var(--space-3)' }}>AN Connect Tchad</div></div>
          <div>
            <h2 className="font-heading" style={{ fontSize: '2.4rem', lineHeight: 1.2, color: '#fff', marginBlockEnd: 'var(--space-4)' }}>{t('auth.titre')}</h2>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,.85)', maxWidth: 420 }}>{t('auth.sous_titre')}</p>
          </div>
          <div className="text-sm text-gold font-semibold"><Icon n="shield-check" /> {t('auth.note_securite')}</div>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--space-8) var(--space-12)', background: 'var(--white)', marginInline: 'auto' }}>
        <Link to="/" className="btn btn--ghost btn--sm" style={{ width: 'fit-content', marginBlockEnd: 'var(--space-8)' }}><Icon n="arrow-left" /> {t('auth.public_lien')}</Link>
        {defi ? <EtapeOTP defi={defi} onRetour={() => setDefi(null)} /> : <EtapeIdentifiants onDefi={setDefi} />}
      </div>
    </div>
  );
}
