from django.contrib import admin

from .models import (Annonce, Commission, CommissionMembre, Document, Loi,
                     LoiArticle, LoiEtape, OperationFinanciere, Petition,
                     PetitionSignature, Presence, Seance, VoteBulletin,
                     VoteSession)


# ── Inlines ──────────────────────────────────────────────────
class MembreInline(admin.TabularInline):
    model = CommissionMembre
    extra = 1
    autocomplete_fields = ['utilisateur']


class EtapeInline(admin.TabularInline):
    model = LoiEtape
    extra = 1


class ArticleInline(admin.TabularInline):
    model = LoiArticle
    extra = 1


class DocumentInline(admin.TabularInline):
    model = Document
    extra = 0
    fields = ('titre', 'categorie', 'fichier', 'acces')


# ── Modules ──────────────────────────────────────────────────
@admin.register(Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = ('nom', 'nom_ar', 'president', 'nb_membres')
    search_fields = ('nom', 'nom_ar')
    autocomplete_fields = ['president']
    inlines = [MembreInline]

    @admin.display(description='Nb membres')
    def nb_membres(self, obj):
        return obj.membres.count()


@admin.register(Seance)
class SeanceAdmin(admin.ModelAdmin):
    list_display = ('titre', 'type_evenement', 'statut', 'date_debut', 'lieu')
    list_filter = ('type_evenement', 'statut')
    search_fields = ('titre', 'lieu')
    date_hierarchy = 'date_debut'
    autocomplete_fields = ['commission']
    fieldsets = (
        (None, {'fields': ('titre', 'description', 'type_evenement', 'statut')}),
        ('Planning', {'fields': ('date_debut', 'date_fin', 'lieu', 'commission')}),
        ('Ordre du jour', {'fields': ('ordre_du_jour',),
                           'description': 'Un point discuté par ligne.'}),
    )


@admin.register(Loi)
class LoiAdmin(admin.ModelAdmin):
    list_display = ('numero_reference', 'titre', 'statut', 'priorite', 'type_texte', 'commission', 'date_depot')
    list_filter = ('statut', 'priorite', 'type_texte')
    search_fields = ('numero_reference', 'titre')
    date_hierarchy = 'date_depot'
    autocomplete_fields = ['commission', 'rapporteur']
    inlines = [ArticleInline, EtapeInline, DocumentInline]
    fieldsets = (
        ('Identification', {'fields': ('numero_reference', 'titre', 'resume', 'type_texte', 'priorite')}),
        ('Suivi législatif', {'fields': ('statut', 'commission', 'rapporteur', 'depose_par', 'date_depot')}),
    )


@admin.register(VoteSession)
class VoteSessionAdmin(admin.ModelAdmin):
    list_display = ('titre', 'loi', 'type_session', 'statut_resultat',
                    'nb_pour', 'nb_contre', 'nb_abstention',
                    'statut_numerisation', 'date_scrutin')
    list_filter = ('type_session', 'statut_resultat', 'statut_numerisation', 'ouvert')
    search_fields = ('titre',)
    autocomplete_fields = ['loi', 'seance']
    date_hierarchy = 'date_scrutin'
    fieldsets = (
        ('Scrutin', {'fields': ('titre', 'loi', 'seance', 'type_session', 'date_scrutin')}),
        ('Résultats (saisis d\'après le procès-verbal)',
         {'fields': ('nb_pour', 'nb_contre', 'nb_abstention', 'statut_resultat')}),
        ('Numérisation', {'fields': ('statut_numerisation', 'ouvert', 'date_cloture')}),
    )


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('titre', 'categorie', 'acces', 'loi', 'taille_ko', 'date_upload')
    list_filter = ('categorie', 'acces')
    search_fields = ('titre',)
    autocomplete_fields = ['loi', 'uploade_par']
    readonly_fields = ('taille_ko', 'fichier_url', 'date_upload')


@admin.register(Annonce)
class AnnonceAdmin(admin.ModelAdmin):
    list_display = ('titre', 'priorite', 'date_publication')
    list_filter = ('priorite',)
    search_fields = ('titre', 'contenu')
    date_hierarchy = 'date_publication'
    fields = ('titre', 'image', 'contenu', 'priorite', 'cible_role', 'date_publication')


@admin.register(Petition)
class PetitionAdmin(admin.ModelAdmin):
    list_display = ('titre', 'province', 'statut', 'objectif_signatures')
    list_filter = ('statut',)
    search_fields = ('titre',)
    autocomplete_fields = ['commission']


admin.site.register([Presence, VoteBulletin, PetitionSignature, OperationFinanciere])
admin.site.site_header = 'AN Connect Tchad — Administration'
admin.site.site_title = 'AN Connect'
admin.site.index_title = 'Gestion de la plateforme'
