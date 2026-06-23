import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Patch global fetch to automatically route /api requests to the live Cloud Run backend 
// when the application is hosted on Vercel or any other external domain.
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function (input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        const isVercel = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel');
        const isExternal = !window.location.hostname.includes('run.app') && 
                           !window.location.hostname.includes('localhost') && 
                           !window.location.hostname.includes('127.0.0.1');
        
        if (isVercel || isExternal) {
          const backendUrl = 'https://ais-pre-447vehf5bvd3eyica5evnq-452360193972.europe-west2.run.app';
          const targetUrl = `${backendUrl}${input}`;
          return originalFetch(targetUrl, init);
        }
      }
      return originalFetch(input, init);
    }
  });
} catch (e) {
  console.error('Error patching fetch:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

