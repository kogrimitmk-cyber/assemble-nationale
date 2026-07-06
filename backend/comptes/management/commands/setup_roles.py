"""
Cree les groupes d'acces du back-office et un compte secretaire de demo.

    python manage.py setup_roles

  - Groupe "Secretariat"  : creation / lecture / modification / suppression
                            sur tous les modules du site public.
  - Groupe "Lecture seule": consultation uniquement (pour un autre agent).

Les deux groupes sont extensibles : ajoutez/retirez des permissions plus tard
depuis l'admin Django ("Groupes"). Tout membre du "Secretariat" doit avoir
is_staff=True pour acceder a /admin ; la commande le fait pour le compte demo.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand

# Modeles geres depuis le back-office (app_label, model_name).
MODULES = [
    ('comptes', 'utilisateur'),          # deputes
    ('parlement', 'commission'),
    ('parlement', 'commissionmembre'),
    ('parlement', 'seance'),
    ('parlement', 'loi'),
    ('parlement', 'loiarticle'),
    ('parlement', 'loietape'),
    ('parlement', 'document'),
    ('parlement', 'votesession'),
    ('parlement', 'votebulletin'),
    ('parlement', 'annonce'),
    ('parlement', 'petition'),
]


class Command(BaseCommand):
    help = "Cree les groupes Secretariat / Lecture seule et un secretaire de demo."

    def add_arguments(self, parser):
        parser.add_argument('--matricule', default='SEC-001')
        parser.add_argument('--motdepasse', default='Secretariat2026!')

    def handle(self, *args, **opts):
        secretariat = self._groupe('Secretariat',
                                   ('add', 'change', 'delete', 'view'))
        self._groupe('Lecture seule', ('view',))

        User = get_user_model()
        matricule = opts['matricule']
        secretaire, cree = User.objects.get_or_create(
            numero_id=matricule,
            defaults={'nom': 'Secretaire', 'prenom': 'General',
                      'role': 'secretaire_general'},
        )
        secretaire.is_staff = True
        secretaire.doit_changer_mdp = False
        if cree:
            secretaire.set_password(opts['motdepasse'])
        secretaire.save()
        secretaire.groups.add(secretariat)

        self.stdout.write(self.style.SUCCESS(
            'Groupes "Secretariat" et "Lecture seule" prets.'))
        etat = 'cree' if cree else 'existant'
        self.stdout.write(
            f'Secretaire {etat} : matricule={matricule}'
            + (f'  mot de passe={opts["motdepasse"]}' if cree else '')
            + '  -> connexion sur /admin')

    def _groupe(self, nom, actions):
        groupe, _ = Group.objects.get_or_create(name=nom)
        perms = []
        for app_label, model in MODULES:
            try:
                ct = ContentType.objects.get(app_label=app_label, model=model)
            except ContentType.DoesNotExist:
                continue
            for action in actions:
                codename = f'{action}_{model}'
                perm = Permission.objects.filter(
                    content_type=ct, codename=codename).first()
                if perm:
                    perms.append(perm)
        groupe.permissions.set(perms)
        return groupe
