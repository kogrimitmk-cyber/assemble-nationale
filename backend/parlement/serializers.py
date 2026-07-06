from rest_framework import serializers

from comptes.models import Utilisateur
from .models import (Annonce, Commission, Document, Loi, LoiArticle, LoiEtape,
                     Petition, Seance)


class CommissionSerializer(serializers.ModelSerializer):
    nb_membres = serializers.IntegerField(read_only=True)

    class Meta:
        model = Commission
        fields = ['id', 'nom', 'nom_ar', 'nb_membres']


class SeanceSerializer(serializers.ModelSerializer):
    commission_nom = serializers.CharField(source='commission.nom', default=None, read_only=True)

    class Meta:
        model = Seance
        fields = ['id', 'titre', 'description', 'type_evenement', 'statut',
                  'date_debut', 'date_fin', 'lieu', 'commission_nom', 'ordre_du_jour']


class LoiSerializer(serializers.ModelSerializer):
    commission_nom = serializers.CharField(source='commission.nom', default=None, read_only=True)
    rapporteur_nom = serializers.SerializerMethodField()

    class Meta:
        model = Loi
        fields = ['id', 'numero_reference', 'titre', 'resume', 'type_texte',
                  'priorite', 'statut', 'commission_nom', 'rapporteur_nom',
                  'depose_par', 'date_depot']

    def get_rapporteur_nom(self, obj):
        return f'{obj.rapporteur.prenom} {obj.rapporteur.nom}' if obj.rapporteur_id else None


class LoiEtapeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoiEtape
        fields = ['id', 'libelle', 'description', 'date_etape']


class LoiArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoiArticle
        fields = ['id', 'numero', 'titre', 'contenu']


class DocumentSerializer(serializers.ModelSerializer):
    loi_ref = serializers.CharField(source='loi.numero_reference', default=None, read_only=True)
    fichier_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'titre', 'categorie', 'fichier_url', 'taille_ko',
                  'acces', 'loi_ref', 'date_upload']

    def get_fichier_url(self, obj):
        return obj.fichier.url if obj.fichier else obj.fichier_url


class PetitionSerializer(serializers.ModelSerializer):
    commission_nom = serializers.CharField(source='commission.nom', default=None, read_only=True)
    nb_signatures = serializers.IntegerField(read_only=True)

    class Meta:
        model = Petition
        fields = ['id', 'titre', 'description', 'province', 'objectif_signatures',
                  'statut', 'commission_nom', 'nb_signatures', 'date_creation', 'date_fin']


class AnnonceSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Annonce
        fields = ['id', 'titre', 'contenu', 'priorite', 'date_publication', 'image_url']

    def get_image_url(self, obj):
        return obj.image.url if obj.image else ''


class DeputeSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = ['id', 'numero_id', 'nom', 'prenom', 'fonction', 'sexe',
                  'province', 'circonscription', 'groupe_parlementaire', 'photo_url']

    def get_photo_url(self, obj):
        return obj.photo.url if obj.photo else obj.photo_url
