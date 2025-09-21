export class RustDiscoveryIntegration extends BaseLanguageIntegration {
    constructor(discoveryEngine: any);
    collector: RustDiscoveryCollector;
    /**
     * Get the file extension for Rust files
     */
    getFileExtension(): string;
    /**
     * Parse a Rust file and extract metadata
     */
    parseFile(filePath: any): Promise<any>;
    /**
     * Extract candidates from Rust metadata
     */
    extractCandidates(metadata: any): any[];
    /**
     * Evaluate a Rust file as a candidate
     */
    evaluateRustCandidate(filePath: any, signature?: {}): Promise<{
        path: any;
        score: number;
        metadata: never;
        match: null;
        language: any;
    } | null>;
    /**
     * Calculate score for Rust candidate
     */
    calculateRustScore(metadata: any, signature?: {}): {
        score: number;
        match: null;
    } | null;
    /**
     * Resolve a Rust target from a candidate
     */
    resolveRustTarget(candidate: any, signature: any): Promise<{
        language: string;
        path: any;
        crateName: any;
        name: any;
        type: any;
        metadata: any;
        fullName: any;
    } | null>;
    /**
     * Get fully qualified name
     */
    getFullyQualifiedName(crateName: any, name: any): any;
    /**
     * Generate Rust test from discovered target
     */
    generateRustTest(target: any, options?: {}): string;
    generateStructTests(target: any, options: any): string;
    generateEnumTests(target: any, options: any): string;
    generateTraitTests(target: any, options: any): string;
    generateFunctionTests(target: any, options: any): string;
    generateGenericTests(target: any, options: any): string;
    generateMethodParams(method: any): any;
    getDefaultValue(type: any): "true" | "\"test\"" | "0" | "0.0" | "/* TODO */" | "Vec::new()" | "HashMap::new()" | "None" | "Ok(())" | "/* TODO: reference */";
    /**
     * Generate test content for a target (required by base class)
     */
    generateTestContent(target: any, options?: {}): string;
}
import { BaseLanguageIntegration } from "../base-language-integration";
import { RustDiscoveryCollector } from "./rust-discovery-collector";
