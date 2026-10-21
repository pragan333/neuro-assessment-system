/*
 * Neuro-Diagnostic System - scoring rules.
 *
 * Pure functions with no DOM access so they can be unit tested in Node and
 * reused in the browser. Each calculator takes a form snapshot:
 *   { checked: string[]  - ids of ticked checkboxes,
 *     values:  object    - id -> value for selects / inputs }
 * and returns { title, score, maxScore?, interpretation, details[] }.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.NeuroScoring = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const FND_SIGNS = ['hoover-sign', 'give-way', 'tremor-entrain', 'distractibility', 'non-anatomical'];
    const FND_INVESTIGATIONS = [
        'neuro-exam', 'video-recording', 'distraction-tests', 'functional-scales',
        'routine-eeg-fnd', 'video-eeg-fnd', 'emg-fnd', 'ncs-fnd', 'evoked-potentials',
        'mri-brain-fnd', 'mri-spine-fnd', 'ct-head-fnd', 'pet-scan',
        'cbc-fnd', 'cmp-fnd', 'thyroid-fnd', 'vitamin-b12', 'vitamin-d', 'inflammatory', 'autoimmune', 'toxicology',
        'lumbar-puncture', 'cardiac-tests', 'sleep-study', 'autonomic-testing',
        'psychiatric-interview', 'trauma-screening', 'depression-scale', 'anxiety-scale', 'neuropsych-testing'
    ];
    const SEIZURE_FEATURES = ['aura', 'automatisms', 'tongue-bite', 'incontinence', 'postictal'];
    const MS_SYMPTOMS = ['optic-neuritis', 'brainstem', 'spinal-symptoms', 'cerebellar', 'fatigue'];
    const PD_CARDINAL = ['rest-tremor', 'rigidity', 'postural-instability', 'asymmetric'];

    // NIHSS items in scale order with their maximum score (total 42).
    const NIHSS_ITEMS = [
        ['loc', 3], ['loc-questions', 2], ['loc-commands', 2], ['gaze', 2], ['visual', 3],
        ['facial', 3], ['motor-arm-left', 4], ['motor-arm-right', 4], ['motor-leg-left', 4],
        ['motor-leg-right', 4], ['ataxia', 2], ['sensory', 2], ['language', 3],
        ['dysarthria', 2], ['extinction', 2]
    ];
    const NIHSS_MAX = NIHSS_ITEMS.reduce((sum, item) => sum + item[1], 0);
    const STROKE_INVESTIGATIONS = [
        'ct-head-stroke', 'ct-angio', 'ct-perfusion', 'mri-stroke', 'mra',
        'glucose-stroke', 'coagulation-stroke', 'platelet-count', 'troponin', 'lipid-profile', 'hba1c',
        'ecg-stroke', 'echo-stroke', 'holter', 'tee',
        'carotid-doppler', 'transcranial-doppler', 'vertebral-doppler'
    ];

    function normalise(input) {
        const checked = new Set((input && input.checked) || []);
        const values = (input && input.values) || {};
        return { checked, values };
    }

    function countChecked(checked, ids) {
        return ids.filter(id => checked.has(id)).length;
    }

    function toInt(value) {
        const n = parseInt(value, 10);
        return Number.isFinite(n) ? n : 0;
    }

    function scoreFND(input) {
        const { checked, values } = normalise(input);
        const details = [];
        let score = 0;

        const signs = countChecked(checked, FND_SIGNS);
        score += signs * 20;
        if (signs > 0) details.push(`${signs} positive functional signs detected`);

        const investigations = countChecked(checked, FND_INVESTIGATIONS);
        score += investigations * 3;
        if (investigations > 0) {
            details.push(`${investigations}/${FND_INVESTIGATIONS.length} investigations completed`);
        }

        const primarySymptom = values['fnd-primary-symptom'];
        if (primarySymptom) {
            score += 10;
            details.push(`Primary symptom: ${primarySymptom}`);
        }

        return {
            title: 'FND DIAGNOSTIC CONFIDENCE',
            score,
            details,
            interpretation:
                score >= 80 ? 'High confidence FND diagnosis - comprehensive workup completed' :
                score >= 60 ? 'Moderate-high confidence - consider additional investigations' :
                score >= 40 ? 'Moderate confidence - complete investigation workup needed' :
                'Low confidence - rule out organic causes first'
        };
    }

    function scoreEpilepsy(input) {
        const { checked, values } = normalise(input);
        const details = [];
        let score = 0;

        const seizureType = values['seizure-type'];
        if (seizureType) {
            score += 15;
            details.push(`Seizure type: ${seizureType}`);
        }

        const features = countChecked(checked, SEIZURE_FEATURES);
        score += features * 10;
        if (features > 0) details.push(`${features} typical seizure features present`);

        return {
            title: 'EPILEPSY LIKELIHOOD',
            score,
            details,
            interpretation:
                score >= 70 ? 'High probability of epilepsy' :
                score >= 40 ? 'Moderate probability - complete workup needed' :
                'Low probability - consider alternatives'
        };
    }

    function scoreMS(input) {
        const { checked, values } = normalise(input);
        const details = [];
        let score = 0;

        const course = values['ms-course'];
        if (course) {
            score += 10;
            details.push(`Disease course: ${course}`);
        }

        const symptoms = countChecked(checked, MS_SYMPTOMS);
        score += symptoms * 12;
        if (symptoms > 0) details.push(`${symptoms} typical MS symptoms present`);

        return {
            title: 'MS DIAGNOSTIC PROBABILITY',
            score,
            details,
            interpretation:
                score >= 80 ? 'High probability - meets McDonald criteria' :
                score >= 50 ? 'Moderate probability - complete MRI/CSF workup' :
                'Low probability - consider alternatives'
        };
    }

    function scoreParkinson(input) {
        const { checked, values } = normalise(input);
        const details = [];
        let score = 0;

        const bradykinesia = toInt(values['bradykinesia']);
        if (bradykinesia > 0) {
            score += bradykinesia * 15;
            details.push(`Bradykinesia severity: ${bradykinesia}/4`);
        }

        const cardinal = countChecked(checked, PD_CARDINAL);
        score += cardinal * 15;
        if (cardinal > 0) details.push(`${cardinal}/${PD_CARDINAL.length} cardinal features present`);

        const levodopa = values['levodopa-response'];
        if (levodopa === 'excellent') {
            score += 25;
            details.push('Excellent levodopa response');
        } else if (levodopa === 'good') {
            score += 15;
            details.push('Good levodopa response');
        }

        return {
            title: 'PARKINSON\'S DISEASE LIKELIHOOD',
            score,
            details,
            interpretation:
                score >= 80 ? 'High probability of Parkinson\'s disease' :
                score >= 50 ? 'Moderate probability - consider DaTscan' :
                'Low probability - consider alternatives'
        };
    }

    function parseDateTime(value) {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function treatmentWindow(minutes) {
        if (minutes <= 270) return '⚠️ WITHIN tPA WINDOW (≤4.5 h) - Consider thrombolysis';
        if (minutes <= 360) return '⚠️ WITHIN thrombectomy window (≤6 h) - Consider mechanical intervention';
        if (minutes <= 1440) return '⚠️ Consider extended window therapies (6-24 h, imaging selected)';
        return '❌ Outside acute treatment windows';
    }

    function scoreNIHSS(input) {
        const { checked, values } = normalise(input);
        const details = [];

        let score = 0;
        NIHSS_ITEMS.forEach(([id, max]) => {
            score += Math.min(Math.max(toInt(values[id]), 0), max);
        });
        details.push(`Total NIHSS Score: ${score}/${NIHSS_MAX}`);

        const onset = parseDateTime(values['symptom-onset']);
        const arrival = parseDateTime(values['hospital-arrival']);
        if (onset && arrival) {
            const minutes = Math.round((arrival - onset) / 60000);
            if (minutes < 0) {
                details.push('❗ Arrival time is before symptom onset - please check the times entered');
            } else {
                details.push(`Time from onset: ${Math.floor(minutes / 60)}h ${minutes % 60}m`);
                details.push(treatmentWindow(minutes));
            }
        } else if (onset || arrival) {
            details.push('Enter both onset and arrival times to assess treatment windows');
        }

        const investigations = countChecked(checked, STROKE_INVESTIGATIONS);
        if (investigations > 0) {
            details.push(`${investigations}/${STROKE_INVESTIGATIONS.length} investigations completed`);
        }

        return {
            title: 'NIHSS STROKE ASSESSMENT',
            score,
            maxScore: NIHSS_MAX,
            details,
            interpretation:
                score === 0 ? 'No stroke symptoms on NIHSS' :
                score <= 4 ? 'Minor stroke' :
                score <= 15 ? 'Moderate stroke' :
                score <= 20 ? 'Moderate to severe stroke' :
                'Severe stroke'
        };
    }

    const calculators = {
        fnd: scoreFND,
        epilepsy: scoreEpilepsy,
        ms: scoreMS,
        parkinson: scoreParkinson,
        stroke: scoreNIHSS
    };

    function calculate(moduleName, input) {
        const calculator = calculators[moduleName];
        if (!calculator) throw new Error(`Unknown assessment module: ${moduleName}`);
        return calculator(input);
    }

    return {
        calculate,
        scoreFND,
        scoreEpilepsy,
        scoreMS,
        scoreParkinson,
        scoreNIHSS,
        NIHSS_MAX,
        NIHSS_ITEMS: NIHSS_ITEMS.map(([id, max]) => ({ id, max })),
        STROKE_INVESTIGATIONS: STROKE_INVESTIGATIONS.slice()
    };
});
