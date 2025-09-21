export class GoDiscoveryCollector {
    constructor(config?: {});
    config: {
        extensions: string[];
        skipPatterns: string[];
    };
    initialized: boolean;
    parser: any;
    ensureParser(): void;
    shouldScanFile(filePath: any): boolean;
    parseFile(filePath: any): Promise<{
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
    } | null>;
    buildMetadata(rootNode: any, source: any, filePath: any): {
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
    collectImports(node: any, source: any, imports: any): void;
    collectTypes(node: any, source: any, metadata: any, structMap: any): void;
    parseStruct(name: any, typeParameters: any, typeNode: any, source: any): {
        name: any;
        type: string;
        exported: boolean;
        fields: any[];
        embeds: {
            type: any;
            isPointer: any;
            isGeneric: boolean;
            raw: any;
        }[];
        methods: never[];
        typeParameters: any;
    };
    parseInterface(name: any, typeParameters: any, typeNode: any, source: any): {
        name: any;
        type: string;
        exported: boolean;
        methods: {
            name: any;
            parameters: {
                name: null;
                type: any;
            }[];
            returnType: any;
            exported: boolean;
            isGeneric: boolean;
        }[];
        embeds: {
            type: any;
            isPointer: boolean;
            isGeneric: boolean;
        }[];
        typeParameters: any;
    };
    parseFunction(node: any, source: any): {
        name: any;
        type: string;
        parameters: {
            name: null;
            type: any;
        }[];
        returnType: any;
        exported: boolean;
        isGeneric: boolean;
        typeParameters: any[];
    };
    parseMethod(node: any, source: any): {
        name: any;
        parameters: {
            name: null;
            type: any;
        }[];
        returnType: any;
        exported: boolean;
        isGeneric: boolean;
        typeParameters: any[];
        receiver: {
            name: null;
            type: any;
            typeName: any;
            isPointer: any;
        } | null;
    };
    collectConstants(node: any, source: any, constants: any): void;
    collectVariables(node: any, source: any, variables: any): void;
    parseFieldDeclaration(node: any, source: any): {
        declarations: any[];
        embeds: {
            type: any;
            isPointer: any;
            isGeneric: boolean;
            raw: any;
        }[];
    };
    parseParameters(listNode: any, source: any): {
        name: null;
        type: any;
    }[];
    parseReturnType(resultNode: any, source: any): any;
    parseTypeParameters(node: any, source: any): any[];
    describeType(node: any, source: any): any;
    extractDeclarationLines(node: any, source: any): any[];
    getNodeText(node: any, source: any): any;
    stripQuotes(value: any): any;
    isExported(name: any): boolean;
    containsGenerics(typeStr: any): boolean;
}
