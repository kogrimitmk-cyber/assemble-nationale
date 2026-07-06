import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, F, OMBRE, R, S, STATUT_COULEUR } from './theme';
import { useI18n } from './i18n';

/* Écran : fond + zone sûre + direction RTL (flip du layout via Yoga). */
export function Ecran({ children, scroll = true, style }) {
  const { rtl } = useI18n();
  const contenu = scroll
    ? <ScrollView contentContainerStyle={[{ padding: S[4], paddingBottom: S[16] }, style]}>{children}</ScrollView>
    : <View style={[{ flex: 1, padding: S[4] }, style]}>{children}</View>;
  return (
    <SafeAreaView style={[st.ecran, { direction: rtl ? 'rtl' : 'ltr' }]} edges={['top', 'left', 'right']}>
      {contenu}
    </SafeAreaView>
  );
}

export function Serif({ children, style }) { return <Text style={[st.serif, style]}>{children}</Text>; }
export function TitrePage({ children }) { return <Text style={st.titrePage}>{children}</Text>; }
export function SousTitre({ children }) { const { rtl } = useI18n(); return <Text style={[st.sousTitre, rtl && { textAlign: 'right' }]}>{children}</Text>; }

export function Carte({ children, style, onPress }) {
  const Comp = onPress ? Pressable : View;
  return <Comp onPress={onPress} style={({ pressed }) => [st.carte, onPress && pressed && { opacity: 0.85 }, style]}>{children}</Comp>;
}

