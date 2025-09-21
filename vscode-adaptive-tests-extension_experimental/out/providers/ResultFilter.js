"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultFilter = void 0;
class ResultFilter {
    static filterAndSort(results, options) {
        let filtered = [...results];
        // Apply filters
        if (options.minScore !== undefined) {
            filtered = filtered.filter(r => r.score >= options.minScore);
        }
        if (options.maxScore !== undefined) {
            filtered = filtered.filter(r => r.score <= options.maxScore);
        }
        if (options.languages && options.languages.length > 0) {
            filtered = filtered.filter(r => r.language && options.languages.includes(r.language));
        }
        if (options.pathPattern) {
            const pattern = options.pathPattern.toLowerCase();
            filtered = filtered.filter(r => r.path.toLowerCase().includes(pattern));
        }
        // Apply sorting
        filtered.sort((a, b) => {
            let comparison = 0;
            switch (options.sortBy) {
                case 'score':
                    comparison = b.score - a.score; // Higher scores first by default
                    break;
                case 'path':
                    comparison = a.path.localeCompare(b.path);
                    break;
                case 'language':
                    comparison = (a.language || '').localeCompare(b.language || '');
                    break;
                default:
                    comparison = b.score - a.score;
            }
            return options.sortOrder === 'asc' ? -comparison : comparison;
        });
        return filtered;
    }
    static getFilterStats(results) {
        const stats = {
            total: results.length,
            byLanguage: {},
            scoreRange: { min: 0, max: 0, avg: 0 },
            hasTests: 0
        };
        if (results.length === 0)
            return stats;
        // Language distribution
        results.forEach(result => {
            const lang = result.language || 'unknown';
            stats.byLanguage[lang] = (stats.byLanguage[lang] || 0) + 1;
        });
        // Score statistics
        const scores = results.map(r => r.score);
        stats.scoreRange.min = Math.min(...scores);
        stats.scoreRange.max = Math.max(...scores);
        stats.scoreRange.avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return stats;
    }
}
exports.ResultFilter = ResultFilter;
//# sourceMappingURL=ResultFilter.js.map