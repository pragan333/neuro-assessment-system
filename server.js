#!/usr/bin/env node
/*
 * Neuro-Diagnostic System - production static server.
 *
 * Zero runtime dependencies. Serves ./public from memory with security
 * headers, gzip, ETags and a /healthz endpoint for load balancers.
 *
 * Environment:
 *   PORT          port to listen on (default 8080)
 *   HOST          interface to bind (default 0.0.0.0)
 *   LOG_REQUESTS  "false" to disable access logs (default on)
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const { version } = require('./package.json');

const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.svg', '.txt']);

// Files that must always be revalidated so new releases reach users.
const NO_CACHE = new Set(['/index.html', '/sw.js', '/manifest.webmanifest']);

const SECURITY_HEADERS = {
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "img-src 'self' data:",
        "connect-src 'self'",
        "manifest-src 'self'",
        "worker-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'microphone=(self), camera=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
};

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        if (entry.name.startsWith('.')) return [];
        return entry.isDirectory() ? walk(full) : [full];
    });
}

/** Reads every file under rootDir into memory, keyed by URL path. */
function loadAssets(rootDir = PUBLIC_DIR) {
    const assets = new Map();
    for (const file of walk(rootDir)) {
        const ext = path.extname(file).toLowerCase();
        const body = fs.readFileSync(file);
        const urlPath = '/' + path.relative(rootDir, file).split(path.sep).join('/');
        assets.set(urlPath, {
            body,
            gzip: COMPRESSIBLE.has(ext) && body.length > 512 ? zlib.gzipSync(body, { level: 9 }) : null,
            type: MIME_TYPES[ext] || 'application/octet-stream',
            etag: '"' + crypto.createHash('sha1').update(body).digest('base64url') + '"',
            cacheControl: NO_CACHE.has(urlPath) ? 'no-cache' : 'public, max-age=3600'
        });
    }
    return assets;
}

function createApp(options = {}) {
    const assets = options.assets || loadAssets(options.rootDir);
    const log = options.log || (() => {});

    return function handler(req, res) {
        const started = process.hrtime.bigint();
        res.on('finish', () => {
            if (req.url === '/healthz') return;
            const ms = Number(process.hrtime.bigint() - started) / 1e6;
            log(`${req.method} ${req.url.split('?')[0]} ${res.statusCode} ${ms.toFixed(1)}ms`);
        });

        for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(name, value);
        if (req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { 'Allow': 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Method Not Allowed\n');
            return;
        }

        let pathname;
        try {
            pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Bad Request\n');
            return;
        }

        if (pathname === '/healthz') {
            const body = JSON.stringify({ status: 'ok', version, uptime: Math.round(process.uptime()) });
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(req.method === 'HEAD' ? undefined : body);
            return;
        }

        if (pathname.endsWith('/')) pathname += 'index.html';
        const asset = assets.get(pathname);
        if (!asset) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end('Not Found\n');
            return;
        }

        const headers = {
            'Content-Type': asset.type,
            'Cache-Control': asset.cacheControl,
            'ETag': asset.etag,
            'Vary': 'Accept-Encoding'
        };

        if (req.headers['if-none-match'] === asset.etag) {
            res.writeHead(304, headers);
            res.end();
            return;
        }

        let body = asset.body;
        if (asset.gzip && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
            body = asset.gzip;
            headers['Content-Encoding'] = 'gzip';
        }
        headers['Content-Length'] = body.length;

        res.writeHead(200, headers);
        res.end(req.method === 'HEAD' ? undefined : body);
    };
}

function start() {
    const port = Number(process.env.PORT) || 8080;
    const host = process.env.HOST || '0.0.0.0';
    const log = process.env.LOG_REQUESTS === 'false'
        ? () => {}
        : line => console.log(`${new Date().toISOString()} ${line}`);

    const server = http.createServer(createApp({ log }));
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    server.listen(port, host, () => {
        console.log(`Neuro-Diagnostic System v${version} listening on http://${host}:${port}`);
    });

    const shutdown = signal => {
        console.log(`${signal} received, shutting down`);
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

if (require.main === module) start();

module.exports = { createApp, loadAssets, SECURITY_HEADERS };
