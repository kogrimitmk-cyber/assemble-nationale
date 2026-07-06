import { createContext, useContext, useEffect, useState } from 'react';
import { api, clearTokens, getAccess, getRefresh, setTokens } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUser] = useState(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    (async () => {
      if (getAccess()) {
        try {
          const { utilisateur } = await api('/api/auth/moi');
          setUser(utilisateur);
        } catch {
          clearTokens();
        }
      }
      setPret(true);
    })();
  }, []);

  const login = async (identifiant, mot_de_passe) => {
    const r = await api('/api/auth/connexion', {
      method: 'POST', auth: false, body: { identifiant, mot_de_passe },
    });
    if (r.etape === 'connecte') {
      setTokens(r.access, r.refresh);
      setUser(r.utilisateur);
    }
    return r;
  };

  const verifierOtp = async (defi, code) => {
    const r = await api('/api/auth/verifier-otp', {
      method: 'POST', auth: false, body: { defi, code },
    });
    setTokens(r.access, r.refresh);
    setUser(r.utilisateur);
    return r;
  };

  const logout = async () => {
    try { await api('/api/auth/deconnexion', { method: 'POST', body: { refresh: getRefresh() } }); }
    catch { /* ignore */ }
    clearTokens();
    setUser(null);
  };

  const majUser = (patch) => setUser((u) => ({ ...u, ...patch }));

  return (
    <AuthCtx.Provider value={{ utilisateur, pret, login, verifierOtp, logout, majUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
