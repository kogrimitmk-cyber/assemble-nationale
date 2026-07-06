"""
Peuplement de DÉMONSTRATION — AN Connect Tchad.

    python manage.py seed_demo

Crée le Bureau + un échantillon de députés, les 9 commissions
permanentes, des textes de loi (étapes/articles), l'agenda, des
documents, des pétitions et des annonces. Noms FICTIFS à remplacer
par les données officielles avant mise en production.

Idempotent : ne fait rien si des utilisateurs existent déjà.
"""
from datetime import datetime

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from comptes.models import Utilisateur
from parlement.models import (Annonce, Commission, CommissionMembre, Document,
                              Loi, LoiArticle, LoiEtape, Petition,
                              PetitionSignature, Presence, Seance)

PROVINCES = [
    "N'Djamena", 'Chari-Baguirmi', 'Ouaddaï', 'Logone Oriental', 'Logone Occidental',
    'Borkou', 'Wadi Fira', 'Mayo-Kebbi Est', 'Mayo-Kebbi Ouest', 'Moyen-Chari',
    'Tibesti', 'Lac', 'Kanem', 'Batha', 'Guéra', 'Salamat', 'Sila', 'Ennedi Est',
    'Ennedi Ouest', 'Hadjer-Lamis', 'Mandoul', 'Tandjilé', 'Barh El Gazel',
]
GROUPES = ['MPS', 'RNDT–Le Réveil', 'UNDR', 'RDP', 'Les Transformateurs', 'Indépendants']
NOMS = ['Tahir', 'Youssouf', 'Abakar', 'Mbaïro', 'Deby', 'Allamine', 'Ngarhoulem',
        'Souleymane', 'Kemkoye', 'Abdoulaye', 'Nodjigoto', 'Brahim', 'Madjitoloum',
        'Oumar', 'Djasrabé', 'Mahamat', 'Ratou', 'Weïding']
PRENOMS_F = ['Fatimé', 'Amina', 'Zara', 'Khadidja', 'Achta', 'Mariam', 'Hawa']
PRENOMS_M = ['Mahamat', 'Idriss', 'Saleh', 'Adoum', 'Béral', 'Nicolas', 'Djimet',
             'Hassane', 'Payang', 'Bichara', 'Célestin']


def dt(s):
    return timezone.make_aware(datetime.strptime(s, '%Y-%m-%d %H:%M'))


