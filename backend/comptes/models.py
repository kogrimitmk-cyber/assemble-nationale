"""
Modèle utilisateur personnalisé + journal des connexions.
L'identifiant de connexion est le matricule (numero_id), ex. DEP-014.
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UtilisateurManager(BaseUserManager):
    def create_user(self, numero_id, nom, prenom, mot_de_passe=None, **extra):
        if not numero_id:
            raise ValueError('Le matricule (numero_id) est obligatoire.')
        email = extra.pop('email', None)
        if email:
            email = self.normalize_email(email)
        user = self.model(numero_id=numero_id, nom=nom, prenom=prenom, email=email, **extra)
        user.set_password(mot_de_passe)
        user.save(using=self._db)
        return user

    def create_superuser(self, numero_id, nom='Admin', prenom='Super', mot_de_passe=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('role', 'secretaire_general')
        extra.setdefault('doit_changer_mdp', False)
        return self.create_user(numero_id, nom, prenom, mot_de_passe, **extra)


class Utilisateur(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ('president', 'Président'),
        ('vice_president', 'Vice-président'),
        ('secretaire_general', 'Secrétaire général'),
        ('questeur', 'Questeur'),
        ('depute', 'Député'),
        ('administration', 'Administration'),
        ('citoyen', 'Citoyen'),
    ]
    SEXES = [('F', 'Femme'), ('M', 'Homme')]

    numero_id = models.CharField('matricule', max_length=40, unique=True)
    nom = models.CharField(max_length=120)
    prenom = models.CharField(max_length=120)
    email = models.EmailField('email', unique=True, null=True, blank=True)
    role = models.CharField(max_length=30, choices=ROLES, default='depute')
    fonction = models.CharField(max_length=120, blank=True)
    sexe = models.CharField(max_length=1, choices=SEXES, blank=True)
    province = models.CharField(max_length=80, blank=True)
    circonscription = models.CharField(max_length=120, blank=True)
    groupe_parlementaire = models.CharField(max_length=80, blank=True)
    photo_url = models.CharField(max_length=300, blank=True)
    photo = models.ImageField('photo', upload_to='deputes/', blank=True, null=True)
    biographie = models.TextField(blank=True)

    # Sécurité / 2FA
    totp_secret = models.CharField(max_length=64, blank=True)
    totp_active = models.BooleanField(default=False)
    doit_changer_mdp = models.BooleanField(default=True)

    # Statut
    is_active = models.BooleanField('actif', default=True)
    is_staff = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)

    objects = UtilisateurManager()

    USERNAME_FIELD = 'numero_id'
    REQUIRED_FIELDS = ['nom', 'prenom']

    ROLES_PARLEMENTAIRES = (
        'depute', 'president', 'vice_president', 'secretaire_general', 'questeur',
    )
    ROLES_BUREAU = ('president', 'vice_president', 'secretaire_general', 'questeur')

    class Meta:
        verbose_name = 'utilisateur'
        verbose_name_plural = 'utilisateurs'
        ordering = ['nom', 'prenom']

    def __str__(self):
        return f'{self.prenom} {self.nom} ({self.numero_id})'

    @property
    def est_parlementaire(self):
        return self.role in self.ROLES_PARLEMENTAIRES

    @property
    def initiales(self):
        return (self.prenom[:1] + self.nom[:1]).upper()


class ConnexionLog(models.Model):
    """Journal des connexions (suivi par le Secrétariat général)."""
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='connexions')
    date_connexion = models.DateTimeField(auto_now_add=True)
    date_deconnexion = models.DateTimeField(null=True, blank=True)
    adresse_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ['-date_connexion']

    def __str__(self):
        return f'{self.utilisateur.numero_id} — {self.date_connexion:%Y-%m-%d %H:%M}'
