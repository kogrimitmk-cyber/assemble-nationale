from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path('connexion', views.connexion),
    path('verifier-otp', views.verifier_otp),
    path('moi', views.moi),
    path('activer-2fa', views.activer_2fa),
    path('confirmer-2fa', views.confirmer_2fa),
    path('changer-mdp', views.changer_mdp),
    path('deconnexion', views.deconnexion),
    path('token/refresh', TokenRefreshView.as_view()),
]
