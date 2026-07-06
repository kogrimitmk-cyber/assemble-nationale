// Helpers CRUD pour le back-office. Detecte automatiquement les fichiers
// (instances File) et bascule en multipart quand necessaire.
import { api } from '../api.js';

const BASE = '/api/admin';

function contientFichier(donnees) {
  return Object.values(donnees || {}).some(
    (v) => typeof File !== 'undefined' && v instanceof File,
  );
}

function versFormData(donnees) {
  const fd = new FormData();
  Object.entries(donnees).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof File !== 'undefined' && v instanceof File) fd.append(k, v);
    else if (typeof v === 'boolean') fd.append(k, v ? 'true' : 'false');
    else fd.append(k, v);
  });
  return fd;
}

// Prepare le corps : multipart si fichier present, sinon JSON nettoye.
function corps(donnees) {
  if (contientFichier(donnees)) return versFormData(donnees);
  // JSON : retirer les champs fichier vides / non modifies
  const clean = {};
  Object.entries(donnees).forEach(([k, v]) => {
    if (v === undefined) return;
    if (typeof File !== 'undefined' && v instanceof File) return; // deja gere
    clean[k] = v;
  });
  return clean;
}

export const liste = (ressource, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api(`${BASE}/${ressource}/${qs ? '?' + qs : ''}`);
};

export const creer = (ressource, donnees) =>
  api(`${BASE}/${ressource}/`, { method: 'POST', body: corps(donnees) });

export const modifier = (ressource, id, donnees) =>
  api(`${BASE}/${ressource}/${id}/`, { method: 'PATCH', body: corps(donnees) });

export const supprimer = (ressource, id) =>
  api(`${BASE}/${ressource}/${id}/`, { method: 'DELETE' });
