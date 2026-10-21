#!/usr/bin/env node
/*
 * Pre-deploy checks: syntax of browser scripts, version consistency,
 * assets referenced by the page and service worker actually exist,
 * and no inline scripts/handlers that the CSP would block.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');
const { version } = require('../package.json');
const errors = [];

for (const file of ['js/scoring.js', 'js/app.js', 'sw.js']) {
    try {
        new vm.Script(fs.readFileSync(path.join(pub, file), 'utf8'), { filename: file });
    } catch (err) {
        errors.push(`${file}: ${err.message}`);
    }
}

const html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(pub, 'sw.js'), 'utf8');

if (!sw.includes(`'neuro-dx-${version}'`)) {
    errors.push(`sw.js CACHE_VERSION must be 'neuro-dx-${version}' to match package.json`);
}

const referenced = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1]);
const precached = [...sw.matchAll(/^\s+'([^']+)',?$/gm)].map(m => m[1]).filter(p => p !== './');
for (const ref of new Set([...referenced, ...precached])) {
    if (!fs.existsSync(path.join(pub, ref))) errors.push(`missing asset: ${ref}`);
}

if (/\son[a-z]+="/i.test(html)) errors.push('index.html has inline event handlers (blocked by CSP)');
if (/<script(?![^>]*\ssrc=)[^>]*>/i.test(html)) errors.push('index.html has inline <script> (blocked by CSP)');
if (/\sstyle="/i.test(html)) errors.push('index.html has inline style attributes (blocked by CSP)');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) errors.push(`duplicate element ids: ${[...new Set(dupes)].join(', ')}`);

if (errors.length) {
    console.error('Pre-deploy check FAILED:\n - ' + errors.join('\n - '));
    process.exit(1);
}
console.log(`Pre-deploy check passed (v${version}, ${ids.length} element ids, ${new Set([...referenced, ...precached]).size} assets).`);
