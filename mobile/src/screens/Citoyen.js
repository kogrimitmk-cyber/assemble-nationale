import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { C, F, R, S } from '../theme';
import { useI18n } from '../i18n';
import { useFetch } from '../useFetch';
import { api } from '../api';
import { Ecran, Carte, Badge, Champ, Bouton, Serif, Etat, Vue } from '../ui';

function Segment({ actif, onder, gauche, droite }) {
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 2, borderColor: C.border, marginBottom: S[4] }}>
      {[gauche, droite].map((lbl, i) => {
        const on = actif === i;
        return (
          <Pressable key={i} onPress={() => onder(i)} style={{ paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 2, borderColor: on ? C.gold500 : 'transparent', marginBottom: -2 }}>
            <Text style={{ fontFamily: on ? F.sansBold : F.sansMed, color: on ? C.blue800 : C.muted }}>{lbl}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Formulaire() {
  const { t } = useI18n();
  const ref = useFetch(() => api('/api/public/deputes'), []);
  const [f, setF] = useState({ nom: '', contact: '', depute: '', sujet: '', message: '' });
  const [envoye, setEnvoye] = useState(null);
  const [busy, setBusy] = useState(false);
  const maj = (k) => (v) => setF({ ...f, [k]: v });

  if (envoye) return (
    <Vue icone="checkmark-circle" couleur={C.green600} bg={C.green100} titre={t('citoyen.envoye')}
      texte={`${t('citoyen.envoye_texte')} ${envoye}`}
      action={<Bouton titre={t('citoyen.autre')} variante="contour" onPress={() => { setEnvoye(null); setF({ nom: '', contact: '', depute: '', sujet: '', message: '' }); }} />} />
  );

  const envoyer = async () => {
    if (!f.nom || !f.sujet || !f.message) return;
    setBusy(true);
    try {
      const r = await api('/api/public/messages', { method: 'POST', auth: false, body: { nom_complet: f.nom, contact: f.contact, sujet: f.sujet, message: f.message, depute_id: f.depute || null } });
      setEnvoye(r.reference);
    } catch (e) { setBusy(false); }
  };

  return (
    <View style={{ gap: S[3] }}>
      <Champ placeholder={t('citoyen.nom')} value={f.nom} onChangeText={maj('nom')} />
      <Champ placeholder={t('citoyen.contact')} value={f.contact} onChangeText={maj('contact')} />
      <Champ placeholder={t('citoyen.sujet')} value={f.sujet} onChangeText={maj('sujet')} />
      <Champ placeholder={t('citoyen.message')} value={f.message} onChangeText={maj('message')} multiline />
      <Bouton titre={t('citoyen.envoyer')} icone="paper-plane" variante="primaire" plein disabled={busy} onPress={envoyer} />
    </View>
  );
}

function Petitions() {
  const { t, locale } = useI18n();
  const { data, error, reload } = useFetch(() => api('/api/public/petitions'), []);
  return (
    <Etat chargement={data === undefined} erreur={error} onRetry={reload} vide={data && data.petitions.length === 0}>
      {data?.petitions?.map((p) => <PetitionCarte key={p.id} p={p} onSigned={reload} />)}
    </Etat>
  );
}

function PetitionCarte({ p, onSigned }) {
  const { t, locale } = useI18n();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [contact, setContact] = useState('');
  const pct = Math.min(100, Math.round((p.nb_signatures / p.objectif_signatures) * 100));
  const active = p.statut === 'active';

  const signer = async () => {
    try { await api(`/api/public/petitions/${p.id}/signer`, { method: 'POST', auth: false, body: { nom_complet: nom, contact } }); setOuvert(false); onSigned(); }
    catch (e) { /* toast simplifié */ }
  };

  return (
    <Carte>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontFamily: F.sansBold, fontSize: 14, color: C.ink, flex: 1 }}>{p.titre}</Text>
        {!active && <Badge label={t(p.statut === 'traitee' ? 'citoyen.petition_traitee' : 'citoyen.petition_cloturee')} ton={p.statut === 'traitee' ? 'vert' : 'neutre'} />}
      </View>
      {!!p.province && <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 2 }}>{p.province}{p.commission_nom ? ' · ' + p.commission_nom : ''}</Text>}
      <View style={{ height: 8, backgroundColor: C.border, borderRadius: R.full, overflow: 'hidden', marginTop: 8 }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 80 ? C.gold500 : C.blue800 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontFamily: F.sansMed, fontSize: 12, color: C.gold700 }}>{p.nb_signatures.toLocaleString(locale)} {t('citoyen.signatures')}</Text>
        <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.muted }}>{t('citoyen.objectif')} : {p.objectif_signatures.toLocaleString(locale)}</Text>
      </View>
      {active && !ouvert && <Bouton titre={t('citoyen.signer')} icone="create-outline" variante="or" plein style={{ marginTop: 10 }} onPress={() => setOuvert(true)} />}
      {active && ouvert && (
        <View style={{ gap: 8, marginTop: 10 }}>
          <Champ placeholder={t('citoyen.nom')} value={nom} onChangeText={setNom} />
          <Champ placeholder={t('citoyen.contact')} value={contact} onChangeText={setContact} />
          <Bouton titre={t('citoyen.signer')} variante="primaire" plein onPress={signer} />
        </View>
      )}
    </Carte>
  );
}

export default function Citoyen() {
  const { t } = useI18n();
  const [onglet, setOnglet] = useState(0);
  return (
    <Ecran>
      <Segment actif={onglet} onder={setOnglet} gauche={t('citoyen.onglet_ecrire')} droite={t('citoyen.onglet_petitions')} />
      {onglet === 0 ? <Formulaire /> : <Petitions />}
    </Ecran>
  );
}
