# Déploiement — AN Connect Tchad

Architecture cible :
- **Backend Django + PostgreSQL** → **Render** (`render.yaml`)
- **Frontend React (Vite)** → **Vercel** (`frontend/vercel.json`)
- **Mobile Expo** → **EAS Build** (`mobile/eas.json`)

Les données de démonstration (`seed_demo`) sont conservées pour l'instant.

---

## 0. Prérequis — pousser le code sur GitHub
Render et Vercel déploient depuis un dépôt Git.

```bash
cd D:\assemble-national
git init
git add .
git commit -m "AN Connect Tchad — prêt pour déploiement"
git branch -M main
git remote add origin https://github.com/<votre-compte>/assemble-national.git
git push -u origin main
```
Le `.gitignore` exclut déjà `venv/`, `node_modules/`, `.env`, `db.sqlite3`, `staticfiles/`, `media/`.

---

## 1. Backend + base de données sur Render

1. Render → **New** → **Blueprint** → sélectionner le dépôt. Render lit `render.yaml`
   et crée **anconnect-db** (PostgreSQL) + **anconnect-api** (web).
2. `SECRET_KEY`, `ADMIN_INIT_PASSWORD` et `DATABASE_URL` sont générés/reliés
   automatiquement. `DEBUG=false` est déjà fixé.
3. Laisser le déploiement se terminer. Le build lance :
   `collectstatic` → `migrate` → `seed_demo` → `setup_roles`.
4. Noter l'URL publique, par ex. `https://anconnect-api.onrender.com`.
   Vérifier `https://anconnect-api.onrender.com/api/sante/` → `{"statut":"ok"}`.

> **Comptes créés par le seed** : identifiants type `SEC-001` (secrétaire, accès
> `/admin`) ; le mot de passe est la valeur de `ADMIN_INIT_PASSWORD` (visible dans
> l'onglet *Environment* du service Render). Changez-le après la première connexion.

---

## 2. Frontend sur Vercel

1. Dans `frontend/vercel.json`, remplacer les deux occurrences de
   `REMPLACER-PAR-URL-RENDER.onrender.com` par le domaine Render de l'étape 1.
2. Vercel → **New Project** → importer le dépôt → **Root Directory = `frontend`**
   (framework Vite détecté automatiquement).
3. Déployer. Noter l'URL, par ex. `https://an-connect.vercel.app`.

Les appels `/api/*` et `/media/*` du site sont automatiquement relayés vers Render
par les *rewrites* (même origine → pas de souci CORS côté navigateur).

---

## 3. Relier les deux (CORS + CSRF côté Render)

Dans Render → service **anconnect-api** → **Environment**, renseigner avec l'URL Vercel :
```
CORS_ORIGINS         = https://an-connect.vercel.app
CSRF_TRUSTED_ORIGINS = https://an-connect.vercel.app
```
Puis **Manual Deploy** (ou attendre le redéploiement). Nécessaire pour l'app mobile
(qui appelle l'API en cross-origin) et la connexion à l'admin Django.

---

## 4. Mobile (Expo / EAS)

1. Dans `mobile/eas.json`, remplacer `REMPLACER-PAR-URL-RENDER.onrender.com`
   par le domaine Render.
2. Builds :
   ```bash
   cd mobile
   npm install -g eas-cli
   eas login
   eas build --profile preview   --platform android   # APK de test
   eas build --profile production --platform all        # stores
   ```

---

## Points d'attention (plan gratuit Render)
- **Mise en veille** : le service gratuit s'endort après inactivité → première
  requête lente (~30 s). Un plan payant supprime ce comportement.
- **PostgreSQL gratuit** : expire après 90 jours ; passer à un plan payant pour la prod.
- **Fichiers `/media` (uploads du secrétaire)** : le disque Render gratuit est
  éphémère → les fichiers téléversés disparaissent à chaque redéploiement. Pour les
  conserver : ajouter un **disque persistant** (plan payant, monté sur `MEDIA_ROOT`
  via la variable `MEDIA_ROOT`) ou un **stockage objet** (S3 / Cloudinary). Sans
  impact tant qu'on reste sur les données de démo (pas de fichiers téléversés).

## Quand passer aux vraies données
Retirer la ligne `python manage.py seed_demo` de `backend/build.sh`, puis saisir le
contenu réel via l'admin (`/admin`, compte secrétaire) ou le back-office React.
