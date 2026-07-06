import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './styles/design-system.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';
import './styles/logo.css';
import './styles/an-extra.css';
import './styles/root.css';

import { I18nProvider } from './i18n.jsx';
import { AuthProvider } from './auth.jsx';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
