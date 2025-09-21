export class ScoringEngine {
    constructor(config?: {});
    config: any;
    pathScorers: any[];
    customScorers: any[];
    regexCache: Map<any, any>;
    methodRegexCache: Map<any, any>;
    /**
     * Compile scoring functions for better performance
     */
    compileScorers(): void;
    /**
     * Calculate total score for a candidate
     */
    calculateScore(candidate: any, signature: any, content?: null): number;
    calculateScoreDetailed(candidate: any, signature: any, content?: null): {
        totalScore: number;
        breakdown: {};
        details: never[] | null;
    };
    computeScore(candidate: any, signature: any, content: any, collectDetails?: boolean): {
        totalScore: number;
        breakdown: {};
        details: never[] | null;
    };
    /**
     * Score based on file path
     */
    scorePath(filePath: any, detailCollector?: null): number;
    /**
     * Score based on file extension
     */
    scoreExtension(filePath: any): any;
    /**
     * Score based on file name match
     */
    scoreFileName(fileName: any, signature: any): any;
    /**
     * Score based on type hints in content
     */
    scoreTypeHints(content: any, signature: any): any;
    /**
     * Score based on method mentions in content
     */
    scoreMethodMentions(content: any, methods: any): number;
    /**
     * Score based on export hints
     */
    scoreExportHints(content: any, signature: any): any;
    /**
     * Score based on name mentions
     */
    scoreNameMentions(content: any, signature: any): number;
    /**
     * Apply custom scoring functions
     */
    scoreCustom(candidate: any, signature: any, content: any, detailCollector?: null): number;
    /**
     * Score target name match (after module is loaded)
     */
    scoreTargetName(targetName: any, signature: any): any;
    /**
     * Score method validation (after module is loaded)
     */
    scoreMethodValidation(target: any, methods: any): any;
    /**
     * Escape special regex characters
     */
    escapeRegExp(str: any): string;
    /**
     * Get a cached regex for method matching
     */
    getMethodRegex(method: any): any;
    /**
     * Get a cached regex for any pattern
     */
    getCachedRegex(pattern: any, flags?: string): any;
    /**
     * Update configuration
     */
    updateConfig(config: any): void;
}
