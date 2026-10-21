'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const Scoring = require('../public/js/scoring.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const pageIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));

test('every NIHSS item and stroke investigation exists in the page', () => {
    for (const { id } of Scoring.NIHSS_ITEMS) assert.ok(pageIds.has(id), `missing NIHSS item #${id}`);
    for (const id of Scoring.STROKE_INVESTIGATIONS) assert.ok(pageIds.has(id), `missing investigation #${id}`);
});

test('NIHSS has 15 items with a maximum of 42', () => {
    assert.equal(Scoring.NIHSS_ITEMS.length, 15);
    assert.equal(Scoring.NIHSS_MAX, 42);
});

test('NIHSS maximum values score 42 and classify as severe', () => {
    const values = {};
    for (const { id, max } of Scoring.NIHSS_ITEMS) values[id] = String(max);
    const result = Scoring.scoreNIHSS({ values });
    assert.equal(result.score, 42);
    assert.equal(result.interpretation, 'Severe stroke');
});

test('NIHSS ignores out-of-range values', () => {
    const result = Scoring.scoreNIHSS({ values: { loc: '9', gaze: '-1', facial: 'abc' } });
    assert.equal(result.score, 3);
});

test('NIHSS severity bands follow the standard 0 / 1-4 / 5-15 / 16-20 / 21-42 split', () => {
    const cases = [[0, 'No stroke symptoms on NIHSS'], [4, 'Minor stroke'], [5, 'Moderate stroke'],
        [15, 'Moderate stroke'], [16, 'Moderate to severe stroke'], [20, 'Moderate to severe stroke'], [21, 'Severe stroke']];
    for (const [target, expected] of cases) {
        const values = {};
        let remaining = target;
        for (const { id, max } of Scoring.NIHSS_ITEMS) {
            const v = Math.min(max, remaining);
            values[id] = String(v);
            remaining -= v;
        }
        const result = Scoring.scoreNIHSS({ values });
        assert.equal(result.score, target);
        assert.equal(result.interpretation, expected, `score ${target}`);
    }
});

test('stroke investigations count all 18 checkboxes', () => {
    const result = Scoring.scoreNIHSS({ checked: Scoring.STROKE_INVESTIGATIONS });
    assert.ok(result.details.includes('18/18 investigations completed'));
});

test('stroke time window: 3h 10m is within the tPA window', () => {
    const result = Scoring.scoreNIHSS({
        values: { 'symptom-onset': '2026-10-21T08:00', 'hospital-arrival': '2026-10-21T11:10' }
    });
    assert.ok(result.details.includes('Time from onset: 3h 10m'));
    assert.ok(result.details.some(d => d.includes('WITHIN tPA WINDOW')));
});

test('stroke time window boundaries: 270, 271, 360, 1440 and 1441 minutes', () => {
    const at = minutes => {
        const onset = new Date('2026-10-21T00:00:00');
        const arrival = new Date(onset.getTime() + minutes * 60000);
        return Scoring.scoreNIHSS({ values: { 'symptom-onset': onset.toISOString(), 'hospital-arrival': arrival.toISOString() } }).details.join('|');
    };
    assert.match(at(270), /tPA WINDOW/);
    assert.match(at(271), /thrombectomy window/);
    assert.match(at(360), /thrombectomy window/);
    assert.match(at(1440), /extended window/);
    assert.match(at(1441), /Outside acute treatment windows/);
});

test('stroke time: missing times produce no NaN and no window advice', () => {
    const none = Scoring.scoreNIHSS({ values: {} }).details.join('|');
    assert.doesNotMatch(none, /NaN|WINDOW|window/);
    const one = Scoring.scoreNIHSS({ values: { 'symptom-onset': '2026-10-21T08:00' } }).details.join('|');
    assert.match(one, /Enter both onset and arrival times/);
    assert.doesNotMatch(one, /NaN/);
});

test('stroke time: arrival before onset is flagged', () => {
    const result = Scoring.scoreNIHSS({
        values: { 'symptom-onset': '2026-10-21T10:00', 'hospital-arrival': '2026-10-21T09:00' }
    });
    assert.ok(result.details.some(d => d.includes('Arrival time is before symptom onset')));
});

test('FND: 5 signs + 30 investigations + primary symptom = 200', () => {
    const fndInputs = [...html.matchAll(/type="checkbox" id="([^"]+)"/g)].map(m => m[1]);
    const result = Scoring.scoreFND({ checked: fndInputs, values: { 'fnd-primary-symptom': 'weakness' } });
    assert.equal(result.score, 5 * 20 + 30 * 3 + 10);
    assert.match(result.interpretation, /^High confidence/);
});

test('FND: empty form is low confidence with score 0', () => {
    const result = Scoring.scoreFND({});
    assert.equal(result.score, 0);
    assert.match(result.interpretation, /^Low confidence/);
});

test('Epilepsy: type + 5 features = 65 (moderate), thresholds at 40 and 70', () => {
    const all = ['aura', 'automatisms', 'tongue-bite', 'incontinence', 'postictal'];
    assert.equal(Scoring.scoreEpilepsy({ checked: all, values: { 'seizure-type': 'focal' } }).score, 65);
    assert.match(Scoring.scoreEpilepsy({ checked: all, values: { 'seizure-type': 'focal' } }).interpretation, /^Moderate/);
    assert.match(Scoring.scoreEpilepsy({ checked: all.slice(0, 4) }).interpretation, /^Moderate/);
    assert.match(Scoring.scoreEpilepsy({ checked: all.slice(0, 3) }).interpretation, /^Low/);
});

test('MS: course + 5 symptoms = 70 (moderate)', () => {
    const all = ['optic-neuritis', 'brainstem', 'spinal-symptoms', 'cerebellar', 'fatigue'];
    const result = Scoring.scoreMS({ checked: all, values: { 'ms-course': 'rrms' } });
    assert.equal(result.score, 70);
    assert.match(result.interpretation, /^Moderate/);
});

test('Parkinson: bradykinesia 4 + 4 cardinal + excellent levodopa = 145 (high)', () => {
    const result = Scoring.scoreParkinson({
        checked: ['rest-tremor', 'rigidity', 'postural-instability', 'asymmetric'],
        values: { bradykinesia: '4', 'levodopa-response': 'excellent' }
    });
    assert.equal(result.score, 60 + 60 + 25);
    assert.match(result.interpretation, /^High/);
});

test('every id used by the calculators exists in the page', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'scoring.js'), 'utf8');
    const quoted = [...src.matchAll(/'([a-z0-9]+(?:-[a-z0-9]+)+|loc|gaze|facial|visual|ataxia|sensory|language|dysarthria|extinction|bradykinesia|aura|automatisms|incontinence|postictal|brainstem|cerebellar|fatigue|rigidity|asymmetric|inflammatory|autoimmune|toxicology)'/g)].map(m => m[1]);
    const ignore = new Set(['neuro-dx']);
    const missing = [...new Set(quoted)].filter(id => !pageIds.has(id) && !ignore.has(id));
    assert.deepEqual(missing, []);
});

test('unknown module throws', () => {
    assert.throws(() => Scoring.calculate('nope', {}), /Unknown assessment module/);
});
