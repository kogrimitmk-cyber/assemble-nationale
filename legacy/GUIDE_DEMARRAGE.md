# 🏛️ AN Connect Tchad — Guide de démarrage

Plateforme numérique officielle de l'**Assemblée Nationale de la
République du Tchad** : portail citoyen public + espace député sécurisé,
bilingue **FR / AR** avec bascule RTL complète.

---

## 🚀 Démarrer en local

```bash
npm install
node db/init.js      # une seule fois : crée la base + données de démonstration
npm start            # lance le serveur sur http://localhost:3000
```

Puis ouvrez **http://localhost:3000**.

> ⚠️ Les comptes et contenus créés par `db/init.js` sont des **données de
> démonstration** (noms fictifs). Remplacez-les par les données officielles
> de l'Assemblée avant toute mise en ligne réelle.

---

## 🗂️ Structure du projet

```
an-connect-tchad/
├── server.js              Serveur Express (sécurité, sessions, routage API)
├── package.json
├── .env.example           Modèle de configuration (copier en .env)
├── db/
│   ├── schema.sql         Schéma complet de la base
│   ├── init.js            Création base + jeu de démonstration
│   ├── connection.js      Connexion SQLite partagée
│   └── assemblee.db        (généré, ne pas versionner)
├── lib/
│   └── totp.js            2FA TOTP (RFC 6238), sans dépendance externe
├── middleware/
│   └── auth.js            Contrôle d'accès par rôle
├── routes/
│   ├── auth.js            Connexion, 2FA, déconnexion, changement mdp
│   ├── public.js          API publique (stats, agenda, lois, députés, pétitions…)
│   ├── depute.js          Espace député (aperçu, vote, présence)
│   └── dashboard.js       Suivi des connexions (Secrétariat général)
└── public/
    ├── index.html         Portail (SPA) — shell + charte
    ├── mobile.html        Livrable de design des écrans mobile (React Native/Expo)
    └── assets/
        ├── css/           Design system (charte AN Connect)
        │   ├── design-system.css  tokens, typo, reset
        │   ├── components.css      boutons, cartes, badges, progress-law…
        │   ├── layout.css         header, footer, hero, grilles, sidebar
        │   ├── pages.css          agenda, votes, connexion, dashboard…
        │   ├── logo.css           logo hémicycle
        │   └── an-extra.css       compléments (utilitaires, back-office, a11y, toast)
        ├── i18n.js        Dictionnaires FR / AR + bascule RTL
        └── app.js         Application (routeur, rendu charte, appels API)
```

---

## ✅ Ce qui fonctionne

**Portail public (mobile-first)**
- Accueil avec chiffres clés **calculés** depuis la base (jamais en dur)
- Agenda des séances (vue liste + calendrier, filtres type/statut)
- Projets et propositions de loi + détail (fil des étapes, articles, documents)
- Historique des votes — avec **état vide honnête** (« module en développement »)
- Trombinoscope des députés (filtres groupe/province/commission, fiche détail)
- Bibliothèque de documents (accès public / interne / confidentiel selon le rôle)
- Espace citoyen : message à un député/commission, pétitions + signature
- Pages légales FR/AR

**Espace sécurisé (desktop-first, plus dense)**
- Connexion matricule/email + mot de passe, puis **2FA TOTP** (Google Authenticator, FreeOTP…)
- Espace député : agenda personnel, commissions, présence, documents, vote électronique
- Activation de la double authentification depuis le tableau de bord

**Transversal**
- **Bilingue FR/AR** avec miroir RTL complet (propriétés logiques CSS)
- **Accessibilité** : contrastes AA, zones tactiles ≥ 44 px, focus visibles, `prefers-reduced-motion`
- **États systématiques** : chargement (squelettes), vide (message clair), erreur réseau (reprise)
- Sécurité : mots de passe hachés (bcrypt), sessions SQLite, helmet, anti-force-brute

### Comptes de démonstration

| Identifiant | Rôle | 
|-------------|------|
| `PRES-001`  | Président |
| `VP1-001` / `VP2-001` | Vice-présidents |
| `SG-001`    | Secrétaire général |
| `QUEST-001` | Questeur |
| `DEP-010` … `DEP-027` | Députés |

**Mot de passe initial (tous les comptes)** : `ChangezMoi2025!`
(modifiable via `ADMIN_INIT_PASSWORD` avant le premier `node db/init.js`).

---

## 🔐 Variables d'environnement (`.env`)

| Clé | Rôle |
|-----|------|
| `PORT` | Port d'écoute (défaut 3000) |
| `NODE_ENV` | `production` en ligne (active cookies sécurisés + `trust proxy`) |
| `SESSION_SECRET` | **Obligatoire en production** — longue chaîne aléatoire |
| `ADMIN_INIT_PASSWORD` | Mot de passe initial des comptes de démonstration |

---

## 📱 Livrable de design mobile

`public/mobile.html` présente les **8 écrans de l'application mobile**
(React Native / Expo) : accueil citoyen, agenda, suivi de loi, trombinoscope,
messagerie + pétitions, connexion 2FA, espace député, et les **états système**
(hors-ligne, chargement, erreur, vide) + un cadre en **arabe RTL**. Il partage
le même design system que le site (`styles.css`).

Ouvrez **http://localhost:3000/mobile.html**.

---

## 🌍 Déploiement (Render.com, plan gratuit)

- **Build** : `npm install && node db/init.js`
- **Start** : `npm start`
- Variables : `NODE_ENV=production`, `SESSION_SECRET=…`, `ADMIN_INIT_PASSWORD=…`

> ⚠️ Sur le plan gratuit, le disque est éphémère : la base SQLite peut être
> réinitialisée à chaque redéploiement. Pour des données durables, ajoutez un
> disque persistant Render ou migrez vers PostgreSQL (le schéma reste transposable).
