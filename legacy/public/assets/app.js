// ═══════════════════════════════════════════════════════════════
// AN CONNECT TCHAD — Application publique (SPA)
// Rendu avec la charte de l'exemple (classes BEM + Phosphor),
// alimenté par l'API réelle. Règle : données réelles ou état vide
// honnête — jamais de fausses données.
// ═══════════════════════════════════════════════════════════════

/* ── Logo hémicycle (charte) ─────────────────────────────────── */
function logoSvg(onDark = true, size = 44) {
  const mid = onDark ? '#FFFFFF' : '#002B7F';
  return `<svg viewBox="0 0 44 44" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M4 36C4 26.0589 12.0589 18 22 18C31.9411 18 40 26.0589 40 36" stroke="#D4A843" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M10 36C10 29.3726 15.3726 24 22 24C28.6274 24 34 29.3726 34 36" stroke="${mid}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="22" cy="34" r="3" fill="#D4A843"/></svg>`;
}

/* Hero et visuel de connexion : 100 % CSS (dégradé bleu institutionnel
   + motif hémicycle) — aucune dépendance réseau, robuste hors-ligne. */
const HERO_BG = 'linear-gradient(160deg, var(--blue-900) 0%, var(--blue-800) 55%, #013a9e 100%)';

/* ═══ ÉTAT ═══ */
const Etat = { utilisateur: null, agendaVue: 'liste' };
const ROLES_PARLEMENTAIRES = ['depute', 'president', 'vice_president', 'secretaire_general', 'questeur'];

/* ═══ API ═══ */
async function api(url, options = {}) {
  const reponse = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    const err = new Error(donnees.message || 'Erreur serveur');
    err.code = donnees.erreur; err.statut = reponse.status;
    throw err;
  }
  return donnees;
}

/* ═══ AIDES ═══ */
const $ = (s, r = document) => r.querySelector(s);
const vue = () => $('#vue');
function echapper(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const ic = (nom) => `<i class="ph ph-${nom}" aria-hidden="true"></i>`;

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 3600);
}

function dateLocale(iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!iso) return '—';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (isNaN(d)) return iso;
  return new Intl.DateTimeFormat(LANGUE === 'ar' ? 'ar-TD' : 'fr-FR', opts).format(d);
}
const heureLocale = (iso) => dateLocale(iso, { hour: '2-digit', minute: '2-digit' });

function etatVide(titre, texte, icone = 'tray') {
  return `<div class="empty-state">
    <div class="empty-state__icon">${ic(icone)}</div>
    <h3 class="empty-state__title">${echapper(titre || t('commun.vide_titre'))}</h3>
    <p class="empty-state__text">${echapper(texte || t('commun.vide_texte'))}</p>
  </div>`;
}
function etatErreur(fn) {
  return `<div class="empty-state">
    <div class="empty-state__icon" style="background:var(--red-100);color:var(--red-600)">${ic('wifi-slash')}</div>
    <h3 class="empty-state__title">${t('commun.erreur_titre')}</h3>
    <p class="empty-state__text">${t('commun.erreur_texte')}</p>
    <button class="btn btn--secondary" onclick="${fn}">${ic('arrow-clockwise')} ${t('commun.reessayer')}</button>
  </div>`;
}
const skeletonCarte = (n = 3) => `<div class="grid-3">${Array.from({ length: n }, () => '<div class="skeleton skeleton--card"></div>').join('')}</div>`;

/* Badges */
const STATUT_BADGE = {
  depose: 'neutral', en_commission: 'primary', en_debat: 'primary', au_vote: 'gold',
  adopte: 'success', promulgue: 'success', rejete: 'danger', retire: 'muted',
};
const badgeStatut = (s) => `<span class="badge badge--${STATUT_BADGE[s] || 'neutral'}">${t('statut.' + s)}</span>`;
function badgePriorite(p) {
  if (p === 'urgence_nationale') return `<span class="badge badge--danger">${ic('warning')} ${t('priorite.' + p)}</span>`;
  if (p === 'prioritaire') return `<span class="badge badge--gold">${ic('star')} ${t('priorite.' + p)}</span>`;
  return '';
}
const badgeType = (ty) => ty === 'proposition'
  ? `<span class="badge badge--neutral">${t('lois.type_proposition')}</span>`
  : `<span class="badge badge--primary">${t('lois.type_projet')}</span>`;
const badgeSeance = (s) => {
  const m = { prevue: 'primary', en_cours: 'success', terminee: 'muted', annulee: 'danger' };
  return `<span class="badge badge--${m[s] || 'neutral'}">${t('seance.' + s)}</span>`;
};

/* Progression législative (5 étapes charte) */
const STATUT_ETAPE = { depose: 0, en_commission: 1, en_debat: 2, au_vote: 3, adopte: 4, promulgue: 5, rejete: 3, retire: 1 };
const ETAPES = ['etape.depot', 'etape.commission', 'etape.pleniere', 'etape.vote', 'etape.promulgation'];
function progressLaw(statut, compact = false) {
  const idx = STATUT_ETAPE[statut] ?? 0;
  return `<div class="progress-law${compact ? ' progress-law--compact' : ''}">` + ETAPES.map((lk, i) => {
    const cls = i < idx ? ' progress-law__step--done' : i === idx ? ' progress-law__step--active' : '';
    const dot = i < idx ? ic('check') : '';
    const lbl = compact ? '' : `<div class="progress-law__label">${t(lk)}</div>`;
    return `<div class="progress-law__step${cls}"><div class="progress-law__dot">${dot}</div>${lbl}</div>`;
  }).join('') + `</div>`;
}

/* ═══ NAVIGATION / SHELL ═══ */
const NAV = [
  ['#/', 'house', 'nav.accueil'],
  ['#/agenda', 'calendar-blank', 'nav.agenda'],
  ['#/lois', 'scroll', 'nav.lois'],
  ['#/deputes', 'users', 'nav.deputes'],
  ['#/documents', 'file-text', 'nav.documents'],
  ['#/citoyen', 'chat-circle', 'nav.citoyen'],
];

function rendreShell() {
  const routeActive = '#/' + (location.hash.split('/')[1] || '');

  $('#logo-mark').innerHTML = logoSvg(true, 44);

  $('#main-nav').innerHTML = NAV.map(([h, , c]) =>
    `<a href="${h}" data-lien class="main-nav__link${h === routeActive ? ' main-nav__link--active' : ''}">${t(c)}</a>`).join('');

  $('#mobile-nav-links').innerHTML = NAV.map(([h, i, c]) =>
    `<a href="${h}" data-lien class="mobile-nav__link${h === routeActive ? ' mobile-nav__link--active' : ''}">${ic(i)} ${t(c)}</a>`).join('');

  $('#mobile-nav-footer').innerHTML = Etat.utilisateur
    ? `<a href="#/espace" data-lien class="btn btn--gold btn--full">${ic('squares-four')} ${t('nav.espace')}</a>`
    : `<a href="#/connexion" data-lien class="btn btn--secondary btn--full">${t('nav.connexion')}</a>`;

  $('#header-profile-slot').innerHTML = Etat.utilisateur
    ? `<a href="#/espace" data-lien class="header-profile" aria-label="${t('nav.espace')}" title="${echapper(Etat.utilisateur.prenom + ' ' + Etat.utilisateur.nom)}">${ic('user-circle')}</a>`
    : `<a href="#/connexion" data-lien class="header-profile" aria-label="${t('nav.connexion')}">${ic('user')}</a>`;

  // Bascule langue (les deux groupes de boutons)
  document.querySelectorAll('.lang-toggle__btn').forEach((b) => {
    b.classList.toggle('lang-toggle__btn--active', b.dataset.lang === (LANGUE === 'ar' ? 'AR' : 'FR'));
  });

  $('#site-footer').innerHTML = footerHTML();
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
}

function footerHTML() {
  const lien = (h, txt) => `<a href="${h}" data-lien class="site-footer__link">${txt}</a>`;
  return `<div class="site-footer__inner">
    <div class="site-footer__grid">
      <div>
        <div class="site-footer__brand">
          <div class="site-footer__brand-logo">${logoSvg(true, 48)}</div>
          <div class="site-footer__brand-text">${t('marque.nom')}<br>${t('marque.pays')}</div>
        </div>
        <p class="site-footer__desc">${t('footer.desc')}</p>
      </div>
      <div>
        <h4 class="site-footer__heading">${t('footer.institution')}</h4>
        <div class="site-footer__links">
          ${lien('#/deputes', t('footer.apropos'))}
          ${lien('#/deputes', t('footer.president'))}
          ${lien('#/deputes', t('footer.groupes'))}
        </div>
      </div>
      <div>
        <h4 class="site-footer__heading">${t('footer.legislation')}</h4>
        <div class="site-footer__links">
          ${lien('#/lois', t('nav.lois'))}
          ${lien('#/votes', t('scrutins.titre'))}
          ${lien('#/agenda', t('agenda.titre'))}
          ${lien('#/documents', t('documents.titre'))}
        </div>
      </div>
      <div>
        <h4 class="site-footer__heading">${t('footer.contact')}</h4>
        <div class="site-footer__links">
          <span class="site-footer__link">${ic('map-pin')} ${t('marque.palais')}</span>
          ${lien('#/citoyen', t('nav.citoyen'))}
          ${lien('#/connexion', t('nav.connexion'))}
        </div>
      </div>
    </div>
    <div class="site-footer__bottom">
      <div class="site-footer__copyright">${t('footer.copyright')}</div>
      <div class="site-footer__legal-links">
        <a href="#/mentions-legales" data-lien>${t('legal.mentions')}</a>
        <a href="#/confidentialite" data-lien>${t('legal.confidentialite')}</a>
      </div>
    </div>
  </div>`;
}

