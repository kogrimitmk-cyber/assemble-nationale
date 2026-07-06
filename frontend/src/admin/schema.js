// Definition declarative des modules du back-office.
// Chaque module : endpoint, colonnes de liste, champs de formulaire,
// et eventuelles sous-collections (membres, articles, etapes, documents).

const nomDepute = (o) => `${o.prenom} ${o.nom} (${o.numero_id})`;
const nomLoi = (o) => `${o.numero_reference} — ${o.titre}`;

// Sources pour les listes deroulantes liees (cle etrangere).
export const SOURCES = {
  commissions: { ressource: 'commissions', label: (o) => o.nom },
  deputes: { ressource: 'deputes', label: nomDepute },
  lois: { ressource: 'lois', label: nomLoi },
  seances: { ressource: 'seances', label: (o) => o.titre },
};

const CHOIX = {
  sexe: [['F', 'Femme'], ['M', 'Homme']],
  role: [['depute', 'Député'], ['president', 'Président'], ['vice_president', 'Vice-président'],
         ['secretaire_general', 'Secrétaire général'], ['questeur', 'Questeur'],
         ['administration', 'Administration']],
  type_evenement: [['seance_pleniere', 'Séance plénière'], ['commission', 'Commission'],
                   ['reunion', 'Réunion'], ['ceremonie', 'Cérémonie'], ['autre', 'Autre']],
  seance_statut: [['prevue', 'À venir'], ['en_cours', 'En cours'],
                  ['terminee', 'Terminée'], ['annulee', 'Annulée']],
  type_texte: [['projet', 'Projet de loi'], ['proposition', 'Proposition de loi']],
  priorite_loi: [['normale', 'Normale'], ['prioritaire', 'Prioritaire'],
                 ['urgence_nationale', 'Urgence nationale']],
  loi_statut: [['depose', 'Déposé'], ['en_commission', 'En commission'], ['en_debat', 'En débat'],
               ['au_vote', 'Au vote'], ['adopte', 'Adopté'], ['promulgue', 'Promulgué'],
               ['rejete', 'Rejeté'], ['retire', 'Retiré']],
  type_session: [['ordinaire', 'Session ordinaire'], ['extraordinaire', 'Session extraordinaire']],
  resultat: [['en_attente', 'En attente'], ['adopte', 'Adopté'], ['rejete', 'Rejeté']],
  numerisation: [['numerise', 'Numérisé'], ['en_cours', 'En cours de numérisation']],
  priorite_annonce: [['normale', 'Normale'], ['importante', 'Importante'], ['urgente', 'Urgente']],
  doc_categorie: [['loi_adoptee', 'Loi adoptée'], ['rapport', 'Rapport'],
                  ['proces_verbal', 'Procès-verbal'], ['reglement', 'Règlement'],
                  ['ordre_du_jour', 'Ordre du jour'], ['autre', 'Autre']],
  doc_acces: [['public', 'Public'], ['interne', 'Interne'], ['confidentiel', 'Confidentiel']],
  membre_role: [['president', 'Président'], ['vice_president', 'Vice-président'],
                ['rapporteur', 'Rapporteur'], ['membre', 'Membre']],
};
export { CHOIX };

const label = (choix, val) => (choix.find((c) => c[0] === val) || [null, val])[1];

