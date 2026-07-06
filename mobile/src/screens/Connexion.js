import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, F, R, S } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import { Bouton, Champ, Serif } from '../ui';

function LogoHemicycle({ size = 56 }) {
  // Approximation du logo hémicycle avec des arcs (View borders).
  return (
    <View style={{ width: size, height: size / 2 + 6, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ position: 'absolute', bottom: 0, width: size, height: size / 2, borderTopLeftRadius: size, borderTopRightRadius: size, borderWidth: 3, borderBottomWidth: 0, borderColor: C.gold500 }} />
      <View style={{ position: 'absolute', bottom: 0, width: size * 0.6, height: size * 0.3, borderTopLeftRadius: size, borderTopRightRadius: size, borderWidth: 3, borderBottomWidth: 0, borderColor: '#fff' }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold500, marginBottom: 2 }} />
    </View>
  );
}

export default function Connexion({ navigation }) {
  const { t } = useI18n();
  const { login, verifierOtp } = useAuth();
  const [defi, setDefi] = useState(null);
  const [id, setId] = useState('');
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const refs = useRef([]);

  const seConnecter = async () => {
    setBusy(true); setErreur('');
    try {
      const r = await login(id, mdp);
      if (r.etape === '2fa') setDefi(r.defi);
      else navigation.replace('Espace');
    } catch (e) { setErreur(e.statut === 429 ? e.message : t('auth.erreur')); }
    finally { setBusy(false); }
  };

  const setCase = (i, v) => {
    const d = v.replace(/\D/g, '').slice(0, 1);
    const next = [...code]; next[i] = d; setCode(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const verifier = async () => {
    setErreur('');
    try { await verifierOtp(defi, code.join('')); navigation.replace('Espace'); }
    catch (e) { setErreur(e.code === 'DEFI_EXPIRE' ? e.message : t('auth.otp_erreur')); setCode(['', '', '', '', '', '']); refs.current[0]?.focus(); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.blue900 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <SafeAreaView edges={['top']} style={{ paddingHorizontal: S[4] }}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: S[3] }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontFamily: F.sansMed }}>{t('auth.retour_portail')}</Text>
            </Pressable>
            <View style={{ alignItems: 'center', marginTop: S[4], marginBottom: S[6] }}>
              <LogoHemicycle />
              <Serif style={{ color: '#fff', fontSize: 22, marginTop: 10 }}>AN Connect Tchad</Serif>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontFamily: F.sans, fontSize: 13, marginTop: 4, textAlign: 'center' }}>{t('auth.sous_titre')}</Text>
            </View>
          </SafeAreaView>

          <View style={{ flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: S[6], gap: S[4] }}>
            {!defi ? (
              <>
                <Serif style={{ fontSize: 22, color: C.blue800 }}>{t('auth.titre')}</Serif>
                <View style={{ gap: S[3] }}>
                  <Champ placeholder={t('auth.identifiant')} autoCapitalize="none" value={id} onChangeText={setId} />
                  <Champ placeholder={t('auth.mdp')} secureTextEntry value={mdp} onChangeText={setMdp} />
                  {!!erreur && <Text style={{ color: C.red600, fontFamily: F.sansMed, fontSize: 13 }}>{erreur}</Text>}
                </View>
                <Bouton titre={t('auth.se_connecter')} icone="lock-closed" variante="primaire" plein disabled={busy} onPress={seConnecter} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                  <Ionicons name="shield-checkmark-outline" size={15} color={C.green600} />
                  <Text style={{ fontFamily: F.sans, fontSize: 12.5, color: C.muted }}>{t('auth.securite')}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 56, height: 56, borderRadius: R.lg, backgroundColor: C.gold100, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="phone-portrait-outline" size={26} color={C.gold600} />
                  </View>
                  <Serif style={{ fontSize: 20, color: C.blue800 }}>{t('auth.otp_titre')}</Serif>
                  <Text style={{ fontFamily: F.sans, fontSize: 13, color: C.muted, textAlign: 'center' }}>{t('auth.otp_sous_titre')}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                  {code.map((v, i) => (
                    <TextInput key={i} ref={(el) => (refs.current[i] = el)} value={v} onChangeText={(x) => setCase(i, x)}
                      keyboardType="number-pad" maxLength={1}
                      style={{ width: 46, height: 56, borderWidth: 2, borderColor: v ? C.blue800 : C.border, borderRadius: R.md, textAlign: 'center', fontSize: 22, fontFamily: F.sansBold, color: C.ink, backgroundColor: v ? C.blue50 : C.surface }} />
                  ))}
                </View>
                {!!erreur && <Text style={{ color: C.red600, fontFamily: F.sansMed, fontSize: 13, textAlign: 'center' }}>{erreur}</Text>}
                <Bouton titre={t('auth.otp_valider')} variante="primaire" plein onPress={verifier} />
                <Pressable onPress={() => { setDefi(null); setErreur(''); }} style={{ alignItems: 'center', paddingVertical: 6 }}>
                  <Text style={{ color: C.blue800, fontFamily: F.sansMed }}>{t('auth.otp_retour')}</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
