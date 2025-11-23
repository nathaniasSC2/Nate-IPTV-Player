/**
 * Nate IPTV Player - Application Entry Point
 * ==========================================
 * React 18 application bootstrap with StrictMode
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initThemeListener } from './stores/settingsStore';

// Import global styles
import './index.css';

// Initialize theme listener for system theme changes
initThemeListener();

// Create root and render application
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a <div id="root"></div> in your index.html');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Cleanup on unmount (handled by React's useEffect in components)
// The theme listener will be cleaned up when the app unmounts
