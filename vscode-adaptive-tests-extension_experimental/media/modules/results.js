/**
 * @fileoverview Results display and rendering module for the Discovery Lens.
 * Handles the presentation of discovery results with interactive features.
 *
 * @module ResultsModule
 */

/**
 * Shows skeleton loading placeholders while discovery is in progress.
 *
 * @function showSkeleton
 * @param {HTMLElement} resultsContainer - Container for skeleton elements
 * @param {number} [count=3] - Number of skeleton items to display
 */
export function showSkeleton(resultsContainer, count = 3) {
    // Clear container safely
    while (resultsContainer.firstChild) {
        resultsContainer.removeChild(resultsContainer.firstChild);
    }
    
    for (let i = 0; i < count; i++) {
        const skeletonEl = createSkeletonElement();
        resultsContainer.appendChild(skeletonEl);
    }
}

/**
 * Creates a single skeleton loading element with appropriate structure.
 *
 * @function createSkeletonElement
 * @returns {HTMLElement} Skeleton element with loading animation
 */
function createSkeletonElement() {
    const div = document.createElement('div');
    div.className = 'skeleton-result';
    div.setAttribute('aria-hidden', 'true');
    
    // Build skeleton structure with DOM methods
    const header = document.createElement('div');
    header.className = 'skeleton-header';

    const pathSkeleton = document.createElement('div');
    pathSkeleton.className = 'skeleton skeleton-path';

    const scoreSkeleton = document.createElement('div');
    scoreSkeleton.className = 'skeleton skeleton-score';

    header.appendChild(pathSkeleton);
    header.appendChild(scoreSkeleton);
    div.appendChild(header);

    const breakdown = document.createElement('div');
    breakdown.className = 'skeleton-breakdown';

    const breakdownTitle = document.createElement('div');
    breakdownTitle.className = 'skeleton skeleton-breakdown-title';
    breakdown.appendChild(breakdownTitle);

    for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.className = 'skeleton skeleton-breakdown-item';
        breakdown.appendChild(item);
    }
    div.appendChild(breakdown);

    const actions = document.createElement('div');
    actions.className = 'skeleton-actions';

    for (let i = 0; i < 2; i++) {
        const action = document.createElement('div');
        action.className = 'skeleton skeleton-action';
        actions.appendChild(action);
    }
    div.appendChild(actions);
    
    return div;
}

/**
 * Normalises score breakdown data into a flat array of strings.
 * Accepts either the legacy array shape or the factor object structure.
 *
 * @param {any} breakdown
 * @returns {Array<string>}
 */
function normaliseScoreBreakdown(breakdown) {
    if (!breakdown) {
        return [];
    }

    if (Array.isArray(breakdown)) {
        return breakdown;
    }

    if (Array.isArray(breakdown.factors)) {
        return breakdown.factors
            .map((factor) => {
                if (!factor) {
                    return '';
                }
                const parts = [];
                if (factor.factor) {
                    parts.push(String(factor.factor));
                }
                if (typeof factor.points === 'number' && !Number.isNaN(factor.points)) {
                    parts.push(`(+${factor.points})`);
                }
                if (factor.description) {
                    parts.push(String(factor.description));
                }
                return parts.join(' ').trim();
            })
            .filter(Boolean);
    }

    return [];
}

/**
 * Displays discovery results with summary, individual items, and navigation setup.
 * Creates interactive result elements with accessibility support.
 *
 * @function displayResults
 * @param {Object} data - Discovery results data
 * @param {Array} data.results - Array of result objects
 * @param {Object} data.signature - Original discovery signature
 * @param {number} data.totalCandidates - Total candidates analyzed
 * @param {HTMLElement} resultsSection - Results display section
 * @param {HTMLElement} resultsContainer - Container for result items
 * @param {HTMLElement} resultsSummary - Summary display element
 * @param {Function} announceToScreenReader - Accessibility announcement function
 * @param {Function} manageFocus - Focus management function
 * @param {Function} saveState - State persistence function
 * @param {Function} setupResultNavigation - Navigation setup function
 */
export function displayResults(data, resultsSection, resultsContainer, resultsSummary, announceToScreenReader, manageFocus, saveState, setupResultNavigation) {
    const { results, signature, totalCandidates } = data;

    // Update summary
    const summaryText = results.length === 0
        ? `No matches found out of ${totalCandidates} candidates`
        : `Found ${results.length} matches out of ${totalCandidates} candidates`;
    resultsSummary.replaceChildren();
    const summaryStrong = document.createElement('strong');
    summaryStrong.textContent = summaryText;
    resultsSummary.appendChild(summaryStrong);
    if (signature) {
        const label = document.createElement('span');
        label.textContent = ' for signature:';
        const code = document.createElement('code');
        code.textContent = JSON.stringify(signature, null, 2);
        resultsSummary.append(label, code);
    }

    // Clear previous results and selection
    resultsContainer.replaceChildren();

    if (results.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.setAttribute('role', 'status');

        const icon = document.createElement('div');
        icon.className = 'empty-state-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '🔍';

        const text = document.createElement('div');
        text.className = 'empty-state-text';
        text.textContent = 'No matching files found';

        const help = document.createElement('p');
        help.textContent = 'Try adjusting your signature or check that the target code exists in your workspace.';

        emptyState.append(icon, text, help);
        resultsContainer.appendChild(emptyState);
        announceToScreenReader(`No matches found out of ${totalCandidates} candidates`, 'assertive');
    } else {
        results.forEach((result, index) => {
            const resultEl = createResultElement(result, index, results.length);
            resultsContainer.appendChild(resultEl);
        });
        
        // Set up result navigation and accessibility
        setupResultNavigation(resultsContainer);

        // Update state manager if available
        if (window.stateManager) {
            window.stateManager.setState({
                ui: {
                    ...window.stateManager.getState('ui'),
                    resultsVisible: true,
                    resultsCount: results.length
                }
            });
        }

        announceToScreenReader(`Found ${results.length} matches out of ${totalCandidates} candidates. Use arrow keys to navigate results.`, 'assertive');
        
        // Focus management - focus first result after a brief delay
        const resultItems = resultsContainer.querySelectorAll('.result-item');
        manageFocus(resultItems[0], { delay: 200 });
    }

    resultsSection.style.display = 'block';
    saveState();
}

