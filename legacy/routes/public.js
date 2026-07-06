// ═══════════════════════════════════════════════════════════════
// API PUBLIQUE — accessible sans compte (portail citoyen)
// Toutes les réponses renvoient des DONNÉES RÉELLES de la base ;
// si une table est vide, la liste renvoyée est vide et le
// front-end affiche son état vide (« Aucune donnée disponible »).
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const db = require('../db/connection');

const router = express.Router();

// ───────────────────────────────────────────────────────────────
// GET /api/public/stats — chiffres clés CALCULÉS (jamais en dur)
// ───────────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const un = (sql, ...p) => db.prepare(sql).get(...p);
  res.json({
    deputes_actifs: un(`SELECT COUNT(*) n FROM utilisateurs WHERE role IN ('depute','president','vice_president','questeur') AND actif = 1`).n,
    femmes_deputees: un(`SELECT COUNT(*) n FROM utilisateurs WHERE role IN ('depute','president','vice_president','questeur') AND actif = 1 AND sexe = 'F'`).n,
    textes_en_cours: un(`SELECT COUNT(*) n FROM lois WHERE statut IN ('depose','en_commission','en_debat','au_vote')`).n,
    seances_tenues: un(`SELECT COUNT(*) n FROM seances WHERE statut = 'terminee'`).n,
    groupes_parlementaires: un(`SELECT COUNT(DISTINCT groupe_parlementaire) n FROM utilisateurs WHERE groupe_parlementaire IS NOT NULL AND actif = 1`).n,
    commissions: un(`SELECT COUNT(*) n FROM commissions`).n,
    petitions_actives: un(`SELECT COUNT(*) n FROM petitions WHERE statut = 'active'`).n,
  });
});

// ───────────────────────────────────────────────────────────────
// GET /api/public/agenda?type=&statut=&depuis=
// ───────────────────────────────────────────────────────────────
router.get('/agenda', (req, res) => {
  const { type, statut } = req.query;
  const clauses = [];
  const params = [];
  if (type) { clauses.push('s.type_evenement = ?'); params.push(type); }
  if (statut) { clauses.push('s.statut = ?'); params.push(statut); }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

  const seances = db.prepare(`
    SELECT s.*, c.nom AS commission_nom
    FROM seances s LEFT JOIN commissions c ON c.id = s.commission_id
    ${where}
    ORDER BY s.date_debut ASC
    LIMIT 200
  `).all(...params);

  res.json({ seances });
});

