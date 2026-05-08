/**
 * scripts/stamp-sw.js
 * Reads sw.template.js (never modified), stamps the deploy time,
 * writes the result to sw.js (the file browsers actually load).
 * This way sw.template.js always has __DEPLOY_TIME__ as placeholder
 * and every build produces a fresh sw.js with a unique cache name.
 */
const fs   = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'public', 'sw.template.js');
const outPath      = path.join(__dirname, '..', 'public', 'sw.js');

if (!fs.existsSync(templatePath)) {
  console.error('[stamp-sw] ERROR: public/sw.template.js not found!');
  process.exit(1);
}

const template   = fs.readFileSync(templatePath, 'utf8');
const deployTime = Date.now().toString();
const stamped    = template.replace('__DEPLOY_TIME__', deployTime);

fs.writeFileSync(outPath, stamped);
console.log(`[stamp-sw] ✓ sw.js written — cache: gas-tracker-${deployTime}`);
