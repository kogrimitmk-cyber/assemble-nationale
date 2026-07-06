import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Toaster from './components/Toaster.jsx';

import Accueil from './pages/Accueil.jsx';
import Agenda from './pages/Agenda.jsx';
import Lois from './pages/Lois.jsx';
import LoiDetail from './pages/LoiDetail.jsx';
import Votes from './pages/Votes.jsx';
import Deputes from './pages/Deputes.jsx';
import DeputeDetail from './pages/DeputeDetail.jsx';
import Documents from './pages/Documents.jsx';
import Citoyen from './pages/Citoyen.jsx';
import Connexion from './pages/Connexion.jsx';
import EspaceDepute from './pages/EspaceDepute.jsx';
import Legale from './pages/Legale.jsx';
import AdminApp from './admin/AdminApp.jsx';

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Accueil />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="lois" element={<Lois />} />
          <Route path="lois/:ref" element={<LoiDetail />} />
          <Route path="votes" element={<Votes />} />
          <Route path="deputes" element={<Deputes />} />
          <Route path="deputes/:id" element={<DeputeDetail />} />
          <Route path="documents" element={<Documents />} />
          <Route path="citoyen" element={<Citoyen />} />
          <Route path="mentions-legales" element={<Legale which="mentions" />} />
          <Route path="confidentialite" element={<Legale which="confidentialite" />} />
          <Route path="*" element={<Accueil />} />
        </Route>
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/espace" element={<EspaceDepute />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
      <Toaster />
    </>
  );
}
