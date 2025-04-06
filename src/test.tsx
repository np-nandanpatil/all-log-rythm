import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('Test file loaded');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <div>
      <h1>Test Page</h1>
      <p>This is a test page to see if Vite can handle TypeScript files correctly.</p>
    </div>
  </React.StrictMode>
); 