# Neuro Assessment System v2.1

A comprehensive web-based neurological assessment platform designed for healthcare professionals to perform structured evaluations of major neurological conditions.

## 🧠 Overview

The Neuro Assessment System is an advanced diagnostic support tool that provides structured assessment modules for major neurological conditions. It features multilingual support (Tamil/English), evidence-based scoring workflows, and comprehensive reporting capabilities.

> **Clinical Safety Notice:** This tool is for decision support and educational use. It does **not** replace clinical judgment, institutional protocols, emergency pathways, or specialist consultation.

## ✨ Features

### Diagnostic Modules
- **🔍 Functional Neurological Disorder (FND)** - Structured assessment with functional signs evaluation
- **⚡ Epilepsy/Seizure Disorders** - ILAE-aligned classification workflow with EEG context fields
- **🧬 Multiple Sclerosis** - McDonald criteria-oriented workflow with MRI and CSF evaluation fields
- **🤝 Parkinson's Disease** - UPDRS-oriented scoring workflow with motor assessment and levodopa response tracking
- **🚨 Stroke/CVD Emergency** - NIHSS-based calculator with time-critical treatment window guidance

### Key Capabilities
- **Patient Registration System** - Structured patient data capture
- **Tamil Voice Input** - Native language support for patient interviews
- **Evidence-Based Scoring** - Clinically aligned assessment logic
- **Print Reports** - Professional diagnostic report generation
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Offline-Friendly** - Runs in-browser without a backend dependency

## 🚀 Quick Start

1. Open `neuro_assessment_system.html` in a modern web browser.
2. Register a new patient using the **Patient Registration** tab.
3. Select the appropriate diagnostic module.
4. Complete assessment fields as per clinical findings.
5. Generate and print the diagnostic report.

## 🔧 System Requirements

- Modern web browser with JavaScript enabled
- For voice input: browser with Web Speech API support (recommended: Chrome, Edge)
- Internet connection not required for core usage (offline-capable)

## 🏥 Clinical Applications

This system is designed for use by:
- Neurologists
- Emergency physicians
- General practitioners
- Medical students and residents
- Healthcare facilities requiring structured neurological assessments

## 📊 Assessment Scoring

Each module uses established clinical frameworks:
- **FND**: Confidence-oriented scoring using functional signs and investigations
- **Parkinson's**: UPDRS-oriented likelihood assessment
- **Stroke**: NIHSS-based severity scoring with treatment-window support
- **MS**: McDonald criteria-oriented workflow
- **Epilepsy**: ILAE-aligned classification support

## 🔒 Privacy & Data Handling

- Data is processed locally in the browser.
- No automatic transmission of patient data to external servers is performed by this static application.
- If browser storage/export features are used, data retention depends on user actions and local device/browser policies.
- Use only within secure clinical environments and according to institutional policy.

## ⚠️ Regulatory & Compliance Notice

You are responsible for ensuring compliance with applicable healthcare and privacy regulations (e.g., local patient-data laws, institutional governance requirements) before clinical deployment.

## 📝 Versioning

Current documentation version: **v2.1**
For code-level changes, maintain a `CHANGELOG.md` or GitHub Releases for traceable version history.

## 📄 License / Usage Notice

This project is intended for educational and clinical decision-support use.
If you plan open-source distribution, add a formal `LICENSE` file (e.g., MIT/Apache-2.0) and update this section accordingly.