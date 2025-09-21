/**
 * @fileoverview Filtering and sorting module for discovery results.
 * Provides UI components and logic for filtering and sorting discovery results
 * with real-time updates and accessibility support.
 */

export class FiltersModule {
    constructor() {
        this.filtersContainer = null;
        this.isVisible = false;
        this.currentFilters = {
            minScore: '',
            maxScore: '',
            languages: [],
            pathPattern: '',
            sortBy: 'score',
            sortOrder: 'desc'
        };
    }

    /**
     * Creates and initializes the filters UI component.
     * @param {HTMLElement} parentContainer - Container to append filters to
     * @param {Function} onFiltersChange - Callback when filters change
     * @param {Array} availableLanguages - Available language options
     */
    createFiltersUI(parentContainer, onFiltersChange, availableLanguages = []) {
        this.filtersContainer = document.createElement('div');
        this.filtersContainer.className = 'filters-section hidden';
        this.filtersContainer.style.display = 'none';
        this.filtersContainer.setAttribute('aria-labelledby', 'filters-heading');

        this.filtersContainer.innerHTML = `
            <div class="filters-header">
                <h3 id="filters-heading" class="filters-title">
                    <button class="filters-toggle" aria-expanded="false" aria-controls="filters-content">
                        <span class="filters-icon" aria-hidden="true">🔍</span>
                        Advanced Filters
                    </button>
                </h3>
                <button class="filters-clear" aria-label="Clear all filters">
                    Clear All
                </button>
            </div>

            <div id="filters-content" class="filters-content" aria-hidden="true">
                <div class="filters-grid">
                    <!-- Score Range Filters -->
                    <div class="filter-group">
                        <label for="min-score">Minimum Score</label>
                        <input type="range" id="min-score" min="0" max="100" value="0"
                               aria-describedby="min-score-value">
                        <span id="min-score-value" class="range-value">0</span>
                    </div>

                    <div class="filter-group">
                        <label for="max-score">Maximum Score</label>
                        <input type="range" id="max-score" min="0" max="100" value="100"
                               aria-describedby="max-score-value">
                        <span id="max-score-value" class="range-value">100</span>
                    </div>

                    <!-- Language Filter -->
                    <div class="filter-group">
                        <label for="language-filter">Languages</label>
                        <select id="language-filter" multiple aria-describedby="language-help">
                            ${availableLanguages.map(lang =>
                                `<option value="${lang}">${lang}</option>`
                            ).join('')}
                        </select>
                        <div id="language-help" class="filter-help">
                            Hold Ctrl/Cmd to select multiple languages
                        </div>
                    </div>

                    <!-- Path Pattern Filter -->
                    <div class="filter-group">
                        <label for="path-pattern">Path Pattern</label>
                        <input type="text" id="path-pattern"
                               placeholder="e.g., src/, components/, utils/"
                               aria-describedby="path-help">
                        <div id="path-help" class="filter-help">
                            Filter by file path (partial match)
                        </div>
                    </div>

                    <!-- Sort Options -->
                    <div class="filter-group">
                        <label for="sort-by">Sort By</label>
                        <select id="sort-by" aria-describedby="sort-help">
                            <option value="score">Discovery Score</option>
                            <option value="path">File Path</option>
                            <option value="language">Language</option>
                        </select>
                        <div id="sort-help" class="filter-help">
                            Choose primary sort criteria
                        </div>
                    </div>

                    <div class="filter-group">
                        <label for="sort-order">Sort Order</label>
                        <select id="sort-order" aria-describedby="order-help">
                            <option value="desc">Highest First</option>
                            <option value="asc">Lowest First</option>
                        </select>
                        <div id="order-help" class="filter-help">
                            Sort direction
                        </div>
                    </div>
                </div>

                <!-- Filter Stats -->
                <div class="filter-stats" aria-live="polite">
                    <div class="stats-summary">
                        <span class="stats-count">0 results</span>
                        <span class="stats-details"></span>
                    </div>
                </div>
            </div>
        `;

        parentContainer.appendChild(this.filtersContainer);

        // Set up event listeners
        this.setupEventListeners(onFiltersChange);
        this.setupAccessibility();

        return this.filtersContainer;
    }

