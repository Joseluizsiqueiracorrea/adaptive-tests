#!/usr/bin/env node
/**
 * Main migration function
 */
export function runMigrate(args?: any[]): Promise<void>;
/**
 * Analyze a test file to extract import information and test structure
 */
export function analyzeTestFile(filePath: any): {
    imports: never[];
    requires: never[];
    describes: never[];
    tests: never[];
    className: null;
    methods: Set<any>;
    isESModule: boolean;
    framework: string;
} | null;
/**
 * Generate adaptive test from analysis
 */
export function generateAdaptiveTest(analysis: any, originalPath: any): string;
