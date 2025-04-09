import React from 'react';
import { createRoot } from 'react-dom/client';
import Options from './app/pages/options';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app-root');
  if (container) {
    const root = createRoot(container);
    root.render(<Options />);
  }
}); 