function fermerMobileNav() {
  $('#mobile-nav').classList.remove('open');
  document.body.style.overflow = '';
}

/* Affiche/masque header+footer publics (l'espace député a son propre layout) */
function chromePublic(visible) {
  $('#site-header').style.display = visible ? '' : 'none';
  $('#site-footer').style.display = visible ? '' : 'none';
}

/* ═══ ROUTEUR ═══ */
async function router() {
  fermerMobileNav();
  window.scrollTo({ top: 0 });
  const [chemin, param] = location.hash.replace(/^#\//, '').split('/');
  const estEspace = chemin === 'espace';
  chromePublic(!estEspace);
  if (!estEspace) rendreShell();

  const pages = {
    '': pageAccueil,
    'agenda': pageAgenda,
    'lois': param ? () => pageLoiDetail(param) : pageLois,
    'votes': pageVotes,
    'deputes': param ? () => pageDeputeDetail(param) : pageDeputes,
    'documents': pageDocuments,
    'citoyen': pageCitoyen,
    'connexion': pageConnexion,
    'espace': pageEspace,
    'mentions-legales': () => pageLegale('mentions'),
    'confidentialite': () => pageLegale('confidentialite'),
  };
  try { await (pages[chemin] || pageAccueil)(); }
  catch { vue().innerHTML = `<main class="container" style="padding-block:var(--space-16)">${etatErreur('router()')}</main>`; }
}

/* En-tête de page réutilisable (fil d'ariane + titre) */
function pageHeader(titreCle, sousCle, fil = []) {
  const ariane = [`<a href="#/" data-lien>${t('nav.accueil')}</a>`, ...fil].join(` <span class="breadcrumb__sep">/</span> `);
  return `<div class="page-header" style="background:transparent;border:none;padding-block-end:0">
    <div class="breadcrumb">${ariane}</div>
    <h1 class="section-title">${t(titreCle)}</h1>
    <p class="section-subtitle">${t(sousCle)}</p>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   ACCUEIL
═══════════════════════════════════════════════════════════════ */
async function pageAccueil() {
  vue().innerHTML = `
  <section class="hero" style="background:${HERO_BG}">
    <div class="hero__overlay"></div>
    <div class="hero__pattern"></div>
    <div class="hero__content animate-in">
      <h1 class="hero__title">${t('marque.nom')}<br>${t('marque.pays')}</h1>
      <div class="hero__separator"></div>
      <p class="hero__subtitle">${t('accueil.hero_sous')}</p>
    </div>
  </section>

  <div class="hero__stats animate-in animate-in-1" id="stats" style="margin-block-start:calc(-1 * var(--space-16))">
    ${STATS.map(statSkeleton).join('')}
  </div>

  <section class="section">
    <div class="container">
      <div class="section__header">
        <div><h2 class="section-title">${t('accueil.prochaines')}</h2>
          <p class="section-subtitle">${t('agenda.sous_titre')}</p></div>
        <a href="#/agenda" data-lien class="section__link">${t('accueil.tout_agenda')} ${ic('arrow-right')}</a>
      </div>
      <div id="acc-seances">${skeletonCarte(3)}</div>
    </div>
  </section>

  <section class="section section--gray">
    <div class="container">
      <div class="section__header">
        <div><h2 class="section-title">${t('accueil.derniers_textes')}</h2>
          <p class="section-subtitle">${t('lois.sous_titre')}</p></div>
        <a href="#/lois" data-lien class="section__link">${t('accueil.tous_textes')} ${ic('arrow-right')}</a>
      </div>
      <div id="acc-lois">${skeletonCarte(3)}</div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section__header"><div><h2 class="section-title">${t('accueil.actualites')}</h2></div></div>
      <div id="acc-annonces" class="grid-3">${skeletonCarte(3)}</div>
    </div>
  </section>`;

  api('/api/public/stats').then((s) => {
    const vals = [s.deputes_actifs, s.textes_en_cours, s.seances_tenues, s.groupes_parlementaires];
    $('#stats').innerHTML = STATS.map((st, i) => statCard(st, vals[i])).join('');
  }).catch(() => {});

  api('/api/public/agenda?statut=prevue').then(({ seances }) => {
    $('#acc-seances').innerHTML = seances.length
      ? `<div class="grid-3">${seances.slice(0, 3).map(sessionCard).join('')}</div>`
      : etatVide(undefined, undefined, 'calendar-x');
  }).catch(() => { $('#acc-seances').innerHTML = etatErreur('pageAccueil()'); });

  api('/api/public/lois').then(({ lois }) => {
    $('#acc-lois').innerHTML = lois.length
      ? `<div class="grid-3">${lois.slice(0, 3).map(lawCard).join('')}</div>`
      : etatVide(undefined, undefined, 'scroll');
  }).catch(() => { $('#acc-lois').innerHTML = etatErreur('pageAccueil()'); });

  api('/api/public/annonces').then(({ annonces }) => {
    $('#acc-annonces').innerHTML = annonces.length
      ? annonces.slice(0, 3).map(annonceCard).join('')
      : `<div style="grid-column:1/-1">${etatVide()}</div>`;
  }).catch(() => { $('#acc-annonces').innerHTML = `<div style="grid-column:1/-1">${etatErreur('pageAccueil()')}</div>`; });
}

const STATS = [
  { ic: 'users-three', cle: 'stat.deputes' },
  { ic: 'scroll', cle: 'stat.textes' },
  { ic: 'calendar-check', cle: 'stat.seances' },
  { ic: 'users', cle: 'stat.groupes' },
];
const statSkeleton = (st) => `<div class="stat-card"><div class="stat-card__icon">${ic(st.ic)}</div>
  <div class="stat-card__number"><span class="skeleton" style="display:inline-block;width:42px;height:34px;border-radius:6px"></span></div>
  <div class="stat-card__label">${t(st.cle)}</div></div>`;
const statCard = (st, v) => `<div class="stat-card"><div class="stat-card__icon">${ic(st.ic)}</div>
  <div class="stat-card__number">${v}</div><div class="stat-card__label">${t(st.cle)}</div></div>`;

function sessionCard(s) {
  const badge = s.type_evenement === 'seance_pleniere'
    ? `<span class="badge badge--primary">${t('seance.seance_pleniere')}</span>`
    : s.type_evenement === 'commission'
      ? `<span class="badge badge--gold">${t('seance.commission')}</span>`
      : `<span class="badge badge--neutral">${t('seance.' + s.type_evenement)}</span>`;
  const odj = s.ordre_du_jour
    ? `<div class="session-card__agenda"><h5>${t('agenda.ordre_du_jour')} :</h5><ul>${s.ordre_du_jour.split('\n').filter(Boolean).slice(0, 3).map((p) => `<li>${echapper(p)}</li>`).join('')}</ul></div>`
    : '';
  return `<div class="session-card">
    <div class="session-card__header">${badge}
      <div class="session-card__date">${ic('calendar-blank')} ${dateLocale(s.date_debut, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
    </div>
    <h3 class="session-card__title">${echapper(s.titre)}</h3>
    <div class="session-card__meta">
      <span>${ic('clock')} ${heureLocale(s.date_debut)}${s.date_fin ? ' - ' + heureLocale(s.date_fin) : ''}</span>
      ${s.lieu ? `<span>${ic('map-pin')} ${echapper(s.lieu)}</span>` : ''}
      ${badgeSeance(s.statut)}
    </div>${odj}
  </div>`;
}

function lawCard(l) {
  return `<div class="law-card${l.priorite === 'urgence_nationale' ? ' law-card--urgent' : ''}">
    <div class="law-card__badges">${badgeType(l.type_texte)} ${badgePriorite(l.priorite)}</div>
    <h3 class="law-card__title">${echapper(l.titre)}</h3>
    <div class="law-card__ref">${t('commun.ref')}: ${echapper(l.numero_reference)}</div>
    ${l.commission_nom ? `<div class="law-card__commission">${ic('scales')} ${echapper(l.commission_nom)}</div>` : ''}
    ${progressLaw(l.statut, true)}
    <a href="#/lois/${encodeURIComponent(l.numero_reference)}" data-lien class="law-card__cta">${t('lois.consulter')} ${ic('arrow-right')}</a>
  </div>`;
}

function annonceCard(a) {
  const badge = a.priorite === 'urgente' ? `<span class="badge badge--danger">${ic('warning')} ${LANGUE === 'ar' ? 'عاجل' : 'Urgent'}</span>`
    : a.priorite === 'importante' ? `<span class="badge badge--gold">${LANGUE === 'ar' ? 'هام' : 'Important'}</span>` : '';
  return `<article class="card card--flat">
    ${badge ? `<div style="margin-block-end:var(--space-3)">${badge}</div>` : ''}
    <h3 class="font-heading text-xl text-primary" style="margin-block-end:var(--space-2)">${echapper(a.titre)}</h3>
    <p class="text-sm text-secondary">${echapper(a.contenu)}</p>
    <div class="text-xs text-gold font-semibold" style="margin-block-start:var(--space-3)">${ic('calendar-blank')} ${dateLocale(a.date_publication)}</div>
  </article>`;
}

/* ═══════════════════════════════════════════════════════════════
   AGENDA
═══════════════════════════════════════════════════════════════ */
async function pageAgenda() {
  vue().innerHTML = `<main class="container animate-in" style="padding-block:var(--space-10) var(--space-16)">
    ${pageHeader('agenda.titre', 'agenda.sous_titre', [`<span>${t('nav.agenda')}</span>`])}
    <div class="filter-bar">
      <div class="tabs" style="margin:0;border:none">
        <button class="tab${Etat.agendaVue === 'liste' ? ' tab--active' : ''}" onclick="Etat.agendaVue='liste';pageAgenda()">${t('agenda.vue_liste')}</button>
        <button class="tab${Etat.agendaVue === 'calendrier' ? ' tab--active' : ''}" onclick="Etat.agendaVue='calendrier';pageAgenda()">${t('agenda.vue_calendrier')}</button>
      </div>
      <select class="filter-bar__select" id="f-type">
        <option value="">${t('agenda.filtre_type')}</option>
        ${['seance_pleniere', 'commission', 'reunion', 'ceremonie'].map((v) => `<option value="${v}">${t('seance.' + v)}</option>`).join('')}
      </select>
      <select class="filter-bar__select" id="f-statut">
        <option value="">${t('agenda.filtre_statut')}</option>
        ${['prevue', 'en_cours', 'terminee', 'annulee'].map((v) => `<option value="${v}">${t('seance.' + v)}</option>`).join('')}
      </select>
    </div>
    <div id="ag-zone" style="margin-block-start:var(--space-6)">${skeletonCarte(3)}</div>
  </main>`;

  const charger = async () => {
    const q = new URLSearchParams();
    if ($('#f-type').value) q.set('type', $('#f-type').value);
    if ($('#f-statut').value) q.set('statut', $('#f-statut').value);
    try {
      const { seances } = await api('/api/public/agenda?' + q);
      if (Etat.agendaVue === 'calendrier') {
        $('#ag-zone').innerHTML = calendrier(seances);
      } else {
        $('#ag-zone').innerHTML = seances.length
          ? `<div class="grid-2">${seances.map(sessionCard).join('')}</div>`
          : etatVide(undefined, undefined, 'calendar-x');
      }
    } catch { $('#ag-zone').innerHTML = etatErreur('pageAgenda()'); }
  };
  $('#f-type').onchange = charger; $('#f-statut').onchange = charger;
  charger();
}

function calendrier(seances) {
  const now = new Date();
  const an = now.getFullYear(), mo = now.getMonth();
  const nbJours = new Date(an, mo + 1, 0).getDate();
  const decal = (new Date(an, mo, 1).getDay() + 6) % 7;
  const parJour = {};
  for (const s of seances) {
    const d = new Date(String(s.date_debut).replace(' ', 'T'));
    if (d.getFullYear() === an && d.getMonth() === mo) (parJour[d.getDate()] ||= []).push(s);
  }
  const jours = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(LANGUE === 'ar' ? 'ar-TD' : 'fr-FR', { weekday: 'short' }).format(new Date(2024, 0, i + 1)));
  let cells = '';
  for (let i = 0; i < decal; i++) cells += `<div class="calendar__day calendar__day--other-month"></div>`;
  for (let j = 1; j <= nbJours; j++) {
    const evts = parJour[j] || [];
    const dots = evts.slice(0, 3).map((s) => `<span class="calendar__dot calendar__dot--${s.type_evenement === 'seance_pleniere' ? 'plenary' : 'commission'}"></span>`).join('');
    cells += `<div class="calendar__day${j === now.getDate() ? ' calendar__day--today' : ''}"><span>${j}</span><div class="calendar__dots">${dots}</div></div>`;
  }
  const titre = new Intl.DateTimeFormat(LANGUE === 'ar' ? 'ar-TD' : 'fr-FR', { month: 'long', year: 'numeric' }).format(now);
  const liste = seances.filter((s) => s.statut === 'prevue' || s.statut === 'en_cours').slice(0, 5);
  return `<div class="agenda-layout">
    <div class="calendar">
      <div class="calendar__header"><div class="calendar__title" style="text-transform:capitalize">${titre}</div></div>
      <div class="calendar__weekdays">${jours.map((n) => `<div class="calendar__weekday">${n}</div>`).join('')}</div>
      <div class="calendar__days">${cells}</div>
      <div class="calendar__legend">
        <div class="calendar__legend-item"><span class="calendar__dot calendar__dot--plenary"></span> ${t('seance.seance_pleniere')}</div>
        <div class="calendar__legend-item"><span class="calendar__dot calendar__dot--commission"></span> ${t('seance.commission')}</div>
      </div>
    </div>
    <div><div class="agenda-sidebar__title">${t('agenda.a_venir')}</div>
      <div class="agenda-sidebar__list">${liste.length ? liste.map(sessionCard).join('') : etatVide()}</div>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   LOIS + DÉTAIL
═══════════════════════════════════════════════════════════════ */
async function pageLois() {
  const statuts = ['', 'depose', 'en_commission', 'en_debat', 'au_vote', 'adopte', 'promulgue'];
  vue().innerHTML = `<main class="container animate-in" style="padding-block:var(--space-10) var(--space-16)">
    ${pageHeader('lois.titre', 'lois.sous_titre', [`<span>${t('nav.lois')}</span>`])}
    <div class="filter-bar">
      <div class="search-bar">${ic('magnifying-glass')}<i class="search-bar__icon"></i>
        <input class="search-bar__input" id="lois-q" type="search" placeholder="${t('lois.rechercher')}" style="padding-inline-start:var(--space-12)">
      </div>
    </div>
    <div class="filter-bar" id="lois-chips">
      ${statuts.map((s, i) => `<button class="filter-chip" data-s="${s}" style="${i === 0 ? '' : 'background:transparent;color:var(--color-text-secondary);border:1px solid var(--color-border)'}">${s ? t('statut.' + s) : t('lois.tous')}</button>`).join('')}
    </div>
    <div id="lois-zone" style="margin-block-start:var(--space-4)">${skeletonCarte(6)}</div>
  </main>`;

  let statutActif = '';
  const peindreChips = () => $('#lois-chips').querySelectorAll('.filter-chip').forEach((b) => {
    const on = b.dataset.s === statutActif;
    b.style.cssText = on ? '' : 'background:transparent;color:var(--color-text-secondary);border:1px solid var(--color-border)';
  });
  const charger = async () => {
    const q = new URLSearchParams();
    if (statutActif) q.set('statut', statutActif);
    if ($('#lois-q').value.trim()) q.set('q', $('#lois-q').value.trim());
    try {
      const { lois } = await api('/api/public/lois?' + q);
      $('#lois-zone').innerHTML = lois.length ? `<div class="grid-3">${lois.map(lawCard).join('')}</div>` : etatVide(undefined, undefined, 'scroll');
    } catch { $('#lois-zone').innerHTML = etatErreur('pageLois()'); }
  };
  $('#lois-chips').querySelectorAll('.filter-chip').forEach((b) => {
    b.onclick = () => { statutActif = b.dataset.s; peindreChips(); charger(); };
  });
  let tmr; $('#lois-q').oninput = () => { clearTimeout(tmr); tmr = setTimeout(charger, 280); };
  charger();
}

async function pageLoiDetail(ref) {
  vue().innerHTML = `<main class="container" style="padding-block:var(--space-8) var(--space-16)">${skeletonCarte(2)}</main>`;
  let d;
  try { d = await api('/api/public/lois/' + encodeURIComponent(ref)); }
  catch (e) { vue().innerHTML = `<main class="container" style="padding-block:var(--space-16)">${e.statut === 404 ? etatVide() : etatErreur(`pageLoiDetail('${ref}')`)}</main>`; return; }
  const { loi, etapes, articles, documents } = d;

  vue().innerHTML = `<main class="container animate-in" style="padding-block:var(--space-8) var(--space-16)">
    <div class="breadcrumb" style="margin-block-end:var(--space-6)">
      <a href="#/" data-lien>${t('nav.accueil')}</a> <span class="breadcrumb__sep">/</span>
      <a href="#/lois" data-lien>${t('nav.lois')}</a> <span class="breadcrumb__sep">/</span>
      <span>${echapper(loi.numero_reference)}</span>
    </div>

    <div class="card card--no-hover" style="margin-block-end:var(--space-8);padding:var(--space-8)">
      <div class="flex items-center gap-2 flex-wrap" style="margin-block-end:var(--space-4)">
        ${badgeType(loi.type_texte)} ${badgePriorite(loi.priorite)} ${badgeStatut(loi.statut)}
        <span class="text-sm text-muted" style="margin-inline-start:auto">Réf: ${echapper(loi.numero_reference)}</span>
      </div>
      <h1 class="section-title" style="font-size:var(--text-4xl);margin-block-end:var(--space-8)">${echapper(loi.titre)}</h1>
      ${progressLaw(loi.statut, false)}
    </div>

    <div class="layout-content">
      <div>
        ${loi.resume ? `<div class="card card--flat" style="margin-block-end:var(--space-6)"><p class="text-secondary" style="margin:0;line-height:1.8">${echapper(loi.resume)}</p></div>` : ''}
        <div class="tabs-container">
          <div class="tabs">
            <button class="tab tab--active" data-target="tab-art">${t('loi.articles')} (${articles.length})</button>
            <button class="tab" data-target="tab-doc">${t('loi.documents')} (${documents.length})</button>
          </div>
          <div id="tab-art" class="tab-content tab-content--active">
            ${articles.length ? articles.map((a) => `<div class="card card--flat" style="margin-block-end:var(--space-4)">
              <h4 class="font-semibold text-primary">${echapper(a.numero)}${a.titre ? ' — ' + echapper(a.titre) : ''}</h4>
              ${a.contenu ? `<p class="text-sm text-secondary" style="line-height:1.8;margin-block-start:var(--space-2);margin-block-end:0">${echapper(a.contenu)}</p>` : ''}
            </div>`).join('') : etatVide(t('loi.aucun_article'), ' ')}
          </div>
          <div id="tab-doc" class="tab-content">
            ${documents.length ? documents.map(docRow).join('') : etatVide()}
          </div>
        </div>
      </div>
      <div>
        <div class="card card--flat" style="margin-block-end:var(--space-6)">
          <h3 class="font-semibold text-lg" style="margin-block-end:var(--space-4);border-block-end:2px solid var(--gold-500);padding-block-end:var(--space-2)">Informations</h3>
          <div class="flex flex-col gap-4 text-sm">
            <div><div class="text-muted font-semibold">${t('lois.commission_en_charge')}</div><div class="flex items-center gap-2">${ic('scales')} ${echapper(loi.commission_nom || '—')}</div></div>
            <div><div class="text-muted font-semibold">${t('lois.rapporteur')}</div><div>${echapper(loi.rapporteur_nom || '—')}</div></div>
            <div><div class="text-muted font-semibold">${t('lois.depose_par')}</div><div>${echapper(loi.depose_par || '—')}</div></div>
            <div><div class="text-muted font-semibold">${t('lois.date_depot')}</div><div>${dateLocale(loi.date_depot)}</div></div>
          </div>
        </div>
        <div class="card card--flat">
          <h3 class="font-semibold text-lg" style="margin-block-end:var(--space-6);border-block-end:2px solid var(--gold-500);padding-block-end:var(--space-2)">${t('loi.etapes')}</h3>
          ${etapes.length ? `<div class="timeline">${etapes.map((e, i) => `
            <div class="timeline__item timeline__item--${i === etapes.length - 1 ? 'active' : 'done'}">
              <div class="timeline__dot"></div>
              <div class="timeline__title">${echapper(e.libelle)}</div>
              <div class="timeline__date">${dateLocale(e.date_etape)}</div>
              ${e.description ? `<div class="timeline__content">${echapper(e.description)}</div>` : ''}
            </div>`).join('')}</div>` : etatVide()}
        </div>
      </div>
    </div>
  </main>`;
  activerTabs();
}

function docRow(d) {
  const badge = d.acces === 'public' ? `<span class="badge badge--success">${t('documents.acces_public')}</span>`
    : d.acces === 'interne' ? `<span class="badge badge--gold">${ic('lock-simple')} ${t('documents.acces_interne')}</span>`
      : `<span class="badge badge--danger">${ic('lock-key')} ${t('documents.acces_confidentiel')}</span>`;
  return `<div class="doc-row${d.acces !== 'public' ? ' doc-row--restricted' : ''}" style="margin-block-end:var(--space-3)">
    <div class="doc-row__icon">${ic('file-pdf')}</div>
    <div class="doc-row__info">
      <div class="doc-row__title">${echapper(d.titre)}</div>
      <div class="doc-row__meta">
        <span>${t('doc.' + d.categorie)}</span>
        ${d.loi_ref ? `<span>${echapper(d.loi_ref)}</span>` : ''}
        ${d.taille_ko ? `<span>${ic('file-archive')} ${(d.taille_ko / 1024).toFixed(1)} ${t('commun.mo')}</span>` : ''}
        ${badge}
      </div>
    </div>
    <div class="doc-row__actions"><button class="btn btn--secondary btn--sm" onclick="toast('${echapper(t('commun.demo'))}')">${ic('download-simple')} ${t('documents.telecharger')}</button></div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   VOTES / SCRUTINS
═══════════════════════════════════════════════════════════════ */
async function pageVotes() {
  vue().innerHTML = `<main class="container animate-in" style="padding-block:var(--space-10) var(--space-16)">
    ${pageHeader('scrutins.titre', 'scrutins.sous_titre', [`<span>${t('nav.scrutins') || 'Votes'}</span>`])}
    <div class="info-banner info-banner--info" style="margin-block-end:var(--space-8)">
      <div class="info-banner__icon">${ic('info')}</div>
      <div><strong>${t('scrutins.dev_titre')}</strong><br>${t('scrutins.dev_texte')}</div>
    </div>
    <div id="votes-zone">${skeletonCarte(2)}</div>
  </main>`;

  try {
    const { scrutins } = await api('/api/public/scrutins');
    if (!scrutins.length) {
      $('#votes-zone').innerHTML = etatVide(t('scrutins.archives_titre'), t('scrutins.archives_texte'), 'archive-box');
      return;
    }
    $('#votes-zone').innerHTML = `<div class="grid-2">${scrutins.map(voteCard).join('')}</div>`;
  } catch { $('#votes-zone').innerHTML = etatErreur('pageVotes()'); }
}

function voteCard(s) {
  const total = s.pour + s.contre + s.abstention || 1;
  const pc = (v) => Math.round((v / total) * 100);
  const adopte = s.pour > s.contre;
  const g = `conic-gradient(var(--green-600) 0% ${pc(s.pour)}%, var(--red-600) ${pc(s.pour)}% ${pc(s.pour) + pc(s.contre)}%, var(--neutral-400) ${pc(s.pour) + pc(s.contre)}% 100%)`;
  const row = (lbl, cls, v) => `<div class="vote-bar__row"><div class="vote-bar__label">${lbl}</div>
    <div class="vote-bar__track"><div class="vote-bar__fill vote-bar__fill--${cls}" style="width:${pc(v)}%"></div></div>
    <div class="vote-bar__value">${v} <span class="text-muted">(${pc(v)}%)</span></div></div>`;
  return `<div class="vote-card">
    <div class="vote-card__header">
      <div>
        <div class="text-sm font-semibold text-muted">${ic('calendar-blank')} ${dateLocale(s.date_cloture)}${s.numero_reference ? ' — ' + echapper(s.numero_reference) : ''}</div>
        <h3 class="font-semibold text-lg" style="margin-block-start:var(--space-1)">${echapper(s.loi_titre || s.titre)}</h3>
      </div>
      <span class="badge badge--${adopte ? 'success' : 'danger'}">${adopte ? t('scrutins.adopte') : t('scrutins.rejete')}</span>
    </div>
    <div class="vote-card__results">
      <div class="vote-donut" style="background:${g}">
        <div class="vote-donut__center" style="background:var(--white);width:80px;height:80px;border-radius:50%;display:flex;flex-direction:column;justify-content:center">
          <div class="vote-donut__total">${total}</div><div class="vote-donut__label">${t('scrutins.votants')}</div>
        </div>
      </div>
      <div class="vote-bar">
        ${row(t('scrutins.pour'), 'pour', s.pour)}
        ${row(t('scrutins.contre'), 'contre', s.contre)}
        ${row(t('scrutins.abstention'), 'abstention', s.abstention)}
      </div>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   DÉPUTÉS
═══════════════════════════════════════════════════════════════ */
async function pageDeputes() {
  vue().innerHTML = `<main class="container container--wide animate-in" style="padding-block:var(--space-10) var(--space-16)">
    ${pageHeader('deputes.titre', 'deputes.sous_titre', [`<span>${t('nav.deputes')}</span>`])}
    <div class="filter-bar">
      <div class="search-bar">${ic('magnifying-glass')}<input class="search-bar__input" id="dep-q" type="search" placeholder="${t('deputes.rechercher')}" style="padding-inline-start:var(--space-12)"></div>
      <select class="filter-bar__select" id="dep-groupe"><option value="">${t('deputes.tous_groupes')}</option></select>
      <select class="filter-bar__select" id="dep-province"><option value="">${t('deputes.toutes_provinces')}</option></select>
      <select class="filter-bar__select" id="dep-commission"><option value="">${t('deputes.toutes_commissions')}</option></select>
    </div>
    <p id="dep-compte" class="text-sm text-muted" style="margin-block:var(--space-2) var(--space-4)"></p>
    <div id="dep-zone" class="grid-deputies">${Array.from({ length: 8 }, () => '<div class="skeleton skeleton--card"></div>').join('')}</div>
  </main>`;

  api('/api/public/commissions').then(({ commissions }) => {
    $('#dep-commission').innerHTML += commissions.map((c) => `<option value="${c.id}">${echapper(LANGUE === 'ar' && c.nom_ar ? c.nom_ar : c.nom)}</option>`).join('');
  }).catch(() => {});

  let filtresPrets = false;
  const charger = async () => {
    const q = new URLSearchParams();
    if ($('#dep-q').value.trim()) q.set('q', $('#dep-q').value.trim());
    if ($('#dep-groupe').value) q.set('groupe', $('#dep-groupe').value);
    if ($('#dep-province').value) q.set('province', $('#dep-province').value);
    if ($('#dep-commission').value) q.set('commission', $('#dep-commission').value);
    try {
      const { deputes, provinces, groupes } = await api('/api/public/deputes?' + q);
      if (!filtresPrets) {
        $('#dep-groupe').innerHTML += groupes.map((g) => `<option>${echapper(g)}</option>`).join('');
        $('#dep-province').innerHTML += provinces.map((p) => `<option>${echapper(p)}</option>`).join('');
        filtresPrets = true;
      }
      $('#dep-compte').textContent = `${deputes.length} ${t('deputes.resultat')}`;
      $('#dep-zone').innerHTML = deputes.length ? deputes.map(deputyCard).join('') : `<div style="grid-column:1/-1">${etatVide(undefined, undefined, 'users')}</div>`;
    } catch { $('#dep-zone').innerHTML = `<div style="grid-column:1/-1">${etatErreur('pageDeputes()')}</div>`; }
  };
  let tmr; $('#dep-q').oninput = () => { clearTimeout(tmr); tmr = setTimeout(charger, 280); };
  ['#dep-groupe', '#dep-province', '#dep-commission'].forEach((s) => { $(s).onchange = charger; });
  charger();
}

function deputyCard(d) {
  const init = ((d.prenom[0] || '') + (d.nom[0] || '')).toUpperCase();
  return `<a href="#/deputes/${d.id}" data-lien class="deputy-card" style="text-decoration:none;color:inherit">
    <div class="deputy-card__photo" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-serif);font-size:1.6rem;font-weight:700;color:var(--blue-800);background:var(--blue-100)">${echapper(init)}</div>
    <div class="deputy-card__name">${echapper(d.prenom)} ${echapper(d.nom)}</div>
    <div class="deputy-card__separator"></div>
    <span class="badge badge--group" style="--badge-group-color:var(--blue-800)">${echapper(d.groupe_parlementaire || '—')}</span>
    <div class="deputy-card__constituency">${ic('map-pin')} ${echapper(d.province || '—')}</div>
    <div class="deputy-card__cta">${d.fonction ? echapper(d.fonction) : t('deputes.retour')} ${ic('arrow-right')}</div>
  </a>`;
}

async function pageDeputeDetail(id) {
  vue().innerHTML = `<main class="container" style="padding-block:var(--space-10)">${skeletonCarte(2)}</main>`;
  let d;
  try { d = await api('/api/public/deputes/' + encodeURIComponent(id)); }
  catch (e) { vue().innerHTML = `<main class="container" style="padding-block:var(--space-16)">${e.statut === 404 ? etatVide() : etatErreur(`pageDeputeDetail('${id}')`)}</main>`; return; }
  const { depute: p, commissions, taux_presence } = d;
  const init = ((p.prenom[0] || '') + (p.nom[0] || '')).toUpperCase();

  vue().innerHTML = `<main class="container animate-in" style="padding-block:var(--space-8) var(--space-16)">
    <div class="breadcrumb" style="margin-block-end:var(--space-6)">
      <a href="#/" data-lien>${t('nav.accueil')}</a> <span class="breadcrumb__sep">/</span>
      <a href="#/deputes" data-lien>${t('nav.deputes')}</a> <span class="breadcrumb__sep">/</span>
      <span>${echapper(p.prenom)} ${echapper(p.nom)}</span>
    </div>
    <div class="layout-content--reversed">
      <div class="deputy-card card--no-hover">
        <div class="deputy-card__photo" style="width:110px;height:110px;display:flex;align-items:center;justify-content:center;font-family:var(--font-serif);font-size:2.4rem;font-weight:700;color:var(--blue-800);background:var(--blue-100)">${echapper(init)}</div>
        <div class="deputy-card__name" style="font-size:var(--text-xl)">${echapper(p.prenom)} ${echapper(p.nom)}</div>
        <div class="text-sm text-gold font-semibold">${echapper(p.fonction || '')}</div>
        <div class="deputy-card__separator"></div>
        <div class="text-xs text-muted" style="font-family:var(--font-mono, monospace)">${echapper(p.numero_id || '')}</div>
        <a href="#/citoyen" data-lien class="btn btn--primary btn--sm btn--full" style="margin-block-start:var(--space-4)">${ic('paper-plane-tilt')} ${t('deputes.ecrire')}</a>
      </div>
      <div class="flex flex-col gap-6">
        <div class="grid-2">
          <div class="card card--flat"><div class="text-muted font-semibold text-sm">${t('deputes.circonscription')}</div><div class="font-heading text-2xl text-primary">${echapper(p.province || '—')}</div></div>
          <div class="card card--flat"><div class="text-muted font-semibold text-sm">${t('deputes.groupe')}</div><div class="font-heading text-2xl text-primary">${echapper(p.groupe_parlementaire || '—')}</div></div>
        </div>
        <div class="card card--flat">
          <h3 class="font-semibold text-lg" style="border-block-end:2px solid var(--gold-500);padding-block-end:var(--space-2);margin-block-end:var(--space-4)">${t('deputes.commissions')}</h3>
          ${commissions.length ? commissions.map((c) => `<div class="flex items-center justify-between" style="padding:var(--space-2) 0;border-block-end:1px solid var(--color-border)">
            <span class="font-semibold text-sm">${echapper(c.nom)}</span>
            <span class="badge badge--${c.role_commission === 'rapporteur' ? 'gold' : 'neutral'}">${t('bo.role_' + c.role_commission)}</span></div>`).join('') : etatVide()}
        </div>
        ${taux_presence !== null ? `<div class="card card--flat">
          <div class="petition-bar">
            <div class="petition-bar__header"><span class="petition-bar__count">${t('deputes.taux_presence')}</span><span class="petition-bar__percent">${taux_presence}%</span></div>
            <div class="petition-bar__track"><div class="petition-bar__fill" style="width:${taux_presence}%"></div></div>
          </div></div>` : ''}
      </div>
    </div>
  </main>`;
}

/* ═══════════════════════════════════════════════════════════════
   DOCUMENTS
═══════════════════════════════════════════════════════════════ */
async function pageDocuments() {
  vue().innerHTML = `<main class="container animate-in" style="padding-block:var(--space-10) var(--space-16)">
    ${pageHeader('documents.titre', 'documents.sous_titre', [`<span>${t('nav.documents')}</span>`])}
    ${!Etat.utilisateur ? `<div class="info-banner info-banner--info" style="margin-block-end:var(--space-6)"><div class="info-banner__icon">${ic('info')}</div><div>${t('documents.note_connexion')}</div></div>` : ''}
    <div class="filter-bar">
      <div class="search-bar">${ic('magnifying-glass')}<input class="search-bar__input" id="doc-q" type="search" placeholder="${t('documents.rechercher')}" style="padding-inline-start:var(--space-12)"></div>
      <select class="filter-bar__select" id="doc-cat">
        <option value="">${t('documents.toutes_categories')}</option>
        ${['loi_adoptee', 'rapport', 'proces_verbal', 'reglement', 'ordre_du_jour', 'autre'].map((c) => `<option value="${c}">${t('doc.' + c)}</option>`).join('')}
      </select>
    </div>
    <div id="doc-zone" class="docs-list" style="margin-block-start:var(--space-4)">${skeletonCarte(1)}</div>
  </main>`;

  const charger = async () => {
    const q = new URLSearchParams();
    if ($('#doc-q').value.trim()) q.set('q', $('#doc-q').value.trim());
    if ($('#doc-cat').value) q.set('categorie', $('#doc-cat').value);
    try {
      const { documents } = await api('/api/public/documents?' + q);
      $('#doc-zone').innerHTML = documents.length ? documents.map(docRow).join('') : etatVide(undefined, undefined, 'folder-open');
    } catch { $('#doc-zone').innerHTML = etatErreur('pageDocuments()'); }
  };
  let tmr; $('#doc-q').oninput = () => { clearTimeout(tmr); tmr = setTimeout(charger, 280); };
  $('#doc-cat').onchange = charger;
  charger();
}

/* ═══════════════════════════════════════════════════════════════
   ESPACE CITOYEN
═══════════════════════════════════════════════════════════════ */
async function pageCitoyen() {
  vue().innerHTML = `<main class="container animate-in" style="padding-block:var(--space-10) var(--space-16)">
    ${pageHeader('citoyen.titre', 'citoyen.sous_titre', [`<span>${t('nav.citoyen')}</span>`])}
    <div class="citizen-layout">
      <div class="card card--flat" id="cit-form"></div>
      <div class="card card--flat">
        <h3 class="font-semibold text-lg" style="border-block-end:2px solid var(--gold-500);padding-block-end:var(--space-2);margin-block-end:var(--space-4)">${t('citoyen.petitions')}</h3>
        <div id="cit-petitions" class="flex flex-col gap-4">${skeletonCarte(1)}</div>
      </div>
    </div>
  </main>`;
  formulaireCitoyen();
  chargerPetitions();
}

function formulaireCitoyen() {
  const z = $('#cit-form');
  z.innerHTML = `<h3 class="font-semibold text-lg" style="border-block-end:2px solid var(--gold-500);padding-block-end:var(--space-2);margin-block-end:var(--space-4)">${t('citoyen.form_titre')}</h3>
    <form id="f-msg" class="flex flex-col gap-4">
      <div class="grid-2">
        <div class="form-group"><label class="form-label">${t('citoyen.nom')} <span class="required">*</span></label><input class="form-input" id="m-nom" required></div>
        <div class="form-group"><label class="form-label">${t('citoyen.contact')}</label><input class="form-input" id="m-contact"></div>
      </div>
      <div class="form-group"><label class="form-label">${t('citoyen.province')}</label>
        <select class="form-select" id="m-province"><option value="">${t('citoyen.choisir_province')}</option></select></div>
      <div class="form-group"><label class="form-label">${t('citoyen.destinataire')}</label>
        <div class="tabs" style="margin-block-end:var(--space-3)">
          <button type="button" class="tab tab--active" id="v-dep">${t('citoyen.dest_depute')}</button>
          <button type="button" class="tab" id="v-com">${t('citoyen.dest_commission')}</button>
        </div>
        <select class="form-select" id="m-depute"><option value="">${t('citoyen.choisir_depute')}</option></select>
        <select class="form-select" id="m-commission" hidden><option value="">${t('citoyen.choisir_commission')}</option></select>
      </div>
      <div class="form-group"><label class="form-label">${t('citoyen.sujet')} <span class="required">*</span></label><input class="form-input" id="m-sujet" required></div>
      <div class="form-group"><label class="form-label">${t('citoyen.message')} <span class="required">*</span></label><textarea class="form-textarea" id="m-message" required placeholder="${t('citoyen.message_ph')}"></textarea></div>
      <button class="btn btn--primary btn--full btn--lg" type="submit">${ic('paper-plane-tilt')} ${t('citoyen.envoyer')}</button>
    </form>`;

  api('/api/public/deputes').then(({ deputes, provinces }) => {
    $('#m-depute').innerHTML += deputes.map((d) => `<option value="${d.id}">${echapper(d.prenom + ' ' + d.nom + (d.province ? ' — ' + d.province : ''))}</option>`).join('');
    $('#m-province').innerHTML += provinces.map((p) => `<option>${echapper(p)}</option>`).join('');
  }).catch(() => {});
  api('/api/public/commissions').then(({ commissions }) => {
    $('#m-commission').innerHTML += commissions.map((c) => `<option value="${c.id}">${echapper(LANGUE === 'ar' && c.nom_ar ? c.nom_ar : c.nom)}</option>`).join('');
  }).catch(() => {});

  let versDepute = true;
  const bascule = (dep) => {
    versDepute = dep;
    $('#v-dep').classList.toggle('tab--active', dep); $('#v-com').classList.toggle('tab--active', !dep);
    $('#m-depute').hidden = !dep; $('#m-commission').hidden = dep;
  };
  $('#v-dep').onclick = () => bascule(true); $('#v-com').onclick = () => bascule(false);

  $('#f-msg').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      const r = await api('/api/public/messages', { method: 'POST', body: {
        nom_complet: $('#m-nom').value, contact: $('#m-contact').value, province: $('#m-province').value,
        sujet: $('#m-sujet').value, message: $('#m-message').value,
        depute_id: versDepute ? $('#m-depute').value || null : null,
        commission_id: !versDepute ? $('#m-commission').value || null : null,
      } });
      z.innerHTML = `<div class="success-state">
        <div class="success-state__icon">${ic('check-circle')}</div>
        <h3 class="success-state__title">${t('citoyen.envoye_titre')}</h3>
        <p class="success-state__text">${t('citoyen.envoye_texte')}</p>
        <div class="success-state__ref">${echapper(r.reference)}</div>
        <button class="btn btn--secondary" onclick="formulaireCitoyen()">${t('citoyen.nouveau_message')}</button>
      </div>`;
    } catch (err) { toast(err.message); btn.disabled = false; }
  };
}

async function chargerPetitions() {
  try {
    const { petitions } = await api('/api/public/petitions');
    $('#cit-petitions').innerHTML = petitions.length ? petitions.map(petitionCard).join('') : etatVide();
  } catch { $('#cit-petitions').innerHTML = etatErreur('chargerPetitions()'); }
}

function petitionCard(p) {
  const pct = Math.min(100, Math.round((p.nb_signatures / p.objectif_signatures) * 100));
  const active = p.statut === 'active';
  return `<div class="petition-card">
    <div class="flex items-center justify-between gap-2">
      <div class="petition-card__title">${echapper(p.titre)}</div>
      ${active ? '' : `<span class="badge badge--${p.statut === 'traitee' ? 'success' : 'muted'}">${t(p.statut === 'traitee' ? 'citoyen.petition_traitee' : 'citoyen.petition_cloturee')}</span>`}
    </div>
    ${p.province ? `<div class="petition-card__deadline">${ic('map-pin')} ${echapper(p.province)}${p.commission_nom ? ' · ' + echapper(p.commission_nom) : ''}</div>` : ''}
    <div class="petition-bar">
      <div class="petition-bar__header"><span class="petition-bar__count">${p.nb_signatures.toLocaleString(LANGUE === 'ar' ? 'ar-TD' : 'fr')} ${t('citoyen.signatures')}</span><span class="petition-bar__percent">${pct}%</span></div>
      <div class="petition-bar__track"><div class="petition-bar__fill${pct >= 80 ? ' petition-bar__fill--high' : ''}" style="width:${pct}%"></div></div>
      <div class="petition-bar__percent" style="margin-block-start:var(--space-1)">${t('citoyen.objectif')} : ${p.objectif_signatures.toLocaleString(LANGUE === 'ar' ? 'ar-TD' : 'fr')}</div>
    </div>
    ${active ? `<button class="btn btn--gold btn--full btn--sm" onclick="signerPetition(${p.id}, this)">${ic('pencil-simple-line')} ${t('citoyen.signer')}</button>` : ''}
  </div>`;
}

async function signerPetition(id, btn) {
  const wrap = btn.parentElement;
  if (wrap.querySelector('.sig-form')) return;
  const form = document.createElement('form');
  form.className = 'sig-form flex flex-col gap-2';
  form.style.marginBlockStart = 'var(--space-3)';
  form.innerHTML = `<input class="form-input" name="nom" placeholder="${t('citoyen.nom')}" required>
    <input class="form-input" name="contact" placeholder="${t('citoyen.contact')}" required>
    <button class="btn btn--primary btn--sm btn--full" type="submit">${t('citoyen.signer')}</button>`;
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api(`/api/public/petitions/${id}/signer`, { method: 'POST', body: { nom_complet: form.nom.value, contact: form.contact.value } });
      toast(t('citoyen.signee')); chargerPetitions();
    } catch (err) { toast(err.message); }
  };
  wrap.appendChild(form); form.nom.focus();
}

/* ═══════════════════════════════════════════════════════════════
   CONNEXION + 2FA (split-screen, charte)
═══════════════════════════════════════════════════════════════ */
function pageConnexion() {
  if (Etat.utilisateur) { location.hash = '#/espace'; return; }
  vue().innerHTML = `<div class="login-layout" style="min-height:calc(100vh - var(--header-height))">
    <div class="login-visual hide-mobile" style="flex:1;background:${HERO_BG};position:relative">
      <div class="hero__pattern"></div>
      <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:var(--space-12);color:#fff">
        <div>${logoSvg(true, 48)}<div class="text-xl font-bold font-heading" style="margin-block-start:var(--space-3)">AN Connect Tchad</div></div>
        <div>
          <h2 class="font-heading" style="font-size:2.4rem;line-height:1.2;color:#fff;margin-block-end:var(--space-4)">${t('auth.titre')}</h2>
          <p style="font-size:1.1rem;color:rgba(255,255,255,.85);max-width:420px">${t('auth.sous_titre')}</p>
        </div>
        <div class="text-sm text-gold font-semibold">${ic('shield-check')} ${t('auth.note_securite')}</div>
      </div>
    </div>
    <div style="width:100%;max-width:520px;display:flex;flex-direction:column;justify-content:center;padding:var(--space-8) var(--space-12);background:var(--white);margin-inline:auto">
      <a href="#/" data-lien class="btn btn--ghost btn--sm" style="width:fit-content;margin-block-end:var(--space-8)">${ic('arrow-left')} ${t('auth.public_lien')}</a>
      <div id="auth-etape"></div>
    </div>
  </div>`;
  etapeIdentifiants();
}

function etapeIdentifiants() {
  $('#auth-etape').innerHTML = `
    <h1 class="font-heading text-primary" style="font-size:1.8rem;margin-block-end:var(--space-2)">${t('nav.connexion')}</h1>
    <p class="text-secondary" style="margin-block-end:var(--space-8)">${t('auth.sous_titre')}</p>
    <form id="f-cx" class="flex flex-col gap-5">
      <div class="form-group"><label class="form-label">${t('auth.identifiant')}</label>
        <input class="form-input" id="cx-id" placeholder="${t('auth.identifiant_ph')}" autocomplete="username" dir="ltr" required></div>
      <div class="form-group"><label class="form-label">${t('auth.mdp')}</label>
        <input class="form-input" id="cx-mdp" type="password" autocomplete="current-password" dir="ltr" required>
        <div class="form-error" id="cx-err" hidden>${ic('warning-circle')} <span></span></div></div>
      <button class="btn btn--primary btn--full btn--lg" type="submit">${t('auth.se_connecter')}</button>
    </form>
    <div class="login-card__security" style="margin-block-start:var(--space-6)">${ic('shield-check')} ${t('auth.note_securite')}</div>`;

  $('#f-cx').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button'); btn.disabled = true;
    try {
      const r = await api('/api/auth/connexion', { method: 'POST', body: { identifiant: $('#cx-id').value, mot_de_passe: $('#cx-mdp').value } });
      if (r.etape === '2fa') { etapeOTP(); }
      else { Etat.utilisateur = r.utilisateur; location.hash = '#/espace'; }
    } catch (err) {
      const z = $('#cx-err'); z.hidden = false; z.querySelector('span').textContent = err.statut === 429 ? err.message : t('auth.erreur');
      btn.disabled = false;
    }
  };
}

