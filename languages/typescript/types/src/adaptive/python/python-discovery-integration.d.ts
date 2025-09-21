export class PythonDiscoveryIntegration extends BaseLanguageIntegration {
    constructor(discoveryEngine: any);
    collector: PythonDiscoveryCollector;
    getFileExtension(): string;
    parseFile(filePath: any): Promise<{
        success: boolean;
        error: string;
        message: any;
    } | {
        path: string;
        classes: any;
        functions: any;
    } | null>;
    extractCandidates(metadata: any): any[];
    scorePackageMatching(candidate: any, signature: any, metadata: any): 0 | 8 | 5 | -3 | -6 | 16;
    scoreLanguageSpecific(candidate: any, signature: any): number;
    getCandidateMethods(candidate: any): Set<any>;
    generateTestContent(target: any, options?: {}): string;
    generatePytestTest({ signature, moduleName, targetKind, depth }: {
        signature: any;
        moduleName: any;
        targetKind: any;
        depth: any;
    }): string;
    buildExports(metadata: any): any[];
    computeModuleName(filePath: any): string;
    slugify(value: any): any;
}
export class PythonDiscoveryCollector {
    pythonEnv: {
        PYTHONPATH: string;
        TZ?: string;
    };
    errorHandler: ErrorHandler;
    shouldScanFile(filePath: any): boolean;
    runPythonBridge(filePath: any): {
        executable: string;
        result: childProcess.SpawnSyncReturns<Buffer<ArrayBufferLike>> & childProcess.SpawnSyncReturns<string> & childProcess.SpawnSyncReturns<string | Buffer<ArrayBufferLike>>;
    };
    parseFile(filePath: any): Promise<{
        success: boolean;
        error: string;
        message: any;
    } | {
        path: string;
        classes: any;
        functions: any;
    } | null>;
}
import { BaseLanguageIntegration } from "../base-language-integration";
import { ErrorHandler } from "../error-handler";
import childProcess = require("child_process");