export const MODULES = {
  deputes: {
    titre: 'Députés', icone: 'users-three', ressource: 'deputes', cle_recherche: 'q',
    colonnes: [
      { cle: 'numero_id', libelle: 'Matricule' },
      { cle: 'nom', libelle: 'Nom', rendu: (r) => `${r.prenom} ${r.nom}` },
      { cle: 'groupe_parlementaire', libelle: 'Groupe' },
      { cle: 'province', libelle: 'Province' },
    ],
    champs: [
      { nom: 'numero_id', libelle: 'Matricule', requis: true, aide: 'Identifiant unique, ex. DEP-014' },
      { nom: 'nom', libelle: 'Nom', requis: true },
      { nom: 'prenom', libelle: 'Prénom', requis: true },
      { nom: 'sexe', libelle: 'Sexe', type: 'select', choix: CHOIX.sexe },
      { nom: 'role', libelle: 'Rôle', type: 'select', choix: CHOIX.role, defaut: 'depute' },
      { nom: 'fonction', libelle: 'Fonction', aide: 'Ex. Président de commission, Rapporteur' },
      { nom: 'groupe_parlementaire', libelle: 'Groupe parlementaire', aide: 'Ex. MPS, RNDT' },
      { nom: 'province', libelle: 'Province' },
      { nom: 'circonscription', libelle: 'Circonscription' },
      { nom: 'email', libelle: 'Email', type: 'email' },
      { nom: 'biographie', libelle: 'Biographie courte', type: 'textarea' },
      { nom: 'photo', libelle: 'Photo', type: 'file', accept: 'image/*', apercu: 'photo_url_effective' },
      { nom: 'mot_de_passe', libelle: 'Mot de passe', type: 'password',
        aide: 'Optionnel — laisser vide pour ne pas définir/modifier' },
    ],
  },

  commissions: {
    titre: 'Commissions', icone: 'scales', ressource: 'commissions',
    colonnes: [
      { cle: 'nom', libelle: 'Nom' },
      { cle: 'president_nom', libelle: 'Président' },
      { cle: 'nb_membres', libelle: 'Membres' },
    ],
    champs: [
      { nom: 'nom', libelle: 'Nom', requis: true },
      { nom: 'nom_ar', libelle: 'Nom (arabe)', dir: 'rtl' },
      { nom: 'president', libelle: 'Président', type: 'fk', source: 'deputes' },
      { nom: 'description', libelle: 'Description', type: 'textarea' },
    ],
    sous: [
      { titre: 'Membres', ressource: 'membres-commission', parent: 'commission',
        colonnes: [{ cle: 'utilisateur_nom', libelle: 'Député' },
                   { cle: 'role_commission', libelle: 'Rôle', rendu: (r) => label(CHOIX.membre_role, r.role_commission) }],
        champs: [{ nom: 'utilisateur', libelle: 'Député', type: 'fk', source: 'deputes', requis: true },
                 { nom: 'role_commission', libelle: 'Rôle', type: 'select', choix: CHOIX.membre_role, defaut: 'membre' }] },
    ],
  },

  seances: {
    titre: 'Séances / Agenda', icone: 'calendar-dots', ressource: 'seances',
    colonnes: [
      { cle: 'titre', libelle: 'Titre' },
      { cle: 'type_evenement', libelle: 'Type', rendu: (r) => label(CHOIX.type_evenement, r.type_evenement) },
      { cle: 'statut', libelle: 'Statut', rendu: (r) => label(CHOIX.seance_statut, r.statut) },
      { cle: 'date_debut', libelle: 'Début', type: 'datetime' },
      { cle: 'lieu', libelle: 'Lieu' },
    ],
    champs: [
      { nom: 'titre', libelle: 'Titre', requis: true },
      { nom: 'type_evenement', libelle: 'Type', type: 'select', choix: CHOIX.type_evenement, defaut: 'seance_pleniere' },
      { nom: 'statut', libelle: 'Statut', type: 'select', choix: CHOIX.seance_statut, defaut: 'prevue' },
      { nom: 'date_debut', libelle: 'Date et heure de début', type: 'datetime', requis: true },
      { nom: 'date_fin', libelle: 'Date et heure de fin', type: 'datetime' },
      { nom: 'lieu', libelle: 'Lieu' },
      { nom: 'commission', libelle: 'Commission', type: 'fk', source: 'commissions' },
      { nom: 'description', libelle: 'Description', type: 'textarea' },
      { nom: 'ordre_du_jour', libelle: 'Ordre du jour', type: 'textarea', aide: 'Un point discuté par ligne' },
    ],
  },

  lois: {
    titre: 'Projets & propositions de loi', icone: 'gavel', ressource: 'lois', cle_recherche: 'q',
    colonnes: [
      { cle: 'numero_reference', libelle: 'Référence' },
      { cle: 'titre', libelle: 'Titre' },
      { cle: 'statut', libelle: 'Étape', rendu: (r) => label(CHOIX.loi_statut, r.statut) },
      { cle: 'priorite', libelle: 'Priorité', rendu: (r) => label(CHOIX.priorite_loi, r.priorite) },
    ],
    champs: [
      { nom: 'numero_reference', libelle: 'Référence', requis: true, aide: 'Ex. PLT-2026-042' },
      { nom: 'titre', libelle: 'Titre', requis: true },
      { nom: 'type_texte', libelle: 'Type', type: 'select', choix: CHOIX.type_texte, defaut: 'projet' },
      { nom: 'priorite', libelle: 'Priorité', type: 'select', choix: CHOIX.priorite_loi, defaut: 'normale' },
      { nom: 'statut', libelle: 'Étape législative', type: 'select', choix: CHOIX.loi_statut, defaut: 'depose',
        aide: 'Dépôt → Commission → Plénière → Vote → Promulgation' },
      { nom: 'commission', libelle: 'Commission en charge', type: 'fk', source: 'commissions' },
      { nom: 'rapporteur', libelle: 'Rapporteur', type: 'fk', source: 'deputes' },
      { nom: 'depose_par', libelle: 'Déposé par' },
      { nom: 'date_depot', libelle: 'Date de dépôt', type: 'datetime', requis: true },
      { nom: 'resume', libelle: 'Résumé', type: 'textarea' },
    ],
    sous: [
      { titre: 'Articles du texte', ressource: 'articles-loi', parent: 'loi',
        colonnes: [{ cle: 'numero', libelle: 'N°' }, { cle: 'titre', libelle: 'Titre' }],
        champs: [{ nom: 'numero', libelle: 'Numéro', requis: true, aide: 'Ex. Article 1' },
                 { nom: 'titre', libelle: 'Intitulé' },
                 { nom: 'contenu', libelle: 'Contenu', type: 'textarea' }] },
      { titre: 'Étapes (dates de franchissement)', ressource: 'etapes-loi', parent: 'loi',
        colonnes: [{ cle: 'libelle', libelle: 'Étape' }, { cle: 'date_etape', libelle: 'Date', type: 'datetime' }],
        champs: [{ nom: 'libelle', libelle: 'Étape', requis: true, aide: 'Ex. Adoption en plénière' },
                 { nom: 'date_etape', libelle: 'Date', type: 'datetime', requis: true },
                 { nom: 'description', libelle: 'Description', type: 'textarea' }] },
      { titre: 'Documents associés (PDF)', ressource: 'documents', parent: 'loi',
        colonnes: [{ cle: 'titre', libelle: 'Titre' },
                   { cle: 'categorie', libelle: 'Catégorie', rendu: (r) => label(CHOIX.doc_categorie, r.categorie) }],
        champs: [{ nom: 'titre', libelle: 'Titre', requis: true },
                 { nom: 'categorie', libelle: 'Catégorie', type: 'select', choix: CHOIX.doc_categorie, defaut: 'rapport' },
                 { nom: 'acces', libelle: 'Accès', type: 'select', choix: CHOIX.doc_acces, defaut: 'public' },
                 { nom: 'fichier', libelle: 'Fichier PDF', type: 'file', accept: 'application/pdf', apercu: 'fichier_url_effective' }] },
    ],
  },

  scrutins: {
    titre: 'Votes / Scrutins', icone: 'chart-bar', ressource: 'scrutins',
    colonnes: [
      { cle: 'titre', libelle: 'Titre' },
      { cle: 'type_session', libelle: 'Session', rendu: (r) => label(CHOIX.type_session, r.type_session) },
      { cle: 'resultat', libelle: 'Résultat', rendu: (r) => label(CHOIX.resultat, r.statut_resultat) },
      { cle: 'score', libelle: 'Pour / Contre / Abst.', rendu: (r) => `${r.nb_pour} / ${r.nb_contre} / ${r.nb_abstention}` },
      { cle: 'statut_numerisation', libelle: 'Numérisation', rendu: (r) => label(CHOIX.numerisation, r.statut_numerisation) },
    ],
    champs: [
      { nom: 'titre', libelle: 'Titre du scrutin', requis: true },
      { nom: 'loi', libelle: 'Loi concernée', type: 'fk', source: 'lois' },
      { nom: 'seance', libelle: 'Séance', type: 'fk', source: 'seances' },
      { nom: 'type_session', libelle: 'Type de session', type: 'select', choix: CHOIX.type_session, defaut: 'ordinaire' },
      { nom: 'date_scrutin', libelle: 'Date du scrutin', type: 'datetime' },
      { nom: 'nb_pour', libelle: 'Voix pour', type: 'number', defaut: 0 },
      { nom: 'nb_contre', libelle: 'Voix contre', type: 'number', defaut: 0 },
      { nom: 'nb_abstention', libelle: 'Abstentions', type: 'number', defaut: 0 },
      { nom: 'statut_resultat', libelle: 'Résultat', type: 'select', choix: CHOIX.resultat, defaut: 'en_attente' },
      { nom: 'statut_numerisation', libelle: 'Numérisation', type: 'select', choix: CHOIX.numerisation, defaut: 'numerise' },
    ],
  },

  actualites: {
    titre: 'Actualités', icone: 'newspaper', ressource: 'actualites',
    colonnes: [
      { cle: 'titre', libelle: 'Titre' },
      { cle: 'priorite', libelle: 'Priorité', rendu: (r) => label(CHOIX.priorite_annonce, r.priorite) },
      { cle: 'date_publication', libelle: 'Publication', type: 'datetime' },
    ],
    champs: [
      { nom: 'titre', libelle: 'Titre', requis: true },
      { nom: 'image', libelle: 'Image', type: 'file', accept: 'image/*', apercu: 'image_url' },
      { nom: 'contenu', libelle: 'Contenu', type: 'textarea', requis: true },
      { nom: 'priorite', libelle: 'Priorité', type: 'select', choix: CHOIX.priorite_annonce, defaut: 'normale' },
      { nom: 'cible_role', libelle: 'Cible', defaut: 'tous', aide: 'tous, citoyen, depute…' },
      { nom: 'date_publication', libelle: 'Date de publication', type: 'datetime', requis: true },
    ],
  },
};

export const ORDRE = ['deputes', 'commissions', 'seances', 'lois', 'scrutins', 'actualites'];
export { label };
