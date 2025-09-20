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
        this.filtersContainer.className = 'filters-section';
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
            this.filtersContainer.style.display = 'block';
            content.setAttribute('aria-hidden', 'false');
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.querySelector('.filters-icon').textContent = '🔽';
        } else {
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
        return { ...this.currentFilters };
    }

    setAvailableLanguages(languages) {
        const languageSelect = this.filtersContainer.querySelector('#language-filter');
        if (languageSelect) {
            languageSelect.innerHTML = languages.map(lang =>
                `<option value="${lang}">${lang}</option>`
            ).join('');
        }
    }
}