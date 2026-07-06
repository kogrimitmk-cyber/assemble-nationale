import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ── Adresse de l'API Django ──────────────────────────────────
// • Émulateur Android : 10.0.2.2 pointe vers le PC hôte.
// • Simulateur iOS / web : localhost.
// • Téléphone physique : remplacez par l'IP LAN du PC (ex. 192.168.1.20)
//   en définissant EXPO_PUBLIC_API_URL dans un fichier .env.
const DEFAUT = Platform.OS === 'android' ? 'http://10.0.2.2:8010' : 'http://localhost:8010';
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || DEFAUT;

let _access = null;
let _refresh = null;

export async function chargerJetons() {
  _access = await SecureStore.getItemAsync('an_access');
  _refresh = await SecureStore.getItemAsync('an_refresh');
  return _access;
}
export async function definirJetons(access, refresh) {
  _access = access ?? _access;
  _refresh = refresh ?? _refresh;
  if (access) await SecureStore.setItemAsync('an_access', access);
  if (refresh) await SecureStore.setItemAsync('an_refresh', refresh);
}
export async function effacerJetons() {
  _access = null; _refresh = null;
  await SecureStore.deleteItemAsync('an_access');
  await SecureStore.deleteItemAsync('an_refresh');
}
export const jetonActuel = () => _access;

// Construit une query string (URLSearchParams est peu fiable en RN).
export function qs(params) {
  const p = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return p.length ? '?' + p.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';
}

function envoyer(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && _access) headers.Authorization = `Bearer ${_access}`;
  return fetch(API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

export async function api(path, opts = {}) {
  let res = await envoyer(path, opts);

  if (res.status === 401 && opts.auth !== false && _refresh) {
    const r = await fetch(API_BASE + '/api/auth/token/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: _refresh }),
    });
    if (r.ok) {
      const d = await r.json();
      await definirJetons(d.access, d.refresh);
      res = await envoyer(path, opts);
    } else {
      await effacerJetons();
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Erreur serveur');
    err.code = data.erreur; err.statut = res.status;
    throw err;
  }
  return data;
}
