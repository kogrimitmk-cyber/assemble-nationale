import { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F, S } from '../theme';
import { useI18n } from '../i18n';
import { useFetch } from '../useFetch';
import { api, qs } from '../api';
import { Ecran, Carte, Badge, Champ, ProgressLoi, Etat } from '../ui';

export function LoiCarte({ l, onPress }) {
  const { t } = useI18n();
  return (
    <Carte onPress={onPress} style={l.priorite === 'urgence_nationale' ? { borderLeftWidth: 3, borderLeftColor: C.red600 } : null}>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
        <Badge label={t(l.type_texte === 'proposition' ? 'lois.proposition' : 'lois.projet')} ton="bleu" />
        {l.priorite === 'urgence_nationale' && <Badge label={t('priorite.urgence_nationale')} ton="rouge" />}
        {l.priorite === 'prioritaire' && <Badge label={t('priorite.prioritaire')} ton="or" />}
        <View style={{ flex: 1 }} />
        <Badge label={t('statut.' + l.statut)} statut={l.statut} />
      </View>
      <Text style={{ fontFamily: F.sansBold, fontSize: 15, color: C.ink }}>{l.titre}</Text>
      <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 2, marginBottom: 6 }}>{t('commun.ref')}: {l.numero_reference}</Text>
      <ProgressLoi statut={l.statut} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, flex: 1 }} numberOfLines={1}>
          {l.commission_nom ? <><Ionicons name="git-branch-outline" size={12} /> {l.commission_nom}</> : ' '}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={{ fontFamily: F.sansMed, fontSize: 13, color: C.blue800 }}>{t('lois.voir')}</Text>
          <Ionicons name="chevron-forward" size={14} color={C.blue800} />
        </View>
      </View>
    </Carte>
  );
}

export default function Lois({ navigation }) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [debounce, setDeb] = useState('');
  const { data, error, reload } = useFetch(() => api('/api/public/lois' + qs({ q: debounce.trim() })), [debounce]);

  const onChange = (v) => { setQ(v); clearTimeout(global._tmr); global._tmr = setTimeout(() => setDeb(v), 300); };

  return (
    <Ecran>
      <View style={{ marginBottom: S[3] }}>
        <Champ placeholder={t('lois.rechercher')} value={q} onChangeText={onChange} />
      </View>
      <Etat chargement={data === undefined} erreur={error} onRetry={reload}
        vide={data && data.lois.length === 0} videIcone="document-text-outline">
        {data?.lois?.map((l) => <LoiCarte key={l.id} l={l} onPress={() => navigation.navigate('LoiDetail', { ref: l.numero_reference })} />)}
      </Etat>
    </Ecran>
  );
}
