// Startup file for cPanel Node.js Selector
// This file points cPanel to the compiled Express server bundle

// If your package.json does NOT have "type": "module" (CommonJS):
require('./dist/server.cjs');

// If your package.json HAS "type": "module" (ES Modules):
// import './dist/server.cjs';
