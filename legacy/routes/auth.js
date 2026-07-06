// ═══════════════════════════════════════════════════════════════
// ROUTES D'AUTHENTIFICATION — avec 2FA TOTP
// /api/auth/connexion     → étape 1 : matricule + mot de passe
// /api/auth/verifier-otp  → étape 2 : code TOTP (si 2FA activée)
// /api/auth/activer-2fa   → génère un secret TOTP pour l'utilisateur
// /api/auth/confirmer-2fa → confirme l'activation avec un 1er code
// /api/auth/deconnexion   → déconnexion
// /api/auth/moi           → utilisateur en session
// /api/auth/changer-mdp   → changement de mot de passe
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');
const totp = require('../lib/totp');

const router = express.Router();

const ERREUR_GENERIQUE = {
  erreur: 'IDENTIFIANTS_INVALIDES',
  message: 'Identifiant ou mot de passe incorrect.',
};

/** Finalise la session après vérification complète (mdp + OTP éventuel). */
function ouvrirSession(req, utilisateur) {
  req.session.attente2FA = null;
  req.session.utilisateur = {
    id: utilisateur.id,
    numero_id: utilisateur.numero_id,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    role: utilisateur.role,
    fonction: utilisateur.fonction,
    province: utilisateur.province,
    groupe_parlementaire: utilisateur.groupe_parlementaire,
    photo_url: utilisateur.photo_url,
    totp_active: !!utilisateur.totp_active,
    doit_changer_mdp: !!utilisateur.doit_changer_mdp,
  };

  const log = db.prepare(`
    INSERT INTO connexions_log (utilisateur_id, adresse_ip, user_agent)
    VALUES (?, ?, ?)
  `).run(utilisateur.id, req.ip, req.get('user-agent') || null);
  req.session.connexionLogId = log.lastInsertRowid;

  db.prepare(`UPDATE utilisateurs SET derniere_connexion = datetime('now') WHERE id = ?`)
    .run(utilisateur.id);
}

// ───────────────────────────────────────────────────────────────
// POST /api/auth/connexion — { identifiant, mot_de_passe }
// L'identifiant est le matricule (numero_id) ou l'email.
// Réponse : { etape: 'connecte' } ou { etape: '2fa' }
// ───────────────────────────────────────────────────────────────
router.post('/connexion', (req, res) => {
  const { identifiant, mot_de_passe } = req.body;

  if (!identifiant || !mot_de_passe) {
    return res.status(400).json({
      erreur: 'CHAMPS_MANQUANTS',
      message: 'Identifiant et mot de passe sont requis.',
    });
  }

  const id = String(identifiant).trim();
  const utilisateur = db.prepare(`
    SELECT * FROM utilisateurs
    WHERE (numero_id = ? COLLATE NOCASE OR email = ? COLLATE NOCASE) AND actif = 1
  `).get(id, id);

  if (!utilisateur || !bcrypt.compareSync(mot_de_passe, utilisateur.mot_de_passe)) {
    return res.status(401).json(ERREUR_GENERIQUE);
  }

  if (utilisateur.totp_active) {
    // Étape intermédiaire : mot de passe validé, code OTP attendu.
    req.session.attente2FA = { userId: utilisateur.id, depuis: Date.now() };
    return res.json({ succes: true, etape: '2fa' });
  }

  ouvrirSession(req, utilisateur);
  return res.json({ succes: true, etape: 'connecte', utilisateur: req.session.utilisateur });
});

// ───────────────────────────────────────────────────────────────
// POST /api/auth/verifier-otp — { code }
// ───────────────────────────────────────────────────────────────
router.post('/verifier-otp', (req, res) => {
  const attente = req.session.attente2FA;
  // Le défi expire après 5 minutes.
  if (!attente || Date.now() - attente.depuis > 5 * 60 * 1000) {
    req.session.attente2FA = null;
    return res.status(401).json({
      erreur: 'DEFI_EXPIRE',
      message: 'Session de vérification expirée. Reconnectez-vous.',
    });
  }

  const utilisateur = db.prepare('SELECT * FROM utilisateurs WHERE id = ? AND actif = 1')
    .get(attente.userId);

  if (!utilisateur || !totp.verifierCode(utilisateur.totp_secret, req.body.code)) {
    return res.status(401).json({
      erreur: 'CODE_INVALIDE',
      message: 'Code de vérification incorrect ou expiré.',
    });
  }

  ouvrirSession(req, utilisateur);
  return res.json({ succes: true, etape: 'connecte', utilisateur: req.session.utilisateur });
});

