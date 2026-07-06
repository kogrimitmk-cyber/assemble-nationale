import { createContext, useContext, useEffect, useState } from 'react';
import { api, chargerJetons, definirJetons, effacerJetons } from './api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUser] = useState(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    (async () => {
      const tok = await chargerJetons();
      if (tok) {
        try {
          const { utilisateur } = await api('/api/auth/moi');
          setUser(utilisateur);
        } catch {
          await effacerJetons();
        }
      }
      setPret(true);
    })();
  }, []);

  const login = async (identifiant, mot_de_passe) => {
    const r = await api('/api/auth/connexion', { method: 'POST', auth: false, body: { identifiant, mot_de_passe } });
    if (r.etape === 'connecte') { await definirJetons(r.access, r.refresh); setUser(r.utilisateur); }
    return r;
  };

  const verifierOtp = async (defi, code) => {
    const r = await api('/api/auth/verifier-otp', { method: 'POST', auth: false, body: { defi, code } });
    await definirJetons(r.access, r.refresh); setUser(r.utilisateur);
    return r;
  };

  const logout = async () => {
    try { await api('/api/auth/deconnexion', { method: 'POST', body: {} }); } catch { /* ignore */ }
    await effacerJetons(); setUser(null);
  };

  return <Ctx.Provider value={{ utilisateur, pret, login, verifierOtp, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
