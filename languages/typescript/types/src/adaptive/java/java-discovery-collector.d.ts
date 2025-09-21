export class JavaDiscoveryCollector {
    constructor(config?: {});
    config: {
        extensions: string[];
        skipPatterns: string[];
    };
    shouldScanFile(filePath: any): boolean;
    parseFile(filePath: any): Promise<{
        path: any;
        packageName: null;
        imports: never[];
        classes: never[];
        interfaces: never[];
        enums: never[];
        records: never[];
        annotations: never[];
        errors: any[];
    } | null>;
    extractMetadata(source: any, filePath: any): {
        path: any;
        packageName: null;
        imports: never[];
        classes: never[];
        interfaces: never[];
        enums: never[];
        records: never[];
        annotations: never[];
        errors: any[];
    };
    extractPackageName(root: any): any;
    extractImports(root: any): any[];
    processTypeDeclaration(children: any, context: any, metadata: any): void;
    processNormalClassDeclaration(normalClass: any, modifierNodes: any, context: any, metadata: any): void;
    processNormalInterfaceDeclaration(normalInterface: any, modifierNodes: any, context: any, metadata: any): void;
    processEnumDeclaration(enumDeclaration: any, modifierNodes: any, context: any, metadata: any): void;
    processRecordDeclaration(recordDeclaration: any, modifierNodes: any, context: any, metadata: any): void;
    processAnnotationInterfaceDeclaration(annotationDeclaration: any, modifierNodes: any, context: any, metadata: any): void;
    processClassBody(bodyChildren: any, context: any, metadata: any, target: any): void;
    processInterfaceBody(bodyChildren: any, context: any, metadata: any, target: any): void;
    handleClassBodyDeclaration(children: any, context: any, metadata: any, target: any, treatAsEnum: any): void;
    parseMethodDeclaration(methodDeclaration: any, context: any, options?: {}): {
        name: any;
        returnType: any;
        parameters: any[];
        annotations: any[];
        modifiers: {
            public: boolean;
            protected: boolean;
            private: boolean;
            static: boolean;
            abstract: boolean;
            final: boolean;
            default: boolean;
            sealed: boolean;
            nonSealed: boolean;
        };
        isConstructor: boolean;
        isStatic: boolean;
        isPublic: any;
        isAbstract: boolean;
        isDefault: boolean;
    } | null;
    parseConstructorDeclaration(constructorDeclaration: any, context: any, ownerName: any): {
        name: any;
        returnType: null;
        parameters: any[];
        annotations: any[];
        modifiers: {
            public: boolean;
            protected: boolean;
            private: boolean;
            static: boolean;
            abstract: boolean;
            final: boolean;
            default: boolean;
            sealed: boolean;
            nonSealed: boolean;
        };
        isConstructor: boolean;
        isStatic: boolean;
        isPublic: boolean;
        isAbstract: boolean;
        isDefault: boolean;
    } | null;
    createCompactConstructor(name: any, components: any): {
        name: any;
        returnType: null;
        parameters: any;
        annotations: never[];
        modifiers: {
            public: boolean;
        };
        isConstructor: boolean;
        isStatic: boolean;
        isPublic: boolean;
        isAbstract: boolean;
        isDefault: boolean;
    };
    extractParameters(parameterList: any, source: any): any[];
    extractEnumConstants(enumBody: any, source: any): any;
    extractRecordComponents(recordHeader: any, source: any): any[];
    extractInterfaceList(interfaceListNode: any, source: any): any;
    extractModifierInfo(modifierNodes: any[] | undefined, source: any): {
        annotations: any[];
        flags: {
            public: boolean;
            protected: boolean;
            private: boolean;
            static: boolean;
            abstract: boolean;
            final: boolean;
            default: boolean;
            sealed: boolean;
            nonSealed: boolean;
        };
    };
    readQualifiedName(children?: {}): any;
    sliceFromLocation(location: any, source: any): any;
    extendContext(context: any, name: any): {
        source: any;
        packageName: any;
        enclosing: any[];
    };
    buildFullName(enclosing: any, name: any): any;
}
