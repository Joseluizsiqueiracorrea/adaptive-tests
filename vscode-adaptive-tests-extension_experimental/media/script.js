/**
 * Adaptive Tests Discovery Lens webview controller.
 * Modernized for the VS Code Tahoe 26 "liquid glass" release with
 * resilient state restoration, accessibility, and filtering.
 */
(() => {
    const vscode = acquireVsCodeApi();

    // Core DOM references (fail fast if the webview did not render correctly)
    const signatureInput = document.getElementById('signature-input');
    const runButton = document.getElementById('run-discovery');
    const resultsSection = document.querySelector('.results-section');
    const resultsContainer = document.getElementById('results-container');
    const resultsSummary = document.querySelector('.results-summary');
    const errorSection = document.querySelector('.error-section');
    const errorMessage = errorSection ? errorSection.querySelector('.error-message') : null;
    const presetButtons = Array.from(document.querySelectorAll('.preset-btn'));
    const statusAnnouncements = document.getElementById('status-announcements');
    const progressContainer = document.querySelector('.discovery-progress');
    const progressText = document.getElementById('progress-text');
    const progressSteps = Array.from(document.querySelectorAll('.progress-step'));

    if (!signatureInput || !runButton || !resultsSection || !resultsContainer || !resultsSummary) {
        console.error('[Adaptive Tests] Discovery Lens failed to initialise: missing required DOM nodes.');
        return;
    }

    const originalRunButtonMarkup = runButton.innerHTML;

    // Mutable state
    let isLoading = false;
    let lastSignature = null;
    let lastResults = [];
    let currentStepIndex = 0;
    let validationTimer = null;

    // Lazy-loaded modules
    let resultsModule = null;
    let errorsModule = null;
    let navigationModule = null;
    let filtersModuleInstance = null;

    const progressTimers = new Set();

    class StateManager {
        constructor() {
            this.state = {
                isLoading: false,
                lastSignature: null,
                lastResults: [],
                ui: {
                    currentError: null,
                    currentErrorType: null,
                    resultsVisible: false,
                    resultsCount: 0,
                    announcements: [],
                    selectedResultIndex: -1,
                    selectedPreset: null
                }
            };
            this.listeners = [];
        }

        getState(key) {
            if (key) {
                return this.state[key];
            }
            return { ...this.state };
        }

        setState(updates) {
            const previous = JSON.parse(JSON.stringify(this.state));
            this.state = deepMerge({ ...this.state }, updates);
            this.listeners.forEach(listener => {
                try {
                    listener(this.state, previous);
                } catch (error) {
                    console.error('[Adaptive Tests] state listener error', error);
                }
            });
        }

        subscribe(listener) {
            this.listeners.push(listener);
            return () => {
                const index = this.listeners.indexOf(listener);
                if (index >= 0) {
                    this.listeners.splice(index, 1);
                }
            };
        }
    }

    function deepMerge(target, source) {
        Object.keys(source).forEach(key => {
            const value = source[key];
            if (Array.isArray(value)) {
                target[key] = [...value];
            } else if (value && typeof value === 'object') {
                target[key] = deepMerge(target[key] ? { ...target[key] } : {}, value);
            } else {
                target[key] = value;
            }
        });
        return target;
    }

    const stateManager = new StateManager();
    window.stateManager = stateManager;
    window.announceToScreenReader = announceToScreenReader;
    window.openFile = openFile;
    window.scaffoldTest = scaffoldTest;
    window.retryLastDiscovery = retryLastDiscovery;

    init().catch(error => console.error('[Adaptive Tests] Failed to initialise Discovery Lens', error));

    async function init() {
        attachEventListeners();
        await setupPresetHandlers();
        setupDetailsAccessibility();
        restoreState();
    }

    function attachEventListeners() {
        runButton.addEventListener('click', runDiscovery);
        signatureInput.addEventListener('keydown', handleSignatureKeydown);
        signatureInput.addEventListener('input', debounceValidation);
        document.addEventListener('keydown', handleGlobalKeydown);
        window.addEventListener('message', handleMessage);
    }

    async function setupPresetHandlers() {
        if (!presetButtons.length) {
            return;
        }
        const { setupPresetHandlers } = await import('./modules/presets.js');
        setupPresetHandlers(signatureInput, presetButtons, announceToScreenReader, saveState);
    }

    function setupDetailsAccessibility() {
        const details = document.querySelector('.help-section details');
        const summary = details ? details.querySelector('summary') : null;
        if (!details || !summary) {
            return;
        }
        summary.addEventListener('click', () => {
            requestAnimationFrame(() => {
                summary.setAttribute('aria-expanded', details.open.toString());
            });
        });
    }

    function restoreState() {
        const persisted = vscode.getState();
        if (!persisted) {
            return;
        }

        if (persisted.signature) {
            signatureInput.value = persisted.signature;
        }

        if (persisted.lastSignature) {
            lastSignature = persisted.lastSignature;
            stateManager.setState({ lastSignature });
        }

        if (Array.isArray(persisted.results) && persisted.results.length) {
            lastResults = persisted.results;
            stateManager.setState({ lastResults });
            const totalCandidates = persisted.totalCandidates ?? persisted.results.length;
            setTimeout(() => {
                displayResults(
                    {
                        results: persisted.results,
                        signature: persisted.lastSignature ?? null,
                        totalCandidates
                    },
                    {
                        skipStateSave: true,
                        restoredFilters: persisted.filters ?? null
                    }
                ).catch(error => console.error('[Adaptive Tests] Failed to restore discovery results', error));
            }, 0);
        }
    }

    async function handleMessage(event) {
        const message = event.data || {};

        switch (message.command) {
            case 'displayResults':
                setLoading(false);
                await displayResults(message).catch(error => {
                    console.error('[Adaptive Tests] Failed to display discovery results', error);
                    showError('Unable to render discovery results. See console for details.', 'DISCOVERY');
                });
                break;
            case 'showError':
                setLoading(false);
                await showError(message.error || 'Discovery failed.', message.errorType).catch(err => {
                    console.error('[Adaptive Tests] Failed to show error state', err);
                });
                break;
            case 'updateProgress':
                updateProgress(
                    typeof message.step === 'number' ? message.step : currentStepIndex,
                    typeof message.text === 'string' ? message.text : ''
                );
                break;
            default:
                break;
        }
    }

    async function runDiscovery() {
        if (isLoading) {
            return;
        }

        const rawSignature = signatureInput.value.trim();
        if (!rawSignature) {
            await showError('Please enter a discovery signature before running discovery.', 'VALIDATION');
            manageFocus(signatureInput);
            return;
        }

        let parsedSignature;
        try {
            parsedSignature = JSON.parse(rawSignature);
        } catch (error) {
            await showError('Invalid JSON signature. Please fix the syntax and try again.', 'VALIDATION');
            manageFocus(signatureInput);
            return;
        }

        if (!parsedSignature.name) {
            await showError('Signature must include at least a "name" property.', 'VALIDATION');
            manageFocus(signatureInput);
            return;
        }

        lastSignature = parsedSignature;
        stateManager.setState({
            lastSignature: parsedSignature,
            lastResults: []
        });

        setLoading(true);
        hideError();

        const { showSkeleton } = await loadResultsModule();
        showResultsSection();
        showSkeleton(resultsContainer, 5);

        showProgress();
        startProgressAnimation();

        announceToScreenReader('Starting discovery. Results will appear soon.', 'assertive');

        vscode.postMessage({
            command: 'runDiscovery',
            signature: parsedSignature
        });

        saveState();
    }

    function setLoading(loading) {
        isLoading = loading;
        stateManager.setState({ isLoading: loading });

        runButton.disabled = loading;
        runButton.classList.toggle('loading', loading);

        if (loading) {
            runButton.setAttribute('aria-busy', 'true');
            runButton.setAttribute('aria-label', 'Running discovery, please wait');
            runButton.innerHTML = '<span class="progress-spinner" aria-hidden="true"></span><span>Running Discovery…</span>';
            showProgress();
        } else {
            runButton.removeAttribute('aria-busy');
            runButton.setAttribute('aria-label', 'Run discovery to find matching code files');
            runButton.innerHTML = originalRunButtonMarkup;
            hideProgress();
        }
    }

    async function displayResults(payload, options = {}) {
        hideError();

        const signature = payload.signature ?? null;
        const totalCandidates = payload.totalCandidates ?? (Array.isArray(payload.results) ? payload.results.length : 0);
        lastResults = Array.isArray(payload.results) ? payload.results : [];

        stateManager.setState({
            lastResults,
            ui: {
                ...stateManager.getState('ui'),
                resultsVisible: true,
                resultsCount: lastResults.length
            }
        });

        const filters = await ensureFilters(lastResults);
        if (filters && options.restoredFilters) {
            filters.applyFilterState(options.restoredFilters);
        }

        const activeFilters = filters ? filters.getCurrentFilters() : null;
        const filteredResults = filters && activeFilters
            ? filters.filterAndSort(lastResults, activeFilters)
            : lastResults;

        await renderResults(filteredResults, totalCandidates, signature);

        if (filters) {
            filters.updateStats(lastResults, filteredResults);
        }

        announceResults(filteredResults.length, lastResults.length);

        if (!options.skipStateSave) {
            saveState(totalCandidates);
        }
    }

    async function renderResults(resultsToRender, totalCandidates, signature) {
        const module = await loadResultsModule();
        await ensureNavigationModule();

        module.displayResults(
            {
                results: resultsToRender,
                signature,
                totalCandidates
            },
            resultsSection,
            resultsContainer,
            resultsSummary,
            announceToScreenReader,
            manageFocus,
            () => saveState(totalCandidates),
            container => navigationModule.setupResultNavigation(container)
        );

        showResultsSection();
    }

    async function ensureFilters(results) {
        if (!results || results.length === 0) {
            if (filtersModuleInstance && filtersModuleInstance.filtersContainer) {
                filtersModuleInstance.filtersContainer.classList.add('hidden');
                filtersModuleInstance.filtersContainer.style.display = 'none';
            }
            return null;
        }

        const filters = await getFiltersModule();
        const languages = Array.from(new Set(results.map(result => result.language).filter(Boolean))).sort();

        if (!filters.filtersContainer) {
            filters.createFiltersUI(resultsSection, handleFiltersChange, languages);
        } else {
            filters.setAvailableLanguages(languages);
            filters.filtersContainer.classList.remove('hidden');
            filters.filtersContainer.style.display = 'block';
        }

        return filters;
    }

    async function handleFiltersChange(newFilters) {
        if (!lastResults.length) {
            return;
        }

        const filters = await getFiltersModule();
        const filtered = filters.filterAndSort(lastResults, newFilters);
        await renderResults(filtered, lastResults.length, lastSignature);
        filters.updateStats(lastResults, filtered);
        announceResults(filtered.length, lastResults.length);
        saveState(lastResults.length);
    }

    function announceResults(filteredCount, totalCount) {
        if (totalCount === 0) {
            announceToScreenReader('No matching results found.');
        } else if (filteredCount === totalCount) {
            announceToScreenReader(`Found ${filteredCount} results.`);
        } else {
            announceToScreenReader(`Showing ${filteredCount} of ${totalCount} filtered results.`);
        }
    }

    async function showError(message, errorType) {
        const module = await loadErrorsModule();
        const category = errorType || module.categorizeError(message);

        module.showError(
            message,
            errorSection,
            errorMessage,
            resultsSection,
            announceToScreenReader,
            manageFocus,
            category,
            lastSignature
        );

        if (errorSection) {
            errorSection.classList.remove('hidden');
            errorSection.style.display = 'block';
        }

        stateManager.setState({
            ui: {
                ...stateManager.getState('ui'),
                currentError: message,
                currentErrorType: category,
                resultsVisible: false
            }
        });
    }

    function hideError() {
        if (errorsModule && typeof errorsModule.hideError === 'function') {
            errorsModule.hideError(errorSection);
        }

        if (errorSection) {
            errorSection.classList.add('hidden');
            errorSection.style.display = 'none';
        }

        stateManager.setState({
            ui: {
                ...stateManager.getState('ui'),
                currentError: null,
                currentErrorType: null
            }
        });
    }

    function showResultsSection() {
        resultsSection.classList.remove('hidden');
        resultsSection.style.display = 'block';
    }

    function showProgress() {
        if (!progressContainer) {
            return;
        }
        progressContainer.classList.remove('hidden');
        progressContainer.style.display = progressContainer.dataset.display || 'flex';
        resetProgress();
    }

    function hideProgress() {
        if (!progressContainer) {
            return;
        }
        progressContainer.classList.add('hidden');
        progressContainer.style.display = 'none';
        resetProgress();
        clearProgressAnimation();
    }

    function startProgressAnimation() {
        clearProgressAnimation();
        resetProgress();
        const steps = [
            { delay: 200, text: 'Scanning workspace…' },
            { delay: 1100, text: 'Analyzing syntax trees…' },
            { delay: 2100, text: 'Scoring candidates…' },
            { delay: 3100, text: 'Finalizing results…' }
        ];

        steps.forEach((entry, index) => {
            const timer = setTimeout(() => updateProgress(index, entry.text), entry.delay);
            progressTimers.add(timer);
        });
    }

    function clearProgressAnimation() {
        progressTimers.forEach(timer => clearTimeout(timer));
        progressTimers.clear();
    }

    function resetProgress() {
        currentStepIndex = 0;
        if (progressText) {
            progressText.textContent = 'Discovering files…';
        }
        progressSteps.forEach(step => {
            step.classList.remove('active');
            step.classList.remove('completed');
        });
    }

    function updateProgress(stepIndex, text) {
        currentStepIndex = Math.max(0, Math.min(progressSteps.length - 1, stepIndex));

        if (progressText && text) {
            progressText.textContent = text;
        }

        progressSteps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStepIndex);
            step.classList.toggle('completed', index < currentStepIndex);
        });
    }

    function announceToScreenReader(message, priority = 'polite') {
        if (!statusAnnouncements) {
            return;
        }

        statusAnnouncements.textContent = message;
        statusAnnouncements.setAttribute('aria-live', priority);

        const currentUi = stateManager.getState('ui');
        const announcements = [...(currentUi.announcements || []), {
            message,
            priority,
            timestamp: Date.now()
        }];

        stateManager.setState({
            ui: {
                ...currentUi,
                announcements: announcements.slice(-10)
            }
        });

        setTimeout(() => {
            statusAnnouncements.textContent = '';
        }, 1000);
    }

    function manageFocus(element, options = {}) {
        if (!element || typeof element.focus !== 'function') {
            return;
        }
        const delay = options.delay ?? 100;
        setTimeout(() => {
            element.focus(options);
        }, delay);
    }

    function handleSignatureKeydown(event) {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            runDiscovery();
        } else if (event.key === 'Escape') {
            hideError();
        }
    }

    function handleGlobalKeydown(event) {
        if (event.key === 'Escape') {
            hideError();
        }

        if (!navigationModule || !resultsContainer) {
            return;
        }

        navigationModule.handleGlobalKeydown(event, resultsContainer);
    }

    function debounceValidation() {
        if (validationTimer) {
            clearTimeout(validationTimer);
        }
        validationTimer = setTimeout(validateSignature, 400);
    }

    async function validateSignature() {
        const text = signatureInput.value.trim();
        const module = await loadErrorsModule();

        if (!text) {
            module.clearInputError(signatureInput);
            return;
        }

        const validation = module.validateSignature(text);
        if (!validation.isValid) {
            module.setInputError(validation.error, signatureInput);
        } else {
            module.clearInputError(signatureInput);
        }
    }

    function openFile(path) {
        vscode.postMessage({
            command: 'openFile',
            path
        });
    }

    function scaffoldTest(path) {
        vscode.postMessage({
            command: 'scaffoldTest',
            path
        });
    }

    function retryLastDiscovery(signatureOverride) {
        const signature = signatureOverride || lastSignature;
        if (!signature) {
            manageFocus(signatureInput);
            return;
        }

        signatureInput.value = JSON.stringify(signature, null, 2);
        hideError();
        runDiscovery();
    }

    function saveState(totalCandidatesOverride) {
        try {
            vscode.setState({
                signature: signatureInput.value,
                results: lastResults,
                lastSignature,
                totalCandidates: totalCandidatesOverride ?? (lastResults ? lastResults.length : 0),
                filters: filtersModuleInstance ? filtersModuleInstance.getCurrentFilters() : null
            });
        } catch (error) {
            console.warn('[Adaptive Tests] Failed to persist Discovery Lens state', error);
        }
    }

    async function loadResultsModule() {
        if (!resultsModule) {
            resultsModule = await import('./modules/results.js');
        }
        return resultsModule;
    }

    async function loadErrorsModule() {
        if (!errorsModule) {
            errorsModule = await import('./modules/errors.js');
        }
        return errorsModule;
    }

    async function ensureNavigationModule() {
        if (!navigationModule) {
            navigationModule = await import('./modules/navigation.js');
        }
        return navigationModule;
    }

    async function getFiltersModule() {
        if (!filtersModuleInstance) {
            const module = await import('./modules/filters.js');
            filtersModuleInstance = new module.FiltersModule();
        }
        return filtersModuleInstance;
    }
})();
