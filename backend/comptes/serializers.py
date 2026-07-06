from rest_framework import serializers

from .models import Utilisateur


class UtilisateurSerializer(serializers.ModelSerializer):
    """Représentation de l'utilisateur connecté (renvoyée par /auth/moi)."""
    est_parlementaire = serializers.BooleanField(read_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'numero_id', 'nom', 'prenom', 'email', 'role', 'fonction',
            'province', 'groupe_parlementaire', 'photo_url',
            'totp_active', 'doit_changer_mdp', 'est_parlementaire', 'is_staff',
        ]
