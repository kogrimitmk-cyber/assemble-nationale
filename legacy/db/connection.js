// ═══════════════════════════════════════════════════════════════
// CONNEXION À LA BASE DE DONNÉES
// Point d'accès unique au fichier assemblee.db, utilisé par
// toutes les routes du serveur.
// ═══════════════════════════════════════════════════════════════

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'assemblee.db');

const db = new Database(DB_PATH);

// WAL = meilleure gestion des accès simultanés (plusieurs utilisateurs
// connectés en même temps, ce qui sera le cas avec les députés).
db.pragma('journal_mode = WAL');

// Vérifie l'intégrité référentielle (ex: un vote doit référencer
// un utilisateur et une session existants).
db.pragma('foreign_keys = ON');

module.exports = db;
