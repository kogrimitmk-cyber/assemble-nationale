# AN Connect Tchad — Monorepo

Plateforme numérique officielle de l'**Assemblée Nationale de la République du Tchad**
(portail citoyen, transparence législative, espace député), bilingue **FR / AR**.

## Pile technique

| Brique | Techno | Dossier | État |
|--------|--------|---------|------|
| **Backend / API** | Django 6 + Django REST Framework, JWT, 2FA TOTP | [`backend/`](backend) | ✅ opérationnel |
| **Frontend web** | React 18 + Vite + React Router | [`frontend/`](frontend) | ✅ opérationnel |
| **Application mobile** | React Native + Expo (SDK 57) | [`mobile/`](mobile) | ✅ opérationnel |
| **Base de données** | PostgreSQL (prod) · SQLite (dev) | — | ✅ |
| **Ancien prototype** | Node/Express + SQLite + SPA vanilla | [`legacy/`](legacy) | 🗄️ archivé (référence) |

Le dossier `legacy/` conserve le prototype précédent (schéma, endpoints, design
system d'exemple) comme référence — le nouveau front React réutilisera la charte
visuelle qui s'y trouve (`legacy/public/assets/css/`).

## Démarrer le backend

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate      # (Windows)
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver          # http://127.0.0.1:8000
```

Voir [backend/README.md](backend/README.md) pour le détail (endpoints, 2FA, comptes de démo, PostgreSQL).

## Démarrer le frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 (proxy /api → Django sur :8010)
```

Voir [frontend/README.md](frontend/README.md). Lancez le backend en parallèle.

## Démarrer l'application mobile

```bash
cd mobile
npm install
npx expo start          # « a » Android, « i » iOS, ou QR + Expo Go
```

Voir [mobile/README.md](mobile/README.md). Le backend doit tourner (port 8010) ;
sur téléphone physique, renseignez l'IP LAN via `EXPO_PUBLIC_API_URL`.

## État : les 3 briques de la pile sont opérationnelles

Backend Django/DRF (API + JWT + 2FA), frontend React (Vite) et application
mobile Expo consomment le même contrat d'API. Reste, pour la mise en production :
brancher PostgreSQL (`DATABASE_URL`), remplacer les données de démonstration par
les données officielles, et déployer.
