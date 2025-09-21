#!/usr/bin/env node
/**
 * Convert traditional tests to adaptive with rollback
 */
export function convertTests(testDir: any, options?: {}): Promise<{
    success: boolean;
    message: string;
    conversions?: undefined;
    backupDir?: undefined;
    files?: undefined;
} | {
    success: boolean;
    conversions: number;
    backupDir: string | null;
    files: {
        filePath: any;
        changed: boolean;
        changes: any[];
        strategy: any;
        backupPath: string | null;
    }[];
    message?: undefined;
}>;
/**
 * Convert a single test file
 */
export function convertSingleTest(filePath: any, options: any): Promise<{
    filePath: any;
    changed: boolean;
    changes: any[];
    strategy: any;
    backupPath: string | null;
}>;
