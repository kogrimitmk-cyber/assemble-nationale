// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE D'AUTHENTIFICATION
// Fonctions réutilisables pour protéger les routes selon le rôle
// de l'utilisateur connecté (session).
// ═══════════════════════════════════════════════════════════════

/**
 * Vérifie que l'utilisateur est connecté (a une session valide).
 * À utiliser sur toutes les routes nécessitant un compte.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.utilisateur) {
    return res.status(401).json({
      erreur: 'NON_AUTHENTIFIE',
      message: 'Vous devez être connecté pour accéder à cette ressource.',
    });
  }
  next();
}

/**
 * Vérifie que l'utilisateur connecté a un rôle parmi ceux autorisés.
 * Exemple d'utilisation : requireRole('secretaire_general', 'president')
 *
 * @param  {...string} rolesAutorises - liste des rôles ayant accès
 */
function requireRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.session || !req.session.utilisateur) {
      return res.status(401).json({
        erreur: 'NON_AUTHENTIFIE',
        message: 'Vous devez être connecté.',
      });
    }
    const roleActuel = req.session.utilisateur.role;
    if (!rolesAutorises.includes(roleActuel)) {
      return res.status(403).json({
        erreur: 'ACCES_REFUSE',
        message: `Votre rôle (${roleActuel}) n'a pas accès à cette ressource.`,
      });
    }
    next();
  };
}

/**
 * Raccourci : accès réservé aux rôles "direction" de l'Assemblée
 * (Président, Vice-présidents, Secrétaire général) — utilisé pour
 * la messagerie interne et certaines vues de pilotage.
 */
const requireDirection = requireRole('president', 'vice_president', 'secretaire_general');

/**
 * Raccourci : accès réservé au Secrétaire général uniquement
 * (administration avancée : agenda, annonces, notifications).
 */
const requireSecretaireGeneral = requireRole('secretaire_general');

/**
 * Raccourci : accès Questeur + Secrétaire général (suivi financier).
 */
const requireFinance = requireRole('questeur', 'secretaire_general');

module.exports = {
  requireAuth,
  requireRole,
  requireDirection,
  requireSecretaireGeneral,
  requireFinance,
};
