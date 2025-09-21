export function createTsconfigResolver(rootPath: any): {
    configPath: string;
    absoluteBaseUrl: string;
    paths: {
        [key: string]: string[];
    };
    matchPath: import("tsconfig-paths").MatchPath;
    aliasEntries: {
        aliasPattern: any;
        aliasPrefix: any;
        aliasHasWildcard: any;
        targetPattern: any;
        targetPrefix: string;
        targetHasWildcard: any;
    }[];
    resolveWithMatch: (specifier: any) => string | null;
    getAliasesForFile: (filePath: any) => any[];
    getBaseUrlRelativeImport: (filePath: any) => any;
} | null;