/**
 * Creates a single result element with score display, breakdown, and actions.
 * Includes accessibility attributes and interactive features.
 *
 * @function createResultElement
 * @param {Object} result - Result object with path, score, and metadata
 * @param {number} index - Index of this result in the results array
 * @param {number} totalResults - Total number of results for context
 * @returns {HTMLElement} Configured result element
 */
function createResultElement(result, index, totalResults) {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.setAttribute('role', 'listitem');

    const showScores = Boolean(result.showScores);

    // Determine score class and description
    let scoreClass = 'score-low';
    let scoreDescription = 'low match';
    if (result.score >= 80) {
        scoreClass = 'score-high';
        scoreDescription = 'high match';
    } else if (result.score >= 50) {
        scoreClass = 'score-medium';
        scoreDescription = 'medium match';
    }

    const header = document.createElement('div');
    header.className = 'result-header';

    const pathSpan = document.createElement('span');
    pathSpan.className = 'result-path';
    pathSpan.setAttribute('role', 'text');
    pathSpan.textContent = result.path;
    header.appendChild(pathSpan);

    if (showScores) {
        const scoreChip = document.createElement('span');
        scoreChip.className = `result-score ${scoreClass}`;
        scoreChip.setAttribute('aria-label', `Score ${result.score}, ${scoreDescription}`);
        scoreChip.textContent = String(result.score);
        header.appendChild(scoreChip);
    }

    div.appendChild(header);

    const breakdownItems = normaliseScoreBreakdown(result.scoreBreakdown);
    if (showScores && breakdownItems.length > 0) {
        const breakdown = document.createElement('div');
        breakdown.className = 'result-breakdown';
        const title = document.createElement('div');
        title.className = 'breakdown-title';
        title.textContent = 'Score Breakdown:';
        breakdown.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'breakdown-list';
        list.setAttribute('role', 'list');
        breakdownItems.forEach(item => {
            const li = document.createElement('li');
            li.setAttribute('role', 'listitem');
            li.textContent = item;
            list.appendChild(li);
        });
        breakdown.appendChild(list);
        div.appendChild(breakdown);
    }

    const actions = document.createElement('div');
    actions.className = 'result-actions';
    actions.setAttribute('role', 'group');
    actions.setAttribute('aria-label', `Actions for ${result.path}`);

    const openButton = document.createElement('button');
    openButton.className = 'action-btn';
    openButton.textContent = 'Open File';
    openButton.setAttribute('aria-describedby', `open-help-${index}`);
    openButton.addEventListener('click', () => {
        if (typeof window.openFile === 'function') {
            window.openFile(result.absolutePath);
        }
    });

    const scaffoldButton = document.createElement('button');
    scaffoldButton.className = 'action-btn';
    scaffoldButton.textContent = 'Scaffold Test';
    scaffoldButton.setAttribute('aria-describedby', `scaffold-help-${index}`);
    scaffoldButton.addEventListener('click', () => {
        if (typeof window.scaffoldTest === 'function') {
            window.scaffoldTest(result.absolutePath);
        }
    });

    const openHelp = document.createElement('div');
    openHelp.id = `open-help-${index}`;
    openHelp.className = 'visually-hidden';
    openHelp.textContent = `Open ${result.path} in editor`;

    const scaffoldHelp = document.createElement('div');
    scaffoldHelp.id = `scaffold-help-${index}`;
    scaffoldHelp.className = 'visually-hidden';
    scaffoldHelp.textContent = `Generate test file for ${result.path}`;

    actions.append(openButton, scaffoldButton, openHelp, scaffoldHelp);
    div.appendChild(actions);

    const ariaLabel = showScores
        ? `File ${result.path}, score ${result.score}, ${scoreDescription}. Position ${index + 1} of ${totalResults}`
        : `File ${result.path}. Position ${index + 1} of ${totalResults}`;
    div.setAttribute('aria-label', ariaLabel);

    return div;
}

/**
 * Hides the results display section.
 *
 * @function hideResults
 * @param {HTMLElement} resultsSection - Results section element to hide
 */
export function hideResults(resultsSection) {
    resultsSection.style.display = 'none';
}