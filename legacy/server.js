// ═══════════════════════════════════════════════════════════════
// SERVEUR PRINCIPAL
// Plateforme Numérique — Assemblée Nationale du Tchad
// ═══════════════════════════════════════════════════════════════
//
// Pour démarrer :
//   1) npm install
//   2) node db/init.js        (une seule fois, crée la base + comptes)
//   3) npm start               (lance le serveur)
//
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const db = require('./db/connection');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const publicRoutes = require('./routes/public');
const deputeRoutes = require('./routes/depute');

const app = express();
const PORT = process.env.PORT || 3000;
const EN_PRODUCTION = process.env.NODE_ENV === 'production';

// Derrière un proxy (Render, Nginx…) : nécessaire pour que
// express-rate-limit voie la vraie IP et que les cookies `secure`
// fonctionnent en HTTPS.
if (EN_PRODUCTION) app.set('trust proxy', 1);

// ── Vérification : la base de données existe-t-elle ? ──────────
const dbPath = path.join(__dirname, 'db', 'assemblee.db');
if (!fs.existsSync(dbPath)) {
  console.warn('⚠️  Base de données introuvable.');
  console.warn('   Lancez d\'abord : node db/init.js');
}

// ═══════════════════════════════════════════════════════════════
// SÉCURITÉ — En-têtes HTTP protecteurs (helmet)
// ═══════════════════════════════════════════════════════════════
app.use(helmet({
  // contentSecurityPolicy désactivé ici pour ne pas casser le
  // front-end existant (styles/scripts en ligne). À affiner plus
  // tard si vous séparez le CSS/JS en fichiers externes.
  contentSecurityPolicy: false,
}));

// ═══════════════════════════════════════════════════════════════
// SÉCURITÉ — Limitation du débit (anti force-brute sur /connexion)
// ═══════════════════════════════════════════════════════════════
const limiteurConnexion = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // 10 tentatives max par IP / fenêtre
  message: {
    erreur: 'TROP_DE_TENTATIVES',
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const limiteurGeneral = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 120,                 // 120 requêtes / minute / IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiteurGeneral);

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARES STANDARDS
// ═══════════════════════════════════════════════════════════════
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ═══════════════════════════════════════════════════════════════
// SESSIONS — stockées dans SQLite (persistantes même si le serveur
// redémarre, contrairement aux sessions en mémoire par défaut)
// ═══════════════════════════════════════════════════════════════
app.use(session({
  store: new SqliteStore({
    client: db,
    expired: { clear: true, intervalMs: 15 * 60 * 1000 },
  }),
  secret: process.env.SESSION_SECRET || 'changez-cette-cle-en-production',
  name: 'assemblee.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,           // inaccessible via JavaScript côté navigateur (anti-XSS)
    secure: EN_PRODUCTION,    // HTTPS uniquement en production
    sameSite: 'lax',          // protection CSRF de base
    maxAge: 12 * 60 * 60 * 1000, // 12 heures
  },
}));

// Avertissement clair si la clé de session par défaut est utilisée
if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  SESSION_SECRET non défini — utilisation d\'une clé par défaut NON sécurisée.');
  console.warn('   Définissez SESSION_SECRET dans vos variables d\'environnement avant la mise en ligne.');
}

// ═══════════════════════════════════════════════════════════════
// ROUTES API
// ═══════════════════════════════════════════════════════════════
app.use('/api/auth/connexion', limiteurConnexion); // limite stricte sur cette route précise
app.use('/api/auth/verifier-otp', limiteurConnexion); // même protection sur l'étape 2FA
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/depute', deputeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Route de santé (utile pour vérifier que l'hébergeur fonctionne)
app.get('/api/sante', (req, res) => {
  res.json({ statut: 'ok', heure_serveur: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════════
// FICHIERS STATIQUES (front-end)
// Place ton fichier HTML (index.html) dans le dossier /public
// ═══════════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, 'public')));

// Toute autre route → renvoie l'application (front-end gère la navigation)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ═══════════════════════════════════════════════════════════════
// GESTION DES ERREURS
// ═══════════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err);
  res.status(500).json({
    erreur: 'ERREUR_SERVEUR',
    message: EN_PRODUCTION ? 'Une erreur est survenue.' : err.message,
  });
});

// ═══════════════════════════════════════════════════════════════
// DÉMARRAGE
// ═══════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Assemblée Nationale du Tchad — Serveur démarré`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  Environnement : ${process.env.NODE_ENV || 'development'}`);
  console.log('═══════════════════════════════════════════════════');
});
