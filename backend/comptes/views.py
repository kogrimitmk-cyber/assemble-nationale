"""
Authentification — AN Connect Tchad.

Flux de connexion :
  1) POST /auth/connexion   { identifiant, mot_de_passe }
        → { etape: '2fa', defi } si 2FA active
        → { etape: 'connecte', access, refresh, utilisateur } sinon
  2) POST /auth/verifier-otp { defi, code }  → tokens

Le « defi » est un jeton signé (django.core.signing), valable 5 min,
qui remplace la session entre l'étape 1 et l'étape 2 (API sans état).
"""
import pyotp
from django.contrib.auth import authenticate, get_user_model
from django.core import signing
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ConnexionLog
from .serializers import UtilisateurSerializer

Utilisateur = get_user_model()
SIGNER = signing.TimestampSigner(salt='an-connect-2fa')
DEFI_MAX_AGE = 300  # secondes


class ThrottleConnexion(ScopedRateThrottle):
    scope = 'connexion'


def _emettre_tokens(utilisateur, request):
    """Crée les jetons JWT + journalise la connexion."""
    ConnexionLog.objects.create(
        utilisateur=utilisateur,
        adresse_ip=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:300],
    )
    utilisateur.derniere_connexion = timezone.now()
    utilisateur.save(update_fields=['derniere_connexion'])

    refresh = RefreshToken.for_user(utilisateur)
    refresh['role'] = utilisateur.role
    return {
        'etape': 'connecte',
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'utilisateur': UtilisateurSerializer(utilisateur).data,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([ThrottleConnexion])
def connexion(request):
    identifiant = (request.data.get('identifiant') or '').strip()
    mot_de_passe = request.data.get('mot_de_passe') or ''
    if not identifiant or not mot_de_passe:
        return Response(
            {'erreur': 'CHAMPS_MANQUANTS', 'message': 'Identifiant et mot de passe requis.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Identifiant = matricule OU email.
    utilisateur = (
        Utilisateur.objects.filter(
            Q(numero_id__iexact=identifiant) | Q(email__iexact=identifiant), is_active=True
        ).first()
    )
    generique = {'erreur': 'IDENTIFIANTS_INVALIDES',
                 'message': 'Identifiant ou mot de passe incorrect.'}
    if not utilisateur or not utilisateur.check_password(mot_de_passe):
        return Response(generique, status=status.HTTP_401_UNAUTHORIZED)

    if utilisateur.totp_active:
        defi = SIGNER.sign(str(utilisateur.pk))
        return Response({'succes': True, 'etape': '2fa', 'defi': defi})

    return Response({'succes': True, **_emettre_tokens(utilisateur, request)})


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([ThrottleConnexion])
def verifier_otp(request):
    defi = request.data.get('defi') or ''
    code = (request.data.get('code') or '').strip()
    try:
        pk = SIGNER.unsign(defi, max_age=DEFI_MAX_AGE)
    except signing.SignatureExpired:
        return Response({'erreur': 'DEFI_EXPIRE', 'message': 'Session de vérification expirée. Reconnectez-vous.'},
                        status=status.HTTP_401_UNAUTHORIZED)
    except signing.BadSignature:
        return Response({'erreur': 'DEFI_INVALIDE', 'message': 'Vérification invalide.'},
                        status=status.HTTP_401_UNAUTHORIZED)

    utilisateur = Utilisateur.objects.filter(pk=pk, is_active=True).first()
    if not utilisateur or not utilisateur.totp_secret or \
            not pyotp.TOTP(utilisateur.totp_secret).verify(code, valid_window=1):
        return Response({'erreur': 'CODE_INVALIDE', 'message': 'Code de vérification incorrect ou expiré.'},
                        status=status.HTTP_401_UNAUTHORIZED)

    return Response({'succes': True, **_emettre_tokens(utilisateur, request)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def moi(request):
    return Response({'utilisateur': UtilisateurSerializer(request.user).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activer_2fa(request):
    secret = pyotp.random_base32()
    request.user.totp_secret = secret
    request.user.totp_active = False
    request.user.save(update_fields=['totp_secret', 'totp_active'])
    url = pyotp.totp.TOTP(secret).provisioning_uri(
        name=request.user.numero_id, issuer_name='AN Connect Tchad')
    return Response({
        'succes': True, 'secret': secret, 'otpauth_url': url,
        'message': "Saisissez ce secret dans votre application d'authentification, puis confirmez avec un premier code.",
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirmer_2fa(request):
    u = request.user
    code = (request.data.get('code') or '').strip()
    if not u.totp_secret:
        return Response({'erreur': 'AUCUN_SECRET', 'message': "Générez d'abord un secret via /activer-2fa."},
                        status=status.HTTP_400_BAD_REQUEST)
    if not pyotp.TOTP(u.totp_secret).verify(code, valid_window=1):
        return Response({'erreur': 'CODE_INVALIDE', 'message': "Code incorrect — vérifiez l'heure de votre téléphone."},
                        status=status.HTTP_401_UNAUTHORIZED)
    u.totp_active = True
    u.save(update_fields=['totp_active'])
    return Response({'succes': True, 'message': 'Double authentification activée.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def changer_mdp(request):
    u = request.user
    ancien = request.data.get('ancien_mot_de_passe') or ''
    nouveau = request.data.get('nouveau_mot_de_passe') or ''
    if not ancien or not nouveau:
        return Response({'erreur': 'CHAMPS_MANQUANTS', 'message': 'Ancien et nouveau mot de passe requis.'},
                        status=status.HTTP_400_BAD_REQUEST)
    if len(nouveau) < 8:
        return Response({'erreur': 'MDP_TROP_COURT', 'message': 'Le nouveau mot de passe doit contenir au moins 8 caractères.'},
                        status=status.HTTP_400_BAD_REQUEST)
    if not u.check_password(ancien):
        return Response({'erreur': 'ANCIEN_MDP_INCORRECT', 'message': "L'ancien mot de passe est incorrect."},
                        status=status.HTTP_401_UNAUTHORIZED)
    u.set_password(nouveau)
    u.doit_changer_mdp = False
    u.save(update_fields=['password', 'doit_changer_mdp'])
    return Response({'succes': True, 'message': 'Mot de passe mis à jour avec succès.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deconnexion(request):
    """Invalide le refresh token et clôt le dernier log de connexion ouvert."""
    ConnexionLog.objects.filter(utilisateur=request.user, date_deconnexion__isnull=True) \
        .update(date_deconnexion=timezone.now())
    refresh = request.data.get('refresh')
    if refresh:
        try:
            RefreshToken(refresh).blacklist()
        except Exception:
            pass
    return Response({'succes': True})
