import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { Icon } from './ui.jsx';
import { LangToggle } from './Header.jsx';

const LIENS = [
  ['/', 'house', 'nav.accueil'],
  ['/agenda', 'calendar-blank', 'nav.agenda'],
  ['/lois', 'scroll', 'nav.lois'],
  ['/deputes', 'users', 'nav.deputes'],
  ['/documents', 'file-text', 'nav.documents'],
  ['/citoyen', 'chat-circle', 'nav.citoyen'],
];

export default function MobileNav({ open, onClose }) {
  const { t } = useI18n();
  const { utilisateur } = useAuth();
  return (
    <div className={`mobile-nav${open ? ' open' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mobile-nav__panel">
        <div className="mobile-nav__header">
          <LangToggle />
          <button className="mobile-nav__close" onClick={onClose} aria-label={t('commun.fermer') || 'Fermer'}><Icon n="x" /></button>
        </div>
        <nav className="mobile-nav__links">
          {LIENS.map(([to, ic, cle]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onClose}
                     className={({ isActive }) => `mobile-nav__link${isActive ? ' mobile-nav__link--active' : ''}`}>
              <Icon n={ic} /> {t(cle)}
            </NavLink>
          ))}
        </nav>
        <div className="mobile-nav__footer">
          <NavLink to={utilisateur ? '/espace' : '/connexion'} onClick={onClose} className="btn btn--secondary btn--full">
            {utilisateur ? t('nav.espace') : t('nav.connexion')}
          </NavLink>
        </div>
      </div>
    </div>
  );
}
