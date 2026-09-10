import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';

// Vite HMR is disabled in the sandboxed preview container.
// Filter out benign Vite websocket connection notices.
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes?.('WebSocket') ||
    event.reason?.toString?.().includes('WebSocket')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
