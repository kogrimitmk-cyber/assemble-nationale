-- ═══════════════════════════════════════════════════════════════
-- SCHÉMA DE BASE DE DONNÉES — AN Connect Tchad
-- Plateforme numérique de l'Assemblée Nationale de la Rép. du Tchad
-- ═══════════════════════════════════════════════════════════════
-- SQLite : un simple fichier (db/assemblee.db). La structure reste
-- transposable vers PostgreSQL/MySQL sans réécriture majeure.
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- TABLE : utilisateurs
-- Président, Vice-présidents, Secrétaires, Questeurs, Députés,
-- personnel administratif, citoyens inscrits.
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS utilisateurs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_id       TEXT UNIQUE,              -- matricule (ex: DEP-014)
  nom             TEXT NOT NULL,
  prenom          TEXT NOT NULL,
  email           TEXT UNIQUE,
  mot_de_passe    TEXT NOT NULL,            -- haché bcrypt, jamais en clair
  role            TEXT NOT NULL CHECK(role IN (
                    'president','vice_president','secretaire_general',
                    'questeur','depute','administration','citoyen'
                  )),
  fonction        TEXT,                     -- ex: "2ème Vice-Présidente"
  sexe            TEXT CHECK(sexe IN ('F','M')),
  province        TEXT,                     -- circonscription / province
  groupe_parlementaire TEXT,
  photo_url       TEXT,
  biographie      TEXT,
  -- Sécurité
  totp_secret     TEXT,                     -- secret 2FA (Base32)
  totp_active     INTEGER NOT NULL DEFAULT 0,
  doit_changer_mdp INTEGER NOT NULL DEFAULT 1,
  -- Statut du compte
  actif           INTEGER NOT NULL DEFAULT 1,
  date_creation   TEXT NOT NULL DEFAULT (datetime('now')),
  derniere_connexion TEXT
);

CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_numero ON utilisateurs(numero_id);

-- ───────────────────────────────────────────────────────────────
-- TABLE : connexions_log — journal des connexions (suivi SG)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS connexions_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id  INTEGER NOT NULL REFERENCES utilisateurs(id),
  date_connexion  TEXT NOT NULL DEFAULT (datetime('now')),
  date_deconnexion TEXT,
  adresse_ip      TEXT,
  user_agent      TEXT
);

CREATE INDEX IF NOT EXISTS idx_connexions_user ON connexions_log(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_connexions_date ON connexions_log(date_connexion);

-- ───────────────────────────────────────────────────────────────
-- TABLE : commissions — commissions permanentes
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commissions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nom             TEXT NOT NULL,
  nom_ar          TEXT,                     -- traduction arabe
  description     TEXT,
  president_id    INTEGER REFERENCES utilisateurs(id)
);

CREATE TABLE IF NOT EXISTS commission_membres (
  commission_id   INTEGER NOT NULL REFERENCES commissions(id),
  utilisateur_id  INTEGER NOT NULL REFERENCES utilisateurs(id),
  role_commission TEXT CHECK(role_commission IN ('president','vice_president','rapporteur','membre')) DEFAULT 'membre',
  PRIMARY KEY (commission_id, utilisateur_id)
);

