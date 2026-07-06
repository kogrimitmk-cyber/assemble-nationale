// ═══════════════════════════════════════════════════════════════
// ROUTES TABLEAU DE BORD
// Réservé au Secrétaire général (et Président pour consultation) :
// suivi en temps réel des connexions des Députés.
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const db = require('../db/connection');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// ───────────────────────────────────────────────────────────────
// GET /api/dashboard/connectes
// Liste des utilisateurs actuellement connectés (sans déconnexion
// enregistrée), avec date/heure de connexion.
// Accès : Secrétaire général, Président, Vice-présidents.
// ───────────────────────────────────────────────────────────────
router.get('/connectes', requireRole('secretaire_general', 'president', 'vice_president'), (req, res) => {
  const connectes = db.prepare(`
    SELECT
      c.id              AS log_id,
      u.id              AS utilisateur_id,
      u.numero_id,
      u.nom,
      u.prenom,
      u.role,
      u.province,
      u.groupe_parlementaire,
      c.date_connexion,
      c.adresse_ip
    FROM connexions_log c
    JOIN utilisateurs u ON u.id = c.utilisateur_id
    WHERE c.date_deconnexion IS NULL
    ORDER BY c.date_connexion DESC
  `).all();

  res.json({ total: connectes.length, connectes });
});

// ───────────────────────────────────────────────────────────────
// GET /api/dashboard/historique-connexions?limite=50
// Historique complet des connexions (les plus récentes en premier).
// Accès : Secrétaire général uniquement.
// ───────────────────────────────────────────────────────────────
router.get('/historique-connexions', requireRole('secretaire_general'), (req, res) => {
  const limite = Math.min(parseInt(req.query.limite, 10) || 50, 200);

  const historique = db.prepare(`
    SELECT
      c.id              AS log_id,
      u.numero_id,
      u.nom,
      u.prenom,
      u.role,
      c.date_connexion,
      c.date_deconnexion,
      c.adresse_ip
    FROM connexions_log c
    JOIN utilisateurs u ON u.id = c.utilisateur_id
    ORDER BY c.date_connexion DESC
    LIMIT ?
  `).all(limite);

  res.json({ historique });
});

// ───────────────────────────────────────────────────────────────
// GET /api/dashboard/statistiques
// Vue d'ensemble : nombre total de comptes par rôle, nombre de
// connectés actuellement, opérations financières récentes.
// Accès : Secrétaire général, Président.
// ───────────────────────────────────────────────────────────────
router.get('/statistiques', requireRole('secretaire_general', 'president'), (req, res) => {
  const parRole = db.prepare(`
    SELECT role, COUNT(*) AS total
    FROM utilisateurs
    WHERE actif = 1
    GROUP BY role
  `).all();

  const nbConnectes = db.prepare(`
    SELECT COUNT(*) AS total FROM connexions_log WHERE date_deconnexion IS NULL
  `).get();

  const dernieresOperations = db.prepare(`
    SELECT id, type_operation, montant, devise, motif, statut, date_operation
    FROM operations_financieres
    ORDER BY date_operation DESC
    LIMIT 10
  `).all();

  const soldeApprouve = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type_operation = 'recette' THEN montant ELSE 0 END), 0) AS total_recettes,
      COALESCE(SUM(CASE WHEN type_operation = 'depense' THEN montant ELSE 0 END), 0) AS total_depenses
    FROM operations_financieres
    WHERE statut = 'approuvee'
  `).get();

  res.json({
    utilisateurs_par_role: parRole,
    nb_connectes_actuellement: nbConnectes.total,
    dernieres_operations_financieres: dernieresOperations,
    solde: {
      total_recettes: soldeApprouve.total_recettes,
      total_depenses: soldeApprouve.total_depenses,
      solde_net: soldeApprouve.total_recettes - soldeApprouve.total_depenses,
    },
  });
});

module.exports = router;
