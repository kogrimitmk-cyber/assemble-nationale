import { useState } from 'react';
import { Routes, Route, NavLink, Navigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';
import { Icon } from '../components/ui.jsx';
import { MODULES, ORDRE } from './schema.js';
import { ListView } from './ListView.jsx';
import '../styles/admin.css';

// ── Mini-connexion autonome (sans toucher au site public) ─────
function AdminLogin() {
  const { login } = useAuth();
  const [id, setId] = useState('');
  const [mdp, setMdp] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const r = await login(id, mdp);
      if (r.etape === '2fa') setMsg('Ce compte utilise la double authentification. Connectez-vous via le portail principal.');
      // Si « connecte », le contexte auth bascule et affiche l'admin.
    } catch (err) { setMsg(err.statut === 429 ? err.message : 'Identifiants invalides.'); }
    setBusy(false);
  };

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={soumettre}>
        <Logo size={44} />
        <h1>Administration</h1>
        <p className="admin-login__sub">Espace réservé au secrétariat de l'Assemblée Nationale.</p>
        <div className="form-group"><label className="form-label">Matricule</label>
          <input className="form-input" dir="ltr" value={id} onChange={(e) => setId(e.target.value)} required autoFocus /></div>
        <div className="form-group"><label className="form-label">Mot de passe</label>
          <input className="form-input" dir="ltr" type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} required /></div>
        {msg && <div className="form-error"><Icon n="warning-circle" /> {msg}</div>}
        <button className="btn btn--primary btn--full btn--lg" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        <Link to="/" className="admin-login__retour"><Icon n="arrow-left" /> Retour au site public</Link>
      </form>
    </div>
  );
}

function AccesRefuse() {
  const { logout, utilisateur } = useAuth();
  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__deny"><Icon n="lock" /></div>
        <h1>Accès refusé</h1>
        <p className="admin-login__sub">Le compte « {utilisateur.prenom} {utilisateur.nom} » n'a pas les droits d'administration.</p>
        <button className="btn btn--secondary btn--full" onClick={logout}>Changer de compte</button>
        <Link to="/" className="admin-login__retour"><Icon n="arrow-left" /> Retour au site public</Link>
      </div>
    </div>
  );
}

function PageModule() {
  const { module } = useParams();
  const conf = MODULES[module];
  if (!conf) return <Navigate to={`/admin/${ORDRE[0]}`} replace />;
  return <ListView module={conf} />;
}

function AdminLayout() {
  const { utilisateur, logout } = useAuth();
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-side__brand"><Logo size={34} /><span>AN Connect<br /><small>Administration</small></span></div>
        <nav className="admin-side__nav">
          {ORDRE.map((k) => (
            <NavLink key={k} to={`/admin/${k}`} className={({ isActive }) => 'admin-side__link' + (isActive ? ' actif' : '')}>
              <Icon n={MODULES[k].icone} /> {MODULES[k].titre}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side__foot">
          <a href="/" className="admin-side__link"><Icon n="globe" /> Site public</a>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <span className="admin-top__user"><Icon n="user-circle" /> {utilisateur.prenom} {utilisateur.nom}</span>
          <button className="btn btn--ghost btn--sm" onClick={logout}><Icon n="sign-out" /> Déconnexion</button>
        </header>
        <main className="admin-content">
          <Routes>
            <Route index element={<Navigate to={ORDRE[0]} replace />} />
            <Route path=":module" element={<PageModule />} />
            <Route path="*" element={<Navigate to={ORDRE[0]} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { utilisateur, pret } = useAuth();
  if (!pret) return <div className="admin-login"><div className="admin-login__card">Chargement…</div></div>;
  if (!utilisateur) return <AdminLogin />;
  if (!utilisateur.is_staff) return <AccesRefuse />;
  return <AdminLayout />;
}
