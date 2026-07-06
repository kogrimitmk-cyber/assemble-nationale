"""
API d'administration (back-office React) — AN Connect Tchad.

Endpoints CRUD proteges sous /api/admin/*. Acces reserve au personnel
(is_staff) ; les actions d'ecriture respectent les permissions Django
(groupes "Secretariat" = CRUD, "Lecture seule" = consultation).

Reutilise les memes modeles que le site public et l'admin Django.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import serializers, viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAdminUser

from comptes.models import Utilisateur
from .models import (Annonce, Commission, CommissionMembre, Document, Loi,
                     LoiArticle, LoiEtape, Seance, VoteSession)

User = get_user_model()


# ── Permissions communes ─────────────────────────────────────
class PermAdmin:
    """Personnel authentifie (is_staff) + permissions de modele Django."""
    permission_classes = [IsAdminUser, DjangoModelPermissions]


class BaseAdminViewSet(PermAdmin, viewsets.ModelViewSet):
    pass


# ════════════════════════════════════════════════════════════
#  DEPUTES
# ════════════════════════════════════════════════════════════
class DeputeAdminSerializer(serializers.ModelSerializer):
    photo_url_effective = serializers.SerializerMethodField()
    mot_de_passe = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Utilisateur
        fields = ['id', 'numero_id', 'nom', 'prenom', 'email', 'sexe', 'role',
                  'fonction', 'province', 'circonscription', 'groupe_parlementaire',
                  'biographie', 'photo', 'photo_url', 'photo_url_effective',
                  'is_active', 'mot_de_passe']
        extra_kwargs = {'photo_url': {'required': False}}

    def get_photo_url_effective(self, obj):
        return obj.photo.url if obj.photo else obj.photo_url

    def create(self, validated_data):
        mdp = validated_data.pop('mot_de_passe', '') or None
        validated_data.setdefault('role', 'depute')
        user = Utilisateur(**validated_data)
        if mdp:
            user.set_password(mdp)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        mdp = validated_data.pop('mot_de_passe', '') or None
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if mdp:
            instance.set_password(mdp)
        instance.save()
        return instance


class DeputeAdminViewSet(BaseAdminViewSet):
    serializer_class = DeputeAdminSerializer
    queryset = Utilisateur.objects.filter(
        role__in=Utilisateur.ROLES_PARLEMENTAIRES).order_by('nom', 'prenom')
    # DjangoModelPermissions verifie les permissions du modele Utilisateur.

    def get_queryset(self):
        qs = self.queryset
        q = self.request.query_params.get('q')
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(nom__icontains=q) | Q(prenom__icontains=q) | Q(numero_id__icontains=q))
        if self.request.query_params.get('groupe'):
            qs = qs.filter(groupe_parlementaire=self.request.query_params['groupe'])
        return qs


# ════════════════════════════════════════════════════════════
#  COMMISSIONS (+ membres)
# ════════════════════════════════════════════════════════════
class CommissionAdminSerializer(serializers.ModelSerializer):
    president_nom = serializers.SerializerMethodField()
    nb_membres = serializers.IntegerField(source='membres.count', read_only=True)

    class Meta:
        model = Commission
        fields = ['id', 'nom', 'nom_ar', 'description', 'president',
                  'president_nom', 'nb_membres']

    def get_president_nom(self, obj):
        return f'{obj.president.prenom} {obj.president.nom}' if obj.president_id else None


class CommissionMembreAdminSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.SerializerMethodField()

    class Meta:
        model = CommissionMembre
        fields = ['id', 'commission', 'utilisateur', 'utilisateur_nom', 'role_commission']

    def get_utilisateur_nom(self, obj):
        return f'{obj.utilisateur.prenom} {obj.utilisateur.nom}'


class CommissionAdminViewSet(BaseAdminViewSet):
    serializer_class = CommissionAdminSerializer
    queryset = Commission.objects.all().order_by('nom')


class CommissionMembreAdminViewSet(BaseAdminViewSet):
    serializer_class = CommissionMembreAdminSerializer
    queryset = CommissionMembre.objects.select_related('commission', 'utilisateur').all()

    def get_queryset(self):
        qs = self.queryset
        if self.request.query_params.get('commission'):
            qs = qs.filter(commission_id=self.request.query_params['commission'])
        return qs


# ════════════════════════════════════════════════════════════
#  SEANCES / AGENDA
# ════════════════════════════════════════════════════════════
class SeanceAdminSerializer(serializers.ModelSerializer):
    commission_nom = serializers.CharField(source='commission.nom', default=None, read_only=True)

    class Meta:
        model = Seance
        fields = ['id', 'titre', 'description', 'type_evenement', 'statut',
                  'date_debut', 'date_fin', 'lieu', 'commission', 'commission_nom',
                  'ordre_du_jour']


class SeanceAdminViewSet(BaseAdminViewSet):
    serializer_class = SeanceAdminSerializer
    queryset = Seance.objects.select_related('commission').all().order_by('-date_debut')


# ════════════════════════════════════════════════════════════
#  LOIS (+ articles, etapes, documents)
# ════════════════════════════════════════════════════════════
class LoiAdminSerializer(serializers.ModelSerializer):
    commission_nom = serializers.CharField(source='commission.nom', default=None, read_only=True)
    rapporteur_nom = serializers.SerializerMethodField()

    class Meta:
        model = Loi
        fields = ['id', 'numero_reference', 'titre', 'resume', 'type_texte',
                  'priorite', 'statut', 'commission', 'commission_nom',
                  'rapporteur', 'rapporteur_nom', 'depose_par', 'date_depot']

    def get_rapporteur_nom(self, obj):
        return f'{obj.rapporteur.prenom} {obj.rapporteur.nom}' if obj.rapporteur_id else None


class LoiArticleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoiArticle
        fields = ['id', 'loi', 'numero', 'titre', 'contenu']


class LoiEtapeAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoiEtape
        fields = ['id', 'loi', 'libelle', 'description', 'date_etape']


class DocumentAdminSerializer(serializers.ModelSerializer):
    fichier_url_effective = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'titre', 'categorie', 'acces', 'loi', 'fichier',
                  'fichier_url', 'fichier_url_effective', 'taille_ko', 'date_upload']
        read_only_fields = ['fichier_url', 'taille_ko', 'date_upload']

    def get_fichier_url_effective(self, obj):
        return obj.fichier.url if obj.fichier else obj.fichier_url


class LoiAdminViewSet(BaseAdminViewSet):
    serializer_class = LoiAdminSerializer
    queryset = Loi.objects.select_related('commission', 'rapporteur').all().order_by('-date_depot')

    def get_queryset(self):
        qs = self.queryset
        if self.request.query_params.get('statut'):
            qs = qs.filter(statut=self.request.query_params['statut'])
        q = self.request.query_params.get('q')
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(titre__icontains=q) | Q(numero_reference__icontains=q))
        return qs


class _ParentFilterMixin:
    parent_field = None

    def get_queryset(self):
        qs = self.queryset
        val = self.request.query_params.get(self.parent_field)
        if val:
            qs = qs.filter(**{self.parent_field: val})
        return qs


class LoiArticleAdminViewSet(_ParentFilterMixin, BaseAdminViewSet):
    serializer_class = LoiArticleAdminSerializer
    queryset = LoiArticle.objects.all()
    parent_field = 'loi'


class LoiEtapeAdminViewSet(_ParentFilterMixin, BaseAdminViewSet):
    serializer_class = LoiEtapeAdminSerializer
    queryset = LoiEtape.objects.all()
    parent_field = 'loi'


class DocumentAdminViewSet(_ParentFilterMixin, BaseAdminViewSet):
    serializer_class = DocumentAdminSerializer
    queryset = Document.objects.select_related('loi').all().order_by('-date_upload')
    parent_field = 'loi'


# ════════════════════════════════════════════════════════════
#  SCRUTINS
# ════════════════════════════════════════════════════════════
class ScrutinAdminSerializer(serializers.ModelSerializer):
    loi_ref = serializers.CharField(source='loi.numero_reference', default=None, read_only=True)

    class Meta:
        model = VoteSession
        fields = ['id', 'titre', 'loi', 'loi_ref', 'seance', 'type_session',
                  'date_scrutin', 'nb_pour', 'nb_contre', 'nb_abstention',
                  'statut_resultat', 'statut_numerisation', 'ouvert', 'date_cloture']


class ScrutinAdminViewSet(BaseAdminViewSet):
    serializer_class = ScrutinAdminSerializer
    queryset = VoteSession.objects.select_related('loi').all().order_by('-date_ouverture')


# ════════════════════════════════════════════════════════════
#  ACTUALITES
# ════════════════════════════════════════════════════════════
class ActualiteAdminSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Annonce
        fields = ['id', 'titre', 'contenu', 'image', 'image_url', 'priorite',
                  'cible_role', 'date_publication']

    def get_image_url(self, obj):
        return obj.image.url if obj.image else ''


class ActualiteAdminViewSet(BaseAdminViewSet):
    serializer_class = ActualiteAdminSerializer
    queryset = Annonce.objects.all().order_by('-date_publication')