class Command(BaseCommand):
    help = 'Insère un jeu de données de démonstration.'

    def handle(self, *args, **opts):
        if Utilisateur.objects.exists():
            self.stdout.write(self.style.WARNING('[i] Base déjà initialisée — aucun ré-ensemencement.'))
            return

        mdp = settings.ADMIN_INIT_PASSWORD

        # ── 1) Comptes ────────────────────────────────────────
        bureau = [
            ('PRES-001', 'Kolotou', 'Ali', 'president', "Président de l'Assemblée Nationale", 'M', "N'Djamena", 'MPS'),
            ('VP1-001', 'Barka', 'Abdelkerim', 'vice_president', '1er Vice-Président', 'M', 'Ouaddaï', 'MPS'),
            ('VP2-001', 'Nassour', 'Fatimé', 'vice_president', '2ème Vice-Présidente', 'F', 'Logone Oriental', 'MPS'),
            ('SG-001', 'Hassan', 'Moussa', 'secretaire_general', 'Secrétaire général', 'M', 'Mayo-Kebbi Est', 'MPS'),
            ('QUEST-001', 'Djibrine', 'Omar', 'questeur', '1er Questeur', 'M', 'Moyen-Chari', 'MPS'),
        ]
        comptes = []
        for numero, nom, prenom, role, fonction, sexe, prov, grp in bureau:
            comptes.append(dict(numero_id=numero, nom=nom, prenom=prenom, role=role,
                                fonction=fonction, sexe=sexe, province=prov, groupe_parlementaire=grp))
        for i in range(18):
            femme = i % 3 == 2
            comptes.append(dict(
                numero_id=f'DEP-{i + 10:03d}', nom=NOMS[i % len(NOMS)],
                prenom=PRENOMS_F[i % len(PRENOMS_F)] if femme else PRENOMS_M[i % len(PRENOMS_M)],
                role='depute', fonction='Députée' if femme else 'Député',
                sexe='F' if femme else 'M', province=PROVINCES[i % len(PROVINCES)],
                groupe_parlementaire=GROUPES[i % len(GROUPES)]))

        users = {}
        for c in comptes:
            email = f"{c['numero_id'].lower()}@assemblee-nationale.td"
            u = Utilisateur.objects.create_user(
                c['numero_id'], c['nom'], c['prenom'], mot_de_passe=mdp, email=email,
                role=c['role'], fonction=c['fonction'], sexe=c['sexe'],
                province=c['province'], groupe_parlementaire=c['groupe_parlementaire'])
            users[c['numero_id']] = u
        self.stdout.write(f'[OK] {len(users)} comptes.')

        # ── 2) Commissions ────────────────────────────────────
        commissions = [
            ('Finances, Budget et Comptabilité publique', 'المالية والميزانية والمحاسبة العامة'),
            ('Lois constitutionnelles, Justice et Droits humains', 'القوانين الدستورية والعدل وحقوق الإنسان'),
            ('Affaires étrangères et Coopération internationale', 'الشؤون الخارجية والتعاون الدولي'),
            ('Défense, Sécurité et Anciens combattants', 'الدفاع والأمن وقدماء المحاربين'),
            ('Développement rural, Agriculture et Eau', 'التنمية الريفية والزراعة والمياه'),
            ('Santé publique et Affaires sociales', 'الصحة العامة والشؤون الاجتماعية'),
            ('Éducation, Culture et Jeunesse', 'التربية والثقافة والشباب'),
            ('Communication et Nouvelles technologies', 'الاتصال والتقنيات الحديثة'),
            ("Aménagement du territoire et Infrastructures", 'إعداد التراب والبنى التحتية'),
        ]
        coms = [Commission.objects.create(nom=fr, nom_ar=ar) for fr, ar in commissions]
        self.stdout.write(f'[OK] {len(coms)} commissions.')

        for i, u in enumerate(users.values()):
            CommissionMembre.objects.create(commission=coms[i % len(coms)], utilisateur=u,
                                            role_commission='rapporteur' if i % 7 == 0 else 'membre')
            if i % 2 == 0:
                CommissionMembre.objects.get_or_create(commission=coms[(i + 3) % len(coms)],
                                                        utilisateur=u, defaults={'role_commission': 'membre'})

        # ── 3) Lois ───────────────────────────────────────────
        lois = [
            dict(ref='PLF-2026-042', titre='Loi de finances rectificative 2026',
                 resume="Ajustement du budget de l'État pour 2026, avec renforcement des dotations aux collectivités décentralisées.",
                 type='projet', priorite='prioritaire', statut='au_vote', com=0, rap='DEP-010',
                 depose='Gouvernement — Ministère des Finances', depot='2026-05-05 09:00',
                 etapes=[('Dépôt du texte sur le bureau de l\'Assemblée', 'Transmission officielle par le Gouvernement.', '2026-05-05 09:00'),
                         ('Renvoi en commission Finances', 'Examen au fond confié à la commission des Finances.', '2026-05-07 10:30'),
                         ('Adoption du rapport en commission', 'Rapport adopté avec 4 amendements.', '2026-05-28 16:00'),
                         ('Ouverture du débat en séance plénière', 'Discussion générale, 14 orateurs inscrits.', '2026-06-10 09:00')],
                 articles=[('Article 1', 'Objet', "La présente loi porte rectification de la loi de finances initiale pour 2026."),
                           ('Article 12', 'Dotations aux collectivités provinciales', "Les dotations allouées aux collectivités décentralisées sont augmentées de 15 % pour 2026-2027."),
                           ('Article 13', 'Comité de suivi', 'Il est institué un comité de suivi interministériel qui rend son rapport sous 60 jours.')]),
            dict(ref='PLN-2026-031', titre='Loi relative à la protection des données à caractère personnel',
                 resume='Encadrement de la collecte et du traitement des données personnelles et biométriques.',
                 type='projet', priorite='normale', statut='en_commission', com=7, rap='DEP-012',
                 depose='Gouvernement — Ministère du Numérique', depot='2026-04-14 11:00',
                 etapes=[('Dépôt du texte', 'Transmission par le Gouvernement.', '2026-04-14 11:00'),
                         ('Renvoi en commission Communication et Nouvelles technologies', 'Désignation du rapporteur.', '2026-04-18 10:00')],
                 articles=[('Article 1', "Champ d'application", "La présente loi s'applique à tout traitement de données à caractère personnel sur le territoire national."),
                           ('Article 4', 'Consentement', 'Tout traitement requiert le consentement libre, éclairé et révocable de la personne concernée.')]),
            dict(ref='PPL-2026-028', titre='Proposition de loi portant révision du Code de la décentralisation',
                 resume='Clarification des compétences transférées aux communes et renforcement de la fiscalité locale.',
                 type='proposition', priorite='normale', statut='en_debat', com=8, rap='DEP-014',
                 depose='Groupe parlementaire RNDT–Le Réveil', depot='2026-03-02 10:00',
                 etapes=[('Dépôt de la proposition', 'Déposée par 24 députés.', '2026-03-02 10:00'),
                         ('Renvoi en commission Aménagement du territoire', '', '2026-03-06 09:00'),
                         ('Adoption du rapport en commission', 'Rapport adopté à l\'unanimité.', '2026-05-20 15:00')],
                 articles=[('Article 2', 'Compétences communales', 'Les communes exercent les compétences en matière d\'état civil, de voirie communale et de marchés publics locaux.')]),
            dict(ref='PLU-2026-045', titre="Loi d'urgence sur la réponse humanitaire dans les provinces de l'Est",
                 resume="Mesures exceptionnelles de financement et de coordination de l'aide humanitaire.",
                 type='projet', priorite='urgence_nationale', statut='depose', com=5, rap=None,
                 depose='Gouvernement — Primature', depot='2026-06-28 08:30',
                 etapes=[('Dépôt du texte en procédure d\'urgence', 'Article 132 du Règlement intérieur.', '2026-06-28 08:30')],
                 articles=[]),
            dict(ref='PLE-2025-019', titre='Loi portant statut des chefferies traditionnelles',
                 resume='Reconnaissance et organisation du rôle des autorités traditionnelles et coutumières.',
                 type='projet', priorite='normale', statut='promulgue', com=1, rap='DEP-016',
                 depose="Gouvernement — Ministère de l'Administration du territoire", depot='2025-10-08 10:00',
                 etapes=[('Dépôt du texte', '', '2025-10-08 10:00'),
                         ('Renvoi en commission Lois constitutionnelles', '', '2025-10-12 09:00'),
                         ('Adoption du rapport en commission', '', '2025-11-30 14:00'),
                         ('Débat en séance plénière', '', '2025-12-10 09:00'),
                         ('Adoption en séance plénière', '132 pour, 21 contre, 9 abstentions.', '2025-12-12 17:45'),
                         ('Promulgation au Journal officiel', 'Loi n°019/PR/2025.', '2026-01-05 00:00')],
                 articles=[('Article 1', 'Objet', 'La présente loi fixe le statut des autorités traditionnelles et coutumières de la République du Tchad.')]),
        ]
        objets_lois = {}
        for l in lois:
            loi = Loi.objects.create(
                numero_reference=l['ref'], titre=l['titre'], resume=l['resume'],
                type_texte=l['type'], priorite=l['priorite'], statut=l['statut'],
                commission=coms[l['com']], rapporteur=users.get(l['rap']) if l['rap'] else None,
                depose_par=l['depose'], date_depot=dt(l['depot']))
            for lib, desc, d in l['etapes']:
                LoiEtape.objects.create(loi=loi, libelle=lib, description=desc, date_etape=dt(d))
            for num, titre, contenu in l['articles']:
                LoiArticle.objects.create(loi=loi, numero=num, titre=titre, contenu=contenu)
            objets_lois[l['ref']] = loi
        self.stdout.write(f'[OK] {len(lois)} textes de loi.')

        # ── 4) Agenda ─────────────────────────────────────────
        seances = [
            ('Séance plénière n°11 — Examen de la LFR 2026', 'seance_pleniere', 'terminee', '2026-06-10 09:00', '2026-06-10 13:30', 'Hémicycle — Palais de la Démocratie', None, "Discussion générale (suite)\nExamen des articles 1 à 8\nQuestions au Gouvernement"),
            ('Commission Finances — Audition du Ministre du Budget', 'commission', 'terminee', '2026-06-24 14:00', '2026-06-24 17:00', 'Salle A — Palais de la Démocratie', 0, 'Audition du Ministre\nExamen des amendements'),
            ('Séance plénière n°12 — Vote solennel de la LFR 2026', 'seance_pleniere', 'prevue', '2026-07-08 09:00', None, 'Hémicycle — Palais de la Démocratie', None, 'Explications de vote\nScrutin public solennel'),
            ('Commission Santé — Examen PLU-2026-045 (urgence)', 'commission', 'prevue', '2026-07-06 10:00', None, 'Salle C — Palais de la Démocratie', 5, 'Désignation du rapporteur\nCalendrier d\'examen accéléré'),
            ('Cérémonie — Ouverture de la session extraordinaire', 'ceremonie', 'prevue', '2026-07-15 10:00', None, 'Palais de la Démocratie', None, ''),
        ]
        premiere = None
        for titre, typ, statut, deb, fin, lieu, com, odj in seances:
            s = Seance.objects.create(titre=titre, type_evenement=typ, statut=statut,
                                      date_debut=dt(deb), date_fin=dt(fin) if fin else None,
                                      lieu=lieu, commission=coms[com] if com is not None else None,
                                      ordre_du_jour=odj)
            if premiere is None:
                premiere = s
        for i, u in enumerate(users.values()):
            Presence.objects.create(seance=premiere, depute=u,
                                    statut='excuse' if i % 6 == 5 else 'present')
        self.stdout.write(f'[OK] {len(seances)} séances.')

        # ── 5) Documents ──────────────────────────────────────
        docs = [
            ("Règlement intérieur de l'Assemblée Nationale (édition 2025)", 'reglement', '/documents/reglement-interieur-2025.pdf', 2140, 'public', None),
            ('Loi n°019/PR/2025 portant statut des chefferies traditionnelles', 'loi_adoptee', '/documents/loi-019-2025.pdf', 890, 'public', 'PLE-2025-019'),
            ('Rapport de la commission Finances sur la LFR 2026', 'rapport', '/documents/rapport-lfr-2026.pdf', 3420, 'public', 'PLF-2026-042'),
            ('Procès-verbal — Séance plénière n°11', 'proces_verbal', '/documents/pv-seance-11.pdf', 1260, 'interne', None),
            ('Ordre du jour prévisionnel — Session extraordinaire', 'ordre_du_jour', '/documents/odj-session-extra.pdf', 320, 'interne', None),
            ('Note confidentielle — Sécurité du Palais de la Démocratie', 'autre', '/documents/note-securite.pdf', 540, 'confidentiel', None),
        ]
        for titre, cat, url, taille, acces, ref in docs:
            Document.objects.create(titre=titre, categorie=cat, fichier_url=url, taille_ko=taille,
                                    acces=acces, loi=objets_lois.get(ref))
        self.stdout.write(f'[OK] {len(docs)} documents.')

        # ── 6) Pétitions ──────────────────────────────────────
        petitions = [
            ("Accès à l'eau potable dans la province du Lac", "Demande de programme d'urgence pour la réalisation de forages dans les zones insulaires.", 'Lac', 2000, 'active', 4, '2026-05-12 10:00', 1248),
            ('Réhabilitation des routes rurales du Logone Oriental', "Les axes Doba–Bébédjia sont impraticables en saison des pluies.", 'Logone Oriental', 1500, 'active', 8, '2026-05-28 10:00', 876),
            ('Écoles de proximité dans le Tibesti', "Construction d'écoles primaires dans les localités enclavées.", 'Tibesti', 1000, 'traitee', 6, '2026-03-15 10:00', 1043),
        ]
        for pi, (titre, desc, prov, obj, st, com, dc, nsig) in enumerate(petitions):
            p = Petition.objects.create(titre=titre, description=desc, province=prov,
                                        objectif_signatures=obj, statut=st, commission=coms[com],
                                        date_creation=dt(dc))
            PetitionSignature.objects.bulk_create([
                PetitionSignature(petition=p, nom_complet=f'Signataire {i + 1}', contact=f'sig-{pi}-{i}@demo.td')
                for i in range(nsig)])
        self.stdout.write(f'[OK] {len(petitions)} pétitions.')

        # ── 7) Annonces ───────────────────────────────────────
        annonces = [
            ('Vote solennel de la loi de finances rectificative le 8 juillet', 'Le scrutin public solennel sur l\'ensemble de la LFR 2026 se tiendra en séance plénière le mercredi 8 juillet à 9 h 00.', 'importante', '2026-06-30 09:00'),
            ('Procédure d\'urgence engagée sur la réponse humanitaire à l\'Est', 'Le Gouvernement a engagé la procédure d\'urgence sur le projet PLU-2026-045. La commission Santé se réunit le 6 juillet.', 'urgente', '2026-06-28 15:00'),
            ('Publication du rapport de la commission Finances', 'Le rapport sur la LFR 2026 est disponible dans la bibliothèque de documents.', 'normale', '2026-06-02 11:00'),
        ]
        for titre, contenu, prio, d in annonces:
            Annonce.objects.create(titre=titre, contenu=contenu, priorite=prio, date_publication=dt(d))
        self.stdout.write(f'[OK] {len(annonces)} annonces.')

        self.stdout.write(self.style.SUCCESS(
            f'\nInitialisation terminée. Mot de passe initial : « {mdp} »'))
        self.stdout.write(self.style.WARNING(
            '[!] Données de DÉMONSTRATION (noms fictifs) — à remplacer avant production.'))
