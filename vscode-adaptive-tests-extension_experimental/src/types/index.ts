// Type definitions for Adaptive Tests VS Code Extension

import type { DiscoverySignature } from './api';

export interface DiscoveryCandidate {
    path: string;
    absolutePath?: string;
    relativePath?: string;
    score: number;
    reason?: string;
    language?: string;
    nameMatch?: number;
    pathBonus?: number;
    methodMatches?: number;
    typeMatch?: number;
    metadata?: Record<string, unknown>;
}

export interface DiscoveryOptions {
    root: string;
    outputDir: string;
    force: boolean;
    isTypeScript: boolean;
    applyAssertions: boolean;
}

export interface ScaffoldResults {
    created: string[];
    skippedExisting: string[];
    skippedNoExport: string[];
    errors: Error[];
}

export interface InvisibleHistoryEntry {
    timestamp?: string;
    suggestion?: string;
    modulePath?: string;
}

export interface ExtensionConfig {
    discovery: {
        showScores: boolean;
        maxResults: number;
    };
    scaffold: {
        outputDirectory: string;
        autoOpen: boolean;
    };
}

export interface AdaptiveTestsAPI {
    DiscoveryEngine: new (root: string) => DiscoveryEngine;
    processSingleFile: (
        engine: DiscoveryEngine,
        filePath: string,
        options: DiscoveryOptions,
        results: ScaffoldResults
    ) => Promise<void>;
    getDiscoveryEngine: (root: string) => DiscoveryEngine;
}

// Re-export from api.ts first to make DiscoverySignature available
export type { DiscoverySignature, DiscoveryResult, DiscoveryState, ScoreBreakdown } from './api';

export interface DiscoveryEngine {
    collectCandidates(
        workspaceRoot: string,
        signature: DiscoverySignature
    ): Promise<DiscoveryCandidate[]>;
}