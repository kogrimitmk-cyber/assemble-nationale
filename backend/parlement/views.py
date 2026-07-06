"""
API — AN Connect Tchad.

  /api/public/*   → lecture publique (données réelles ou vide honnête)
  /api/depute/*   → espace parlementaire (JWT + rôle requis)
"""
import hashlib
import time

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from comptes.models import Utilisateur
from .models import (Annonce, Commission, CommissionMembre, Document, Loi,
                     Petition, PetitionSignature, MessageCitoyen, Presence,
                     Seance, VoteBulletin, VoteSession)
from .serializers import (AnnonceSerializer, CommissionSerializer,
                          DeputeSerializer, DocumentSerializer,
                          LoiArticleSerializer, LoiEtapeSerializer,
                          LoiSerializer, PetitionSerializer, SeanceSerializer)

User = get_user_model()
ROLES_ELUS = Utilisateur.ROLES_PARLEMENTAIRES
ROLES_BUREAU = Utilisateur.ROLES_BUREAU


# ════════════════════════════════════════════════════════════════
#  API PUBLIQUE
# ════════════════════════════════════════════════════════════════
@api_view(['GET'])
@permission_classes([AllowAny])
def stats(request):
    elus = User.objects.filter(role__in=ROLES_ELUS, is_active=True)
    return Response({
        'deputes_actifs': elus.count(),
        'femmes_deputees': elus.filter(sexe='F').count(),
        'textes_en_cours': Loi.objects.filter(
            statut__in=['depose', 'en_commission', 'en_debat', 'au_vote']).count(),
        'seances_tenues': Seance.objects.filter(statut='terminee').count(),
        'groupes_parlementaires': elus.exclude(groupe_parlementaire='')
            .values('groupe_parlementaire').distinct().count(),
        'commissions': Commission.objects.count(),
        'petitions_actives': Petition.objects.filter(statut='active').count(),
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def agenda(request):
    qs = Seance.objects.select_related('commission').all()
    if request.GET.get('type'):
        qs = qs.filter(type_evenement=request.GET['type'])
    if request.GET.get('statut'):
        qs = qs.filter(statut=request.GET['statut'])
    return Response({'seances': SeanceSerializer(qs[:200], many=True).data})


@api_view(['GET'])
@permission_classes([AllowAny])
def lois(request):
    qs = Loi.objects.select_related('commission', 'rapporteur').all()
    if request.GET.get('statut'):
        qs = qs.filter(statut=request.GET['statut'])
    if request.GET.get('priorite'):
        qs = qs.filter(priorite=request.GET['priorite'])
    q = request.GET.get('q')
    if q:
        qs = qs.filter(Q(titre__icontains=q) | Q(numero_reference__icontains=q))
    return Response({'lois': LoiSerializer(qs[:200], many=True).data})


@api_view(['GET'])
@permission_classes([AllowAny])
def loi_detail(request, ref):
    loi = Loi.objects.select_related('commission', 'rapporteur') \
        .filter(numero_reference=ref).first()
    if not loi:
        return Response({'erreur': 'INTROUVABLE', 'message': 'Texte de loi introuvable.'},
                        status=status.HTTP_404_NOT_FOUND)
    data = LoiSerializer(loi).data
    data['rapporteur_matricule'] = loi.rapporteur.numero_id if loi.rapporteur_id else None
    return Response({
        'loi': data,
        'etapes': LoiEtapeSerializer(loi.etapes.all(), many=True).data,
        'articles': LoiArticleSerializer(loi.articles.all(), many=True).data,
        'documents': DocumentSerializer(loi.documents.filter(acces='public'), many=True).data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def scrutins(request):
    resultat = []
    qs = VoteSession.objects.filter(ouvert=False).select_related('loi').annotate(
        pour=Count('bulletins', filter=Q(bulletins__choix='POUR')),
        contre=Count('bulletins', filter=Q(bulletins__choix='CONTRE')),
        abstention=Count('bulletins', filter=Q(bulletins__choix='ABSTENTION')),
    )
    for s in qs[:100]:
        resultat.append({
            'id': s.id, 'titre': s.titre, 'date_cloture': s.date_cloture,
            'numero_reference': s.loi.numero_reference if s.loi_id else None,
            'loi_titre': s.loi.titre if s.loi_id else None,
            'pour': s.pour, 'contre': s.contre, 'abstention': s.abstention,
        })
    return Response({'scrutins': resultat})


@api_view(['GET'])
@permission_classes([AllowAny])
def deputes(request):
    qs = User.objects.filter(role__in=ROLES_ELUS, is_active=True)
    if request.GET.get('groupe'):
        qs = qs.filter(groupe_parlementaire=request.GET['groupe'])
    if request.GET.get('province'):
        qs = qs.filter(province=request.GET['province'])
    if request.GET.get('commission'):
        qs = qs.filter(commissions__commission_id=request.GET['commission'])
    q = request.GET.get('q')
    if q:
        qs = qs.filter(Q(nom__icontains=q) | Q(prenom__icontains=q) | Q(numero_id__icontains=q))
    qs = qs.distinct()

    base = User.objects.filter(role__in=ROLES_ELUS, is_active=True)
    provinces = list(base.exclude(province='').values_list('province', flat=True).distinct().order_by('province'))
    groupes = list(base.exclude(groupe_parlementaire='').values_list('groupe_parlementaire', flat=True).distinct().order_by('groupe_parlementaire'))
    return Response({
        'deputes': DeputeSerializer(qs, many=True).data,
        'provinces': provinces, 'groupes': groupes,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def depute_detail(request, pk):
    d = User.objects.filter(pk=pk, is_active=True, role__in=ROLES_ELUS).first()
    if not d:
        return Response({'erreur': 'INTROUVABLE', 'message': 'Élu introuvable.'},
                        status=status.HTTP_404_NOT_FOUND)
    coms = [{'id': m.commission_id, 'nom': m.commission.nom, 'role_commission': m.role_commission}
            for m in d.commissions.select_related('commission').all()]
    total = d.presences.count()
    presents = d.presences.filter(statut='present').count()
    return Response({
        'depute': {
            'id': d.id, 'numero_id': d.numero_id, 'nom': d.nom, 'prenom': d.prenom,
            'fonction': d.fonction, 'sexe': d.sexe, 'province': d.province,
            'groupe_parlementaire': d.groupe_parlementaire, 'photo_url': d.photo_url,
            'biographie': d.biographie,
        },
        'commissions': coms,
        'taux_presence': round(presents / total * 100) if total else None,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def commissions(request):
    qs = Commission.objects.annotate(nb_membres=Count('membres'))
    return Response({'commissions': CommissionSerializer(qs, many=True).data})


@api_view(['GET'])
@permission_classes([AllowAny])
def documents(request):
    role = getattr(request.user, 'role', None) if request.user.is_authenticated else None
    niveaux = ['public']
    if role and role != 'citoyen':
        niveaux.append('interne')
    if role in ROLES_BUREAU:
        niveaux.append('confidentiel')

    qs = Document.objects.select_related('loi').filter(acces__in=niveaux)
    if request.GET.get('q'):
        qs = qs.filter(titre__icontains=request.GET['q'])
    if request.GET.get('categorie'):
        qs = qs.filter(categorie=request.GET['categorie'])
    return Response({
        'documents': DocumentSerializer(qs[:200], many=True).data,
        'niveaux_visibles': niveaux,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def petitions(request):
    qs = Petition.objects.select_related('commission').annotate(nb_signatures=Count('signatures'))
    qs = sorted(qs, key=lambda p: (0 if p.statut == 'active' else 1, -p.date_creation.timestamp()))
    return Response({'petitions': PetitionSerializer(qs[:100], many=True).data})


@api_view(['POST'])
@permission_classes([AllowAny])
def signer_petition(request, pk):
    nom = (request.data.get('nom_complet') or '').strip()
    contact = (request.data.get('contact') or '').strip().lower()
    if not nom or not contact:
        return Response({'erreur': 'CHAMPS_MANQUANTS', 'message': 'Nom complet et contact requis.'},
                        status=status.HTTP_400_BAD_REQUEST)
    petition = Petition.objects.filter(pk=pk).first()
    if not petition:
        return Response({'erreur': 'INTROUVABLE', 'message': 'Pétition introuvable.'},
                        status=status.HTTP_404_NOT_FOUND)
    if petition.statut != 'active':
        return Response({'erreur': 'PETITION_CLOSE', 'message': "Cette pétition n'accepte plus de signatures."},
                        status=status.HTTP_400_BAD_REQUEST)
    if PetitionSignature.objects.filter(petition=petition, contact=contact).exists():
        return Response({'erreur': 'DEJA_SIGNE', 'message': 'Ce contact a déjà signé cette pétition.'},
                        status=status.HTTP_409_CONFLICT)
    PetitionSignature.objects.create(petition=petition, nom_complet=nom, contact=contact)
    nb = petition.signatures.count()
    return Response({'succes': True, 'nb_signatures': nb,
                     'message': 'Signature enregistrée. Merci pour votre participation.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def message_citoyen(request):
    nom = (request.data.get('nom_complet') or '').strip()
    sujet = (request.data.get('sujet') or '').strip()
    message = (request.data.get('message') or '').strip()
    if not nom or not sujet or not message:
        return Response({'erreur': 'CHAMPS_MANQUANTS', 'message': 'Nom, sujet et message sont requis.'},
                        status=status.HTTP_400_BAD_REQUEST)
    if len(message) > 5000:
        return Response({'erreur': 'MESSAGE_TROP_LONG', 'message': 'Le message ne doit pas dépasser 5000 caractères.'},
                        status=status.HTTP_400_BAD_REQUEST)
    m = MessageCitoyen.objects.create(
        nom_complet=nom, contact=request.data.get('contact') or '',
        province=request.data.get('province') or '', sujet=sujet, message=message,
        depute_id=request.data.get('depute_id') or None,
        commission_id=request.data.get('commission_id') or None,
    )
    return Response({'succes': True, 'reference': f'MSG-{m.id:05d}',
                     'message': 'Votre message a bien été transmis.'})


@api_view(['GET'])
@permission_classes([AllowAny])
def annonces(request):
    qs = Annonce.objects.filter(cible_role__in=['tous', 'citoyen'])[:20]
    return Response({'annonces': AnnonceSerializer(qs, many=True).data})


# ════════════════════════════════════════════════════════════════
#  ESPACE DÉPUTÉ (JWT + rôle parlementaire)
# ════════════════════════════════════════════════════════════════
def _refuser_si_non_elu(user):
    return user.role not in ROLES_ELUS


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def apercu(request):
    u = request.user
    if _refuser_si_non_elu(u):
        return Response({'erreur': 'ACCES_REFUSE'}, status=status.HTTP_403_FORBIDDEN)

    prochaines = Seance.objects.select_related('commission').filter(
        statut__in=['prevue', 'en_cours'],
        date_debut__gte=timezone.now() - timezone.timedelta(days=1),
    )[:8]
    mes_coms = [{'id': m.commission_id, 'nom': m.commission.nom, 'role_commission': m.role_commission}
                for m in u.commissions.select_related('commission').all()]
    docs = Document.objects.filter(acces__in=['public', 'interne'])[:8]

    total = u.presences.count()
    presents = u.presences.filter(statut='present').count()
    excuses = u.presences.filter(statut='excuse').count()

    scrutin = VoteSession.objects.filter(ouvert=True).select_related('loi').first()
    mon_vote = None
    scrutin_data = None
    if scrutin:
        b = VoteBulletin.objects.filter(session=scrutin, depute=u).first()
        mon_vote = b.choix if b else None
        scrutin_data = {
            'id': scrutin.id, 'titre': scrutin.titre, 'date_ouverture': scrutin.date_ouverture,
            'numero_reference': scrutin.loi.numero_reference if scrutin.loi_id else None,
            'loi_titre': scrutin.loi.titre if scrutin.loi_id else None,
        }

    return Response({
        'prochaines_seances': SeanceSerializer(prochaines, many=True).data,
        'mes_commissions': mes_coms,
        'documents_recents': DocumentSerializer(docs, many=True).data,
        'presence': {
            'total': total, 'presents': presents, 'excuses': excuses,
            'taux': round(presents / total * 100) if total else None,
        },
        'scrutin_ouvert': scrutin_data,
        'mon_vote': mon_vote,
        'notifications': [],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def voter(request):
    u = request.user
    if _refuser_si_non_elu(u):
        return Response({'erreur': 'ACCES_REFUSE'}, status=status.HTTP_403_FORBIDDEN)
    choix = request.data.get('choix')
    if choix not in ('POUR', 'CONTRE', 'ABSTENTION'):
        return Response({'erreur': 'CHOIX_INVALIDE', 'message': 'Le vote doit être POUR, CONTRE ou ABSTENTION.'},
                        status=status.HTTP_400_BAD_REQUEST)
    scrutin = VoteSession.objects.filter(pk=request.data.get('session_id')).first()
    if not scrutin:
        return Response({'erreur': 'INTROUVABLE', 'message': 'Scrutin introuvable.'},
                        status=status.HTTP_404_NOT_FOUND)
    if not scrutin.ouvert:
        return Response({'erreur': 'SCRUTIN_CLOS', 'message': 'Ce scrutin est clôturé.'},
                        status=status.HTTP_400_BAD_REQUEST)
    if VoteBulletin.objects.filter(session=scrutin, depute=u).exists():
        return Response({'erreur': 'DEJA_VOTE', 'message': 'Vous avez déjà voté sur ce scrutin.'},
                        status=status.HTTP_409_CONFLICT)
    empreinte = hashlib.sha256(f'{scrutin.id}:{u.id}:{choix}:{time.time()}'.encode()) \
        .hexdigest()[:16].upper()
    VoteBulletin.objects.create(session=scrutin, depute=u, choix=choix, hash_verif=empreinte)
    return Response({'succes': True, 'hash_verif': empreinte, 'message': f'Vote « {choix} » enregistré.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ma_presence(request):
    u = request.user
    hist = Presence.objects.select_related('seance').filter(depute=u) \
        .order_by('-seance__date_debut')[:50]
    return Response({'historique': [{
        'statut': p.statut, 'titre': p.seance.titre,
        'type_evenement': p.seance.type_evenement, 'date_debut': p.seance.date_debut,
    } for p in hist]})
