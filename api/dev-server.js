/**
 * Local dev server — wraps Vercel serverless functions as Express routes.
 * Run with: node api/dev-server.js
 */
// Only load .env if vars aren't already set (env-cmd sets them for sandbox/test runs)
require('dotenv').config({ override: false });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.API_DEV_PORT || 4001;

app.use(cors());
app.use(express.json());

// Auto-load every handler in api/ (except _utils and this file)
const apiDir = __dirname;
fs.readdirSync(apiDir)
  .filter(f => f.endsWith('.js') && !f.startsWith('_') && f !== 'dev-server.js')
  .forEach(file => {
    const name = file.replace('.js', '');
    const handler = require(path.join(apiDir, file));
    app.all(`/api/${name}`, (req, res) => handler(req, res));
    console.log(`  GET|POST /api/${name}`);
  });

const server = app.listen(PORT, () => {
  console.log(`\nLocal API dev server running on http://localhost:${PORT}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nError: Port ${PORT} is already in use. Kill the process using it and retry.\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
