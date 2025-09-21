export class GoDiscoveryIntegration extends BaseLanguageIntegration {
    constructor(discoveryEngine: any);
    collector: GoDiscoveryCollector;
    /**
     * Get the file extension for Go files
     */
    getFileExtension(): string;
    /**
     * Evaluate a Go file as a candidate
     */
    evaluateGoCandidate(filePath: any, signature?: {}): Promise<{
        path: any;
        score: number;
        metadata: {
            path: any;
            packageName: null;
            imports: never[];
            structs: never[];
            interfaces: never[];
            functions: never[];
            methods: never[];
            types: never[];
            constants: never[];
            variables: never[];
            errors: never[];
        };
        match: null;
        language: string;
    } | null>;
    /**
     * Calculate score for Go candidate
     */
    calculateGoScore(metadata: any, signature?: {}): {
        score: number;
        match: null;
    } | null;
    /**
     * Resolve a Go target from a candidate
     */
    resolveGoTarget(candidate: any, signature: any): Promise<{
        language: string;
        path: any;
        packageName: any;
        name: any;
        type: any;
        metadata: any;
        fullName: any;
    } | null>;
    /**
     * Get fully qualified name
     */
    getFullyQualifiedName(packageName: any, name: any): any;
    /**
     * Generate Go test from discovered target
     */
    generateGoTest(target: any, options?: {}): string;
    generateStructTests(target: any, options: any): string;
    generateInterfaceTests(target: any, options: any): string;
    generateFunctionTests(target: any, options: any): string;
    generateGenericTests(target: any, options: any): string;
    generateMethodParams(method: any): any;
    getDefaultValue(type: any): "nil" | "\"test\"" | "0" | "0.0" | "false";
}
import { BaseLanguageIntegration } from "../base-language-integration";
import { GoDiscoveryCollector } from "./go-discovery-collector";