-- ───────────────────────────────────────────────────────────────
-- TABLE : seances — agenda parlementaire (plénières, commissions…)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seances (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  titre           TEXT NOT NULL,
  description     TEXT,
  type_evenement  TEXT CHECK(type_evenement IN (
                    'seance_pleniere','commission','reunion','ceremonie','autre'
                  )) DEFAULT 'autre',
  statut          TEXT CHECK(statut IN ('prevue','en_cours','terminee','annulee')) DEFAULT 'prevue',
  date_debut      TEXT NOT NULL,            -- ISO : YYYY-MM-DD HH:MM
  date_fin        TEXT,
  lieu            TEXT,
  commission_id   INTEGER REFERENCES commissions(id),
  ordre_du_jour   TEXT,                     -- points séparés par des sauts de ligne
  cree_par        INTEGER REFERENCES utilisateurs(id),
  date_creation   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_seances_date ON seances(date_debut);

-- ───────────────────────────────────────────────────────────────
-- TABLE : presences — émargement des députés par séance
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS presences (
  seance_id       INTEGER NOT NULL REFERENCES seances(id),
  depute_id       INTEGER NOT NULL REFERENCES utilisateurs(id),
  statut          TEXT CHECK(statut IN ('present','absent','excuse')) DEFAULT 'present',
  PRIMARY KEY (seance_id, depute_id)
);

-- ───────────────────────────────────────────────────────────────
-- TABLE : lois — projets et propositions de loi
-- Étapes du parcours : depose → en_commission → en_debat → au_vote
--                      → adopte → promulgue  (ou rejete / retire)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lois (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_reference TEXT UNIQUE,             -- ex: PL-2026-014
  titre           TEXT NOT NULL,
  resume          TEXT,
  type_texte      TEXT CHECK(type_texte IN ('projet','proposition')) DEFAULT 'projet',
  priorite        TEXT CHECK(priorite IN ('normale','prioritaire','urgence_nationale')) DEFAULT 'normale',
  statut          TEXT CHECK(statut IN (
                    'depose','en_commission','en_debat','au_vote',
                    'adopte','promulgue','rejete','retire'
                  )) DEFAULT 'depose',
  commission_id   INTEGER REFERENCES commissions(id),
  rapporteur_id   INTEGER REFERENCES utilisateurs(id),
  depose_par      TEXT,                     -- ex: "Gouvernement — Min. des Finances"
  date_depot      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Fil des étapes franchies par un texte (timeline du détail de loi)
CREATE TABLE IF NOT EXISTS loi_etapes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  loi_id          INTEGER NOT NULL REFERENCES lois(id),
  libelle         TEXT NOT NULL,            -- ex: "Renvoi en commission Finances"
  description     TEXT,
  date_etape      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_etapes_loi ON loi_etapes(loi_id);

-- Articles d'un texte de loi
CREATE TABLE IF NOT EXISTS loi_articles (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  loi_id          INTEGER NOT NULL REFERENCES lois(id),
  numero          TEXT NOT NULL,            -- ex: "Article 12"
  titre           TEXT,
  contenu         TEXT
);

CREATE INDEX IF NOT EXISTS idx_articles_loi ON loi_articles(loi_id);

-- ───────────────────────────────────────────────────────────────
-- TABLES : scrutins (sessions de vote) + bulletins
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes_sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  loi_id          INTEGER REFERENCES lois(id),
  seance_id       INTEGER REFERENCES seances(id),
  titre           TEXT NOT NULL,
  ouvert          INTEGER NOT NULL DEFAULT 1,
  date_ouverture  TEXT NOT NULL DEFAULT (datetime('now')),
  date_cloture    TEXT
);

CREATE TABLE IF NOT EXISTS votes_bulletins (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      INTEGER NOT NULL REFERENCES votes_sessions(id),
  depute_id       INTEGER NOT NULL REFERENCES utilisateurs(id),
  choix           TEXT NOT NULL CHECK(choix IN ('POUR','CONTRE','ABSTENTION')),
  date_vote       TEXT NOT NULL DEFAULT (datetime('now')),
  hash_verif      TEXT,                     -- empreinte d'intégrité
  UNIQUE(session_id, depute_id)
);

-- ───────────────────────────────────────────────────────────────
-- TABLE : documents — bibliothèque documentaire
-- acces : public (tous) · interne (connectés) · confidentiel (bureau)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  titre           TEXT NOT NULL,
  categorie       TEXT CHECK(categorie IN (
                    'loi_adoptee','rapport','proces_verbal','reglement','ordre_du_jour','autre'
                  )) DEFAULT 'autre',
  fichier_url     TEXT NOT NULL,
  taille_ko       INTEGER,
  acces           TEXT CHECK(acces IN ('public','interne','confidentiel')) DEFAULT 'public',
  loi_id          INTEGER REFERENCES lois(id),
  uploade_par     INTEGER REFERENCES utilisateurs(id),
  date_upload     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ───────────────────────────────────────────────────────────────
-- TABLE : petitions + signatures (espace citoyen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS petitions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  titre           TEXT NOT NULL,
  description     TEXT,
  province        TEXT,
  objectif_signatures INTEGER NOT NULL DEFAULT 1000,
  statut          TEXT CHECK(statut IN ('active','cloturee','traitee')) DEFAULT 'active',
  commission_id   INTEGER REFERENCES commissions(id),
  date_creation   TEXT NOT NULL DEFAULT (datetime('now')),
  date_fin        TEXT
);

CREATE TABLE IF NOT EXISTS petition_signatures (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  petition_id     INTEGER NOT NULL REFERENCES petitions(id),
  nom_complet     TEXT NOT NULL,
  contact         TEXT,                     -- téléphone ou email
  date_signature  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(petition_id, contact)
);

-- ───────────────────────────────────────────────────────────────
-- TABLE : messages_citoyens — interpellation d'un député / commission
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages_citoyens (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nom_complet     TEXT NOT NULL,
  contact         TEXT,
  province        TEXT,
  sujet           TEXT NOT NULL,
  message         TEXT NOT NULL,
  depute_id       INTEGER REFERENCES utilisateurs(id),
  commission_id   INTEGER REFERENCES commissions(id),
  statut          TEXT CHECK(statut IN ('nouvelle','en_cours','traitee','classee')) DEFAULT 'nouvelle',
  date_soumission TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ───────────────────────────────────────────────────────────────
-- TABLE : annonces — actualités et communiqués officiels
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS annonces (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  titre           TEXT NOT NULL,
  contenu         TEXT NOT NULL,
  priorite        TEXT CHECK(priorite IN ('normale','importante','urgente')) DEFAULT 'normale',
  cible_role      TEXT DEFAULT 'tous',
  cree_par        INTEGER REFERENCES utilisateurs(id),
  date_publication TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ───────────────────────────────────────────────────────────────
-- TABLE : notifications — messages individuels internes
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  destinataire_id INTEGER NOT NULL REFERENCES utilisateurs(id),
  expediteur_id   INTEGER REFERENCES utilisateurs(id),
  titre           TEXT NOT NULL,
  message         TEXT NOT NULL,
  lue             INTEGER NOT NULL DEFAULT 0,
  date_envoi      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notif_destinataire ON notifications(destinataire_id);

-- ───────────────────────────────────────────────────────────────
-- TABLE : operations_financieres — module Questure
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operations_financieres (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  type_operation  TEXT CHECK(type_operation IN ('recette','depense')) NOT NULL,
  montant         REAL NOT NULL,
  devise          TEXT NOT NULL DEFAULT 'XAF',
  motif           TEXT NOT NULL,
  statut          TEXT CHECK(statut IN ('en_attente','approuvee','rejetee')) DEFAULT 'approuvee',
  enregistre_par  INTEGER NOT NULL REFERENCES utilisateurs(id),
  approuve_par    INTEGER REFERENCES utilisateurs(id),
  date_operation  TEXT NOT NULL DEFAULT (datetime('now')),
  piece_justificative_url TEXT
);
