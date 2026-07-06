# AN Connect Tchad — Frontend web (React + Vite)

Portail web de l'Assemblée Nationale du Tchad. React 18 · Vite 6 · React Router.
Réutilise la charte AN Connect (Cormorant Garamond / DM Sans / Phosphor,
bleu #002B7F / or #D4A843) et consomme l'API Django (`../backend`).

## Démarrage

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

> Le backend Django doit tourner en parallèle. Le proxy Vite envoie `/api`
> et `/media` vers `VITE_API_TARGET` (par défaut `http://127.0.0.1:8010` —
> le port 8000 étant souvent occupé sur cette machine). Adaptez dans `.env` :
>
> ```
> VITE_API_TARGET=http://127.0.0.1:8010
> ```

Build de production : `npm run build` (génère `dist/`, à servir derrière
n'importe quel serveur statique ; définissez alors le vrai domaine d'API).

## Fonctionnalités

- **Portail public** : accueil (chiffres calculés), agenda (liste + calendrier),
  textes de loi + détail (progression 5 étapes, timeline, articles/documents),
  historique des votes (état vide honnête), trombinoscope + fiche, bibliothèque
  de documents, espace citoyen (messages + pétitions), pages légales.
- **Espace sécurisé** : connexion **JWT** + **2FA TOTP**, tableau de bord député
  (agenda, commissions, présence, vote électronique) — layout dédié.
- **Bilingue FR / AR** avec bascule **RTL** complète (contexte i18n).
- États systématiques : chargement (squelettes), vide, erreur réseau.

## Structure

```
frontend/
├── index.html
├── vite.config.js          proxy /api → Django
├── src/
│   ├── main.jsx            point d'entrée (providers)
│   ├── App.jsx             routes (React Router)
│   ├── api.js              client fetch + jetons JWT (refresh auto)
│   ├── auth.jsx            contexte d'authentification
│   ├── i18n.jsx            dictionnaires FR/AR + contexte + RTL
│   ├── useFetch.js         hook de chargement (data/erreur/reload)
│   ├── styles/             charte AN Connect (6 CSS) + root
│   ├── components/         Header, Footer, MobileNav, Layout, Logo, ui, Toaster
│   └── pages/              Accueil, Agenda, Lois, LoiDetail, Votes, Deputes,
│                           DeputeDetail, Documents, Citoyen, Connexion,
│                           EspaceDepute, Legale
```

## Comptes de démonstration

Matricule `DEP-014` (ou `PRES-001`, `SG-001`…) · mot de passe `ChangezMoi2025!`.
