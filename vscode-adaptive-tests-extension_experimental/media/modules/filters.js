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

        // Build filter UI structure using DOM methods
        this.buildFilterStructure(availableLanguages);

        parentContainer.appendChild(this.filtersContainer);

        // Set up event listeners
        this.setupEventListeners(onFiltersChange);
        this.setupAccessibility();

        return this.filtersContainer;
    }

    /**
     * Build filter structure using DOM methods to avoid innerHTML
     */
    buildFilterStructure(availableLanguages) {
        // Clear container
        while (this.filtersContainer.firstChild) {
            this.filtersContainer.removeChild(this.filtersContainer.firstChild);
        }

        // Create header
        const header = document.createElement('div');
        header.className = 'filters-header';

        const heading = document.createElement('h3');
        heading.id = 'filters-heading';
        heading.className = 'filters-title';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'filters-toggle';
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.setAttribute('aria-controls', 'filters-content');

        const icon = document.createElement('span');
        icon.className = 'filters-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '🔍';

        const toggleText = document.createTextNode(' Advanced Filters');

        toggleBtn.appendChild(icon);
        toggleBtn.appendChild(toggleText);
        heading.appendChild(toggleBtn);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'filters-clear';
        clearBtn.setAttribute('aria-label', 'Clear all filters');
        clearBtn.textContent = 'Clear All';

        header.appendChild(heading);
        header.appendChild(clearBtn);

        // Create content container
        const content = document.createElement('div');
        content.id = 'filters-content';
        content.className = 'filters-content';
        content.setAttribute('aria-hidden', 'true');

        // Create filters grid
        const grid = document.createElement('div');
        grid.className = 'filters-grid';

        // Add score range filters
        grid.appendChild(this.createRangeFilter('min-score', 'Minimum Score', 0, 100, 0));
        grid.appendChild(this.createRangeFilter('max-score', 'Maximum Score', 0, 100, 100));

        // Add language filter
        grid.appendChild(this.createLanguageFilter(availableLanguages));

        // Add path pattern filter
        grid.appendChild(this.createTextFilter(
            'path-pattern',
            'Path Pattern',
            'e.g., src/, components/, utils/',
            'Filter by file path (partial match)'
        ));

        // Add sort options
        grid.appendChild(this.createSortByFilter());
        grid.appendChild(this.createSortOrderFilter());

        content.appendChild(grid);

        // Create filter stats
        const stats = document.createElement('div');
        stats.className = 'filter-stats';
        stats.setAttribute('aria-live', 'polite');

        const statsSummary = document.createElement('div');
        statsSummary.className = 'stats-summary';

        const statsCount = document.createElement('span');
        statsCount.className = 'stats-count';
        statsCount.textContent = '0 results';

        const statsDetails = document.createElement('span');
        statsDetails.className = 'stats-details';

        statsSummary.appendChild(statsCount);
        statsSummary.appendChild(statsDetails);
        stats.appendChild(statsSummary);
        content.appendChild(stats);

        // Append to container
        this.filtersContainer.appendChild(header);
        this.filtersContainer.appendChild(content);
    }

    /**
     * Create a range filter element
     */
    createRangeFilter(id, label, min, max, value) {
        const group = document.createElement('div');
        group.className = 'filter-group';

        const labelEl = document.createElement('label');
        labelEl.setAttribute('for', id);
        labelEl.textContent = label;

        const input = document.createElement('input');
        input.type = 'range';
        input.id = id;
        input.min = min;
        input.max = max;
        input.value = value;
        input.setAttribute('aria-describedby', id + '-value');

        const valueSpan = document.createElement('span');
        valueSpan.id = id + '-value';
        valueSpan.className = 'range-value';
        valueSpan.textContent = String(value);

        group.appendChild(labelEl);
        group.appendChild(input);
        group.appendChild(valueSpan);

        return group;
    }

    /**
     * Create the language filter element
     */
    createLanguageFilter(languages) {
        const group = document.createElement('div');
        group.className = 'filter-group';

        const label = document.createElement('label');
        label.setAttribute('for', 'language-filter');
        label.textContent = 'Languages';

        const select = document.createElement('select');
        select.id = 'language-filter';
        select.multiple = true;
        select.setAttribute('aria-describedby', 'language-help');

        // Add options
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = lang;
            select.appendChild(option);
        });

        const help = document.createElement('div');
        help.id = 'language-help';
        help.className = 'filter-help';
        help.textContent = 'Hold Ctrl/Cmd to select multiple languages';

        group.appendChild(label);
        group.appendChild(select);
        group.appendChild(help);

        return group;
    }

    /**
     * Create a text input filter element
     */
    createTextFilter(id, label, placeholder, helpText) {
        const group = document.createElement('div');
        group.className = 'filter-group';

        const labelEl = document.createElement('label');
        labelEl.setAttribute('for', id);
        labelEl.textContent = label;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = id;
        input.placeholder = placeholder;
        input.setAttribute('aria-describedby', id + '-help');

        const help = document.createElement('div');
        help.id = id + '-help';
        help.className = 'filter-help';
        help.textContent = helpText;

        group.appendChild(labelEl);
        group.appendChild(input);
        group.appendChild(help);

        return group;
    }

    /**
     * Create the sort by filter element
     */
    createSortByFilter() {
        const group = document.createElement('div');
        group.className = 'filter-group';

        const label = document.createElement('label');
        label.setAttribute('for', 'sort-by');
        label.textContent = 'Sort By';

        const select = document.createElement('select');
        select.id = 'sort-by';
        select.setAttribute('aria-describedby', 'sort-help');

        const options = [
            { value: 'score', text: 'Discovery Score' },
            { value: 'path', text: 'File Path' },
            { value: 'language', text: 'Language' }
        ];

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            select.appendChild(option);
        });

        const help = document.createElement('div');
        help.id = 'sort-help';
        help.className = 'filter-help';
        help.textContent = 'Choose primary sort criteria';

        group.appendChild(label);
        group.appendChild(select);
        group.appendChild(help);

        return group;
    }

    /**
     * Create the sort order filter element
     */
    createSortOrderFilter() {
        const group = document.createElement('div');
        group.className = 'filter-group';

        const label = document.createElement('label');
        label.setAttribute('for', 'sort-order');
        label.textContent = 'Sort Order';

        const select = document.createElement('select');
        select.id = 'sort-order';
        select.setAttribute('aria-describedby', 'order-help');

        const options = [
            { value: 'desc', text: 'Highest First' },
            { value: 'asc', text: 'Lowest First' }
        ];

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            select.appendChild(option);
        });

        const help = document.createElement('div');
        help.id = 'order-help';
        help.className = 'filter-help';
        help.textContent = 'Sort direction';

        group.appendChild(label);
        group.appendChild(select);
        group.appendChild(help);

        return group;
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

        // Clear and rebuild options safely
        while (languageSelect.firstChild) {
            languageSelect.removeChild(languageSelect.firstChild);
        }

        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = lang;
            option.selected = selected.has(lang);
            languageSelect.appendChild(option);
        });
    }
}
