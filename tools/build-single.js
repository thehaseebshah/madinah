#!/usr/bin/env node
/* Bundle the journey into one self-contained HTML file.
   node tools/build-single.js [out.html] [--fragment]
   --fragment drops the <!doctype>/<html>/<head>/<body> wrapper (for hosts that supply their own). */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const fragment = args.includes('--fragment');
const out = args.find(a => !a.startsWith('--')) || path.join(root, 'dist', 'madinah.html');

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (_, rel) => `<style>\n${read(rel)}\n</style>`);
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, rel) => `<script>\n${read(rel).replace(/<\/script/gi, '<\\/script')}\n</script>`);

if (fragment) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
    .replace(/<meta charset[^>]*>\s*/, '')
    .replace(/<meta name="viewport"[^>]*>\s*/, '');
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
  html = head.trim() + '\n' + body.trim() + '\n';
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`wrote ${out} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