// ───────────────────────────────────────────────────────────────
// POST /api/auth/activer-2fa — génère le secret (état "en attente")
// Réponse : { secret, otpauth_url } à saisir dans l'app OTP.
// ───────────────────────────────────────────────────────────────
router.post('/activer-2fa', requireAuth, (req, res) => {
  const userId = req.session.utilisateur.id;
  const secret = totp.genererSecret();
  db.prepare('UPDATE utilisateurs SET totp_secret = ?, totp_active = 0 WHERE id = ?')
    .run(secret, userId);

  return res.json({
    succes: true,
    secret,
    otpauth_url: totp.urlOtpAuth(secret, req.session.utilisateur.numero_id),
    message: 'Saisissez ce secret dans votre application (Google Authenticator, FreeOTP…), puis confirmez avec un premier code.',
  });
});

// ───────────────────────────────────────────────────────────────
// POST /api/auth/confirmer-2fa — { code } : active définitivement
// ───────────────────────────────────────────────────────────────
router.post('/confirmer-2fa', requireAuth, (req, res) => {
  const userId = req.session.utilisateur.id;
  const utilisateur = db.prepare('SELECT * FROM utilisateurs WHERE id = ?').get(userId);

  if (!utilisateur.totp_secret) {
    return res.status(400).json({ erreur: 'AUCUN_SECRET', message: 'Générez d\'abord un secret via /activer-2fa.' });
  }
  if (!totp.verifierCode(utilisateur.totp_secret, req.body.code)) {
    return res.status(401).json({ erreur: 'CODE_INVALIDE', message: 'Code incorrect — vérifiez l\'heure de votre téléphone.' });
  }

  db.prepare('UPDATE utilisateurs SET totp_active = 1 WHERE id = ?').run(userId);
  req.session.utilisateur.totp_active = true;
  return res.json({ succes: true, message: 'Double authentification activée.' });
});

// ───────────────────────────────────────────────────────────────
// POST /api/auth/deconnexion
// ───────────────────────────────────────────────────────────────
router.post('/deconnexion', requireAuth, (req, res) => {
  const connexionLogId = req.session.connexionLogId;
  if (connexionLogId) {
    db.prepare(`UPDATE connexions_log SET date_deconnexion = datetime('now') WHERE id = ?`)
      .run(connexionLogId);
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ erreur: 'ERREUR_SERVEUR', message: 'Échec de la déconnexion.' });
    }
    // Nom du cookie défini dans server.js (name: 'assemblee.sid')
    res.clearCookie('assemblee.sid');
    return res.json({ succes: true });
  });
});

// ───────────────────────────────────────────────────────────────
// GET /api/auth/moi
// ───────────────────────────────────────────────────────────────
router.get('/moi', (req, res) => {
  if (!req.session || !req.session.utilisateur) {
    return res.status(401).json({ erreur: 'NON_AUTHENTIFIE' });
  }
  return res.json({ utilisateur: req.session.utilisateur });
});

// ───────────────────────────────────────────────────────────────
// POST /api/auth/changer-mdp — { ancien_mot_de_passe, nouveau_mot_de_passe }
// ───────────────────────────────────────────────────────────────
router.post('/changer-mdp', requireAuth, (req, res) => {
  const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
  const userId = req.session.utilisateur.id;

  if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
    return res.status(400).json({ erreur: 'CHAMPS_MANQUANTS', message: 'Ancien et nouveau mot de passe requis.' });
  }
  if (nouveau_mot_de_passe.length < 8) {
    return res.status(400).json({ erreur: 'MDP_TROP_COURT', message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
  }

  const utilisateur = db.prepare('SELECT * FROM utilisateurs WHERE id = ?').get(userId);
  if (!bcrypt.compareSync(ancien_mot_de_passe, utilisateur.mot_de_passe)) {
    return res.status(401).json({ erreur: 'ANCIEN_MDP_INCORRECT', message: 'L\'ancien mot de passe est incorrect.' });
  }

  db.prepare('UPDATE utilisateurs SET mot_de_passe = ?, doit_changer_mdp = 0 WHERE id = ?')
    .run(bcrypt.hashSync(nouveau_mot_de_passe, 10), userId);
  req.session.utilisateur.doit_changer_mdp = false;

  return res.json({ succes: true, message: 'Mot de passe mis à jour avec succès.' });
});

module.exports = router;
