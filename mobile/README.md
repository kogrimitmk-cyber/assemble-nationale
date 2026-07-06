# AN Connect Tchad — Application mobile (React Native / Expo)

App citoyenne + espace député. Expo SDK 57 · React Native 0.86 · React Navigation.
Réutilise la charte AN Connect (Cormorant Garamond / DM Sans, bleu #002B7F / or #D4A843)
et consomme la même API Django que le web.

## Démarrage

```bash
cd mobile
npm install
npx expo start          # puis « a » (Android), « i » (iOS), ou scan du QR avec Expo Go
```

Le **backend Django doit tourner** (voir `../backend`, sur le port 8010).

### Adresse de l'API selon la cible

L'app détecte l'hôte automatiquement :
- **Émulateur Android** → `http://10.0.2.2:8010` (alias du PC hôte)
- **Simulateur iOS** → `http://localhost:8010`
- **Téléphone physique (Expo Go)** → mettez l'**IP LAN** de votre PC dans un fichier `.env` :
  ```
  EXPO_PUBLIC_API_URL=http://192.168.1.20:8010
  ```
  (et démarrez Django avec `python manage.py runserver 0.0.0.0:8010` pour l'exposer au réseau local).

## Écrans

- **Onglets citoyens** : Accueil (résumé du jour + accès rapides + actualités), Agenda,
  Lois (+ détail : progression 5 étapes, timeline, articles), Députés, Espace citoyen
  (messagerie + pétitions signables).
- **Connexion + 2FA** (clavier numérique OTP) et **Espace député** (présence, commissions,
  vote électronique, documents) — layout dédié.
- **Bilingue FR / AR** (bouton dans l'en-tête) · **états système** (chargement, vide, erreur réseau).

## Structure

```
mobile/
├── App.js                 polices + navigation (tabs + stack)
├── src/
│   ├── theme.js           jetons de la charte
│   ├── i18n.js            dictionnaires FR/AR + contexte
│   ├── api.js             client fetch + jetons JWT (SecureStore) + refresh auto
│   ├── auth.js            contexte d'authentification
│   ├── useFetch.js        hook de chargement
│   ├── format.js          dates / initiales
│   ├── ui.js              composants (Carte, Badge, Bouton, Champ, ProgressLoi, Etat…)
│   └── screens/           Accueil, Agenda, Lois, LoiDetail, Deputes, Citoyen, Connexion, Espace
```

## Comptes de démonstration

Matricule `DEP-014` (ou `PRES-001`…) · mot de passe `ChangezMoi2025!`.
