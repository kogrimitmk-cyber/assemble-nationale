import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F, S } from '../theme';
import { useI18n } from '../i18n';
import { useFetch } from '../useFetch';
import { fmtDate, fmtHeure } from '../format';
import { api } from '../api';
import { Ecran, Carte, Badge, Etat } from '../ui';

export function SeanceCarte({ s }) {
  const { t, locale } = useI18n();
  const badgeTon = s.type_evenement === 'seance_pleniere' ? 'bleu' : s.type_evenement === 'commission' ? 'or' : 'neutre';
  return (
    <Carte>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
        <Badge label={t('seance.' + s.type_evenement)} ton={badgeTon} />
        <Badge label={t('seance.' + s.statut)} statut={s.statut} />
      </View>
      <Text style={{ fontFamily: F.sansBold, fontSize: 15, color: C.ink }}>{s.titre}</Text>
      <View style={{ marginTop: 6, gap: 3 }}>
        <Text style={{ fontFamily: F.sans, fontSize: 12.5, color: C.muted }}><Ionicons name="calendar-outline" size={12} /> {fmtDate(s.date_debut, locale)}  ·  {fmtHeure(s.date_debut, locale)}</Text>
        {!!s.lieu && <Text style={{ fontFamily: F.sans, fontSize: 12.5, color: C.muted }}><Ionicons name="location-outline" size={12} /> {s.lieu}</Text>}
      </View>
    </Carte>
  );
}

export default function Agenda() {
  const { t } = useI18n();
  const { data, error, reload } = useFetch(() => api('/api/public/agenda'), []);
  return (
    <Ecran>
      <Etat chargement={data === undefined} erreur={error} onRetry={reload}
        vide={data && data.seances.length === 0} videIcone="calendar-outline">
        {data?.seances?.map((s) => <SeanceCarte key={s.id} s={s} />)}
      </Etat>
    </Ecran>
  );
}
