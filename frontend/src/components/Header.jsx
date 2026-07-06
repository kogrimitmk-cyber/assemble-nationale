import { Link, NavLink } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import Logo from './Logo.jsx';
import { Icon } from './ui.jsx';

export const NAV = [
  ['/', 'nav.accueil'],
  ['/agenda', 'nav.agenda'],
  ['/lois', 'nav.lois'],
  ['/deputes', 'nav.deputes'],
  ['/documents', 'nav.documents'],
  ['/citoyen', 'nav.citoyen'],
];

function LangToggle() {
  const { lang, toggle } = useI18n();
  return (
    <div className="lang-toggle">
      <button className={`lang-toggle__btn${lang === 'fr' ? ' lang-toggle__btn--active' : ''}`}
              onClick={() => lang !== 'fr' && toggle()}>FR</button>
      <button className={`lang-toggle__btn${lang === 'ar' ? ' lang-toggle__btn--active' : ''}`}
              onClick={() => lang !== 'ar' && toggle()}>ع</button>
    </div>
  );
}

export default function Header({ onBurger }) {
  const { t } = useI18n();
  const { utilisateur } = useAuth();
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <button className="mobile-menu-toggle" onClick={onBurger} aria-label={t('nav.menu')}><Icon n="list" /></button>
        <Link to="/" className="site-header__brand">
          <div className="site-header__logo"><Logo /></div>
          <div className="site-header__title">{t('marque.nom')} <small>{t('marque.pays')}</small></div>
        </Link>
        <nav className="main-nav hide-mobile" aria-label="Navigation principale">
          {NAV.map(([to, cle]) => (
            <NavLink key={to} to={to} end={to === '/'}
                     className={({ isActive }) => `main-nav__link${isActive ? ' main-nav__link--active' : ''}`}>
              {t(cle)}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <div className="hide-mobile"><LangToggle /></div>
          <Link to={utilisateur ? '/espace' : '/connexion'} className="header-profile"
                aria-label={utilisateur ? t('nav.espace') : t('nav.connexion')}>
            <Icon n={utilisateur ? 'user-circle' : 'user'} />
          </Link>
        </div>
      </div>
    </header>
  );
}

export { LangToggle };
