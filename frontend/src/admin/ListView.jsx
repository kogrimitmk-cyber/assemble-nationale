import { useEffect, useState } from 'react';
import { Icon } from '../components/ui.jsx';
import { liste, supprimer } from './adminApi.js';
import { FormView } from './FormView.jsx';

const fmt = (v) => (v ? new Date(v).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '');

export function ListView({ module }) {
  const [rows, setRows] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [q, setQ] = useState('');
  const [edite, setEdite] = useState(null); // objet, {} (nouveau) ou null (ferme)

  const charger = () => {
    setErreur(false);
    const params = module.cle_recherche && q ? { [module.cle_recherche]: q } : {};
    liste(module.ressource, params)
      .then((d) => setRows(d.results || d))
      .catch(() => setErreur(true));
  };

  useEffect(() => { setRows(null); charger(); /* eslint-disable-next-line */ }, [module]);

  const rechercher = (e) => { e.preventDefault(); setRows(null); charger(); };

  const effacer = async (row) => {
    if (!window.confirm(`Supprimer « ${row.titre || row.nom || row.numero_reference || row.numero_id} » ?`)) return;
    await supprimer(module.ressource, row.id);
    charger();
  };

  const apresEnregistrement = () => { setEdite(null); charger(); };

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <div>
          <h1 className="admin-page__titre"><Icon n={module.icone} /> {module.titre}</h1>
          <p className="admin-page__compte">{rows ? `${rows.length} enregistrement(s)` : '…'}</p>
        </div>
        <div className="admin-page__outils">
          {module.cle_recherche && (
            <form onSubmit={rechercher} className="admin-search">
              <Icon n="magnifying-glass" />
              <input className="form-input" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
            </form>
          )}
          <button className="btn btn--primary" onClick={() => setEdite({})}><Icon n="plus" /> Ajouter</button>
        </div>
      </div>

      {erreur && <div className="empty-state"><p className="empty-state__text">Erreur de chargement. <button className="btn btn--secondary btn--sm" onClick={charger}>Réessayer</button></p></div>}

      {!erreur && rows && rows.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon"><Icon n={module.icone} /></div>
          <h3 className="empty-state__title">Aucun enregistrement</h3>
          <p className="empty-state__text">Cliquez sur « Ajouter » pour créer le premier.</p>
        </div>
      )}

      {!erreur && rows === null && <div className="skeleton skeleton--card" style={{ height: 240 }} />}

      {!erreur && rows && rows.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr>{module.colonnes.map((c) => <th key={c.cle}>{c.libelle}</th>)}<th /></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} onDoubleClick={() => setEdite(row)}>
                  {module.colonnes.map((c) => (
                    <td key={c.cle}>{c.rendu ? c.rendu(row) : (c.type === 'datetime' ? fmt(row[c.cle]) : (row[c.cle] ?? '—'))}</td>
                  ))}
                  <td className="admin-table__act">
                    <button className="btn btn--ghost btn--sm" title="Modifier" onClick={() => setEdite(row)}><Icon n="pencil-simple" /></button>
                    <button className="btn btn--ghost btn--sm admin-danger" title="Supprimer" onClick={() => effacer(row)}><Icon n="trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {edite && (
        <div className="admin-overlay" onMouseDown={(e) => e.target === e.currentTarget && setEdite(null)}>
          <FormView module={module} enregistrement={edite} onFerme={() => setEdite(null)} onEnregistre={apresEnregistrement} />
        </div>
      )}
    </div>
  );
}
