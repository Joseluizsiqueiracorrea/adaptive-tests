export interface InvisibleOptions {
  escapePatterns?: string[];
  searchDirs?: string[];
  extensions?: string[];
}

export declare function setupForJest(options?: InvisibleOptions): void;
export declare function teardownForJest(): void;