function etapeOTP() {
  $('#auth-etape').innerHTML = `
    <div class="otp-section">
      <div class="otp-section__icon">${ic('device-mobile')}</div>
      <h1 class="font-heading text-primary" style="font-size:1.6rem">${t('auth.otp_titre')}</h1>
      <p class="otp-section__text">${t('auth.otp_sous_titre')}</p>
      <form id="f-otp">
        <div class="otp-inputs">${Array.from({ length: 6 }, (_, i) => `<input class="otp-input" inputmode="numeric" maxlength="1" aria-label="Chiffre ${i + 1}">`).join('')}</div>
        <div class="form-error" id="otp-err" hidden style="justify-content:center;margin-block-start:var(--space-3)">${ic('warning-circle')} <span></span></div>
        <button class="btn btn--primary btn--full btn--lg" type="submit" style="margin-block-start:var(--space-6)">${t('auth.otp_valider')}</button>
        <div class="otp-section__links"><a href="#" onclick="etapeIdentifiants();return false">${t('auth.otp_retour')}</a></div>
      </form>
    </div>`;

  const cases = [...document.querySelectorAll('.otp-input')];
  cases[0].focus();
  cases.forEach((c, i) => {
    c.oninput = () => { c.value = c.value.replace(/\D/g, '').slice(0, 1); c.classList.toggle('filled', !!c.value); if (c.value && i < 5) cases[i + 1].focus(); };
    c.onkeydown = (e) => { if (e.key === 'Backspace' && !c.value && i > 0) cases[i - 1].focus(); };
    c.onpaste = (e) => {
      const txt = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (txt.length > 1) { e.preventDefault(); txt.split('').forEach((ch, j) => { if (cases[j]) { cases[j].value = ch; cases[j].classList.add('filled'); } }); cases[Math.min(txt.length, 5)].focus(); }
    };
  });
  $('#f-otp').onsubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await api('/api/auth/verifier-otp', { method: 'POST', body: { code: cases.map((c) => c.value).join('') } });
      Etat.utilisateur = r.utilisateur; location.hash = '#/espace';
    } catch (err) {
      const z = $('#otp-err'); z.hidden = false; z.querySelector('span').textContent = err.code === 'DEFI_EXPIRE' ? err.message : t('auth.otp_erreur');
      cases.forEach((c) => { c.value = ''; c.classList.remove('filled'); }); cases[0].focus();
    }
  };
}

