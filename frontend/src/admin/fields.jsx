import { Icon } from '../components/ui.jsx';
import { SOURCES } from './schema.js';

// Convertit une valeur ISO en valeur d'input datetime-local (YYYY-MM-DDTHH:MM).
export const toLocalInput = (v) => (v && typeof v === 'string' && v.includes('T') ? v.slice(0, 16) : v || '');

export function Champ({ champ, valeur, onChange, sources, ligne }) {
  const id = `f_${champ.nom}`;
  const commun = { id, className: 'form-input', required: champ.requis };

  const set = (v) => onChange(champ.nom, v);

  let ctrl;
  switch (champ.type) {
    case 'textarea':
      ctrl = <textarea {...commun} rows={champ.nom === 'contenu' ? 6 : 3} dir={champ.dir}
                       value={valeur ?? ''} onChange={(e) => set(e.target.value)} />;
      break;
    case 'select':
      ctrl = (
        <select {...commun} value={valeur ?? ''} onChange={(e) => set(e.target.value)}>
          {!champ.requis && <option value="">—</option>}
          {champ.choix.map(([v, lib]) => <option key={v} value={v}>{lib}</option>)}
        </select>
      );
      break;
    case 'fk': {
      const opts = sources[champ.source] || [];
      const src = SOURCES[champ.source];
      ctrl = (
        <select {...commun} value={valeur ?? ''} onChange={(e) => set(e.target.value ? Number(e.target.value) : null)}>
          <option value="">—</option>
          {opts.map((o) => <option key={o.id} value={o.id}>{src ? src.label(o) : o.id}</option>)}
        </select>
      );
      break;
    }
    case 'number':
      ctrl = <input {...commun} type="number" min="0" value={valeur ?? ''} onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value))} />;
      break;
    case 'datetime':
      ctrl = <input {...commun} type="datetime-local" value={toLocalInput(valeur)} onChange={(e) => set(e.target.value)} />;
      break;
    case 'password':
      ctrl = <input {...commun} type="password" autoComplete="new-password" value={valeur ?? ''} onChange={(e) => set(e.target.value)} />;
      break;
    case 'email':
      ctrl = <input {...commun} type="email" value={valeur ?? ''} onChange={(e) => set(e.target.value)} />;
      break;
    case 'file': {
      const apercu = champ.apercu && ligne ? ligne[champ.apercu] : null;
      ctrl = (
        <div className="admin-file">
          {apercu && (champ.accept?.includes('image')
            ? <img src={apercu} alt="" className="admin-file__preview" />
            : <a href={apercu} target="_blank" rel="noreferrer" className="admin-file__link"><Icon n="file-pdf" /> Fichier actuel</a>)}
          <input id={id} type="file" accept={champ.accept}
                 onChange={(e) => set(e.target.files[0] || null)} />
        </div>
      );
      break;
    }
    default:
      ctrl = <input {...commun} type="text" dir={champ.dir} value={valeur ?? ''} onChange={(e) => set(e.target.value)} />;
  }

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {champ.libelle}{champ.requis && <span className="admin-req"> *</span>}
      </label>
      {ctrl}
      {champ.aide && <div className="admin-aide">{champ.aide}</div>}
    </div>
  );
}