// ───────────────────────────────────────────────────────────────
// GET /api/public/lois?statut=&priorite=&q=
// ───────────────────────────────────────────────────────────────
router.get('/lois', (req, res) => {
  const { statut, priorite, q } = req.query;
  const clauses = [];
  const params = [];
  if (statut) { clauses.push('l.statut = ?'); params.push(statut); }
  if (priorite) { clauses.push('l.priorite = ?'); params.push(priorite); }
  if (q) {
    clauses.push('(l.titre LIKE ? OR l.numero_reference LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

  const lois = db.prepare(`
    SELECT l.*, c.nom AS commission_nom,
           r.prenom || ' ' || r.nom AS rapporteur_nom
    FROM lois l
    LEFT JOIN commissions c ON c.id = l.commission_id
    LEFT JOIN utilisateurs r ON r.id = l.rapporteur_id
    ${where}
    ORDER BY l.date_depot DESC
    LIMIT 200
  `).all(...params);

  res.json({ lois });
});

// ───────────────────────────────────────────────────────────────
// GET /api/public/lois/:ref — détail complet d'un texte
// ───────────────────────────────────────────────────────────────
router.get('/lois/:ref', (req, res) => {
  const loi = db.prepare(`
    SELECT l.*, c.nom AS commission_nom,
           r.prenom || ' ' || r.nom AS rapporteur_nom, r.numero_id AS rapporteur_matricule
    FROM lois l
    LEFT JOIN commissions c ON c.id = l.commission_id
    LEFT JOIN utilisateurs r ON r.id = l.rapporteur_id
    WHERE l.numero_reference = ?
  `).get(req.params.ref);

  if (!loi) {
    return res.status(404).json({ erreur: 'INTROUVABLE', message: 'Texte de loi introuvable.' });
  }

  const etapes = db.prepare('SELECT * FROM loi_etapes WHERE loi_id = ? ORDER BY date_etape ASC').all(loi.id);
  const articles = db.prepare('SELECT * FROM loi_articles WHERE loi_id = ? ORDER BY id ASC').all(loi.id);
  const documents = db.prepare(`SELECT id, titre, categorie, fichier_url, taille_ko, acces FROM documents WHERE loi_id = ? AND acces = 'public'`).all(loi.id);

  res.json({ loi, etapes, articles, documents });
});

// ───────────────────────────────────────────────────────────────
// GET /api/public/scrutins — historique agrégé des votes clôturés
// ───────────────────────────────────────────────────────────────
router.get('/scrutins', (req, res) => {
  const scrutins = db.prepare(`
    SELECT vs.id, vs.titre, vs.date_cloture, l.numero_reference, l.titre AS loi_titre,
      SUM(CASE WHEN vb.choix = 'POUR' THEN 1 ELSE 0 END) AS pour,
      SUM(CASE WHEN vb.choix = 'CONTRE' THEN 1 ELSE 0 END) AS contre,
      SUM(CASE WHEN vb.choix = 'ABSTENTION' THEN 1 ELSE 0 END) AS abstention
    FROM votes_sessions vs
    LEFT JOIN lois l ON l.id = vs.loi_id
    LEFT JOIN votes_bulletins vb ON vb.session_id = vs.id
    WHERE vs.ouvert = 0
    GROUP BY vs.id
    ORDER BY vs.date_cloture DESC
    LIMIT 100
  `).all();

  res.json({ scrutins });
});

// ───────────────────────────────────────────────────────────────
// GET /api/public/deputes?groupe=&province=&commission=&q=
// ───────────────────────────────────────────────────────────────
router.get('/deputes', (req, res) => {
  const { groupe, province, commission, q } = req.query;
  const clauses = [`u.role IN ('depute','president','vice_president','questeur')`, 'u.actif = 1'];
  const params = [];
  if (groupe) { clauses.push('u.groupe_parlementaire = ?'); params.push(groupe); }
  if (province) { clauses.push('u.province = ?'); params.push(province); }
  if (q) {
    clauses.push('(u.nom LIKE ? OR u.prenom LIKE ? OR u.numero_id LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  let joinCommission = '';
  if (commission) {
    joinCommission = 'JOIN commission_membres cm ON cm.utilisateur_id = u.id AND cm.commission_id = ?';
    params.unshift(Number(commission));
  }

  const deputes = db.prepare(`
    SELECT DISTINCT u.id, u.numero_id, u.nom, u.prenom, u.fonction, u.sexe,
           u.province, u.groupe_parlementaire, u.photo_url
    FROM utilisateurs u
    ${joinCommission}
    WHERE ${clauses.join(' AND ')}
    ORDER BY u.nom, u.prenom
  `).all(...params);

  // Listes de filtres calculées depuis les données réelles
  const provinces = db.prepare(`SELECT DISTINCT province FROM utilisateurs WHERE province IS NOT NULL AND actif = 1 ORDER BY province`).all().map(r => r.province);
  const groupes = db.prepare(`SELECT DISTINCT groupe_parlementaire g FROM utilisateurs WHERE g IS NOT NULL AND actif = 1 ORDER BY g`).all().map(r => r.g);

  res.json({ deputes, provinces, groupes });
});

// ───────────────────────────────────────────────────────────────
// GET /api/public/deputes/:id — fiche individuelle
// ───────────────────────────────────────────────────────────────
router.get('/deputes/:id', (req, res) => {
  const depute = db.prepare(`
    SELECT id, numero_id, nom, prenom, fonction, sexe, province,
           groupe_parlementaire, photo_url, biographie
    FROM utilisateurs
    WHERE id = ? AND actif = 1 AND role IN ('depute','president','vice_president','questeur')
  `).get(req.params.id);

  if (!depute) {
    return res.status(404).json({ erreur: 'INTROUVABLE', message: 'Élu introuvable.' });
  }

  const commissions = db.prepare(`
    SELECT c.id, c.nom, cm.role_commission
    FROM commission_membres cm JOIN commissions c ON c.id = cm.commission_id
    WHERE cm.utilisateur_id = ?
  `).all(depute.id);

  const presence = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) AS presents
    FROM presences WHERE depute_id = ?
  `).get(depute.id);

  res.json({
    depute,
    commissions,
    taux_presence: presence.total ? Math.round((presence.presents / presence.total) * 100) : null,
  });
});

// ───────────────────────────────────────────────────────────────
// GET /api/public/commissions
// ───────────────────────────────────────────────────────────────
router.get('/commissions', (req, res) => {
  const commissions = db.prepare(`
    SELECT c.id, c.nom, c.nom_ar,
      (SELECT COUNT(*) FROM commission_membres cm WHERE cm.commission_id = c.id) AS nb_membres
    FROM commissions c ORDER BY c.id
  `).all();
  res.json({ commissions });
});

// ───────────────────────────────────────────────────────────────
// GET /api/public/documents?q=&categorie=
// Les documents "interne"/"confidentiel" ne sont listés qu'aux
// utilisateurs connectés au rôle suffisant, avec badge d'accès.
// ───────────────────────────────────────────────────────────────
router.get('/documents', (req, res) => {
  const { q, categorie } = req.query;
  const role = req.session?.utilisateur?.role;
  const niveaux = ['public'];
  if (role && role !== 'citoyen') niveaux.push('interne');
  if (['president', 'vice_president', 'secretaire_general', 'questeur'].includes(role)) niveaux.push('confidentiel');

  const clauses = [`d.acces IN (${niveaux.map(() => '?').join(',')})`];
  const params = [...niveaux];
  if (q) { clauses.push('d.titre LIKE ?'); params.push(`%${q}%`); }
  if (categorie) { clauses.push('d.categorie = ?'); params.push(categorie); }

  const documents = db.prepare(`
    SELECT d.id, d.titre, d.categorie, d.fichier_url, d.taille_ko, d.acces, d.date_upload,
           l.numero_reference AS loi_ref
    FROM documents d LEFT JOIN lois l ON l.id = d.loi_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY d.date_upload DESC
    LIMIT 200
  `).all(...params);

  res.json({ documents, niveaux_visibles: niveaux });
});

// ───────────────────────────────────────────────────────────────
// GET /api/public/petitions
// ───────────────────────────────────────────────────────────────
router.get('/petitions', (req, res) => {
  const petitions = db.prepare(`
    SELECT p.*, c.nom AS commission_nom,
      (SELECT COUNT(*) FROM petition_signatures ps WHERE ps.petition_id = p.id) AS nb_signatures
    FROM petitions p LEFT JOIN commissions c ON c.id = p.commission_id
    ORDER BY CASE p.statut WHEN 'active' THEN 0 ELSE 1 END, p.date_creation DESC
    LIMIT 100
  `).all();
  res.json({ petitions });
});

// ───────────────────────────────────────────────────────────────
// POST /api/public/petitions/:id/signer — { nom_complet, contact }
// ───────────────────────────────────────────────────────────────
router.post('/petitions/:id/signer', (req, res) => {
  const { nom_complet, contact } = req.body;
  if (!nom_complet || !contact) {
    return res.status(400).json({ erreur: 'CHAMPS_MANQUANTS', message: 'Nom complet et contact (téléphone ou email) requis.' });
  }

  const petition = db.prepare(`SELECT id, statut FROM petitions WHERE id = ?`).get(req.params.id);
  if (!petition) return res.status(404).json({ erreur: 'INTROUVABLE', message: 'Pétition introuvable.' });
  if (petition.statut !== 'active') {
    return res.status(400).json({ erreur: 'PETITION_CLOSE', message: 'Cette pétition n\'accepte plus de signatures.' });
  }

  try {
    db.prepare('INSERT INTO petition_signatures (petition_id, nom_complet, contact) VALUES (?, ?, ?)')
      .run(petition.id, nom_complet.trim(), contact.trim().toLowerCase());
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ erreur: 'DEJA_SIGNE', message: 'Ce contact a déjà signé cette pétition.' });
    }
    throw e;
  }

  const nb = db.prepare('SELECT COUNT(*) n FROM petition_signatures WHERE petition_id = ?').get(petition.id).n;
  res.json({ succes: true, nb_signatures: nb, message: 'Signature enregistrée. Merci pour votre participation.' });
});

// ───────────────────────────────────────────────────────────────
// POST /api/public/messages — message citoyen à un député/commission
// ───────────────────────────────────────────────────────────────
router.post('/messages', (req, res) => {
  const { nom_complet, contact, province, sujet, message, depute_id, commission_id } = req.body;
  if (!nom_complet || !sujet || !message) {
    return res.status(400).json({ erreur: 'CHAMPS_MANQUANTS', message: 'Nom, sujet et message sont requis.' });
  }
  if (String(message).length > 5000) {
    return res.status(400).json({ erreur: 'MESSAGE_TROP_LONG', message: 'Le message ne doit pas dépasser 5000 caractères.' });
  }

  const r = db.prepare(`
    INSERT INTO messages_citoyens (nom_complet, contact, province, sujet, message, depute_id, commission_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    nom_complet.trim(), contact || null, province || null,
    sujet.trim(), message.trim(),
    depute_id || null, commission_id || null
  );

  res.json({ succes: true, reference: `MSG-${String(r.lastInsertRowid).padStart(5, '0')}`, message: 'Votre message a bien été transmis.' });
});

// ───────────────────────────────────────────────────────────────
// GET /api/public/annonces — actualités publiques
// ───────────────────────────────────────────────────────────────
router.get('/annonces', (req, res) => {
  const annonces = db.prepare(`
    SELECT id, titre, contenu, priorite, date_publication
    FROM annonces WHERE cible_role IN ('tous','citoyen')
    ORDER BY date_publication DESC LIMIT 20
  `).all();
  res.json({ annonces });
});

module.exports = router;
