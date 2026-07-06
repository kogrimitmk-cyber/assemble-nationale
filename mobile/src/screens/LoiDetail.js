import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F, R, S } from '../theme';
import { useI18n } from '../i18n';
import { useFetch } from '../useFetch';
import { fmtDate } from '../format';
import { api } from '../api';
import { Ecran, Carte, Badge, ProgressLoi, Serif, Etat } from '../ui';

export default function LoiDetail({ route }) {
  const { ref } = route.params;
  const { t, locale } = useI18n();
  const { data, error, reload } = useFetch(() => api('/api/public/lois/' + encodeURIComponent(ref)), [ref]);

  if (data === undefined || error) {
    return <Ecran><Etat chargement={!error} erreur={error} onRetry={reload} /></Ecran>;
  }
  const { loi, etapes, articles } = data;

  return (
    <Ecran>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
        <Badge label={t(loi.type_texte === 'proposition' ? 'lois.proposition' : 'lois.projet')} ton="bleu" />
        {loi.priorite === 'urgence_nationale' && <Badge label={t('priorite.urgence_nationale')} ton="rouge" />}
        {loi.priorite === 'prioritaire' && <Badge label={t('priorite.prioritaire')} ton="or" />}
        <Badge label={t('statut.' + loi.statut)} statut={loi.statut} />
      </View>
      <Serif style={{ fontSize: 21, color: C.blue800 }}>{loi.titre}</Serif>
      <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 2, marginBottom: S[3] }}>{t('commun.ref')}: {loi.numero_reference}</Text>

      <Carte><ProgressLoi statut={loi.statut} /></Carte>

      {!!loi.resume && <Carte><Text style={{ fontFamily: F.sans, fontSize: 14, color: C.text, lineHeight: 22 }}>{loi.resume}</Text></Carte>}

      <View style={{ gap: 4, marginTop: S[2], marginBottom: S[3] }}>
        {!!loi.commission_nom && <Ligne icone="git-branch-outline" label={t('lois.commission')} val={loi.commission_nom} />}
        {!!loi.rapporteur_nom && <Ligne icone="person-outline" label={t('lois.rapporteur')} val={loi.rapporteur_nom} />}
        {!!loi.depose_par && <Ligne icone="business-outline" label={t('lois.depose_par')} val={loi.depose_par} />}
      </View>

      <Serif style={{ fontSize: 17, color: C.blue800, marginTop: S[3], marginBottom: S[2] }}>{t('loi.etapes')}</Serif>
      <Carte>
        {etapes.map((e, i) => (
          <View key={e.id} style={{ flexDirection: 'row', gap: 12, paddingBottom: i === etapes.length - 1 ? 0 : S[4] }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.blue800, borderWidth: 3, borderColor: i === etapes.length - 1 ? C.gold200 : C.blue100 }} />
              {i < etapes.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: C.border, marginTop: 2 }} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.sansBold, fontSize: 14, color: C.ink }}>{e.libelle}</Text>
              <Text style={{ fontFamily: F.sansMed, fontSize: 12, color: C.gold700 }}>{fmtDate(e.date_etape, locale)}</Text>
              {!!e.description && <Text style={{ fontFamily: F.sans, fontSize: 12.5, color: C.muted, marginTop: 2 }}>{e.description}</Text>}
            </View>
          </View>
        ))}
      </Carte>

      <Serif style={{ fontSize: 17, color: C.blue800, marginTop: S[3], marginBottom: S[2] }}>{t('loi.articles')} ({articles.length})</Serif>
      {articles.length ? articles.map((a) => (
        <Carte key={a.id}>
          <Text style={{ fontFamily: F.sansBold, fontSize: 14, color: C.blue800 }}>{a.numero}{a.titre ? ' — ' + a.titre : ''}</Text>
          {!!a.contenu && <Text style={{ fontFamily: F.sans, fontSize: 13.5, color: C.text, marginTop: 4, lineHeight: 21 }}>{a.contenu}</Text>}
        </Carte>
      )) : <Carte><Text style={{ fontFamily: F.sans, color: C.muted, textAlign: 'center' }}>{t('loi.aucun_article')}</Text></Carte>}
    </Ecran>
  );
}

function Ligne({ icone, label, val }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icone} size={15} color={C.gold600} />
      <Text style={{ fontFamily: F.sansMed, fontSize: 13, color: C.muted }}>{label} :</Text>
      <Text style={{ fontFamily: F.sans, fontSize: 13, color: C.ink, flex: 1 }}>{val}</Text>
    </View>
  );
}
