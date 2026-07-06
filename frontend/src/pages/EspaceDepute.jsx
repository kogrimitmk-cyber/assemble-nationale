import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { toast } from '../components/Toaster.jsx';
import Logo from '../components/Logo.jsx';
import { Icon, Empty, ErreurReseau, SkeletonGrid } from '../components/ui.jsx';

function Activer2FA({ onActive }) {
  const { t } = useI18n();
  const [secret, setSecret] = useState(null);
  const [msg, setMsg] = useState('');
  const [code, setCode] = useState('');

  const demarrer = async () => {
    try { const r = await api('/api/auth/activer-2fa', { method: 'POST' }); setSecret(r.secret); setMsg(r.message); }
    catch (err) { toast(err.message); }
  };
  const confirmer = async (e) => {
    e.preventDefault();
    try { const r = await api('/api/auth/confirmer-2fa', { method: 'POST', body: { code } }); toast(r.message); onActive(); }
    catch (err) { toast(err.message); }
  };

  if (!secret) return <button className="btn btn--tertiary btn--sm" onClick={demarrer}>{t('bo.activer_2fa')}</button>;
  return (
    <div style={{ textAlign: 'start', fontSize: 'var(--text-xs)' }}>
      <div className="text-secondary">{msg}</div>
      <code style={{ display: 'block', background: 'var(--neutral-50)', padding: 8, borderRadius: 6, wordBreak: 'break-all', direction: 'ltr', marginBlock: 8 }}>{secret}</code>
      <form className="flex gap-2" onSubmit={confirmer}>
        <input className="form-input" inputMode="numeric" maxLength={6} placeholder="000000" dir="ltr" style={{ height: 38 }} value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn btn--primary btn--sm" type="submit">{t('auth.otp_valider')}</button>
      </form>
    </div>
  );
}

function VoteOuvert({ scrutin, monVote, onVote }) {
  const { t } = useI18n();
  const [choix, setChoix] = useState(null);
  if (monVote) return (
    <div className="info-banner info-banner--success"><Icon n="check-circle" /><div><strong>{t('bo.vote_enregistre')}</strong> — {monVote}</div></div>
  );
  const boutons = [['POUR', 'vote-pour', 'check', 'scrutins.pour'], ['CONTRE', 'vote-contre', 'x', 'scrutins.contre'], ['ABSTENTION', 'vote-abstention', 'minus', 'scrutins.abstention']];
  return (
    <div className="active-vote">
      <div className="active-vote__header"><Icon n="lightning" /> {t('bo.vote_requis')}</div>
      <div className="active-vote__title">{scrutin.loi_titre || scrutin.titre}</div>
      <div className="active-vote__subtitle">{scrutin.numero_reference || ''}</div>
      <div className="active-vote__buttons">
        {boutons.map(([c, cls, ic, cle]) => (
          <button key={c} className={`btn btn--${cls}`} style={{ opacity: choix && choix !== c ? 0.5 : 1 }} onClick={() => setChoix(c)}><Icon n={ic} /> {t(cle)}</button>
        ))}
      </div>
      <button className="btn btn--primary btn--full" disabled={!choix} onClick={() => onVote(choix)}>{t('bo.voter')}</button>
      <div className="active-vote__security"><Icon n="lock-key" /> {t('auth.note_securite')}</div>
    </div>
  );
}

