"""
Modèles métier — Assemblée Nationale du Tchad.
Commissions, séances, lois (étapes/articles), scrutins, documents,
pétitions, messages citoyens, annonces, finances.
"""
from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class Commission(models.Model):
    nom = models.CharField(max_length=200)
    nom_ar = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    president = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='commissions_presidees')

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.nom


class CommissionMembre(models.Model):
    ROLES = [('president', 'Président'), ('vice_president', 'Vice-président'),
             ('rapporteur', 'Rapporteur'), ('membre', 'Membre')]
    commission = models.ForeignKey(Commission, on_delete=models.CASCADE, related_name='membres')
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='commissions')
    role_commission = models.CharField(max_length=20, choices=ROLES, default='membre')

    class Meta:
        unique_together = ('commission', 'utilisateur')


class Seance(models.Model):
    TYPES = [('seance_pleniere', 'Séance plénière'), ('commission', 'Commission'),
             ('reunion', 'Réunion'), ('ceremonie', 'Cérémonie'), ('autre', 'Autre')]
    STATUTS = [('prevue', 'Prévue'), ('en_cours', 'En cours'),
               ('terminee', 'Terminée'), ('annulee', 'Annulée')]
    titre = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    type_evenement = models.CharField(max_length=20, choices=TYPES, default='autre')
    statut = models.CharField(max_length=12, choices=STATUTS, default='prevue')
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField(null=True, blank=True)
    lieu = models.CharField(max_length=200, blank=True)
    commission = models.ForeignKey(Commission, null=True, blank=True, on_delete=models.SET_NULL, related_name='seances')
    ordre_du_jour = models.TextField(blank=True)
    cree_par = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='seances_creees')
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date_debut']

    def __str__(self):
        return self.titre


class Presence(models.Model):
    STATUTS = [('present', 'Présent'), ('absent', 'Absent'), ('excuse', 'Excusé')]
    seance = models.ForeignKey(Seance, on_delete=models.CASCADE, related_name='presences')
    depute = models.ForeignKey(User, on_delete=models.CASCADE, related_name='presences')
    statut = models.CharField(max_length=10, choices=STATUTS, default='present')

    class Meta:
        unique_together = ('seance', 'depute')


class Loi(models.Model):
    TYPES = [('projet', 'Projet de loi'), ('proposition', 'Proposition de loi')]
    PRIORITES = [('normale', 'Normale'), ('prioritaire', 'Prioritaire'),
                 ('urgence_nationale', 'Urgence nationale')]
    STATUTS = [('depose', 'Déposé'), ('en_commission', 'En commission'),
               ('en_debat', 'En débat'), ('au_vote', 'Au vote'),
               ('adopte', 'Adopté'), ('promulgue', 'Promulgué'),
               ('rejete', 'Rejeté'), ('retire', 'Retiré')]
    numero_reference = models.CharField(max_length=40, unique=True)
    titre = models.CharField(max_length=400)
    resume = models.TextField(blank=True)
    type_texte = models.CharField(max_length=12, choices=TYPES, default='projet')
    priorite = models.CharField(max_length=20, choices=PRIORITES, default='normale')
    statut = models.CharField(max_length=15, choices=STATUTS, default='depose')
    commission = models.ForeignKey(Commission, null=True, blank=True, on_delete=models.SET_NULL, related_name='lois')
    rapporteur = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='lois_rapportees')
    depose_par = models.CharField(max_length=200, blank=True)
    date_depot = models.DateTimeField()

    class Meta:
        ordering = ['-date_depot']

    def __str__(self):
        return f'{self.numero_reference} — {self.titre}'


class LoiEtape(models.Model):
    loi = models.ForeignKey(Loi, on_delete=models.CASCADE, related_name='etapes')
    libelle = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    date_etape = models.DateTimeField()

    class Meta:
        ordering = ['date_etape']


class LoiArticle(models.Model):
    loi = models.ForeignKey(Loi, on_delete=models.CASCADE, related_name='articles')
    numero = models.CharField(max_length=40)
    titre = models.CharField(max_length=200, blank=True)
    contenu = models.TextField(blank=True)

    class Meta:
        ordering = ['id']


class VoteSession(models.Model):
    TYPES_SESSION = [('ordinaire', 'Session ordinaire'), ('extraordinaire', 'Session extraordinaire')]
    RESULTATS = [('en_attente', 'En attente'), ('adopte', 'Adopté'), ('rejete', 'Rejeté')]
    NUMERISATION = [('numerise', 'Numérisé'), ('en_cours', 'En cours de numérisation')]

    loi = models.ForeignKey(Loi, null=True, blank=True, on_delete=models.SET_NULL, related_name='scrutins')
    seance = models.ForeignKey(Seance, null=True, blank=True, on_delete=models.SET_NULL, related_name='scrutins')
    titre = models.CharField(max_length=250)
    type_session = models.CharField(max_length=15, choices=TYPES_SESSION, default='ordinaire')
    date_scrutin = models.DateTimeField(null=True, blank=True)
    # Résultats agrégés saisis par le secrétariat (à partir des PV papier).
    nb_pour = models.PositiveIntegerField('voix pour', default=0)
    nb_contre = models.PositiveIntegerField('voix contre', default=0)
    nb_abstention = models.PositiveIntegerField('abstentions', default=0)
    statut_resultat = models.CharField(max_length=12, choices=RESULTATS, default='en_attente')
    statut_numerisation = models.CharField(max_length=12, choices=NUMERISATION, default='numerise')
    ouvert = models.BooleanField(default=True)
    date_ouverture = models.DateTimeField(auto_now_add=True)
    date_cloture = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_ouverture']

    def __str__(self):
        return self.titre


