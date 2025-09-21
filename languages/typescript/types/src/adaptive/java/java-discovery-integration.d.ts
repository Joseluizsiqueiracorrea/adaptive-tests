export class JavaDiscoveryIntegration extends BaseLanguageIntegration {
    constructor(discoveryEngine: any);
    collector: JavaDiscoveryCollector;
    /**
     * Get the file extension for Java files
     */
    getFileExtension(): string;
    /**
     * Evaluate a Java file as a candidate (legacy method)
     * @deprecated Use evaluateCandidateAsync for consistent async patterns
     */
    evaluateJavaCandidate(filePath: any, signature?: {}): Promise<any>;
    calculateJavaScore(metadata: any, signature?: {}): {
        score: number;
        match: null;
    } | null;
    normalizeTypeName(value: any): any;
    generateJUnitTest({ target, signature, options }: {
        target: any;
        signature?: {} | undefined;
        options?: {} | undefined;
    }): string;
    buildSubjectReference(target: any, options: any): {
        typeName: any;
        setup: string;
        invocation: string;
    } | {
        typeName: any;
        setup: null;
        invocation: string;
    };
    buildMethodBlocks(target: any, signature: any, subjectReference: any, imports: any): any;
    buildMethodInvocation(target: any, method: any, subjectReference: any, args: any): string[];
    inferAssertions(method: any, imports: any): string[];
    placeholderForType(type: any): "0" | "0.0" | "false" | "null" | "\"TODO\"";
}
import { BaseLanguageIntegration } from "../base-language-integration";
import { JavaDiscoveryCollector } from "./java-discovery-collector";
