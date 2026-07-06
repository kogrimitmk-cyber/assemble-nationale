// Client API — jetons JWT stockés en localStorage, rafraîchissement
// automatique une fois sur 401.
const AK = 'an_access';
const RK = 'an_refresh';

export const getAccess = () => localStorage.getItem(AK);
export const getRefresh = () => localStorage.getItem(RK);
export const setTokens = (a, r) => {
  if (a) localStorage.setItem(AK, a);
  if (r) localStorage.setItem(RK, r);
};
export const clearTokens = () => {
  localStorage.removeItem(AK);
  localStorage.removeItem(RK);
};

function requete(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (auth && getAccess()) headers.Authorization = `Bearer ${getAccess()}`;
  // FormData (televersement de fichiers) : laisser le navigateur poser
  // le Content-Type + boundary. Sinon, corps JSON.
  const estForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let corps;
  if (body !== undefined && body !== null) {
    if (estForm) corps = body;
    else { headers['Content-Type'] = 'application/json'; corps = JSON.stringify(body); }
  }
  return fetch(path, { method, headers, body: corps });
}

export async function api(path, opts = {}) {
  let res = await requete(path, opts);

  if (res.status === 401 && opts.auth !== false && getRefresh()) {
    const r = await fetch('/api/auth/token/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: getRefresh() }),
    });
    if (r.ok) {
      const d = await r.json();
      setTokens(d.access, d.refresh);
      res = await requete(path, opts);
    } else {
      clearTokens();
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Erreur serveur');
    err.code = data.erreur;
    err.statut = res.status;
    throw err;
  }
  return data;
}
