/**
 * Secure Results Module
 * DOM-safe rendering without innerHTML or inline handlers
 */

/**
 * Creates and displays skeleton loading states
 */
export function showSkeleton(resultsContainer, count = 3) {
  // Clear container safely
  while (resultsContainer.firstChild) {
    resultsContainer.removeChild(resultsContainer.firstChild);
  }

  for (let i = 0; i < count; i++) {
    const div = createSkeletonElement();
    resultsContainer.appendChild(div);
  }

  return resultsContainer;
}

/**
 * Creates a skeleton element using DOM methods
 */
function createSkeletonElement() {
  const div = document.createElement('div');
  div.className = 'result-item skeleton-item';
  div.setAttribute('aria-busy', 'true');
  div.setAttribute('aria-hidden', 'true');

  const header = document.createElement('div');
  header.className = 'skeleton-header';

  const pathSkeleton = document.createElement('div');
  pathSkeleton.className = 'skeleton skeleton-path';

  const scoreSkeleton = document.createElement('div');
  scoreSkeleton.className = 'skeleton skeleton-score';

  header.appendChild(pathSkeleton);
  header.appendChild(scoreSkeleton);
  div.appendChild(header);

  const actions = document.createElement('div');
  actions.className = 'skeleton-actions';

  for (let i = 0; i < 2; i++) {
    const button = document.createElement('div');
    button.className = 'skeleton skeleton-button';
    actions.appendChild(button);
  }

  div.appendChild(actions);
  return div;
}

/**
 * Displays results using secure DOM manipulation
 */
export function displayResults(results, signature, config = {}) {
  const { showScores = true } = config;

  const resultsContainer = document.getElementById('results-container');
  const resultsSummary = document.getElementById('results-summary');

  if (!resultsContainer || !resultsSummary) {
    console.error('Required DOM elements not found');
    return;
  }

  // Clear containers safely
  while (resultsContainer.firstChild) {
    resultsContainer.removeChild(resultsContainer.firstChild);
  }
  while (resultsSummary.firstChild) {
    resultsSummary.removeChild(resultsSummary.firstChild);
  }

  // Create summary text
  const summaryText = results.length === 0
    ? 'No results found'
    : `Found ${results.length} result${results.length === 1 ? '' : 's'}`;

  const summaryStrong = document.createElement('strong');
  summaryStrong.textContent = summaryText;
  resultsSummary.appendChild(summaryStrong);

  if (signature) {
    const label = document.createElement('span');
    label.textContent = ' for signature: ';
    const code = document.createElement('code');
    code.textContent = JSON.stringify(signature, null, 2);
    resultsSummary.appendChild(label);
    resultsSummary.appendChild(code);
  }

  // Display results
  results.forEach((result, index) => {
    const resultEl = createResultElement(result, index, showScores);
    resultsContainer.appendChild(resultEl);
  });

  setupKeyboardNavigation(resultsContainer);
}

/**
 * Creates a result element using DOM methods only
 */
function createResultElement(result, index, showScores) {
  const div = document.createElement('div');
  div.className = 'result-item';
  div.setAttribute('tabindex', '0');
  div.setAttribute('role', 'article');
  div.setAttribute('aria-label', `Result ${index + 1}: ${result.path}`);
  div.setAttribute('data-index', String(index));

  // Header section
  const header = document.createElement('div');
  header.className = 'result-header';

  const pathLabel = document.createElement('span');
  pathLabel.className = 'result-path';
  pathLabel.setAttribute('role', 'text');
  pathLabel.textContent = result.path || 'Unknown path';
  header.appendChild(pathLabel);

  // Score display
  if (showScores && typeof result.score === 'number') {
    const scoreChip = document.createElement('span');
    const scoreClass = getScoreClass(result.score);
    const scoreDescription = getScoreDescription(result.score);

    scoreChip.className = `result-score ${scoreClass}`;
    scoreChip.setAttribute('aria-label', `Score ${result.score}, ${scoreDescription}`);
    scoreChip.textContent = String(result.score);
    header.appendChild(scoreChip);
  }

  div.appendChild(header);

  // Score breakdown
  if (showScores && result.breakdown) {
    const breakdown = createBreakdownElement(result.breakdown);
    if (breakdown) {
      div.appendChild(breakdown);
    }
  }

  // Action buttons
  const actions = createActionsElement(result, index);
  div.appendChild(actions);

  return div;
}

