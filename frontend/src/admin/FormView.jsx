import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/ui.jsx';
import { creer, modifier, liste } from './adminApi.js';
import { Champ } from './fields.jsx';
import { SousCollection } from './SousCollection.jsx';

// Prepare une valeur avant envoi selon le type de champ.
function nettoyer(champ, val) {
  if (val === undefined) return undefined;
  if (champ.type === 'datetime') return val === '' ? null : val;
  if (champ.type === 'number') return val === '' ? 0 : val;
  if (champ.type === 'fk') return val === '' ? null : val;
  if (champ.type === 'file') return val instanceof File ? val : undefined; // fichier inchange -> on n'envoie rien
  return val;
}

export function FormView({ module, enregistrement, onFerme, onEnregistre }) {
  const edition = Boolean(enregistrement?.id);
  const [valeurs, setValeurs] = useState({});
  const [sources, setSources] = useState({});
  const [erreur, setErreur] = useState('');
  const [busy, setBusy] = useState(false);

  // Cles de listes liees a charger (champs fk du module + des sous-collections).
  const sourcesRequises = useMemo(() => {
    const s = new Set();
    module.champs.forEach((c) => c.type === 'fk' && s.add(c.source));
    (module.sous || []).forEach((sc) => sc.champs.forEach((c) => c.type === 'fk' && s.add(c.source)));
    return [...s];
  }, [module]);

  useEffect(() => {
    // Valeurs initiales
    const init = {};
    module.champs.forEach((c) => {
      if (c.type === 'file') return;
      if (edition) init[c.nom] = enregistrement[c.nom] ?? (c.defaut ?? '');
      else if (c.defaut !== undefined) init[c.nom] = c.defaut;
    });
    setValeurs(init);
    // Chargement des listes liees
    Promise.all(sourcesRequises.map((k) =>
      liste(k, {}).then((d) => [k, d.results || d]).catch(() => [k, []]),
    )).then((paires) => setSources(Object.fromEntries(paires)));
  }, [module, enregistrement]); // eslint-disable-line

  const onChange = (nom, v) => setValeurs((p) => ({ ...p, [nom]: v }));

  const soumettre = async (e) => {
    e.preventDefault();
    setBusy(true); setErreur('');
    const payload = {};
    module.champs.forEach((c) => {
      const v = nettoyer(c, valeurs[c.nom]);
      if (v !== undefined) payload[c.nom] = v;
    });
    try {
      const rec = edition
        ? await modifier(module.ressource, enregistrement.id, payload)
        : await creer(module.ressource, payload);
      onEnregistre(rec);
    } catch (err) {
      setErreur(err.message || 'Erreur lors de l\'enregistrement.');
      setBusy(false);
    }
  };

  return (
    <div className="admin-drawer">
      <div className="admin-drawer__head">
        <h2>{edition ? 'Modifier' : 'Ajouter'} — {module.titre}</h2>
        <button className="btn btn--ghost btn--sm" onClick={onFerme}><Icon n="x" /></button>
      </div>

      <form className="admin-form" onSubmit={soumettre}>
        <div className="admin-form__grid">
          {module.champs.map((c) => (
            <div key={c.nom} className={c.type === 'textarea' || c.type === 'file' ? 'admin-form__full' : ''}>
              <Champ champ={c} valeur={valeurs[c.nom]} onChange={onChange} sources={sources} ligne={enregistrement} />
            </div>
          ))}
        </div>

        {erreur && <div className="form-error"><Icon n="warning-circle" /> {erreur}</div>}

        <div className="admin-form__actions">
          <button type="button" className="btn btn--secondary" onClick={onFerme}>Annuler</button>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            <Icon n="check" /> {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>

      {edition && (module.sous || []).map((sc) => (
        <SousCollection key={sc.ressource} config={sc} parentId={enregistrement.id} sources={sources} />
      ))}
    </div>
  );
}