class VoteBulletin(models.Model):
    CHOIX = [('POUR', 'Pour'), ('CONTRE', 'Contre'), ('ABSTENTION', 'Abstention')]
    session = models.ForeignKey(VoteSession, on_delete=models.CASCADE, related_name='bulletins')
    depute = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bulletins')
    choix = models.CharField(max_length=10, choices=CHOIX)
    date_vote = models.DateTimeField(auto_now_add=True)
    hash_verif = models.CharField(max_length=32, blank=True)

    class Meta:
        unique_together = ('session', 'depute')


class Document(models.Model):
    CATEGORIES = [('loi_adoptee', 'Loi adoptée'), ('rapport', 'Rapport'),
                  ('proces_verbal', 'Procès-verbal'), ('reglement', 'Règlement'),
                  ('ordre_du_jour', 'Ordre du jour'), ('autre', 'Autre')]
    ACCES = [('public', 'Public'), ('interne', 'Interne'), ('confidentiel', 'Confidentiel')]
    titre = models.CharField(max_length=250)
    categorie = models.CharField(max_length=20, choices=CATEGORIES, default='autre')
    fichier = models.FileField('fichier (PDF)', upload_to='documents/', blank=True, null=True)
    fichier_url = models.CharField(max_length=300, blank=True)
    taille_ko = models.IntegerField(null=True, blank=True)
    acces = models.CharField(max_length=15, choices=ACCES, default='public')
    loi = models.ForeignKey(Loi, null=True, blank=True, on_delete=models.SET_NULL, related_name='documents')
    uploade_par = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='documents')
    date_upload = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_upload']

    def save(self, *args, **kwargs):
        # On sauvegarde d'abord pour que le fichier soit ecrit et que son
        # chemin definitif (dossier upload_to) soit connu, puis on renseigne
        # automatiquement l'URL et la taille a partir du fichier televerse.
        super().save(*args, **kwargs)
        if self.fichier:
            url = self.fichier.url
            taille = self.taille_ko
            try:
                taille = max(1, round(self.fichier.size / 1024))
            except (ValueError, OSError):
                pass
            if self.fichier_url != url or self.taille_ko != taille:
                self.fichier_url = url
                self.taille_ko = taille
                super().save(update_fields=['fichier_url', 'taille_ko'])


class Petition(models.Model):
    STATUTS = [('active', 'Active'), ('cloturee', 'Clôturée'), ('traitee', 'Traitée')]
    titre = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    province = models.CharField(max_length=80, blank=True)
    objectif_signatures = models.IntegerField(default=1000)
    statut = models.CharField(max_length=10, choices=STATUTS, default='active')
    commission = models.ForeignKey(Commission, null=True, blank=True, on_delete=models.SET_NULL, related_name='petitions')
    date_creation = models.DateTimeField()
    date_fin = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_creation']


class PetitionSignature(models.Model):
    petition = models.ForeignKey(Petition, on_delete=models.CASCADE, related_name='signatures')
    nom_complet = models.CharField(max_length=200)
    contact = models.CharField(max_length=120)
    date_signature = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('petition', 'contact')


class MessageCitoyen(models.Model):
    STATUTS = [('nouvelle', 'Nouvelle'), ('en_cours', 'En cours'),
               ('traitee', 'Traitée'), ('classee', 'Classée')]
    nom_complet = models.CharField(max_length=200)
    contact = models.CharField(max_length=120, blank=True)
    province = models.CharField(max_length=80, blank=True)
    sujet = models.CharField(max_length=250)
    message = models.TextField()
    depute = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='messages_recus')
    commission = models.ForeignKey(Commission, null=True, blank=True, on_delete=models.SET_NULL, related_name='messages')
    statut = models.CharField(max_length=10, choices=STATUTS, default='nouvelle')
    date_soumission = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_soumission']


class Annonce(models.Model):
    PRIORITES = [('normale', 'Normale'), ('importante', 'Importante'), ('urgente', 'Urgente')]
    titre = models.CharField(max_length=250)
    contenu = models.TextField()
    image = models.ImageField('image', upload_to='actualites/', blank=True, null=True)
    priorite = models.CharField(max_length=12, choices=PRIORITES, default='normale')
    cible_role = models.CharField(max_length=30, default='tous')
    cree_par = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='annonces')
    date_publication = models.DateTimeField()

    class Meta:
        ordering = ['-date_publication']


class OperationFinanciere(models.Model):
    TYPES = [('recette', 'Recette'), ('depense', 'Dépense')]
    STATUTS = [('en_attente', 'En attente'), ('approuvee', 'Approuvée'), ('rejetee', 'Rejetée')]
    type_operation = models.CharField(max_length=10, choices=TYPES)
    montant = models.DecimalField(max_digits=14, decimal_places=2)
    devise = models.CharField(max_length=8, default='XAF')
    motif = models.CharField(max_length=250)
    statut = models.CharField(max_length=12, choices=STATUTS, default='approuvee')
    enregistre_par = models.ForeignKey(User, on_delete=models.CASCADE, related_name='operations')
    approuve_par = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='operations_approuvees')
    date_operation = models.DateTimeField(auto_now_add=True)
    piece_justificative_url = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ['-date_operation']
