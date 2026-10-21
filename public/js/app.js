/*
 * Neuro-Diagnostic System - UI wiring.
 * Scoring rules live in scoring.js (window.NeuroScoring).
 */
(function () {
    'use strict';

    const Scoring = window.NeuroScoring;
    const SECTIONS = ['home', 'patient', 'fnd', 'epilepsy', 'ms', 'parkinson', 'stroke'];

    let currentPatient = null;
    let recognition = null;
    let isRecording = false;

    function todayLocal() {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now - offset).toISOString().split('T')[0];
    }

    function el(tag, options, children) {
        const node = document.createElement(tag);
        if (options) {
            if (options.className) node.className = options.className;
            if (options.text !== undefined) node.textContent = options.text;
            if (options.attrs) {
                Object.keys(options.attrs).forEach(key => node.setAttribute(key, options.attrs[key]));
            }
        }
        (children || []).forEach(child => node.appendChild(child));
        return node;
    }

    // ---------- Navigation ----------
    function showSection(sectionId, updateHash) {
        if (!SECTIONS.includes(sectionId)) sectionId = 'home';

        document.querySelectorAll('.section').forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });
        document.querySelectorAll('.nav-tab').forEach(tab => {
            const active = tab.dataset.section === sectionId;
            tab.classList.toggle('active', active);
            if (active) tab.setAttribute('aria-current', 'page');
            else tab.removeAttribute('aria-current');
        });

        if (updateHash && location.hash !== '#' + sectionId) {
            history.pushState(null, '', '#' + sectionId);
        }
    }

    // ---------- Patient registration ----------
    function registerPatient() {
        const id = document.getElementById('patientId').value.trim();
        const name = document.getElementById('patientName').value.trim();
        const age = parseInt(document.getElementById('patientAge').value, 10);
        const gender = document.getElementById('patientGender').value;
        const assessmentDate = document.getElementById('assessmentDate').value || todayLocal();

        if (!id || !name || !gender || !Number.isFinite(age)) {
            alert('Please fill in all required patient information.');
            return;
        }
        if (age < 0 || age > 120) {
            alert('Please enter an age between 0 and 120.');
            return;
        }

        currentPatient = { id, name, age, gender, assessmentDate };

        const status = document.getElementById('patient-status');
        status.replaceChildren(el('div', { className: 'score-display' }, [
            el('div', { text: '✅ Patient Registered Successfully!' }),
            el('strong', { text: name }),
            document.createTextNode(` (ID: ${id})`),
            el('div', { text: `Age: ${age} | Gender: ${gender}` })
        ]));
    }

    // ---------- Tamil voice input ----------
    function initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return false;
        recognition = new SpeechRecognition();
        recognition.lang = 'ta-IN';
        recognition.continuous = false;
        recognition.interimResults = true;
        return true;
    }

    function startVoiceInput(targetId, voiceBtn) {
        if (!recognition && !initializeSpeechRecognition()) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        if (isRecording) {
            recognition.stop();
            return;
        }

        const target = document.getElementById(targetId);
        const status = document.getElementById(targetId + '-status');

        isRecording = true;
        voiceBtn.classList.add('recording');
        status.textContent = 'Listening in Tamil... (தமிழில் பேசவும்)';

        recognition.onresult = function (event) {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            target.value = transcript;
            status.textContent = `Recognized: ${transcript}`;
        };
        recognition.onend = function () {
            isRecording = false;
            voiceBtn.classList.remove('recording');
            status.textContent = 'Voice input completed.';
        };
        recognition.onerror = function () {
            isRecording = false;
            voiceBtn.classList.remove('recording');
            status.textContent = 'Error in voice recognition. Please try again.';
        };

        try {
            recognition.start();
        } catch (err) {
            isRecording = false;
            voiceBtn.classList.remove('recording');
            status.textContent = 'Could not start voice recognition. Please try again.';
        }
    }

    // ---------- Assessments ----------
    function collectInputs(section) {
        const checked = [];
        const values = {};
        section.querySelectorAll('input, select, textarea').forEach(field => {
            if (!field.id) return;
            if (field.type === 'checkbox' || field.type === 'radio') {
                if (field.checked) checked.push(field.id);
            } else {
                values[field.id] = field.value;
            }
        });
        return { checked, values };
    }

    function calculate(moduleName) {
        if (!currentPatient) {
            alert('Please register patient first!');
            showSection('patient', true);
            return;
        }
        const section = document.getElementById(moduleName);
        const result = Scoring.calculate(moduleName, collectInputs(section));
        displayResult(moduleName + '-result', result);
    }

    function displayResult(elementId, result) {
        const scoreText = result.maxScore !== undefined
            ? `SCORE: ${result.score}/${result.maxScore}`
            : `SCORE: ${result.score}`;

        const detailList = el('ul', { className: 'result-details' },
            result.details.map(detail => el('li', { text: detail })));

        const card = el('div', { className: 'score-display' }, [
            el('h3', { text: result.title }),
            el('div', { className: 'result-score', text: scoreText }),
            el('div', { className: 'result-interpretation' }, [el('strong', { text: result.interpretation })]),
            el('div', { className: 'result-body' }, [
                el('div', {}, [el('strong', { text: 'Patient: ' }),
                    document.createTextNode(`${currentPatient.name} (${currentPatient.id}), ${currentPatient.age} y, ${currentPatient.gender}`)]),
                el('div', {}, [el('strong', { text: 'Assessment Date: ' }),
                    document.createTextNode(currentPatient.assessmentDate)]),
                el('div', { className: 'result-details-title' }, [el('strong', { text: 'Assessment Details:' })]),
                detailList
            ]),
            el('button', {
                className: 'btn btn-success no-print',
                text: 'Print Report',
                attrs: { type: 'button', 'data-print': elementId }
            })
        ]);

        document.getElementById(elementId).replaceChildren(card);
    }

    // Prints only the chosen result without destroying the form state.
    function printResult(elementId) {
        const printArea = document.getElementById('print-area');
        const source = document.getElementById(elementId).cloneNode(true);
        source.removeAttribute('id');
        printArea.replaceChildren(
            el('h1', { text: 'Neuro-Diagnostic System Report' }),
            source,
            el('p', {
                className: 'print-footer',
                text: `Generated ${new Date().toLocaleString()} - decision support only, not a substitute for clinical judgement.`
            })
        );
        document.body.classList.add('print-mode');
        window.print();
    }

    window.addEventListener('afterprint', () => {
        document.body.classList.remove('print-mode');
        document.getElementById('print-area').replaceChildren();
    });

    // ---------- Connectivity badge ----------
    function updateNetworkStatus() {
        const badge = document.getElementById('network-status');
        if (!badge) return;
        badge.textContent = navigator.onLine ? 'Online' : 'Offline mode';
        badge.classList.toggle('status-online', navigator.onLine);
        badge.classList.toggle('status-offline', !navigator.onLine);
    }

    // ---------- Event wiring ----------
    document.addEventListener('click', event => {
        const target = event.target.closest('[data-section], [data-action], [data-calculate], [data-voice-target], [data-print]');
        if (!target) return;

        if (target.dataset.section) {
            showSection(target.dataset.section, true);
        } else if (target.dataset.action === 'register-patient') {
            registerPatient();
        } else if (target.dataset.calculate) {
            calculate(target.dataset.calculate);
        } else if (target.dataset.voiceTarget) {
            startVoiceInput(target.dataset.voiceTarget, target);
        } else if (target.dataset.print) {
            printResult(target.dataset.print);
        }
    });

    window.addEventListener('popstate', () => showSection(location.hash.slice(1), false));
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    document.getElementById('assessmentDate').value = todayLocal();
    showSection(location.hash.slice(1) || 'home', false);
    updateNetworkStatus();

    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache is optional */ });
        });
    }
})();
