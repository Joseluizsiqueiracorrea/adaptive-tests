export class PhpDiscoveryIntegration extends BaseLanguageIntegration {
    constructor(discoveryEngine: any);
    collector: PHPDiscoveryCollector;
    getFileExtension(): string;
    parseFile(filePath: any): Promise<{
        path: any;
        namespace: null;
        imports: never[];
        classes: never[];
        interfaces: never[];
        traits: never[];
        functions: never[];
        constants: never[];
    } | null>;
    extractCandidates(metadata: any): any[];
    scorePackageMatching(candidate: any, signature: any, metadata: any): 0 | 8 | 18 | 5 | -3 | -6;
    scoreLanguageSpecific(candidate: any, signature: any): number;
    scoreClassSpecific(candidate: any, signature: any): number;
    scoreInterfaceSpecific(candidate: any, signature: any): number;
    scoreTraitSpecific(candidate: any, signature: any): number;
    generateTestContent(target: any, options?: {}): string;
    generatePHPTest(target: any): string;
    getFullyQualifiedName(namespace: any, name: any): any;
    normalizeNamespace(namespace: any): any;
    capitalize(value: any): any;
    buildExports(metadata: any): any[];
}
import { BaseLanguageIntegration } from "../base-language-integration";
import { PHPDiscoveryCollector } from "./php-discovery-collector";
