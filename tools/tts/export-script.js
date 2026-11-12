#!/usr/bin/env node
/* Export the narration script from js/core/narration.js to audio/narration/script.json,
   which tools/tts/generate.py reads. Run after editing any narration text. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const sandbox = { window: {}, localStorage: { getItem() { return null; }, setItem() {} }, document: {} };
vm.createContext(sandbox);
const extra = path.join(root, 'js/data/narration.extra.js');
if (fs.existsSync(extra)) vm.runInContext(fs.readFileSync(extra, 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/narration.js'), 'utf8'), sandbox);
const out = path.join(root, 'audio/narration/script.json');
fs.writeFileSync(out, JSON.stringify(sandbox.window.NARRATOR.script, null, 1));
console.log(`wrote ${out} (${Object.keys(sandbox.window.NARRATOR.script).length} stations)`);
