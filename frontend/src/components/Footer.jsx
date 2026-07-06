import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import Logo from './Logo.jsx';
import { Icon } from './ui.jsx';

export default function Footer() {
  const { t } = useI18n();
  const L = (to, txt) => <Link to={to} className="site-footer__link">{txt}</Link>;
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <div>
            <div className="site-footer__brand">
              <div className="site-footer__brand-logo"><Logo size={48} /></div>
              <div className="site-footer__brand-text">{t('marque.nom')}<br />{t('marque.pays')}</div>
            </div>
            <p className="site-footer__desc">{t('footer.desc')}</p>
          </div>
          <div>
            <h4 className="site-footer__heading">{t('footer.institution')}</h4>
            <div className="site-footer__links">
              {L('/deputes', t('footer.apropos'))}
              {L('/deputes', t('footer.president'))}
              {L('/deputes', t('footer.groupes'))}
            </div>
          </div>
          <div>
            <h4 className="site-footer__heading">{t('footer.legislation')}</h4>
            <div className="site-footer__links">
              {L('/lois', t('nav.lois'))}
              {L('/votes', t('scrutins.titre'))}
              {L('/agenda', t('agenda.titre'))}
              {L('/documents', t('documents.titre'))}
            </div>
          </div>
          <div className="site-footer__emblem">
            <img src="/Coat_of_arms_of_Chad.svg" alt={t('marque.pays')} />
            <div className="site-footer__emblem-devise">{t('marque.devise')}</div>
          </div>
          <div>
            <h4 className="site-footer__heading">{t('footer.contact')}</h4>
            <div className="site-footer__links">
              <span className="site-footer__link"><Icon n="map-pin" /> {t('marque.palais')}</span>
              {L('/citoyen', t('nav.citoyen'))}
              {L('/connexion', t('nav.connexion'))}
            </div>
          </div>
        </div>
        <div className="site-footer__bottom">
          <div className="site-footer__copyright">{t('footer.copyright')}</div>
          <div className="site-footer__legal-links">
            <Link to="/mentions-legales">{t('legal.mentions')}</Link>
            <Link to="/confidentialite">{t('legal.confidentialite')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
