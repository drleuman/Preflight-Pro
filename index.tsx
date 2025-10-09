import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Changed to a named import to match the updated export in App.tsx and fix the module resolution error.
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);