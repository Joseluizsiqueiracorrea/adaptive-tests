export function explainPythonSignature(signatureInput: any, { root, limit }: {
    root: any;
    limit?: number | undefined;
}): {
    language: string;
    path: any;
    relativePath: any;
    score: any;
    rawScore: any;
    recency: null;
    breakdown: any;
    details: any;
    exports: {
        exportedName: any;
        accessType: string;
        accessName: null;
        kind: any;
        name: any;
        methods: any;
        module: any;
    }[];
    metadata: any;
}[];