/* ═══════════════════════════════════════════════════════════════
   ESPACE DÉPUTÉ (back-office, layout dédié)
═══════════════════════════════════════════════════════════════ */
async function pageEspace() {
  if (!Etat.utilisateur) { location.hash = '#/connexion'; return; }
  const u = Etat.utilisateur;
  const init = ((u.prenom[0] || '') + (u.nom[0] || '')).toUpperCase();
  const navLien = (i, txt, actif = false) => `<a href="#/espace" data-lien class="dashboard-nav__link${actif ? ' dashboard-nav__link--active' : ''}">${ic(i)} ${txt}</a>`;

  vue().innerHTML = `<div class="dashboard-layout">
    <aside class="dashboard-sidebar">
      <div class="dashboard-sidebar__header">${logoSvg(true, 32)}<span class="font-bold font-heading text-lg text-white">AN Connect</span></div>
      <nav class="dashboard-nav">
        ${navLien('squares-four', t('bo.tableau'), true)}
        ${navLien('calendar-check', t('bo.agenda_perso'))}
        ${navLien('folder-lock', t('bo.documents_seance'))}
        ${navLien('users', t('bo.mes_commissions'))}
      </nav>
      <div class="dashboard-sidebar__footer">
        <a href="#" onclick="deconnecter();return false" class="dashboard-nav__link">${ic('sign-out')} ${t('nav.deconnexion')}</a>
      </div>
    </aside>
    <main class="dashboard-main">
      <header class="dashboard-topbar">
        <a href="#/" data-lien class="btn btn--ghost btn--sm hide-desktop">${ic('house')}</a>
        <h1 class="text-xl font-bold font-heading m-0 hide-mobile">${t('bo.titre')}</h1>
        <div class="flex items-center gap-4" style="margin-inline-start:auto">
          <div class="relative cursor-pointer" title="${t('bo.notifications')}">${ic('bell')}</div>
          <div class="flex items-center gap-3" style="padding-inline-start:var(--space-4);border-inline-start:1px solid var(--color-border)">
            <div class="text-right hide-mobile"><div class="text-sm font-bold text-primary">${echapper(u.prenom)} ${echapper(u.nom)}</div><div class="text-xs text-muted">${echapper(u.groupe_parlementaire || u.fonction || '')}</div></div>
            <div style="width:40px;height:40px;border-radius:50%;border:2px solid var(--gold-500);background:var(--blue-100);color:var(--blue-800);display:flex;align-items:center;justify-content:center;font-weight:700">${echapper(init)}</div>
          </div>
        </div>
      </header>
      <div class="dashboard-content animate-in" id="bo-content">${skeletonCarte(3)}</div>
    </main>
  </div>`;

  let a;
  try { a = await api('/api/depute/apercu'); }
  catch { $('#bo-content').innerHTML = etatErreur('pageEspace()'); return; }

  const voteBloc = a.scrutin_ouvert
    ? (a.mon_vote
      ? `<div class="info-banner info-banner--success">${ic('check-circle')}<div><strong>${t('bo.vote_enregistre')}</strong> — ${echapper(a.mon_vote)}</div></div>`
      : `<div class="active-vote">
          <div class="active-vote__header">${ic('lightning')} ${t('bo.vote_requis')}</div>
          <div class="active-vote__title">${echapper(a.scrutin_ouvert.loi_titre || a.scrutin_ouvert.titre)}</div>
          <div class="active-vote__subtitle">${a.scrutin_ouvert.numero_reference ? echapper(a.scrutin_ouvert.numero_reference) : ''}</div>
          <div class="active-vote__buttons">
            <button class="btn btn--vote-pour" data-choix="POUR">${ic('check')} ${t('scrutins.pour')}</button>
            <button class="btn btn--vote-contre" data-choix="CONTRE">${ic('x')} ${t('scrutins.contre')}</button>
            <button class="btn btn--vote-abstention" data-choix="ABSTENTION">${ic('minus')} ${t('scrutins.abstention')}</button>
          </div>
          <button class="btn btn--primary btn--full" id="btn-voter" disabled>${t('bo.voter')}</button>
          <div class="active-vote__security">${ic('lock-key')} ${t('auth.note_securite')}</div>
        </div>`)
    : `<div class="card card--flat">${etatVide(t('bo.aucun_scrutin'), t('bo.aucun_scrutin_desc'), 'check-square')}</div>`;

  $('#bo-content').innerHTML = `
    <div class="flex items-center justify-between flex-wrap gap-4" style="margin-block-end:var(--space-6)">
      <h2 class="text-2xl font-bold font-heading">${t('bo.bonjour')}, ${echapper(u.prenom)}</h2>
    </div>
    ${u.doit_changer_mdp ? `<div class="info-banner info-banner--warning" style="margin-block-end:var(--space-6)">${ic('warning')}<div>${t('bo.mdp_a_changer')}</div></div>` : ''}

    <div class="grid-3" style="margin-block-end:var(--space-8)">
      <div class="stat-card" style="box-shadow:var(--shadow-sm)"><div class="stat-card__icon" style="background:var(--blue-100);color:var(--blue-800)">${ic('user-check')}</div>
        <div class="stat-card__number" style="color:var(--color-text)">${a.presence.taux !== null ? a.presence.taux + '%' : '—'}</div><div class="stat-card__label">${t('bo.presence')}</div></div>
      <div class="stat-card" style="box-shadow:var(--shadow-sm)"><div class="stat-card__icon" style="background:var(--gold-100);color:var(--gold-600)">${ic('users')}</div>
        <div class="stat-card__number" style="color:var(--color-text)">${a.mes_commissions.length}</div><div class="stat-card__label">${t('bo.mes_commissions')}</div></div>
      <div class="stat-card" style="box-shadow:var(--shadow-sm)"><div class="stat-card__icon" style="background:${u.totp_active ? 'var(--green-100);color:var(--green-600)' : 'var(--red-100);color:var(--red-700)'}">${ic('shield-check')}</div>
        <div class="stat-card__number" style="font-size:var(--text-xl);color:var(--color-text)">${u.totp_active ? t('bo.2fa_active') : '2FA'}</div>
        <div class="stat-card__label">${u.totp_active ? '' : `<a href="#" onclick="activer2FA(this);return false" class="text-primary font-semibold">${t('bo.activer_2fa')}</a>`}</div></div>
    </div>

    <div class="dashboard-grid">
      <div class="card card--flat">
        <h3 class="font-semibold text-lg" style="border-block-end:2px solid var(--blue-800);padding-block-end:var(--space-2);margin-block-end:var(--space-4)">${t('bo.agenda_perso')}</h3>
        ${a.prochaines_seances.length ? a.prochaines_seances.slice(0, 5).map((s) => `
          <div class="schedule-block${s.type_evenement === 'commission' ? ' schedule-block--commission' : ''}">
            <div class="schedule-block__time">${heureLocale(s.date_debut)}</div>
            <div class="schedule-block__title">${echapper(s.titre)}</div>
          </div>`).join('') : etatVide()}
      </div>
      <div class="flex flex-col gap-6">
        ${voteBloc}
        <div class="card card--flat">
          <h3 class="font-semibold text-lg" style="border-block-end:2px solid var(--neutral-300);padding-block-end:var(--space-2);margin-block-end:var(--space-4)">${t('bo.doc_internes')}</h3>
          ${a.documents_recents.length ? a.documents_recents.slice(0, 5).map((doc) => `
            <a href="#" onclick="toast('${echapper(t('commun.demo'))}');return false" class="flex items-center gap-3 text-sm hover-bg" style="padding:8px;border-radius:var(--radius-sm);text-decoration:none;color:inherit">
              ${ic(doc.acces === 'public' ? 'file-text' : 'file-lock')}<span style="flex:1;font-weight:500">${echapper(doc.titre)}</span>
              <span class="badge badge--${doc.acces === 'public' ? 'success' : 'gold'}">${t('documents.acces_' + doc.acces)}</span>
            </a>`).join('') : etatVide()}
        </div>
      </div>
    </div>`;

  if (a.scrutin_ouvert && !a.mon_vote) {
    let choix = null;
    document.querySelectorAll('.active-vote__buttons .btn').forEach((b) => {
      b.onclick = () => {
        choix = b.dataset.choix;
        document.querySelectorAll('.active-vote__buttons .btn').forEach((x) => x.style.opacity = x === b ? '1' : '.5');
        $('#btn-voter').disabled = false;
      };
    });
    $('#btn-voter').onclick = async () => {
      try {
        const r = await api('/api/depute/voter', { method: 'POST', body: { session_id: a.scrutin_ouvert.id, choix } });
        toast(r.message + ' · ' + r.hash_verif); pageEspace();
      } catch (err) { toast(err.message); }
    };
  }
}