export function Badge({ label, statut, ton }) {
  const c = statut ? STATUT_COULEUR[statut] : ({
    or: { bg: C.gold200, fg: C.gold700 }, rouge: { bg: C.red100, fg: C.red700 },
    vert: { bg: C.green100, fg: C.green700 }, bleu: { bg: C.blue100, fg: C.blue800 },
    neutre: { bg: '#F2F2F5', fg: C.text },
  }[ton] || { bg: '#F2F2F5', fg: C.text });
  return (
    <View style={[st.badge, { backgroundColor: c.bg, borderColor: c.fg }]}>
      <Text style={[st.badgeTxt, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function Bouton({ titre, onPress, variante = 'primaire', icone, plein, disabled, style }) {
  const v = {
    primaire: { bg: C.blue800, fg: '#fff' },
    or: { bg: C.gold500, fg: C.blue900 },
    contour: { bg: 'transparent', fg: C.blue800, bord: C.blue800 },
    danger: { bg: C.red600, fg: '#fff' },
    fantome: { bg: 'transparent', fg: C.text, bord: C.border },
  }[variante];
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={({ pressed }) => [st.bouton, { backgroundColor: v.bg, borderColor: v.bord || v.bg },
        plein && { alignSelf: 'stretch' }, disabled && { opacity: 0.5 }, pressed && { opacity: 0.85 }, style]}>
      {icone && <Ionicons name={icone} size={18} color={v.fg} />}
      <Text style={[st.boutonTxt, { color: v.fg }]}>{titre}</Text>
    </Pressable>
  );
}

export function Champ(props) {
  const { rtl } = useI18n();
  return <TextInput placeholderTextColor={C.muted} {...props}
    style={[st.champ, rtl && { textAlign: 'right' }, props.multiline && { height: 110, textAlignVertical: 'top' }, props.style]} />;
}

/* Progression législative — 5 étapes. */
const ETAPE = ['etape.depot', 'etape.commission', 'etape.pleniere', 'etape.vote', 'etape.promulgation'];
const IDX = { depose: 0, en_commission: 1, en_debat: 2, au_vote: 3, adopte: 4, promulgue: 5, rejete: 3, retire: 1 };
export function ProgressLoi({ statut }) {
  const { t } = useI18n();
  const idx = IDX[statut] ?? 0;
  const last = ETAPE.length - 1;
  return (
    <View style={st.prog}>
      {ETAPE.map((cle, i) => {
        const fait = i < idx, actif = i === idx;
        return (
          <View key={cle} style={st.progEtape}>
            <View style={st.progRangee}>
              <View style={[st.progTrait, { backgroundColor: i <= idx ? C.blue800 : C.border, opacity: i === 0 ? 0 : 1 }]} />
              <View style={[st.progPoint, fait && { backgroundColor: C.blue800, borderColor: C.blue800 },
                actif && { backgroundColor: C.blue800, borderColor: C.gold500 }]}>
                {fait && <Ionicons name="checkmark" size={10} color="#fff" />}
              </View>
              <View style={[st.progTrait, { backgroundColor: i < idx ? C.blue800 : C.border, opacity: i === last ? 0 : 1 }]} />
            </View>
            <Text style={[st.progLbl, (fait || actif) && { color: C.ink, fontFamily: F.sansMed }]} numberOfLines={1}>{t(cle)}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* État unifié : chargement / erreur / vide / contenu. */
export function Etat({ chargement, erreur, vide, onRetry, videTitre, videTexte, videIcone = 'file-tray-outline', children }) {
  const { t } = useI18n();
  if (erreur) return (
    <Vue icone="cloud-offline-outline" couleur={C.red600} bg={C.red100} titre={t('sys.erreur')} texte={t('sys.erreur_txt')}
      action={onRetry && <Bouton titre={t('sys.reessayer')} variante="contour" icone="refresh" onPress={onRetry} />} />
  );
  if (chargement) return <View style={{ padding: S[16], alignItems: 'center' }}><ActivityIndicator size="large" color={C.blue800} /><Text style={{ color: C.muted, marginTop: S[3] }}>{t('sys.chargement')}</Text></View>;
  if (vide) return <Vue icone={videIcone} couleur={C.blue800} bg={C.blue100} titre={videTitre || t('sys.vide')} texte={videTexte || t('sys.vide_txt')} />;
  return children;
}

export function Vue({ icone, couleur, bg, titre, texte, action }) {
  return (
    <View style={st.videWrap}>
      <View style={[st.videIcone, { backgroundColor: bg || C.blue100 }]}><Ionicons name={icone} size={34} color={couleur || C.blue800} /></View>
      <Serif style={st.videTitre}>{titre}</Serif>
      <Text style={st.videTexte}>{texte}</Text>
      {action}
    </View>
  );
}

export const Squelette = ({ h = 90, style }) => <View style={[{ height: h, backgroundColor: '#ECECF2', borderRadius: R.md, marginBottom: S[3] }, style]} />;

const st = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.bg },
  serif: { fontFamily: F.serifBold, color: C.ink },
  titrePage: { fontFamily: F.serifBold, fontSize: 28, color: C.blue800, marginBottom: 4 },
  sousTitre: { fontFamily: F.sans, fontSize: 14, color: C.text, marginBottom: S[5] },
  carte: { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 1, borderColor: C.border, padding: S[4], marginBottom: S[3], ...OMBRE },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: R.sm, paddingVertical: 3, paddingHorizontal: 9 },
  badgeTxt: { fontSize: 11, fontFamily: F.sansBold, textTransform: 'uppercase', letterSpacing: 0.3 },
  bouton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, paddingHorizontal: S[5], borderRadius: R.md, borderWidth: 2 },
  boutonTxt: { fontFamily: F.sansBold, fontSize: 15 },
  champ: { minHeight: 48, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: S[4], fontFamily: F.sans, fontSize: 15, color: C.ink, backgroundColor: C.surface },
  prog: { flexDirection: 'row', marginVertical: S[2] },
  progEtape: { flex: 1, alignItems: 'center' },
  progRangee: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  progTrait: { flex: 1, height: 2 },
  progPoint: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.surface, borderWidth: 2, borderColor: C.muted, alignItems: 'center', justifyContent: 'center' },
  progLbl: { fontSize: 9.5, color: C.muted, marginTop: 5, fontFamily: F.sans, maxWidth: 62, textAlign: 'center' },
  videWrap: { alignItems: 'center', padding: S[10], gap: S[3] },
  videIcone: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center' },
  videTitre: { fontSize: 19, color: C.ink, textAlign: 'center' },
  videTexte: { fontFamily: F.sans, fontSize: 14, color: C.muted, textAlign: 'center', maxWidth: 260 },
});

export { st as styles };
