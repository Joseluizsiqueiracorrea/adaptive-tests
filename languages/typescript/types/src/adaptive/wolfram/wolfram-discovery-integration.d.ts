export class WolframDiscoveryIntegration extends BaseLanguageIntegration {
    constructor(discoveryEngine: any);
    collector: WolframDiscoveryCollector;
    contextCache: Map<any, any>;
    getFileExtension(): string;
    getSupportedExtensions(): string[];
    parseFile(filePath: any): Promise<any>;
    extractCandidates(metadata: any): any;
    extractCandidatesImpl(metadata: any): any[];
    scoreCandidate(candidate: any, signature: any): number;
    scorePackageMatching(candidate: any, signature: any): 0 | 20 | 10 | 5 | -5;
    scoreLanguageSpecific(candidate: any, signature: any): number;
    scorePatternMatching(candidate: any, signature: any): number;
    scoreParameterPatterns(candidateParams: any, signatureParams: any): number;
    areCompatiblePatterns(pattern1: any, pattern2: any): boolean;
    patternsMatch(condition1: any, condition2: any): any;
    generateTestContent(target: any, options?: {}): string;
    generateVerificationTest(target: any, options?: {}): string;
    generatePackageTest(pkg: any): string;
    generateFunctionTest(func: any): string;
    generateSymbolTest(symbol: any): string;
    generatePatternTest(pattern: any): string;
    generateGenericTest(target: any): string;
    updateContextCache(metadata: any): void;
    resolveSymbol(symbolName: any, currentContext: any): any;
    discoverRelatedSymbols(target: any, maxDepth?: number): Promise<any[]>;
}
import { BaseLanguageIntegration } from "../base-language-integration";
import { WolframDiscoveryCollector } from "./wolfram-discovery-collector";
