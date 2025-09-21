export class RustDiscoveryCollector {
    constructor(config?: {});
    config: {
        extensions: string[];
        skipPatterns: string[];
    };
    parser: import("@lezer/lr").LRParser;
    initialized: boolean;
    errorHandler: ErrorHandler;
    initialize(): Promise<void>;
    shouldScanFile(filePath: any): boolean;
    parseFile(filePath: any): Promise<any>;
    extractMetadata(source: any, filePath: any): {
        path: any;
        crateName: null;
        uses: never[];
        structs: never[];
        enums: never[];
        traits: never[];
        impls: never[];
        functions: never[];
        constants: never[];
        statics: never[];
        types: never[];
        macros: never[];
        errors: never[];
    };
    traverseTree(tree: any, source: any, metadata: any): void;
    traverseNode(node: any, source: any, metadata: any): void;
    isInsideTraitOrImpl(node: any): boolean;
    extractUse(node: any, source: any, metadata: any): void;
    extractStruct(node: any, source: any, metadata: any): void;
    extractStructField(node: any, source: any): {
        name: any;
        type: any;
        visibility: string;
        exported: boolean;
    } | null;
    extractEnum(node: any, source: any, metadata: any): void;
    extractEnumVariant(node: any, source: any): {
        name: any;
        fields: never[];
    } | null;
    extractTrait(node: any, source: any, metadata: any): void;
    extractTraitMethod(node: any, source: any): {
        name: any;
        parameters: never[];
        returnType: string;
        isDefault: boolean;
    } | null;
    extractImpl(node: any, source: any, metadata: any): void;
    extractImplMethod(node: any, source: any): {
        name: any;
        parameters: never[];
        returnType: string;
        visibility: string;
        exported: boolean;
    } | null;
    extractFunction(node: any, source: any, metadata: any): void;
    extractConstant(node: any, source: any, metadata: any): void;
    extractStatic(node: any, source: any, metadata: any): void;
    extractTypeAlias(node: any, source: any, metadata: any): void;
    extractMacro(node: any, source: any, metadata: any): void;
    findChildByType(node: any, typeName: any): any;
    getNodeText(node: any, source: any): any;
    extractVisibility(node: any, source: any): "public" | "crate" | "private" | "super";
    isPublic(node: any): boolean;
    extractAttributes(node: any, source: any): any[];
    extractGenerics(node: any, source: any): {
        name: any;
        bounds: never[];
    }[];
    extractTraitBounds(node: any, source: any): any[];
    extractParameters(node: any, source: any): {
        name: any;
        type: any;
    }[];
    extractParameter(node: any, source: any): {
        name: any;
        type: any;
    } | null;
    isExported(name: any): boolean;
    containsGenerics(typeStr: any): any;
}
import { ErrorHandler } from "../error-handler";
