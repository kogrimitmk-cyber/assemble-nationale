import { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F, R, S } from '../theme';
import { useI18n } from '../i18n';
import { useFetch } from '../useFetch';
import { initiales } from '../format';
import { api, qs } from '../api';
import { Ecran, Carte, Badge, Champ, Etat } from '../ui';

function DeputeCarte({ d }) {
  return (
    <Carte style={{ flex: 1, alignItems: 'center', marginHorizontal: 4 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.blue100, borderWidth: 2, borderColor: C.gold500, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: F.serifBold, fontSize: 22, color: C.blue800 }}>{initiales(d)}</Text>
      </View>
      <Text style={{ fontFamily: F.sansBold, fontSize: 13.5, color: C.ink, marginTop: 8, textAlign: 'center' }} numberOfLines={2}>{d.prenom} {d.nom}</Text>
      {!!d.fonction && <Text style={{ fontFamily: F.sansMed, fontSize: 11, color: C.gold700, marginTop: 1 }} numberOfLines={1}>{d.fonction}</Text>}
      <View style={{ marginTop: 6 }}><Badge label={d.groupe_parlementaire || '—'} ton="bleu" /></View>
      <Text style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, marginTop: 4 }} numberOfLines={1}><Ionicons name="location-outline" size={11} /> {d.province || '—'}</Text>
    </Carte>
  );
}

export default function Deputes() {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [debounce, setDeb] = useState('');
  const { data, error, reload } = useFetch(() => api('/api/public/deputes' + qs({ q: debounce.trim() })), [debounce]);

  const onChange = (v) => { setQ(v); clearTimeout(global._dtmr); global._dtmr = setTimeout(() => setDeb(v), 300); };

  // Regroupe en lignes de 2 pour une grille.
  const paires = [];
  const arr = data?.deputes || [];
  for (let i = 0; i < arr.length; i += 2) paires.push(arr.slice(i, i + 2));

  return (
    <Ecran>
      <Champ placeholder={t('deputes.rechercher')} value={q} onChangeText={onChange} style={{ marginBottom: S[2] }} />
      {!!data && <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginBottom: S[3] }}>{data.deputes.length} {t('deputes.resultat')}</Text>}
      <Etat chargement={data === undefined} erreur={error} onRetry={reload}
        vide={data && data.deputes.length === 0} videIcone="people-outline">
        {paires.map((paire, i) => (
          <View key={i} style={{ flexDirection: 'row', marginHorizontal: -4 }}>
            {paire.map((d) => <DeputeCarte key={d.id} d={d} />)}
            {paire.length === 1 && <View style={{ flex: 1, marginHorizontal: 4 }} />}
          </View>
        ))}
      </Etat>
    </Ecran>
  );
}
