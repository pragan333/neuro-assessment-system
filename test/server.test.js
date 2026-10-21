'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const zlib = require('node:zlib');

const { createApp } = require('../server.js');
const { version } = require('../package.json');

let server;
let base;

test.before(async () => {
    server = http.createServer(createApp());
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise(resolve => server.close(resolve)));

function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(base + path, options, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
        });
        req.on('error', reject);
        req.end();
    });
}

test('GET / serves the app with security headers', async () => {
    const res = await request('/');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/html/);
    assert.match(res.body.toString(), /NEURO-DIAGNOSTIC SYSTEM/);
    assert.match(res.headers['content-security-policy'], /script-src 'self'/);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'DENY');
    assert.equal(res.headers['cache-control'], 'no-cache');
    assert.equal(res.headers['strict-transport-security'], undefined);
});

test('HSTS is sent behind an HTTPS proxy', async () => {
    const res = await request('/', { headers: { 'x-forwarded-proto': 'https' } });
    assert.match(res.headers['strict-transport-security'], /max-age=31536000/);
});

test('static assets are served with correct types', async () => {
    const cases = [
        ['/css/styles.css', /text\/css/],
        ['/js/app.js', /text\/javascript/],
        ['/js/scoring.js', /text\/javascript/],
        ['/sw.js', /text\/javascript/],
        ['/manifest.webmanifest', /application\/manifest\+json/],
        ['/icon.svg', /image\/svg\+xml/]
    ];
    for (const [path, type] of cases) {
        const res = await request(path);
        assert.equal(res.status, 200, path);
        assert.match(res.headers['content-type'], type, path);
    }
});

test('gzip is used when accepted', async () => {
    const res = await request('/index.html', { headers: { 'accept-encoding': 'gzip, br' } });
    assert.equal(res.headers['content-encoding'], 'gzip');
    assert.match(zlib.gunzipSync(res.body).toString(), /NEURO-DIAGNOSTIC SYSTEM/);
});

test('ETag revalidation returns 304', async () => {
    const first = await request('/js/app.js');
    const second = await request('/js/app.js', { headers: { 'if-none-match': first.headers.etag } });
    assert.equal(second.status, 304);
    assert.equal(second.body.length, 0);
});

test('/healthz reports ok and the package version', async () => {
    const res = await request('/healthz');
    assert.equal(res.status, 200);
    const json = JSON.parse(res.body.toString());
    assert.equal(json.status, 'ok');
    assert.equal(json.version, version);
});

test('HEAD returns headers without a body', async () => {
    const res = await request('/', { method: 'HEAD' });
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 0);
});

test('unknown paths 404 and path traversal is not possible', async () => {
    assert.equal((await request('/nope.html')).status, 404);
    assert.equal((await request('/../server.js')).status, 404);
    assert.equal((await request('/%2e%2e/package.json')).status, 404);
    assert.equal((await request('/%E0%A4%A')).status, 400);
});

test('non-GET methods are rejected', async () => {
    const res = await request('/', { method: 'POST' });
    assert.equal(res.status, 405);
    assert.equal(res.headers.allow, 'GET, HEAD');
});

test('vercel.json sends the same security headers as server.js and serves public/', () => {
    const { SECURITY_HEADERS } = require('../server.js');
    const vercel = require('../vercel.json');
    assert.equal(vercel.outputDirectory, 'public');
    assert.equal(vercel.buildCommand, 'npm run build');
    const global = vercel.headers.find(rule => rule.source === '/(.*)');
    const sent = Object.fromEntries(global.headers.map(h => [h.key, h.value]));
    assert.deepEqual(sent, SECURITY_HEADERS);
});
