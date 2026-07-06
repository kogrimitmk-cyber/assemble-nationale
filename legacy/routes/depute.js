// ═══════════════════════════════════════════════════════════════
// ESPACE DÉPUTÉ (back-office léger)
// Accessible aux rôles parlementaires : agenda personnel,
// documents de séance, commissions, présence, vote électronique.
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const crypto = require('crypto');
const db = require('../db/connection');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const rolesParlementaires = requireRole(
  'depute', 'president', 'vice_president', 'secretaire_general', 'questeur'
);
router.use(rolesParlementaires);

// ───────────────────────────────────────────────────────────────
// GET /api/depute/apercu — tout le tableau de bord en un appel
// ───────────────────────────────────────────────────────────────
router.get('/apercu', (req, res) => {
  const userId = req.session.utilisateur.id;

  const prochainesSeances = db.prepare(`
    SELECT s.*, c.nom AS commission_nom
    FROM seances s LEFT JOIN commissions c ON c.id = s.commission_id
    WHERE s.statut IN ('prevue','en_cours') AND s.date_debut >= date('now', '-1 day')
    ORDER BY s.date_debut ASC LIMIT 8
  `).all();

  const mesCommissions = db.prepare(`
    SELECT c.id, c.nom, cm.role_commission
    FROM commission_membres cm JOIN commissions c ON c.id = cm.commission_id
    WHERE cm.utilisateur_id = ?
  `).all(userId);

  const documentsRecents = db.prepare(`
    SELECT id, titre, categorie, fichier_url, taille_ko, acces, date_upload
    FROM documents WHERE acces IN ('public','interne')
    ORDER BY date_upload DESC LIMIT 8
  `).all();

  const presence = db.prepare(`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) AS presents,
           SUM(CASE WHEN statut = 'excuse' THEN 1 ELSE 0 END) AS excuses
    FROM presences WHERE depute_id = ?
  `).get(userId);

  const scrutinOuvert = db.prepare(`
    SELECT vs.id, vs.titre, vs.date_ouverture, l.numero_reference, l.titre AS loi_titre
    FROM votes_sessions vs LEFT JOIN lois l ON l.id = vs.loi_id
    WHERE vs.ouvert = 1 ORDER BY vs.date_ouverture DESC LIMIT 1
  `).get();

  let monVote = null;
  if (scrutinOuvert) {
    const b = db.prepare('SELECT choix FROM votes_bulletins WHERE session_id = ? AND depute_id = ?')
      .get(scrutinOuvert.id, userId);
    monVote = b ? b.choix : null;
  }

  const notifications = db.prepare(`
    SELECT id, titre, message, lue, date_envoi
    FROM notifications WHERE destinataire_id = ?
    ORDER BY date_envoi DESC LIMIT 10
  `).all(userId);

  res.json({
    prochaines_seances: prochainesSeances,
    mes_commissions: mesCommissions,
    documents_recents: documentsRecents,
    presence: {
      total: presence.total,
      presents: presence.presents || 0,
      excuses: presence.excuses || 0,
      taux: presence.total ? Math.round(((presence.presents || 0) / presence.total) * 100) : null,
    },
    scrutin_ouvert: scrutinOuvert || null,
    mon_vote: monVote,
    notifications,
  });
});

// ───────────────────────────────────────────────────────────────
// POST /api/depute/voter — { session_id, choix }
// Un seul vote par scrutin (contrainte UNIQUE en base).
// ───────────────────────────────────────────────────────────────
router.post('/voter', (req, res) => {
  const userId = req.session.utilisateur.id;
  const { session_id, choix } = req.body;

  if (!['POUR', 'CONTRE', 'ABSTENTION'].includes(choix)) {
    return res.status(400).json({ erreur: 'CHOIX_INVALIDE', message: 'Le vote doit être POUR, CONTRE ou ABSTENTION.' });
  }

  const scrutin = db.prepare('SELECT id, ouvert FROM votes_sessions WHERE id = ?').get(session_id);
  if (!scrutin) return res.status(404).json({ erreur: 'INTROUVABLE', message: 'Scrutin introuvable.' });
  if (!scrutin.ouvert) {
    return res.status(400).json({ erreur: 'SCRUTIN_CLOS', message: 'Ce scrutin est clôturé.' });
  }

  // Empreinte d'intégrité du bulletin (traçabilité sans révéler le vote)
  const hashVerif = crypto.createHash('sha256')
    .update(`${session_id}:${userId}:${choix}:${Date.now()}`)
    .digest('hex').slice(0, 16).toUpperCase();

  try {
    db.prepare('INSERT INTO votes_bulletins (session_id, depute_id, choix, hash_verif) VALUES (?, ?, ?, ?)')
      .run(session_id, userId, choix, hashVerif);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ erreur: 'DEJA_VOTE', message: 'Vous avez déjà voté sur ce scrutin.' });
    }
    throw e;
  }

  res.json({ succes: true, hash_verif: hashVerif, message: `Vote « ${choix} » enregistré.` });
});

// ───────────────────────────────────────────────────────────────
// GET /api/depute/ma-presence — historique d'émargement
// ───────────────────────────────────────────────────────────────
router.get('/ma-presence', (req, res) => {
  const historique = db.prepare(`
    SELECT p.statut, s.titre, s.type_evenement, s.date_debut
    FROM presences p JOIN seances s ON s.id = p.seance_id
    WHERE p.depute_id = ?
    ORDER BY s.date_debut DESC LIMIT 50
  `).all(req.session.utilisateur.id);
  res.json({ historique });
});

module.exports = router;