/**
 * Creates score breakdown element
 */
function createBreakdownElement(breakdown) {
  const items = normalizeScoreBreakdown(breakdown);
  if (!items.length) return null;

  const container = document.createElement('div');
  container.className = 'result-breakdown';

  const title = document.createElement('div');
  title.className = 'breakdown-title';
  title.textContent = 'Score Breakdown:';
  container.appendChild(title);

  const list = document.createElement('ul');
  list.className = 'breakdown-list';
  list.setAttribute('role', 'list');

  items.forEach(item => {
    const li = document.createElement('li');
    li.setAttribute('role', 'listitem');
    li.textContent = item;
    list.appendChild(li);
  });

  container.appendChild(list);
  return container;
}

/**
 * Creates action buttons element
 */
function createActionsElement(result, index) {
  const actions = document.createElement('div');
  actions.className = 'result-actions';
  actions.setAttribute('role', 'group');
  actions.setAttribute('aria-label', `Actions for ${result.path}`);

  // Open button
  const openButton = document.createElement('button');
  openButton.className = 'action-btn';
  openButton.textContent = 'Open File';
  openButton.setAttribute('aria-describedby', `open-help-${index}`);
  openButton.addEventListener('click', () => {
    if (window.vscode) {
      window.vscode.postMessage({
        command: 'openFile',
        path: result.absolutePath || result.path
      });
    }
  });

  // Scaffold button
  const scaffoldButton = document.createElement('button');
  scaffoldButton.className = 'action-btn';
  scaffoldButton.textContent = 'Scaffold Test';
  scaffoldButton.setAttribute('aria-describedby', `scaffold-help-${index}`);
  scaffoldButton.addEventListener('click', () => {
    if (window.vscode) {
      window.vscode.postMessage({
        command: 'scaffoldTest',
        path: result.absolutePath || result.path
      });
    }
  });

  // Help text
  const openHelp = document.createElement('div');
  openHelp.id = `open-help-${index}`;
  openHelp.className = 'visually-hidden';
  openHelp.textContent = `Open ${result.path} in editor`;

  const scaffoldHelp = document.createElement('div');
  scaffoldHelp.id = `scaffold-help-${index}`;
  scaffoldHelp.className = 'visually-hidden';
  scaffoldHelp.textContent = `Generate test file for ${result.path}`;

  actions.appendChild(openButton);
  actions.appendChild(scaffoldButton);
  actions.appendChild(openHelp);
  actions.appendChild(scaffoldHelp);

  return actions;
}

/**
 * Normalizes score breakdown data
 */
function normalizeScoreBreakdown(breakdown) {
  if (!breakdown) return [];

  if (Array.isArray(breakdown)) {
    return breakdown.filter(Boolean).map(String);
  }

  if (Array.isArray(breakdown.factors)) {
    return breakdown.factors
      .map(factor => {
        if (!factor) return '';
        const parts = [];
        if (factor.factor) parts.push(String(factor.factor));
        if (typeof factor.points === 'number') {
          parts.push(`(+${factor.points})`);
        }
        if (factor.description) parts.push(String(factor.description));
        return parts.join(' ').trim();
      })
      .filter(Boolean);
  }

  return [];
}

/**
 * Gets score class for styling
 */
function getScoreClass(score) {
  if (score >= 80) return 'score-high';
  if (score >= 50) return 'score-medium';
  return 'score-low';
}

/**
 * Gets score description for accessibility
 */
function getScoreDescription(score) {
  if (score >= 80) return 'High confidence match';
  if (score >= 50) return 'Medium confidence match';
  return 'Low confidence match';
}

/**
 * Sets up keyboard navigation for results
 */
function setupKeyboardNavigation(container) {
  const items = container.querySelectorAll('.result-item');

  items.forEach((item, index) => {
    item.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const next = items[index + 1];
          if (next) next.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prev = items[index - 1];
          if (prev) prev.focus();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const firstButton = item.querySelector('.action-btn');
          if (firstButton) firstButton.click();
          break;
      }
    });
  });
}