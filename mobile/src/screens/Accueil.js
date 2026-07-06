import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F, R, S } from '../theme';
import { useI18n } from '../i18n';
import { useFetch } from '../useFetch';
import { fmtDate, fmtHeure } from '../format';
import { api } from '../api';
import { Ecran, Carte, Serif, Badge, Etat, Squelette } from '../ui';

function AccesRapide({ icone, label, couleur, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Carte style={{ alignItems: 'center', paddingVertical: S[5], marginBottom: 0 }}>
        <Ionicons name={icone} size={26} color={couleur} />
        <Text style={{ fontFamily: F.sansMed, fontSize: 12, color: C.ink, marginTop: 6, textAlign: 'center' }}>{label}</Text>
      </Carte>
    </Pressable>
  );
}

export default function Accueil({ navigation }) {
  const { t, locale } = useI18n();
  const stats = useFetch(() => api('/api/public/stats'), []);
  const agenda = useFetch(() => api('/api/public/agenda?statut=en_cours'), []);
  const aVenir = useFetch(() => api('/api/public/agenda?statut=prevue'), []);
  const annonces = useFetch(() => api('/api/public/annonces'), []);

  const enCours = agenda.data?.seances?.[0] || aVenir.data?.seances?.[0];

  return (
    <Ecran>
      <Serif style={{ fontSize: 24, color: C.blue800, marginBottom: 2 }}>{t('accueil.bonjour')} 👋</Serif>
      <Text style={{ fontFamily: F.sans, color: C.muted, marginBottom: S[4] }}>{t('marque.nom')}</Text>

      <Text style={{ fontFamily: F.sansBold, fontSize: 12, color: C.gold700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: S[2] }}>{t('accueil.aujourdhui')}</Text>
      {agenda.data === undefined && aVenir.data === undefined ? <Squelette h={92} />
        : enCours ? (
          <Carte style={{ borderLeftWidth: 4, borderLeftColor: enCours.statut === 'en_cours' ? C.green600 : C.blue800 }}>
            <Badge label={t('seance.' + enCours.statut)} statut={enCours.statut} />
            <Text style={{ fontFamily: F.sansBold, fontSize: 14, color: C.ink, marginTop: 6 }}>{enCours.titre}</Text>
            <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 2 }}>
              <Ionicons name="time-outline" size={12} /> {fmtHeure(enCours.date_debut, locale)}{enCours.lieu ? '  ·  ' + enCours.lieu : ''}
            </Text>
          </Carte>
        ) : (
          <Carte><Text style={{ fontFamily: F.sans, color: C.muted, textAlign: 'center' }}>{t('accueil.rien_auj')}</Text></Carte>
        )}

      <Text style={{ fontFamily: F.sansBold, fontSize: 12, color: C.gold700, textTransform: 'uppercase', letterSpacing: 1, marginTop: S[4], marginBottom: S[2] }}>{t('accueil.acces_rapide')}</Text>
      <View style={{ flexDirection: 'row', gap: S[3] }}>
        <AccesRapide icone="document-text-outline" label={t('qr.lois')} couleur={C.blue800} onPress={() => navigation.navigate('Lois')} />
        <AccesRapide icone="calendar-outline" label={t('qr.agenda')} couleur={C.gold600} onPress={() => navigation.navigate('Agenda')} />
        <AccesRapide icone="paper-plane-outline" label={t('qr.ecrire')} couleur={C.green600} onPress={() => navigation.navigate('Citoyen')} />
      </View>

      <Text style={{ fontFamily: F.sansBold, fontSize: 12, color: C.gold700, textTransform: 'uppercase', letterSpacing: 1, marginTop: S[5], marginBottom: S[2] }}>{t('accueil.actualites')}</Text>
      <Etat chargement={annonces.data === undefined} erreur={annonces.error} onRetry={annonces.reload}
        vide={annonces.data && annonces.data.annonces.length === 0}>
        {annonces.data?.annonces?.slice(0, 4).map((a) => (
          <Carte key={a.id}>
            {a.priorite !== 'normale' && <Badge label={a.priorite === 'urgente' ? '!' : '•'} ton={a.priorite === 'urgente' ? 'rouge' : 'or'} />}
            <Serif style={{ fontSize: 16, color: C.blue800, marginTop: a.priorite !== 'normale' ? 6 : 0 }}>{a.titre}</Serif>
            <Text style={{ fontFamily: F.sans, fontSize: 13, color: C.text, marginTop: 4 }} numberOfLines={3}>{a.contenu}</Text>
            <Text style={{ fontFamily: F.sansMed, fontSize: 11, color: C.gold700, marginTop: 8 }}>{fmtDate(a.date_publication, locale)}</Text>
          </Carte>
        ))}
      </Etat>
    </Ecran>
  );
}
