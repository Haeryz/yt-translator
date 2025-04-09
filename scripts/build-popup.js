const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '../dist');
const POPUP_SRC = path.resolve(__dirname, '../src/popup.tsx');
const OPTIONS_SRC = path.resolve(__dirname, '../src/options.tsx');

// Create dist directory if it doesn't exist
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Create a simple popup.js file that redirects to the Next.js generated page
const popupJs = `
// This file is auto-generated to load the popup UI
window.addEventListener('DOMContentLoaded', () => {
  // Redirect to the actual React component
  const container = document.getElementById('app-root');
  if (container) {
    container.innerHTML = '<p>Loading popup...</p>';
    
    // Import the Next.js generated page
    // This is a simple version that doesn't use React, just for demo
    fetch('_next/static/chunks/pages/popup.js')
      .then(response => response.text())
      .then(js => {
        const script = document.createElement('script');
        script.textContent = js;
        document.head.appendChild(script);
      })
      .catch(error => {
        container.innerHTML = '<p>Error loading popup: ' + error.message + '</p>';
      });
  }
});
`;

// Create a simple options.js file that redirects to the Next.js generated page
const optionsJs = `
// This file is auto-generated to load the options UI
window.addEventListener('DOMContentLoaded', () => {
  // Redirect to the actual React component
  const container = document.getElementById('app-root');
  if (container) {
    container.innerHTML = '<p>Loading options...</p>';
    
    // Import the Next.js generated page
    // This is a simple version that doesn't use React, just for demo
    fetch('_next/static/chunks/pages/options.js')
      .then(response => response.text())
      .then(js => {
        const script = document.createElement('script');
        script.textContent = js;
        document.head.appendChild(script);
      })
      .catch(error => {
        container.innerHTML = '<p>Error loading options: ' + error.message + '</p>';
      });
  }
});
`;

// Write the files
fs.writeFileSync(path.join(DIST_DIR, 'popup.js'), popupJs);
fs.writeFileSync(path.join(DIST_DIR, 'options.js'), optionsJs);

console.log('Generated popup.js and options.js in dist directory'); 