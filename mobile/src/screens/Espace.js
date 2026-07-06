import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, F, R, S } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import { useFetch } from '../useFetch';
import { fmtHeure, initiales } from '../format';
import { api } from '../api';
import { Carte, Badge, Bouton, Serif, Etat, Vue } from '../ui';

function KPI({ valeur, label, icone, couleur, bg }) {
  return (
    <Carte style={{ flex: 1, alignItems: 'center', marginHorizontal: 4 }}>
      <View style={{ width: 42, height: 42, borderRadius: R.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <Ionicons name={icone} size={20} color={couleur} />
      </View>
      <Serif style={{ fontSize: 24, color: C.blue800 }}>{valeur}</Serif>
      <Text style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, textAlign: 'center' }}>{label}</Text>
    </Carte>
  );
}

function VoteOuvert({ scrutin, monVote, onVote }) {
  const { t } = useI18n();
  const [choix, setChoix] = useState(null);
  if (monVote) return (
    <Carte style={{ backgroundColor: C.green100, borderColor: C.green600 }}>
      <Text style={{ fontFamily: F.sansBold, color: C.green700 }}><Ionicons name="checkmark-circle" size={16} /> {t('bo.vote_enregistre')} — {monVote}</Text>
    </Carte>
  );
  const opts = [['POUR', C.green600, 'bo.pour'], ['CONTRE', C.red600, 'bo.contre'], ['ABSTENTION', C.muted, 'bo.abstention']];
  return (
    <Carte style={{ borderColor: C.gold500, borderWidth: 2, backgroundColor: C.gold50 }}>
      <Text style={{ fontFamily: F.sansBold, color: C.blue800, marginBottom: 2 }}><Ionicons name="flash" size={15} /> {t('bo.scrutin')}</Text>
      <Text style={{ fontFamily: F.sansBold, fontSize: 14, color: C.ink }}>{scrutin.loi_titre || scrutin.titre}</Text>
      {!!scrutin.numero_reference && <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginBottom: 8 }}>{scrutin.numero_reference}</Text>}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {opts.map(([c, col, cle]) => (
          <Pressable key={c} onPress={() => setChoix(c)} style={{ flex: 1, minHeight: 60, borderRadius: R.md, borderWidth: 2, borderColor: choix === c ? col : C.border, backgroundColor: choix === c ? col : C.surface, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Ionicons name={c === 'POUR' ? 'checkmark' : c === 'CONTRE' ? 'close' : 'remove'} size={20} color={choix === c ? '#fff' : col} />
            <Text style={{ fontFamily: F.sansBold, fontSize: 12, color: choix === c ? '#fff' : C.text }}>{t(cle)}</Text>
          </Pressable>
        ))}
      </View>
      <Bouton titre={t('bo.voter')} variante="primaire" plein disabled={!choix} style={{ marginTop: 10 }} onPress={() => onVote(choix)} />
    </Carte>
  );
}

