# Changelog

## 2.2.0 - 2026-10-21

Deploy-ready release.

### Added
- Production server (`server.js`, zero runtime dependencies): security headers (strict CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS behind HTTPS), gzip, ETags, `/healthz`, graceful shutdown.
- Dockerfile (non-root, health check), `docker-compose.yml` (read-only filesystem, all capabilities dropped).
- GitHub Actions CI: pre-deploy checks and tests on Node 20 and 22, Docker build plus container smoke test.
- Offline support (service worker) and an installable web app manifest.
- `npm run check` pre-deploy validation, plus 26 unit and server tests (`npm test`).
- Deep links to modules (`/#stroke`, `/#fnd`, ...).
- Clinical safety notice on every screen.

### Fixed
- Stroke: 6 of the 18 investigation checkboxes (coagulation, platelets, lipids, carotid, transcranial and vertebral Doppler) were never counted.
- NIHSS: added the 5 missing items (1b LOC questions, 1c LOC commands, 3 visual fields, 7 limb ataxia, 8 sensory), so the total now really is out of 42.
- NIHSS severity bands now follow the standard split: 0 none, 1-4 minor, 5-15 moderate, 16-20 moderate to severe, 21-42 severe.
- Stroke time window: an empty onset or arrival time printed `NaNh NaNm` and "Outside acute treatment windows". An arrival time before onset is now flagged.
- Print Report rebuilt the page from HTML, which wiped every form entry. Printing now leaves the form intact.
- Patient name and ID were inserted as raw HTML (script injection). They are now rendered as text.
- Navigation relied on the non-standard global `event` object.
- Header badges claimed "Database Connected" and "AI Assistant Active", which were not true. They now show online or offline status and "Data stays on this device".
- Header badge text was invisible (it inherited the title's transparent text fill).

### Changed
- The app moved from `neuro_assessment_system.html` to `public/` (`index.html`, `css/`, `js/`). The old file now redirects.
- Scoring logic moved to `public/js/scoring.js` (pure functions, unit tested). Score weights are unchanged.