    setupEventListeners(onFiltersChange) {
        // Toggle filters visibility
        const toggleBtn = this.filtersContainer.querySelector('.filters-toggle');
        const content = this.filtersContainer.querySelector('.filters-content');
        const clearBtn = this.filtersContainer.querySelector('.filters-clear');

        toggleBtn.addEventListener('click', () => {
            this.toggleFilters();
        });

        // Clear all filters
        clearBtn.addEventListener('click', () => {
            this.clearFilters();
            onFiltersChange(this.currentFilters);
        });

        // Range inputs
        const minScoreInput = this.filtersContainer.querySelector('#min-score');
        const maxScoreInput = this.filtersContainer.querySelector('#max-score');
        const minScoreValue = this.filtersContainer.querySelector('#min-score-value');
        const maxScoreValue = this.filtersContainer.querySelector('#max-score-value');

        [minScoreInput, maxScoreInput].forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                const display = index === 0 ? minScoreValue : maxScoreValue;
                display.textContent = value;

                this.currentFilters[index === 0 ? 'minScore' : 'maxScore'] = value ? parseInt(value) : '';
                onFiltersChange(this.currentFilters);
            });
        });

        // Language filter
        const languageSelect = this.filtersContainer.querySelector('#language-filter');
        languageSelect.addEventListener('change', (e) => {
            this.currentFilters.languages = Array.from(e.target.selectedOptions).map(opt => opt.value);
            onFiltersChange(this.currentFilters);
        });

        // Path pattern filter
        const pathInput = this.filtersContainer.querySelector('#path-pattern');
        pathInput.addEventListener('input', (e) => {
            this.currentFilters.pathPattern = e.target.value;
            onFiltersChange(this.currentFilters);
        });

        // Sort options
        const sortBySelect = this.filtersContainer.querySelector('#sort-by');
        const sortOrderSelect = this.filtersContainer.querySelector('#sort-order');

        sortBySelect.addEventListener('change', (e) => {
            this.currentFilters.sortBy = e.target.value;
            onFiltersChange(this.currentFilters);
        });

        sortOrderSelect.addEventListener('change', (e) => {
            this.currentFilters.sortOrder = e.target.value;
            onFiltersChange(this.currentFilters);
        });
    }

    setupAccessibility() {
        // Enhanced keyboard navigation
        const toggleBtn = this.filtersContainer.querySelector('.filters-toggle');
        const content = this.filtersContainer.querySelector('.filters-content');

        toggleBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleFilters();
            }
        });

        // Focus management when toggling
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
                    const isHidden = content.getAttribute('aria-hidden') === 'true';
                    if (!isHidden) {
                        // Focus first focusable element when opening
                        const firstInput = content.querySelector('input, select, button');
                        if (firstInput) {
                            setTimeout(() => firstInput.focus(), 100);
                        }
                    }
                }
            });
        });

        observer.observe(content, { attributes: true });
    }

    toggleFilters() {
        const toggleBtn = this.filtersContainer.querySelector('.filters-toggle');
        const content = this.filtersContainer.querySelector('.filters-content');

        this.isVisible = !this.isVisible;

        if (this.isVisible) {
            this.filtersContainer.classList.remove('hidden');
            this.filtersContainer.style.display = 'block';
            content.setAttribute('aria-hidden', 'false');
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.querySelector('.filters-icon').textContent = '🔽';
        } else {
            this.filtersContainer.classList.add('hidden');
            this.filtersContainer.style.display = 'none';
            content.setAttribute('aria-hidden', 'true');
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.querySelector('.filters-icon').textContent = '🔍';
        }
    }

    clearFilters() {
        // Reset form elements
        this.filtersContainer.querySelector('#min-score').value = '0';
        this.filtersContainer.querySelector('#max-score').value = '100';
        this.filtersContainer.querySelector('#min-score-value').textContent = '0';
        this.filtersContainer.querySelector('#max-score-value').textContent = '100';
        this.filtersContainer.querySelector('#path-pattern').value = '';
        this.filtersContainer.querySelector('#sort-by').value = 'score';
        this.filtersContainer.querySelector('#sort-order').value = 'desc';

        // Clear multi-select
        const languageSelect = this.filtersContainer.querySelector('#language-filter');
        Array.from(languageSelect.options).forEach(option => {
            option.selected = false;
        });

        // Reset current filters
        this.currentFilters = {
            minScore: '',
            maxScore: '',
            languages: [],
            pathPattern: '',
            sortBy: 'score',
            sortOrder: 'desc'
        };
    }

    applyFilterState(filterState = {}) {
        this.currentFilters = {
            ...this.currentFilters,
            ...filterState,
            languages: Array.isArray(filterState.languages) ? [...filterState.languages] : []
        };

        const minScoreInput = this.filtersContainer.querySelector('#min-score');
        const maxScoreInput = this.filtersContainer.querySelector('#max-score');
        const minScoreValue = this.filtersContainer.querySelector('#min-score-value');
        const maxScoreValue = this.filtersContainer.querySelector('#max-score-value');
        const pathInput = this.filtersContainer.querySelector('#path-pattern');
        const sortBySelect = this.filtersContainer.querySelector('#sort-by');
        const sortOrderSelect = this.filtersContainer.querySelector('#sort-order');
        const languageSelect = this.filtersContainer.querySelector('#language-filter');

        if (minScoreInput && minScoreValue) {
            const value = this.currentFilters.minScore === '' ? 0 : Number(this.currentFilters.minScore);
            minScoreInput.value = String(value);
            minScoreValue.textContent = String(value);
        }

        if (maxScoreInput && maxScoreValue) {
            const value = this.currentFilters.maxScore === '' ? 100 : Number(this.currentFilters.maxScore);
            maxScoreInput.value = String(value);
            maxScoreValue.textContent = String(value);
        }

        if (pathInput) {
            pathInput.value = this.currentFilters.pathPattern || '';
        }

        if (sortBySelect) {
            sortBySelect.value = this.currentFilters.sortBy || 'score';
        }

        if (sortOrderSelect) {
            sortOrderSelect.value = this.currentFilters.sortOrder || 'desc';
        }

        if (languageSelect) {
            const selection = new Set(this.currentFilters.languages || []);
            Array.from(languageSelect.options).forEach(option => {
                option.selected = selection.has(option.value);
            });
        }

        if (filterState.isVisible && !this.isVisible) {
            this.toggleFilters();
        }
    }

    filterAndSort(results, filters = this.currentFilters) {
        if (!Array.isArray(results)) {
            return [];
        }

        const workingFilters = {
            ...this.currentFilters,
            ...filters
        };

        let filtered = results.slice();

        const hasMin = workingFilters.minScore !== '' && workingFilters.minScore !== undefined;
        const hasMax = workingFilters.maxScore !== '' && workingFilters.maxScore !== undefined;

        if (hasMin) {
            filtered = filtered.filter(result => typeof result.score === 'number' && result.score >= Number(workingFilters.minScore));
        }

        if (hasMax) {
            filtered = filtered.filter(result => typeof result.score === 'number' && result.score <= Number(workingFilters.maxScore));
        }

        if (Array.isArray(workingFilters.languages) && workingFilters.languages.length > 0) {
            const languagesSet = new Set(workingFilters.languages);
            filtered = filtered.filter(result => !result.language || languagesSet.has(result.language));
        }

        if (workingFilters.pathPattern) {
            const pattern = workingFilters.pathPattern.toLowerCase();
            filtered = filtered.filter(result => {
                const candidatePath = (result.path || result.relativePath || '').toLowerCase();
                return candidatePath.includes(pattern);
            });
        }

        const sortBy = workingFilters.sortBy || 'score';
        const sortOrder = workingFilters.sortOrder === 'asc' ? 'asc' : 'desc';

        filtered.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'score') {
                const scoreA = typeof a.score === 'number' ? a.score : -Infinity;
                const scoreB = typeof b.score === 'number' ? b.score : -Infinity;
                comparison = scoreA - scoreB;
            } else if (sortBy === 'path') {
                comparison = (a.path || a.relativePath || '').localeCompare(b.path || b.relativePath || '');
            } else if (sortBy === 'language') {
                comparison = (a.language || '').localeCompare(b.language || '');
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }

    updateStats(results, filteredResults) {
        const statsContainer = this.filtersContainer.querySelector('.filter-stats');
        const countSpan = statsContainer.querySelector('.stats-count');
        const detailsSpan = statsContainer.querySelector('.stats-details');

        if (results.length === 0) {
            countSpan.textContent = 'No results';
            detailsSpan.textContent = '';
            return;
        }

        const total = results.length;
        const filtered = filteredResults.length;
        const percentage = total > 0 ? Math.round((filtered / total) * 100) : 0;

        countSpan.textContent = `${filtered} of ${total} results (${percentage}%)`;

        // Show language breakdown if filtering by language
        if (this.currentFilters.languages.length > 0) {
            const languageBreakdown = results.reduce((acc, result) => {
                const lang = result.language || 'unknown';
                acc[lang] = (acc[lang] || 0) + 1;
                return acc;
            }, {});

            const breakdownText = Object.entries(languageBreakdown)
                .map(([lang, count]) => `${lang}: ${count}`)
                .join(', ');

            detailsSpan.textContent = breakdownText;
        } else {
            detailsSpan.textContent = '';
        }
    }

    getCurrentFilters() {
        return {
            ...this.currentFilters,
            languages: [...this.currentFilters.languages]
        };
    }

    setAvailableLanguages(languages) {
        const languageSelect = this.filtersContainer.querySelector('#language-filter');
        if (!languageSelect) {
            return;
        }

        const selected = new Set(this.currentFilters.languages);

        languageSelect.innerHTML = languages.map(lang =>
            `<option value="${lang}">${lang}</option>`
        ).join('');

        Array.from(languageSelect.options).forEach(option => {
            option.selected = selected.has(option.value);
        });
    }
}