export default function Espace({ navigation }) {
  const { t, locale } = useI18n();
  const { utilisateur, logout } = useAuth();
  const [a, setA] = useState(undefined);
  const [err, setErr] = useState(null);

  const charger = () => { setA(undefined); setErr(null); api('/api/depute/apercu').then(setA).catch(setErr); };
  useEffect(() => { if (utilisateur) charger(); }, [utilisateur]);

  if (!utilisateur) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <Vue icone="lock-closed-outline" couleur={C.blue800} bg={C.blue100} titre={t('bo.titre')} texte={t('auth.sous_titre')}
          action={<Bouton titre={t('auth.se_connecter')} variante="primaire" onPress={() => navigation.replace('Connexion')} />} />
      </SafeAreaView>
    );
  }

  const u = utilisateur;
  const voter = async (choix) => {
    try { await api('/api/depute/voter', { method: 'POST', body: { session_id: a.scrutin_ouvert.id, choix } }); charger(); }
    catch (e) { /* ignore */ }
  };
  const deconnexion = async () => { await logout(); navigation.navigate('Onglets'); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.blue800 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: S[4] }}>
          <Pressable onPress={() => navigation.navigate('Onglets')} hitSlop={8}><Ionicons name="close" size={24} color="#fff" /></Pressable>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.blue100, borderWidth: 2, borderColor: C.gold500, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.sansBold, color: C.blue800 }}>{initiales(u)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.sansBold, color: '#fff', fontSize: 15 }}>{u.prenom} {u.nom}</Text>
            <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{u.fonction || u.role}{u.groupe_parlementaire ? ' · ' + u.groupe_parlementaire : ''}</Text>
          </View>
          <Pressable onPress={deconnexion} hitSlop={8}><Ionicons name="log-out-outline" size={22} color="#fff" /></Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: S[4], paddingBottom: S[16] }}>
        <Etat chargement={a === undefined} erreur={err} onRetry={charger}>
          {a && (
            <>
              <Serif style={{ fontSize: 22, color: C.blue800, marginBottom: S[3] }}>{t('bo.bonjour')}, {u.prenom}</Serif>

              <View style={{ flexDirection: 'row', marginHorizontal: -4, marginBottom: S[2] }}>
                <KPI valeur={a.presence.taux !== null ? a.presence.taux + '%' : '—'} label={t('bo.presence')} icone="person-outline" couleur={C.blue800} bg={C.blue100} />
                <KPI valeur={a.mes_commissions.length} label={t('bo.commissions')} icone="people-outline" couleur={C.gold600} bg={C.gold100} />
                <KPI valeur={u.totp_active ? '✓' : '2FA'} label="2FA" icone="shield-checkmark-outline" couleur={u.totp_active ? C.green600 : C.red600} bg={u.totp_active ? C.green100 : C.red100} />
              </View>

              {a.scrutin_ouvert
                ? <VoteOuvert scrutin={a.scrutin_ouvert} monVote={a.mon_vote} onVote={voter} />
                : <Carte><Vue icone="checkbox-outline" couleur={C.blue800} bg={C.blue100} titre={t('bo.aucun_scrutin')} texte={t('bo.aucun_scrutin_desc') || ''} /></Carte>}

              <Serif style={{ fontSize: 17, color: C.blue800, marginTop: S[4], marginBottom: S[2] }}>{t('bo.agenda_perso') || 'Agenda'}</Serif>
              {a.prochaines_seances.length ? a.prochaines_seances.slice(0, 5).map((s) => (
                <Carte key={s.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: s.type_evenement === 'commission' ? C.gold500 : C.blue800 }}>
                  <Text style={{ fontFamily: F.sansBold, color: C.blue900, minWidth: 48 }}>{fmtHeure(s.date_debut, locale)}</Text>
                  <Text style={{ fontFamily: F.sans, fontSize: 13, color: C.ink, flex: 1 }}>{s.titre}</Text>
                </Carte>
              )) : <Carte><Text style={{ color: C.muted, fontFamily: F.sans, textAlign: 'center' }}>{t('sys.vide')}</Text></Carte>}

              <Serif style={{ fontSize: 17, color: C.blue800, marginTop: S[4], marginBottom: S[2] }}>{t('bo.documents')}</Serif>
              {a.documents_recents.slice(0, 5).map((d) => (
                <Carte key={d.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Ionicons name={d.acces === 'public' ? 'document-text-outline' : 'lock-closed-outline'} size={18} color={C.blue800} />
                  <Text style={{ fontFamily: F.sansMed, fontSize: 13, color: C.ink, flex: 1 }} numberOfLines={1}>{d.titre}</Text>
                  <Badge label={d.acces === 'public' ? 'Public' : d.acces === 'interne' ? 'Interne' : 'Confid.'} ton={d.acces === 'public' ? 'vert' : 'or'} />
                </Carte>
              ))}
            </>
          )}
        </Etat>
      </ScrollView>
    </View>
  );
}
