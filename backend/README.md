# AN Connect Tchad — Backend (Django + DRF)

API REST de la plateforme numérique de l'Assemblée Nationale du Tchad.
Django 6 · Django REST Framework · JWT (SimpleJWT) · 2FA TOTP · PostgreSQL (prod) / SQLite (dev).

## Démarrage rapide

```bash
cd backend
python -m venv .venv
# Windows :  .venv\Scripts\activate      |  macOS/Linux :  source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env          # puis adaptez si besoin

python manage.py migrate
python manage.py seed_demo    # données de DÉMONSTRATION (noms fictifs)
python manage.py runserver    # http://127.0.0.1:8000
```

> ⚠️ Si le port 8000 est déjà occupé sur votre machine, lancez par ex.
> `python manage.py runserver 8010` (et ajoutez l'origine correspondante à `CORS_ORIGINS`).

Créer un compte administrateur (accès à `/admin/`) :
```bash
python manage.py createsuperuser
```

## Base de données

- **Développement** : SQLite par défaut (`db.sqlite3`), aucun serveur à installer.
- **Production** : PostgreSQL via la variable d'environnement
  `DATABASE_URL=postgres://user:motdepasse@hote:5432/anconnect`
  (décommentez `psycopg[binary]` dans `requirements.txt`).
  Aucune réécriture de code : Django bascule via `DATABASE_URL`.

## Authentification

| Étape | Endpoint | Corps | Réponse |
|-------|----------|-------|---------|
| 1 | `POST /api/auth/connexion` | `{ identifiant, mot_de_passe }` | `{ etape: '2fa', defi }` **ou** `{ etape: 'connecte', access, refresh, utilisateur }` |
| 2 | `POST /api/auth/verifier-otp` | `{ defi, code }` | `{ access, refresh, utilisateur }` |
| — | `POST /api/auth/token/refresh` | `{ refresh }` | `{ access }` |
| — | `GET /api/auth/moi` | *(Bearer)* | `{ utilisateur }` |
| — | `POST /api/auth/activer-2fa` · `confirmer-2fa` · `changer-mdp` · `deconnexion` | *(Bearer)* | — |

L'`identifiant` est le **matricule** (ex. `DEP-014`) ou l'email.
Les jetons JWT se transmettent en en-tête `Authorization: Bearer <access>`.

## Principales routes API

- **Public** (sans compte) : `/api/public/stats`, `/agenda`, `/lois`, `/lois/<ref>`,
  `/scrutins`, `/deputes`, `/deputes/<id>`, `/commissions`, `/documents`,
  `/petitions`, `/petitions/<id>/signer`, `/messages`, `/annonces`.
- **Espace député** (JWT + rôle parlementaire) : `/api/depute/apercu`, `/voter`, `/ma-presence`.

## Comptes de démonstration

Matricules : `PRES-001`, `VP1-001`, `VP2-001`, `SG-001`, `QUEST-001`, `DEP-010`…`DEP-027`.
Mot de passe initial commun : **`ChangezMoi2025!`** (variable `ADMIN_INIT_PASSWORD`).

## Structure

```
backend/
├── anconnect/        Projet (settings, urls, wsgi/asgi)
├── comptes/          Utilisateur personnalisé (matricule) + auth JWT + 2FA + journal
├── parlement/        Domaine : commissions, séances, lois, scrutins, documents,
│                     pétitions, messages, annonces + commande seed_demo
├── manage.py
└── requirements.txt
```
