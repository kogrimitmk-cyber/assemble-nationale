import { createContext, useContext, useMemo, useState } from 'react';

// Dictionnaires FR / AR (sous-ensemble mobile).
export const I18N = {
  fr: {
    'marque.nom': 'Assemblée Nationale', 'marque.pays': 'République du Tchad',
    'tab.accueil': 'Accueil', 'tab.agenda': 'Agenda', 'tab.lois': 'Lois',
    'tab.deputes': 'Députés', 'tab.citoyen': 'Citoyen',
    'accueil.bonjour': 'Bonjour', 'accueil.aujourdhui': "Aujourd'hui",
    'accueil.en_cours': 'Séance en cours', 'accueil.acces_rapide': 'Accès rapide',
    'accueil.actualites': 'Actualités', 'accueil.rien_auj': 'Aucune séance en cours',
    'qr.lois': 'Suivre les lois', 'qr.agenda': 'Agenda', 'qr.ecrire': 'Écrire',

    'agenda.titre': 'Agenda des séances', 'agenda.a_venir': 'À venir',
    'seance.seance_pleniere': 'Plénière', 'seance.commission': 'Commission',
    'seance.reunion': 'Réunion', 'seance.ceremonie': 'Cérémonie', 'seance.autre': 'Autre',
    'seance.prevue': 'Prévue', 'seance.en_cours': 'En cours', 'seance.terminee': 'Terminée', 'seance.annulee': 'Annulée',

    'lois.titre': 'Textes de loi', 'lois.rechercher': 'Rechercher un texte…',
    'lois.rapporteur': 'Rapporteur', 'lois.commission': 'Commission', 'lois.depose_par': 'Déposé par',
    'lois.projet': 'Projet de loi', 'lois.proposition': 'Proposition', 'lois.voir': 'Détail', 'lois.documents': 'Documents',
    'loi.etapes': 'Étapes franchies', 'loi.articles': 'Articles', 'loi.aucun_article': 'Aucun article publié.',
    'statut.depose': 'Déposé', 'statut.en_commission': 'En commission', 'statut.en_debat': 'En débat',
    'statut.au_vote': 'Au vote', 'statut.adopte': 'Adopté', 'statut.promulgue': 'Promulgué',
    'statut.rejete': 'Rejeté', 'statut.retire': 'Retiré',
    'priorite.prioritaire': 'Prioritaire', 'priorite.urgence_nationale': 'Urgence',
    'etape.depot': 'Dépôt', 'etape.commission': 'Commission', 'etape.pleniere': 'Plénière',
    'etape.vote': 'Vote', 'etape.promulgation': 'Promulgation',

    'deputes.titre': 'Les députés', 'deputes.rechercher': 'Nom, groupe, province…',
    'deputes.resultat': 'élu(s)', 'deputes.circonscription': 'Circonscription',
    'deputes.groupe': 'Groupe', 'deputes.commissions': 'Commissions', 'deputes.presence': 'Présence',

    'citoyen.titre': 'Espace citoyen', 'citoyen.onglet_ecrire': 'Écrire', 'citoyen.onglet_petitions': 'Pétitions',
    'citoyen.nom': 'Nom complet', 'citoyen.contact': 'Téléphone ou email', 'citoyen.sujet': 'Sujet',
    'citoyen.message': 'Votre message', 'citoyen.depute': 'Député concerné', 'citoyen.choisir': 'Choisir…',
    'citoyen.envoyer': 'Envoyer', 'citoyen.envoye': 'Message transmis',
    'citoyen.envoye_texte': 'Votre message a été enregistré sous la référence',
    'citoyen.autre': 'Envoyer un autre message', 'citoyen.signatures': 'signatures',
    'citoyen.objectif': 'objectif', 'citoyen.signer': 'Signer', 'citoyen.signee': 'Signature enregistrée',
    'citoyen.petition_traitee': 'Traitée', 'citoyen.petition_cloturee': 'Clôturée',

    'auth.titre': 'Espace sécurisé', 'auth.sous_titre': "Réservé aux députés et au personnel de l'Assemblée.",
    'auth.identifiant': 'Matricule ou email', 'auth.mdp': 'Mot de passe', 'auth.se_connecter': 'Se connecter',
    'auth.otp_titre': 'Vérification en deux étapes', 'auth.otp_sous_titre': 'Code à 6 chiffres de votre application.',
    'auth.otp_valider': 'Vérifier', 'auth.otp_retour': 'Retour', 'auth.securite': 'Connexion chiffrée.',
    'auth.erreur': 'Identifiant ou mot de passe incorrect.', 'auth.otp_erreur': 'Code incorrect ou expiré.',
    'auth.retour_portail': 'Portail public',

    'bo.titre': 'Espace député', 'bo.bonjour': 'Bonjour', 'bo.presence': 'Présence', 'bo.commissions': 'Commissions',
    'bo.scrutin': 'Scrutin ouvert', 'bo.aucun_scrutin': 'Aucun scrutin ouvert', 'bo.voter': 'Voter',
    'bo.vote_enregistre': 'Vote enregistré', 'bo.deconnexion': 'Déconnexion', 'bo.documents': 'Documents de séance',
    'bo.pour': 'Pour', 'bo.contre': 'Contre', 'bo.abstention': 'Abstention',
    'bo.role_rapporteur': 'Rapporteur', 'bo.role_membre': 'Membre', 'bo.role_president': 'Président', 'bo.role_vice_president': 'Vice-président',

    'sys.hors_ligne': 'Vous êtes hors ligne',
    'sys.hors_ligne_txt': 'Vérifiez votre connexion. Les données déjà consultées restent visibles.',
    'sys.chargement': 'Chargement…', 'sys.erreur': 'Connexion impossible',
    'sys.erreur_txt': 'Le serveur est momentanément injoignable.', 'sys.reessayer': 'Réessayer',
    'sys.vide': 'Aucune donnée disponible', 'sys.vide_txt': 'Les informations apparaîtront ici dès leur publication.',
    'commun.ref': 'Réf', 'commun.demo': 'Démonstration — données fictives.', 'commun.langue': 'ع',
  },
  ar: {
    'marque.nom': 'الجمعية الوطنية', 'marque.pays': 'جمهورية تشاد',
    'tab.accueil': 'الرئيسية', 'tab.agenda': 'الجدول', 'tab.lois': 'القوانين',
    'tab.deputes': 'النواب', 'tab.citoyen': 'المواطن',
    'accueil.bonjour': 'مرحبًا', 'accueil.aujourdhui': 'اليوم',
    'accueil.en_cours': 'جلسة جارية', 'accueil.acces_rapide': 'وصول سريع',
    'accueil.actualites': 'الأخبار', 'accueil.rien_auj': 'لا توجد جلسة جارية',
    'qr.lois': 'متابعة القوانين', 'qr.agenda': 'الجدول', 'qr.ecrire': 'مراسلة',

    'agenda.titre': 'جدول الجلسات', 'agenda.a_venir': 'القادمة',
    'seance.seance_pleniere': 'عامة', 'seance.commission': 'لجنة',
    'seance.reunion': 'اجتماع', 'seance.ceremonie': 'مراسم', 'seance.autre': 'أخرى',
    'seance.prevue': 'مقررة', 'seance.en_cours': 'جارية', 'seance.terminee': 'منتهية', 'seance.annulee': 'ملغاة',

    'lois.titre': 'النصوص التشريعية', 'lois.rechercher': 'ابحث عن نص…',
    'lois.rapporteur': 'المقرر', 'lois.commission': 'اللجنة', 'lois.depose_par': 'أودعه',
    'lois.projet': 'مشروع قانون', 'lois.proposition': 'مقترح', 'lois.voir': 'التفاصيل', 'lois.documents': 'الوثائق',
    'loi.etapes': 'المراحل المنجزة', 'loi.articles': 'المواد', 'loi.aucun_article': 'لا توجد مواد منشورة.',
    'statut.depose': 'مودَع', 'statut.en_commission': 'في اللجنة', 'statut.en_debat': 'قيد المناقشة',
    'statut.au_vote': 'في التصويت', 'statut.adopte': 'معتمَد', 'statut.promulgue': 'صادر',
    'statut.rejete': 'مرفوض', 'statut.retire': 'مسحوب',
    'priorite.prioritaire': 'أولوية', 'priorite.urgence_nationale': 'استعجال',
    'etape.depot': 'الإيداع', 'etape.commission': 'اللجنة', 'etape.pleniere': 'الجلسة',
    'etape.vote': 'التصويت', 'etape.promulgation': 'الإصدار',

    'deputes.titre': 'النواب', 'deputes.rechercher': 'الاسم، الكتلة، الإقليم…',
    'deputes.resultat': 'نائب', 'deputes.circonscription': 'الدائرة',
    'deputes.groupe': 'الكتلة', 'deputes.commissions': 'اللجان', 'deputes.presence': 'الحضور',

    'citoyen.titre': 'فضاء المواطن', 'citoyen.onglet_ecrire': 'مراسلة', 'citoyen.onglet_petitions': 'العرائض',
    'citoyen.nom': 'الاسم الكامل', 'citoyen.contact': 'الهاتف أو البريد', 'citoyen.sujet': 'الموضوع',
    'citoyen.message': 'رسالتك', 'citoyen.depute': 'النائب المعني', 'citoyen.choisir': 'اختر…',
    'citoyen.envoyer': 'إرسال', 'citoyen.envoye': 'تم إرسال الرسالة',
    'citoyen.envoye_texte': 'سُجِّلت رسالتك تحت المرجع',
    'citoyen.autre': 'إرسال رسالة أخرى', 'citoyen.signatures': 'توقيعًا',
    'citoyen.objectif': 'الهدف', 'citoyen.signer': 'توقيع', 'citoyen.signee': 'تم تسجيل التوقيع',
    'citoyen.petition_traitee': 'عولجت', 'citoyen.petition_cloturee': 'أُغلقت',

    'auth.titre': 'الفضاء الآمن', 'auth.sous_titre': 'مخصص للنواب وموظفي الجمعية.',
    'auth.identifiant': 'رقم التسجيل أو البريد', 'auth.mdp': 'كلمة المرور', 'auth.se_connecter': 'دخول',
    'auth.otp_titre': 'التحقق بخطوتين', 'auth.otp_sous_titre': 'رمز من 6 أرقام من تطبيقك.',
    'auth.otp_valider': 'تحقق', 'auth.otp_retour': 'رجوع', 'auth.securite': 'اتصال مشفَّر.',
    'auth.erreur': 'المعرِّف أو كلمة المرور غير صحيحة.', 'auth.otp_erreur': 'رمز غير صحيح أو منتهٍ.',
    'auth.retour_portail': 'البوابة العمومية',

    'bo.titre': 'فضاء النائب', 'bo.bonjour': 'مرحبًا', 'bo.presence': 'الحضور', 'bo.commissions': 'اللجان',
    'bo.scrutin': 'اقتراع مفتوح', 'bo.aucun_scrutin': 'لا يوجد اقتراع مفتوح', 'bo.voter': 'تصويت',
    'bo.vote_enregistre': 'تم تسجيل التصويت', 'bo.deconnexion': 'خروج', 'bo.documents': 'وثائق الجلسات',
    'bo.pour': 'موافق', 'bo.contre': 'معارض', 'bo.abstention': 'ممتنع',
    'bo.role_rapporteur': 'مقرر', 'bo.role_membre': 'عضو', 'bo.role_president': 'رئيس', 'bo.role_vice_president': 'نائب الرئيس',

    'sys.hors_ligne': 'أنت غير متصل',
    'sys.hors_ligne_txt': 'تحقق من اتصالك. تبقى البيانات المطّلع عليها ظاهرة.',
    'sys.chargement': 'جارٍ التحميل…', 'sys.erreur': 'تعذر الاتصال',
    'sys.erreur_txt': 'الخادم غير متاح مؤقتًا.', 'sys.reessayer': 'إعادة المحاولة',
    'sys.vide': 'لا توجد بيانات', 'sys.vide_txt': 'ستظهر المعلومات هنا فور نشرها.',
    'commun.ref': 'مرجع', 'commun.demo': 'عرض تجريبي — بيانات وهمية.', 'commun.langue': 'FR',
  },
};

const Ctx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('fr');
  const value = useMemo(() => ({
    lang,
    rtl: lang === 'ar',
    t: (cle) => I18N[lang]?.[cle] ?? I18N.fr[cle] ?? cle,
    toggle: () => setLang((l) => (l === 'fr' ? 'ar' : 'fr')),
    locale: lang === 'ar' ? 'ar-TD' : 'fr-FR',
  }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