async function activer2FA(el) {
  try {
    const r = await api('/api/auth/activer-2fa', { method: 'POST' });
    const carte = el.closest('.stat-card');
    carte.style.textAlign = 'start';
    carte.innerHTML = `<div class="text-xs text-secondary">${echapper(r.message)}</div>
      <code style="display:block;background:var(--neutral-50);padding:8px;border-radius:6px;font-size:11px;word-break:break-all;direction:ltr;margin-block:8px">${echapper(r.secret)}</code>
      <form onsubmit="confirmer2FA(event)" class="flex gap-2">
        <input class="form-input" name="code" inputmode="numeric" maxlength="6" placeholder="000000" dir="ltr" style="height:38px">
        <button class="btn btn--primary btn--sm" type="submit">${t('auth.otp_valider')}</button></form>`;
  } catch (err) { toast(err.message); }
}
async function confirmer2FA(e) {
  e.preventDefault();
  try { const r = await api('/api/auth/confirmer-2fa', { method: 'POST', body: { code: e.target.code.value } }); toast(r.message); Etat.utilisateur.totp_active = true; pageEspace(); }
  catch (err) { toast(err.message); }
}
async function deconnecter() {
  try { await api('/api/auth/deconnexion', { method: 'POST' }); } catch {}
  Etat.utilisateur = null; location.hash = '#/';
}