export default function EspaceDepute() {
  const { t, fmtTime } = useI18n();
  const { utilisateur, pret, logout } = useAuth();
  const nav = useNavigate();
  const [a, setA] = useState(undefined);
  const [err, setErr] = useState(null);

  useEffect(() => { if (pret && !utilisateur) nav('/connexion', { replace: true }); }, [pret, utilisateur, nav]);

  const charger = () => { setA(undefined); setErr(null); api('/api/depute/apercu').then(setA).catch(setErr); };
  useEffect(() => { if (utilisateur) charger(); /* eslint-disable-next-line */ }, [utilisateur]);

  if (!utilisateur) return null;
  const u = utilisateur;
  const init = ((u.prenom[0] || '') + (u.nom[0] || '')).toUpperCase();

  const voter = async (choix) => {
    try { const r = await api('/api/depute/voter', { method: 'POST', body: { session_id: a.scrutin_ouvert.id, choix } }); toast(r.message + ' · ' + r.hash_verif); charger(); }
    catch (e) { toast(e.message); }
  };
  const deconnexion = async () => { await logout(); nav('/'); };

  const navLien = (ic, txt, actif) => <a href="#" onClick={(e) => e.preventDefault()} className={`dashboard-nav__link${actif ? ' dashboard-nav__link--active' : ''}`}><Icon n={ic} /> {txt}</a>;

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__header"><Logo size={32} /><span className="font-bold font-heading text-lg text-white">AN Connect</span></div>
        <nav className="dashboard-nav">
          {navLien('squares-four', t('bo.tableau'), true)}
          {navLien('calendar-check', t('bo.agenda_perso'))}
          {navLien('folder-lock', t('bo.documents_seance'))}
          {navLien('users', t('bo.mes_commissions'))}
        </nav>
        <div className="dashboard-sidebar__footer">
          <a href="#" onClick={(e) => { e.preventDefault(); deconnexion(); }} className="dashboard-nav__link"><Icon n="sign-out" /> {t('nav.deconnexion')}</a>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <Link to="/" className="btn btn--ghost btn--sm hide-desktop"><Icon n="house" /></Link>
          <h1 className="text-xl font-bold font-heading m-0 hide-mobile">{t('bo.titre')}</h1>
          <div className="flex items-center gap-4" style={{ marginInlineStart: 'auto' }}>
            <div className="relative cursor-pointer" title={t('bo.notifications')}><Icon n="bell" /></div>
            <div className="flex items-center gap-3" style={{ paddingInlineStart: 'var(--space-4)', borderInlineStart: '1px solid var(--color-border)' }}>
              <div className="text-right hide-mobile"><div className="text-sm font-bold text-primary">{u.prenom} {u.nom}</div><div className="text-xs text-muted">{u.groupe_parlementaire || u.fonction || ''}</div></div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--gold-500)', background: 'var(--blue-100)', color: 'var(--blue-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{init}</div>
            </div>
          </div>
        </header>

        <div className="dashboard-content animate-in">
          {err ? <ErreurReseau onRetry={charger} />
            : a === undefined ? <SkeletonGrid n={3} />
              : (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBlockEnd: 'var(--space-6)' }}>
                    <h2 className="text-2xl font-bold font-heading">{t('bo.bonjour')}, {u.prenom}</h2>
                  </div>
                  {u.doit_changer_mdp && <div className="info-banner info-banner--warning" style={{ marginBlockEnd: 'var(--space-6)' }}><Icon n="warning" /><div>{t('bo.mdp_a_changer')}</div></div>}

                  <div className="grid-3" style={{ marginBlockEnd: 'var(--space-8)' }}>
                    <div className="stat-card" style={{ boxShadow: 'var(--shadow-sm)' }}>
                      <div className="stat-card__icon" style={{ background: 'var(--blue-100)', color: 'var(--blue-800)' }}><Icon n="user-check" /></div>
                      <div className="stat-card__number" style={{ color: 'var(--color-text)' }}>{a.presence.taux !== null ? a.presence.taux + '%' : '—'}</div>
                      <div className="stat-card__label">{t('bo.presence')}</div>
                    </div>
                    <div className="stat-card" style={{ boxShadow: 'var(--shadow-sm)' }}>
                      <div className="stat-card__icon" style={{ background: 'var(--gold-100)', color: 'var(--gold-600)' }}><Icon n="users" /></div>
                      <div className="stat-card__number" style={{ color: 'var(--color-text)' }}>{a.mes_commissions.length}</div>
                      <div className="stat-card__label">{t('bo.mes_commissions')}</div>
                    </div>
                    <div className="stat-card" style={{ boxShadow: 'var(--shadow-sm)' }}>
                      <div className="stat-card__icon" style={{ background: u.totp_active ? 'var(--green-100)' : 'var(--red-100)', color: u.totp_active ? 'var(--green-600)' : 'var(--red-700)' }}><Icon n="shield-check" /></div>
                      <div className="stat-card__number" style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text)' }}>{u.totp_active ? t('bo.2fa_active') : '2FA'}</div>
                      <div className="stat-card__label">{u.totp_active ? '' : <Activer2FA onActive={() => { window.location.reload(); }} />}</div>
                    </div>
                  </div>

                  <div className="dashboard-grid">
                    <div className="card card--flat">
                      <h3 className="font-semibold text-lg" style={{ borderBlockEnd: '2px solid var(--blue-800)', paddingBlockEnd: 'var(--space-2)', marginBlockEnd: 'var(--space-4)' }}>{t('bo.agenda_perso')}</h3>
                      {a.prochaines_seances.length ? a.prochaines_seances.slice(0, 5).map((s) => (
                        <div key={s.id} className={`schedule-block${s.type_evenement === 'commission' ? ' schedule-block--commission' : ''}`}>
                          <div className="schedule-block__time">{fmtTime(s.date_debut)}</div>
                          <div className="schedule-block__title">{s.titre}</div>
                        </div>
                      )) : <Empty />}
                    </div>
                    <div className="flex flex-col gap-6">
                      {a.scrutin_ouvert
                        ? <VoteOuvert scrutin={a.scrutin_ouvert} monVote={a.mon_vote} onVote={voter} />
                        : <div className="card card--flat"><Empty title={t('bo.aucun_scrutin')} text={t('bo.aucun_scrutin_desc')} icon="check-square" /></div>}
                      <div className="card card--flat">
                        <h3 className="font-semibold text-lg" style={{ borderBlockEnd: '2px solid var(--neutral-300)', paddingBlockEnd: 'var(--space-2)', marginBlockEnd: 'var(--space-4)' }}>{t('bo.doc_internes')}</h3>
                        {a.documents_recents.length ? a.documents_recents.slice(0, 5).map((doc) => (
                          <a key={doc.id} href="#" onClick={(e) => { e.preventDefault(); toast(t('commun.demo')); }} className="flex items-center gap-3 text-sm hover-bg" style={{ padding: 8, borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'inherit' }}>
                            <Icon n={doc.acces === 'public' ? 'file-text' : 'file-lock'} /><span style={{ flex: 1, fontWeight: 500 }}>{doc.titre}</span>
                            <span className={`badge badge--${doc.acces === 'public' ? 'success' : 'gold'}`}>{t('documents.acces_' + doc.acces)}</span>
                          </a>
                        )) : <Empty />}
                      </div>
                    </div>
                  </div>
                </>
              )}
        </div>
      </main>
    </div>
  );
}
