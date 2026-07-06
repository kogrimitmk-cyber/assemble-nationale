// ═══════════════════════════════════════════════════════════════
// INITIALISATION DE LA BASE — AN Connect Tchad
// Crée db/assemblee.db, applique le schéma et insère un jeu de
// données de DÉMONSTRATION (noms fictifs à remplacer par les
// données officielles de l'Assemblée Nationale avant mise en ligne).
//
//    node db/init.js
//
// Relançable sans risque : les enregistrements déjà présents ne
// sont pas recréés (aucune donnée réelle n'est écrasée).
// ═══════════════════════════════════════════════════════════════

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_PATH = path.join(__dirname, 'assemblee.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

console.log('═══════════════════════════════════════════════════');
console.log(' Initialisation — AN Connect Tchad');
console.log('═══════════════════════════════════════════════════');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
console.log('✅ Tables créées / vérifiées.');

const DEFAULT_PASSWORD = process.env.ADMIN_INIT_PASSWORD || 'ChangezMoi2025!';
const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

// ── Ne pas re-seeder si des utilisateurs existent déjà ──────────
const dejaInitialisee = db.prepare('SELECT COUNT(*) AS n FROM utilisateurs').get().n > 0;
if (dejaInitialisee) {
  console.log('↪︎  Base déjà initialisée — aucun ré-ensemencement.');
  db.close();
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════
// 1) COMPTES — Bureau de l'Assemblée + échantillon de députés
//    ⚠ Noms FICTIFS de démonstration.
// ═══════════════════════════════════════════════════════════════
const PROVINCES = [
  "N'Djamena", 'Chari-Baguirmi', 'Ouaddaï', 'Logone Oriental', 'Logone Occidental',
  'Borkou', 'Wadi Fira', 'Mayo-Kebbi Est', 'Mayo-Kebbi Ouest', 'Moyen-Chari',
  'Tibesti', 'Lac', 'Kanem', 'Batha', 'Guéra', 'Salamat', 'Sila', 'Ennedi Est',
  'Ennedi Ouest', 'Hadjer-Lamis', 'Mandoul', 'Tandjilé', 'Barh El Gazel',
];
const GROUPES = ['MPS', 'RNDT–Le Réveil', 'UNDR', 'RDP', 'Les Transformateurs', 'Indépendants'];

const comptes = [
  { numero_id: 'PRES-001', nom: 'Kolotou', prenom: 'Ali', role: 'president', fonction: "Président de l'Assemblée Nationale", sexe: 'M', province: "N'Djamena", groupe: 'MPS' },
  { numero_id: 'VP1-001', nom: 'Barka', prenom: 'Abdelkerim', role: 'vice_president', fonction: '1er Vice-Président', sexe: 'M', province: 'Ouaddaï', groupe: 'MPS' },
  { numero_id: 'VP2-001', nom: 'Nassour', prenom: 'Fatimé', role: 'vice_president', fonction: '2ème Vice-Présidente', sexe: 'F', province: 'Logone Oriental', groupe: 'MPS' },
  { numero_id: 'SG-001', nom: 'Hassan', prenom: 'Moussa', role: 'secretaire_general', fonction: 'Secrétaire général', sexe: 'M', province: 'Mayo-Kebbi Est', groupe: 'MPS' },
  { numero_id: 'QUEST-001', nom: 'Djibrine', prenom: 'Omar', role: 'questeur', fonction: '1er Questeur', sexe: 'M', province: 'Moyen-Chari', groupe: 'MPS' },
];

// Échantillon de 18 députés fictifs répartis sur les provinces/groupes
const NOMS = ['Tahir', 'Youssouf', 'Abakar', 'Mbaïro', 'Deby', 'Allamine', 'Ngarhoulem', 'Souleymane', 'Kemkoye', 'Abdoulaye', 'Nodjigoto', 'Brahim', 'Madjitoloum', 'Oumar', 'Djasrabé', 'Mahamat', 'Ratou', 'Weïding'];
const PRENOMS_F = ['Fatimé', 'Amina', 'Zara', 'Khadidja', 'Achta', 'Mariam', 'Hawa'];
const PRENOMS_M = ['Mahamat', 'Idriss', 'Saleh', 'Adoum', 'Béral', 'Nicolas', 'Djimet', 'Hassane', 'Payang', 'Bichara', 'Célestin'];

const deputes = [];
for (let i = 0; i < 18; i++) {
  const estFemme = i % 3 === 2; // ~1/3 de femmes dans l'échantillon
  deputes.push({
    numero_id: `DEP-${String(i + 10).padStart(3, '0')}`,
    nom: NOMS[i % NOMS.length],
    prenom: estFemme ? PRENOMS_F[i % PRENOMS_F.length] : PRENOMS_M[i % PRENOMS_M.length],
    role: 'depute',
    fonction: estFemme ? 'Députée' : 'Député',
    sexe: estFemme ? 'F' : 'M',
    province: PROVINCES[i % PROVINCES.length],
    groupe: GROUPES[i % GROUPES.length],
  });
}

const insUser = db.prepare(`
  INSERT INTO utilisateurs (numero_id, nom, prenom, email, mot_de_passe, role, fonction, sexe, province, groupe_parlementaire)
  VALUES (@numero_id, @nom, @prenom, @email, @mot_de_passe, @role, @fonction, @sexe, @province, @groupe)
`);
const ids = {};
for (const c of [...comptes, ...deputes]) {
  const email = `${c.numero_id.toLowerCase()}@assemblee-nationale.td`;
  const r = insUser.run({ ...c, email, mot_de_passe: hash });
  ids[c.numero_id] = r.lastInsertRowid;
  console.log(`✅ Compte : ${c.numero_id} — ${c.prenom} ${c.nom} (${c.role})`);
}

// ═══════════════════════════════════════════════════════════════
// 2) COMMISSIONS PERMANENTES (9)
// ═══════════════════════════════════════════════════════════════
const commissions = [
  ['Finances, Budget et Comptabilité publique', 'المالية والميزانية والمحاسبة العامة'],
  ['Lois constitutionnelles, Justice et Droits humains', 'القوانين الدستورية والعدل وحقوق الإنسان'],
  ['Affaires étrangères et Coopération internationale', 'الشؤون الخارجية والتعاون الدولي'],
  ['Défense, Sécurité et Anciens combattants', 'الدفاع والأمن وقدماء المحاربين'],
  ['Développement rural, Agriculture et Eau', 'التنمية الريفية والزراعة والمياه'],
  ['Santé publique et Affaires sociales', 'الصحة العامة والشؤون الاجتماعية'],
  ['Éducation, Culture et Jeunesse', 'التربية والثقافة والشباب'],
  ['Communication et Nouvelles technologies', 'الاتصال والتقنيات الحديثة'],
  ['Aménagement du territoire et Infrastructures', 'إعداد التراب والبنى التحتية'],
];
const insCom = db.prepare('INSERT INTO commissions (nom, nom_ar) VALUES (?, ?)');
const comIds = commissions.map(([fr, ar]) => insCom.run(fr, ar).lastInsertRowid);
console.log(`✅ ${comIds.length} commissions permanentes.`);

// Affectations de démonstration (chaque député dans 1-2 commissions)
const insMembre = db.prepare('INSERT INTO commission_membres (commission_id, utilisateur_id, role_commission) VALUES (?, ?, ?)');
Object.values(ids).forEach((uid, i) => {
  insMembre.run(comIds[i % comIds.length], uid, i % 7 === 0 ? 'rapporteur' : 'membre');
  if (i % 2 === 0) insMembre.run(comIds[(i + 3) % comIds.length], uid, 'membre');
});

// ═══════════════════════════════════════════════════════════════
// 3) LOIS — quelques textes avec étapes, articles et priorités
// ═══════════════════════════════════════════════════════════════
const insLoi = db.prepare(`
  INSERT INTO lois (numero_reference, titre, resume, type_texte, priorite, statut, commission_id, rapporteur_id, depose_par, date_depot)
  VALUES (@ref, @titre, @resume, @type, @priorite, @statut, @commission, @rapporteur, @depose_par, @date_depot)
`);
const insEtape = db.prepare('INSERT INTO loi_etapes (loi_id, libelle, description, date_etape) VALUES (?, ?, ?, ?)');
const insArt = db.prepare('INSERT INTO loi_articles (loi_id, numero, titre, contenu) VALUES (?, ?, ?, ?)');

const lois = [
  {
    ref: 'PLF-2026-042', titre: 'Loi de finances rectificative 2026',
    resume: "Ajustement du budget de l'État pour l'exercice 2026, avec renforcement des dotations aux collectivités territoriales décentralisées.",
    type: 'projet', priorite: 'prioritaire', statut: 'au_vote', commission: comIds[0],
    rapporteur: ids['DEP-010'], depose_par: 'Gouvernement — Ministère des Finances', date_depot: '2026-05-05 09:00',
    etapes: [
      ['Dépôt du texte sur le bureau de l\'Assemblée', 'Transmission officielle par le Gouvernement.', '2026-05-05 09:00'],
      ['Renvoi en commission Finances', 'Examen au fond confié à la commission des Finances.', '2026-05-07 10:30'],
      ['Adoption du rapport en commission', 'Rapport adopté avec 4 amendements.', '2026-05-28 16:00'],
      ['Ouverture du débat en séance plénière', 'Discussion générale, 14 orateurs inscrits.', '2026-06-10 09:00'],
    ],
    articles: [
      ['Article 1', 'Objet', "La présente loi porte rectification de la loi de finances initiale pour l'exercice 2026."],
      ['Article 12', 'Dotations aux collectivités provinciales', "Les dotations allouées aux collectivités territoriales décentralisées sont augmentées de 15 % pour l'exercice 2026-2027."],
      ['Article 13', 'Comité de suivi', 'Il est institué un comité de suivi interministériel qui rend son rapport sous 60 jours.'],
    ],
  },
  {
    ref: 'PLN-2026-031', titre: 'Loi relative à la protection des données à caractère personnel',
    resume: 'Encadrement de la collecte et du traitement des données personnelles et biométriques des citoyens.',
    type: 'projet', priorite: 'normale', statut: 'en_commission', commission: comIds[7],
    rapporteur: ids['DEP-012'], depose_par: 'Gouvernement — Ministère du Numérique', date_depot: '2026-04-14 11:00',
    etapes: [
      ['Dépôt du texte', 'Transmission par le Gouvernement.', '2026-04-14 11:00'],
      ['Renvoi en commission Communication et Nouvelles technologies', 'Désignation du rapporteur.', '2026-04-18 10:00'],
    ],
    articles: [
      ['Article 1', 'Champ d\'application', 'La présente loi s\'applique à tout traitement de données à caractère personnel effectué sur le territoire national.'],
      ['Article 4', 'Consentement', 'Tout traitement requiert le consentement libre, éclairé et révocable de la personne concernée.'],
    ],
  },
  {
    ref: 'PPL-2026-028', titre: 'Proposition de loi portant révision du Code de la décentralisation',
    resume: 'Clarification des compétences transférées aux communes et renforcement de la fiscalité locale.',
    type: 'proposition', priorite: 'normale', statut: 'en_debat', commission: comIds[8],
    rapporteur: ids['DEP-014'], depose_par: 'Groupe parlementaire RNDT–Le Réveil', date_depot: '2026-03-02 10:00',
    etapes: [
      ['Dépôt de la proposition', 'Déposée par 24 députés.', '2026-03-02 10:00'],
      ['Renvoi en commission Aménagement du territoire', '', '2026-03-06 09:00'],
      ['Adoption du rapport en commission', 'Rapport adopté à l\'unanimité.', '2026-05-20 15:00'],
    ],
    articles: [
      ['Article 2', 'Compétences communales', 'Les communes exercent les compétences en matière d\'état civil, de voirie communale et de marchés publics locaux.'],
    ],
  },
  {
    ref: 'PLU-2026-045', titre: "Loi d'urgence sur la réponse humanitaire dans les provinces de l'Est",
    resume: "Mesures exceptionnelles de financement et de coordination de l'aide humanitaire face à l'afflux de réfugiés.",
    type: 'projet', priorite: 'urgence_nationale', statut: 'depose', commission: comIds[5],
    rapporteur: null, depose_par: 'Gouvernement — Primature', date_depot: '2026-06-28 08:30',
    etapes: [['Dépôt du texte en procédure d\'urgence', 'Article 132 du Règlement intérieur.', '2026-06-28 08:30']],
    articles: [],
  },
  {
    ref: 'PLE-2025-019', titre: 'Loi portant statut des chefferies traditionnelles',
    resume: 'Reconnaissance et organisation du rôle des autorités traditionnelles et coutumières.',
    type: 'projet', priorite: 'normale', statut: 'promulgue', commission: comIds[1],
    rapporteur: ids['DEP-016'], depose_par: 'Gouvernement — Ministère de l\'Administration du territoire', date_depot: '2025-10-08 10:00',
    etapes: [
      ['Dépôt du texte', '', '2025-10-08 10:00'],
      ['Renvoi en commission Lois constitutionnelles', '', '2025-10-12 09:00'],
      ['Adoption du rapport en commission', '', '2025-11-30 14:00'],
      ['Débat en séance plénière', '', '2025-12-10 09:00'],
      ['Adoption en séance plénière', '132 pour, 21 contre, 9 abstentions.', '2025-12-12 17:45'],
      ['Promulgation au Journal officiel', 'Loi n°019/PR/2025.', '2026-01-05 00:00'],
    ],
    articles: [
      ['Article 1', 'Objet', 'La présente loi fixe le statut des autorités traditionnelles et coutumières de la République du Tchad.'],
    ],
  },
];

for (const l of lois) {
  const r = insLoi.run(l);
  for (const [lib, desc, d] of l.etapes) insEtape.run(r.lastInsertRowid, lib, desc, d);
  for (const [num, t, c] of l.articles) insArt.run(r.lastInsertRowid, num, t, c);
  l.id = r.lastInsertRowid;
}
console.log(`✅ ${lois.length} textes de loi (avec étapes et articles).`);

// ═══════════════════════════════════════════════════════════════
// 4) AGENDA — séances passées et à venir
// ═══════════════════════════════════════════════════════════════
const insSeance = db.prepare(`
  INSERT INTO seances (titre, description, type_evenement, statut, date_debut, date_fin, lieu, commission_id, ordre_du_jour)
  VALUES (@titre, @description, @type, @statut, @debut, @fin, @lieu, @commission, @odj)
`);
const seances = [
  { titre: 'Séance plénière n°11 — Examen de la LFR 2026', description: 'Suite de la discussion générale et vote des articles.', type: 'seance_pleniere', statut: 'terminee', debut: '2026-06-10 09:00', fin: '2026-06-10 13:30', lieu: 'Hémicycle — Palais de la Démocratie', commission: null, odj: "Discussion générale (suite)\nExamen des articles 1 à 8\nQuestions au Gouvernement" },
  { titre: 'Commission Finances — Audition du Ministre du Budget', description: null, type: 'commission', statut: 'terminee', debut: '2026-06-24 14:00', fin: '2026-06-24 17:00', lieu: 'Salle A — Palais de la Démocratie', commission: comIds[0], odj: 'Audition du Ministre\nExamen des amendements en discussion commune' },
  { titre: 'Séance plénière n°12 — Vote solennel de la LFR 2026', description: 'Scrutin public sur l\'ensemble du texte.', type: 'seance_pleniere', statut: 'prevue', debut: '2026-07-08 09:00', fin: null, lieu: 'Hémicycle — Palais de la Démocratie', commission: null, odj: 'Explications de vote\nScrutin public solennel' },
  { titre: 'Commission Santé — Examen PLU-2026-045 (urgence)', description: 'Procédure d\'urgence — désignation du rapporteur.', type: 'commission', statut: 'prevue', debut: '2026-07-06 10:00', fin: null, lieu: 'Salle C — Palais de la Démocratie', commission: comIds[5], odj: 'Désignation du rapporteur\nCalendrier d\'examen accéléré' },
  { titre: 'Cérémonie — Ouverture de la session extraordinaire', description: null, type: 'ceremonie', statut: 'prevue', debut: '2026-07-15 10:00', fin: null, lieu: 'Palais de la Démocratie', commission: null, odj: null },
];
for (const s of seances) insSeance.run(s);
console.log(`✅ ${seances.length} séances à l'agenda.`);

// Présences de démonstration sur la séance n°11 (id 1)
const insPres = db.prepare('INSERT INTO presences (seance_id, depute_id, statut) VALUES (?, ?, ?)');
Object.values(ids).forEach((uid, i) => insPres.run(1, uid, i % 6 === 5 ? 'excuse' : 'present'));

// ═══════════════════════════════════════════════════════════════
// 5) DOCUMENTS — publics, internes, confidentiels
// ═══════════════════════════════════════════════════════════════
const insDoc = db.prepare(`
  INSERT INTO documents (titre, categorie, fichier_url, taille_ko, acces, loi_id)
  VALUES (?, ?, ?, ?, ?, ?)
`);
insDoc.run("Règlement intérieur de l'Assemblée Nationale (édition 2025)", 'reglement', '/documents/reglement-interieur-2025.pdf', 2140, 'public', null);
insDoc.run('Loi n°019/PR/2025 portant statut des chefferies traditionnelles', 'loi_adoptee', '/documents/loi-019-2025.pdf', 890, 'public', lois[4].id);
insDoc.run('Rapport de la commission Finances sur la LFR 2026', 'rapport', '/documents/rapport-lfr-2026.pdf', 3420, 'public', lois[0].id);
insDoc.run('Procès-verbal — Séance plénière n°11', 'proces_verbal', '/documents/pv-seance-11.pdf', 1260, 'interne', null);
insDoc.run('Ordre du jour prévisionnel — Session extraordinaire', 'ordre_du_jour', '/documents/odj-session-extra.pdf', 320, 'interne', null);
insDoc.run('Note confidentielle — Sécurité du Palais de la Démocratie', 'autre', '/documents/note-securite.pdf', 540, 'confidentiel', null);
console.log('✅ 6 documents (3 publics, 2 internes, 1 confidentiel).');

// ═══════════════════════════════════════════════════════════════
// 6) PÉTITIONS + quelques signatures
// ═══════════════════════════════════════════════════════════════
const insPet = db.prepare(`
  INSERT INTO petitions (titre, description, province, objectif_signatures, statut, commission_id, date_creation)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insSig = db.prepare('INSERT INTO petition_signatures (petition_id, nom_complet, contact) VALUES (?, ?, ?)');
const petitions = [
  ['Accès à l\'eau potable dans la province du Lac', 'Demande de programme d\'urgence pour la réalisation de forages dans les zones insulaires.', 'Lac', 2000, 'active', comIds[4], '2026-05-12 10:00', 1248],
  ['Réhabilitation des routes rurales du Logone Oriental', 'Les axes Doba–Bébédjia et pistes cotonnières sont impraticables en saison des pluies.', 'Logone Oriental', 1500, 'active', comIds[8], '2026-05-28 10:00', 876],
  ['Écoles de proximité dans le Tibesti', 'Construction d\'écoles primaires dans les localités enclavées.', 'Tibesti', 1000, 'traitee', comIds[6], '2026-03-15 10:00', 1043],
];
petitions.forEach(([t, d, prov, obj, st, com, dc, nSig], pi) => {
  const r = insPet.run(t, d, prov, obj, st, com, dc);
  for (let i = 0; i < nSig; i++) insSig.run(r.lastInsertRowid, `Signataire ${i + 1}`, `sig-${pi}-${i}@demo.td`);
});
console.log('✅ 3 pétitions citoyennes avec signatures.');

// ═══════════════════════════════════════════════════════════════
// 7) ANNONCES (actualités publiques)
// ═══════════════════════════════════════════════════════════════
const insAnn = db.prepare('INSERT INTO annonces (titre, contenu, priorite, date_publication) VALUES (?, ?, ?, ?)');
insAnn.run('Vote solennel de la loi de finances rectificative le 8 juillet', 'Le scrutin public solennel sur l\'ensemble de la LFR 2026 se tiendra en séance plénière le mercredi 8 juillet à 9 h 00.', 'importante', '2026-06-30 09:00');
insAnn.run('Procédure d\'urgence engagée sur la réponse humanitaire à l\'Est', 'Le Gouvernement a engagé la procédure d\'urgence sur le projet de loi PLU-2026-045. La commission Santé se réunit le 6 juillet.', 'urgente', '2026-06-28 15:00');
insAnn.run('Publication du rapport de la commission Finances', 'Le rapport sur la LFR 2026 est disponible dans la bibliothèque de documents.', 'normale', '2026-06-02 11:00');
console.log('✅ 3 annonces publiées.');

// ═══════════════════════════════════════════════════════════════
// NOTE : aucun scrutin clôturé n'est ensemencé volontairement —
// le module « Historique des votes » affichera son bandeau
// « module en cours de développement » (état vide honnête).
// ═══════════════════════════════════════════════════════════════

console.log('───────────────────────────────────────────────────');
console.log(`Mot de passe initial pour tous les comptes : "${DEFAULT_PASSWORD}"`);
console.log('⚠️  Données de DÉMONSTRATION (noms fictifs) — à remplacer');
console.log('    par les données officielles avant mise en production.');
console.log('═══════════════════════════════════════════════════');

db.close();
