from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import ConnexionLog, Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    ordering = ['nom', 'prenom']
    list_display = ('numero_id', 'prenom', 'nom', 'role', 'province', 'groupe_parlementaire', 'is_active')
    list_filter = ('role', 'is_active', 'totp_active', 'groupe_parlementaire')
    search_fields = ('numero_id', 'nom', 'prenom', 'email')
    fieldsets = (
        (None, {'fields': ('numero_id', 'password')}),
        ('Identité', {'fields': ('nom', 'prenom', 'email', 'sexe', 'photo', 'photo_url', 'biographie')}),
        ('Mandat', {'fields': ('role', 'fonction', 'province', 'circonscription', 'groupe_parlementaire')}),
        ('Sécurité', {'fields': ('totp_active', 'doit_changer_mdp')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',),
                'fields': ('numero_id', 'nom', 'prenom', 'email', 'role', 'password1', 'password2')}),
    )

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        # Seul un superutilisateur voit/modifie le bloc Permissions
        # (evite qu'un secretaire s'accorde is_superuser ou change de groupe).
        if not request.user.is_superuser:
            fieldsets = [fs for fs in fieldsets if fs[0] != 'Permissions']
        return fieldsets


@admin.register(ConnexionLog)
class ConnexionLogAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'date_connexion', 'date_deconnexion', 'adresse_ip')
    list_filter = ('date_connexion',)
    search_fields = ('utilisateur__numero_id', 'utilisateur__nom')
