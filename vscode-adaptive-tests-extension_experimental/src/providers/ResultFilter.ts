import { DiscoveryResult } from '../types/api';

export interface FilterOptions {
    minScore?: number;
    maxScore?: number;
    languages?: string[];
    hasTests?: boolean;
    pathPattern?: string;
    sortBy?: 'score' | 'path' | 'language';
    sortOrder?: 'asc' | 'desc';
}

export class ResultFilter {
    static filterAndSort(results: DiscoveryResult[], options: FilterOptions): DiscoveryResult[] {
        let filtered = [...results];

        // Apply filters
        if (options.minScore !== undefined) {
            filtered = filtered.filter(r => r.score >= options.minScore!);
        }

        if (options.maxScore !== undefined) {
            filtered = filtered.filter(r => r.score <= options.maxScore!);
        }

        if (options.languages && options.languages.length > 0) {
            filtered = filtered.filter(r => r.language && options.languages!.includes(r.language));
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

    static getFilterStats(results: DiscoveryResult[]) {
        const stats = {
            total: results.length,
            byLanguage: {} as Record<string, number>,
            scoreRange: { min: 0, max: 0, avg: 0 },
            hasTests: 0
        };

        if (results.length === 0) return stats;

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