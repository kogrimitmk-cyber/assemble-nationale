from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import admin_api, views

# ── API d'administration (back-office React) ─────────────────
router = DefaultRouter()
router.register('deputes', admin_api.DeputeAdminViewSet, basename='admin-deputes')
router.register('commissions', admin_api.CommissionAdminViewSet, basename='admin-commissions')
router.register('membres-commission', admin_api.CommissionMembreAdminViewSet, basename='admin-membres')
router.register('seances', admin_api.SeanceAdminViewSet, basename='admin-seances')
router.register('lois', admin_api.LoiAdminViewSet, basename='admin-lois')
router.register('articles-loi', admin_api.LoiArticleAdminViewSet, basename='admin-articles')
router.register('etapes-loi', admin_api.LoiEtapeAdminViewSet, basename='admin-etapes')
router.register('documents', admin_api.DocumentAdminViewSet, basename='admin-documents')
router.register('scrutins', admin_api.ScrutinAdminViewSet, basename='admin-scrutins')
router.register('actualites', admin_api.ActualiteAdminViewSet, basename='admin-actualites')

urlpatterns = [
    path('admin/', include(router.urls)),
    # Public
    path('public/stats', views.stats),
    path('public/agenda', views.agenda),
    path('public/lois', views.lois),
    path('public/lois/<str:ref>', views.loi_detail),
    path('public/scrutins', views.scrutins),
    path('public/deputes', views.deputes),
    path('public/deputes/<int:pk>', views.depute_detail),
    path('public/commissions', views.commissions),
    path('public/documents', views.documents),
    path('public/petitions', views.petitions),
    path('public/petitions/<int:pk>/signer', views.signer_petition),
    path('public/messages', views.message_citoyen),
    path('public/annonces', views.annonces),
    # Espace député
    path('depute/apercu', views.apercu),
    path('depute/voter', views.voter),
    path('depute/ma-presence', views.ma_presence),
]
