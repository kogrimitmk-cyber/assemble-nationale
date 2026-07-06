import { useEffect, useState } from 'react';
import { Icon } from '../components/ui.jsx';
import { liste, creer, supprimer } from './adminApi.js';
import { Champ } from './fields.jsx';

// Gere une collection liee a un parent (ex. membres d'une commission,
// articles / etapes / documents d'une loi).
export function SousCollection({ config, parentId, sources }) {
  const [items, setItems] = useState(null);
  const [valeurs, setValeurs] = useState({});
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');

  const recharger = () =>
    liste(config.ressource, { [config.parent]: parentId })
      .then((d) => setItems(d.results || d))
      .catch(() => setItems([]));

  useEffect(() => { recharger(); /* eslint-disable-next-line */ }, [parentId]);

  const ajouter = async (e) => {
    e.preventDefault();
    setBusy(true); setErreur('');
    const payload = { [config.parent]: parentId };
    config.champs.forEach((c) => {
      let v = valeurs[c.nom];
      if (c.type === 'file' && !(v instanceof File)) v = undefined;
      if (c.type === 'datetime' && v === '') v = null;
      if (v !== undefined && v !== '') payload[c.nom] = v;
    });
    try {
      await creer(config.ressource, payload);
      setValeurs({});
      e.target.reset?.();
      recharger();
    } catch (err) { setErreur(err.message || 'Erreur.'); }
    setBusy(false);
  };

  const retirer = async (id) => {
    await supprimer(config.ressource, id);
    recharger();
  };

  return (
    <div className="admin-sous">
      <h3 className="admin-sous__titre"><Icon n="list-plus" /> {config.titre}</h3>

      {items && items.length > 0 && (
        <table className="admin-table admin-table--compact">
          <thead><tr>{config.colonnes.map((c) => <th key={c.cle}>{c.libelle}</th>)}<th /></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                {config.colonnes.map((c) => (
                  <td key={c.cle}>{c.rendu ? c.rendu(it) : (c.type === 'datetime' ? fmt(it[c.cle]) : it[c.cle])}</td>
                ))}
                <td className="admin-table__act">
                  <button className="btn btn--ghost btn--sm" title="Retirer" onClick={() => retirer(it.id)}><Icon n="trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {items && items.length === 0 && <p className="admin-sous__vide">Aucun élément.</p>}

      <form className="admin-sous__form" onSubmit={ajouter}>
        {config.champs.map((c) => (
          <Champ key={c.nom} champ={c} valeur={valeurs[c.nom]}
                 onChange={(nom, v) => setValeurs((p) => ({ ...p, [nom]: v }))} sources={sources} />
        ))}
        <button className="btn btn--secondary btn--sm" type="submit" disabled={busy}><Icon n="plus" /> Ajouter</button>
      </form>
      {erreur && <div className="form-error"><Icon n="warning-circle" /> {erreur}</div>}
    </div>
  );
}

const fmt = (v) => (v ? new Date(v).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '');
