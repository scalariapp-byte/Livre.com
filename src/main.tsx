import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { isNative } from './lib/platform';
import { listenForInstall } from './lib/install';

if (!isNative()) listenForInstall();

// Demande au navigateur un stockage « persistant » : les livres ne seront pas
// effacés automatiquement quand l'appareil manque de place.
navigator.storage?.persist?.().catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Mode hors ligne : service worker uniquement en production.
if (import.meta.env.PROD && !isNative() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