/* ═══════════════════════════════════════════════════════════════
   PAGES LÉGALES
═══════════════════════════════════════════════════════════════ */
const LEGAL = {
  mentions: {
    fr: `<h2>Éditeur</h2><p>AN Connect Tchad est le portail numérique officiel de l'Assemblée Nationale de la République du Tchad, sise au Palais de la Démocratie, N'Djamena.</p>
      <h2>Directeur de la publication</h2><p>Le Secrétariat général de l'Assemblée Nationale.</p>
      <h2>Hébergement</h2><p>La plateforme est hébergée sur une infrastructure sécurisée. Les journaux techniques sont conservés conformément à la réglementation en vigueur.</p>
      <h2>Propriété intellectuelle</h2><p>Les textes officiels sont librement réutilisables avec mention de la source. L'emblème de l'Assemblée ne peut être réutilisé sans autorisation.</p>`,
    ar: `<h2>الناشر</h2><p>AN Connect Tchad هي البوابة الرقمية الرسمية للجمعية الوطنية لجمهورية تشاد، ومقرها قصر الديمقراطية، انجمينا.</p>
      <h2>مدير النشر</h2><p>الأمانة العامة للجمعية الوطنية.</p>
      <h2>الاستضافة</h2><p>تُستضاف المنصة على بنية تحتية آمنة، وتُحفظ السجلات التقنية وفقًا للأنظمة المعمول بها.</p>
      <h2>الملكية الفكرية</h2><p>النصوص الرسمية قابلة لإعادة الاستخدام بحرية مع ذكر المصدر. لا يجوز استخدام شعار الجمعية دون إذن.</p>`,
  },
  confidentialite: {
    fr: `<h2>Données collectées</h2><p>Le portail public est consultable sans compte. Les formulaires citoyens ne collectent que les informations que vous saisissez : nom, contact, province et message.</p>
      <h2>Finalité</h2><p>Ces données servent uniquement au traitement de votre demande et ne sont jamais cédées à des tiers.</p>
      <h2>Comptes parlementaires</h2><p>Les connexions sont journalisées (date, IP) à des fins de sécurité. Les mots de passe sont hachés et la double authentification est proposée.</p>
      <h2>Vos droits</h2><p>Vous pouvez demander la consultation, la rectification ou la suppression de vos données via l'espace citoyen.</p>`,
    ar: `<h2>البيانات المجمعة</h2><p>يمكن تصفح البوابة العمومية دون حساب. لا تجمع الاستمارات المواطنية سوى المعلومات التي تدخلونها: الاسم ووسيلة الاتصال والإقليم والرسالة.</p>
      <h2>الغرض</h2><p>تُستخدم هذه البيانات فقط لمعالجة طلبكم ولا تُحال أبدًا إلى أطراف ثالثة.</p>
      <h2>الحسابات البرلمانية</h2><p>تُسجَّل عمليات الدخول (التاريخ وIP) لأغراض أمنية. تُحفظ كلمات المرور مشفَّرة، والمصادقة الثنائية متاحة.</p>
      <h2>حقوقكم</h2><p>يمكنكم طلب الاطلاع على بياناتكم أو تصحيحها أو حذفها عبر فضاء المواطن.</p>`,
  },
};
function pageLegale(quelle) {
  const titre = t(quelle === 'mentions' ? 'legal.mentions' : 'legal.confidentialite');
  vue().innerHTML = `<main class="container animate-in" style="padding-block:var(--space-10) var(--space-16)">
    <div class="breadcrumb" style="margin-block-end:var(--space-6)"><a href="#/" data-lien>${t('nav.accueil')}</a> <span class="breadcrumb__sep">/</span> <span>${titre}</span></div>
    <h1 class="section-title" style="margin-block-end:var(--space-8)">${titre}</h1>
    <div class="legal-content">${LEGAL[quelle][LANGUE] || LEGAL[quelle].fr}</div>
  </main>`;
}

