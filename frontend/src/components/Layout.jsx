import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import MobileNav from './MobileNav.jsx';
import Footer from './Footer.jsx';
import { useI18n } from '../i18n.jsx';

export default function Layout() {
  const [menuOuvert, setMenu] = useState(false);
  const { t } = useI18n();
  const loc = useLocation();

  // L'espace député a son propre plein-écran : pas de header/footer public.
  const espace = loc.pathname.startsWith('/espace');
  if (espace) return <Outlet />;

  return (
    <>
      <a href="#contenu" className="skip-link">{t('a11y.contenu')}</a>
      <Header onBurger={() => setMenu(true)} />
      <MobileNav open={menuOuvert} onClose={() => setMenu(false)} />
      <main id="contenu"><Outlet /></main>
      <Footer />
    </>
  );
}
