"""Routage racine de l'API — AN Connect Tchad."""
from django.conf import settings
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.static import serve


def sante(_request):
    from django.utils import timezone
    return JsonResponse({'statut': 'ok', 'heure_serveur': timezone.now().isoformat()})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/sante/', sante),
    path('api/auth/', include('comptes.urls')),
    path('api/', include('parlement.urls')),
    # Fichiers televerses (photos, PDF, images) — servis par Django y compris
    # en production (Render). Pour un fort trafic, basculer vers un stockage
    # objet (S3 / Cloudinary). Un disque persistant Render garde les fichiers
    # entre deux deploiements.
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