/* ═══ Accordéon d'onglets (détail loi) ═══ */
function activerTabs() {
  document.querySelectorAll('.tabs-container').forEach((grp) => {
    const tabs = grp.querySelectorAll('.tab');
    const contents = grp.querySelectorAll('.tab-content');
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      tabs.forEach((x) => x.classList.remove('tab--active'));
      contents.forEach((c) => c.classList.remove('tab-content--active'));
      tab.classList.add('tab--active');
      const cible = grp.querySelector('#' + tab.dataset.target);
      if (cible) cible.classList.add('tab-content--active');
    }));
  });
}

/* ═══ DÉMARRAGE ═══ */
document.addEventListener('DOMContentLoaded', async () => {
  appliquerLangue();

  // Bascule FR/AR
  document.querySelectorAll('.lang-toggle__btn').forEach((b) => b.addEventListener('click', () => {
    const veutAr = b.dataset.lang === 'AR';
    if ((LANGUE === 'ar') !== veutAr) basculerLangue();
    router();
  }));

  $('#btn-burger').onclick = () => { $('#mobile-nav').classList.add('open'); document.body.style.overflow = 'hidden'; };
  $('#btn-close-nav').onclick = fermerMobileNav;
  $('#mobile-nav').onclick = (e) => { if (e.target === $('#mobile-nav')) fermerMobileNav(); };

  window.addEventListener('hashchange', router);
  window.addEventListener('online', router);

  try { const { utilisateur } = await api('/api/auth/moi'); Etat.utilisateur = utilisateur; } catch {}
  router();
});
