export namespace ENHANCED_CONFIG_SCHEMA {
    export namespace discovery {
        export let extensions: string[];
        export let maxDepth: number;
        export let concurrency: number;
        export let skipDirectories: string[];
        export namespace cache {
            let enabled: boolean;
            let file: string;
            let ttl: number;
            let logWarnings: boolean;
        }
        export namespace scoring {
            export let minCandidateScore: number;
            export let allowLooseNameMatch: boolean;
            export let looseNamePenalty: number;
            export namespace recency {
                let maxBonus: number;
                let halfLifeHours: number;
            }
            export namespace paths {
                let positive: {
                    '/src/': number;
                    '/app/': number;
                    '/lib/': number;
                    '/core/': number;
                };
                let negative: {
                    '/__tests__/': number;
                    '/__mocks__/': number;
                    '/tests/': number;
                    '/test/': number;
                    '/spec/': number;
                    '/mock': number;
                    '/mocks/': number;
                    '/fake': number;
                    '/stub': number;
                    '/fixture': number;
                    '/fixtures/': number;
                    '/temp/': number;
                    '/tmp/': number;
                    '/sandbox/': number;
                    '/deprecated/': number;
                    '/broken': number;
                };
            }
            export namespace fileName {
                let exactMatch: number;
                let caseInsensitive: number;
                let partialMatch: number;
                let regexMatch: number;
            }
            let extensions_1: {
                '.ts': number;
                '.tsx': number;
                '.mjs': number;
                '.cjs': number;
                '.js': number;
            };
            export { extensions_1 as extensions };
            export namespace typeHints {
                let _class: number;
                export { _class as class };
                let _function: number;
                export { _function as function };
                export let module: number;
            }
            export namespace methods {
                let perMention: number;
                let maxMentions: number;
            }
            export namespace exports {
                let moduleExports: number;
                let namedExport: number;
                let defaultExport: number;
            }
            export namespace names {
                let perMention_1: number;
                export { perMention_1 as perMention };
                let maxMentions_1: number;
                export { maxMentions_1 as maxMentions };
            }
            export namespace target {
                let exactName: number;
            }
            export let custom: never[];
        }
        export namespace security {
            let allowUnsafeRequires: boolean;
            let blockedTokens: string[];
        }
        export namespace languages {
            namespace javascript {
                import extensions_2 = LANGUAGE_EXTENSIONS.javascript;
                export { extensions_2 as extensions };
                export let skipPatterns: string[];
                export namespace scoring_1 {
                    namespace customScoring {
                        let preferModernSyntax: number;
                        let preferFunctionalStyle: number;
                    }
                    namespace nameMatching {
                        let exactMatch_1: number;
                        export { exactMatch_1 as exactMatch };
                        let caseInsensitive_1: number;
                        export { caseInsensitive_1 as caseInsensitive };
                        let partialMatch_1: number;
                        export { partialMatch_1 as partialMatch };
                        export let penalty: number;
                    }
                    namespace typeMatching {
                        export let exact: number;
                        export let compatible: number;
                        let penalty_1: number;
                        export { penalty_1 as penalty };
                    }
                    namespace methodMatching {
                        export let perMethod: number;
                        export let allMethodsBonus: number;
                        let penalty_2: number;
                        export { penalty_2 as penalty };
                    }
                }
                export { scoring_1 as scoring };
                export namespace parser {
                    let timeout: number;
                    namespace options {
                        let allowReturnOutsideFunction: boolean;
                        let plugins: string[];
                    }
                }
                let enabled_1: boolean;
                export { enabled_1 as enabled };
                export namespace testGeneration {
                    let enabled_2: boolean;
                    export { enabled_2 as enabled };
                    export let templatePath: null;
                    export let outputPath: null;
                    let options_1: {};
                    export { options_1 as options };
                }
            }
            namespace typescript {
                import extensions_3 = LANGUAGE_EXTENSIONS.typescript;
                export { extensions_3 as extensions };
                let skipPatterns_1: string[];
                export { skipPatterns_1 as skipPatterns };
                export namespace scoring_2 {
                    export namespace customScoring_1 {
                        let preferTypedCode: number;
                        let preferGenerics: number;
                        let preferInterfaces: number;
                    }
                    export { customScoring_1 as customScoring };
                }
                export { scoring_2 as scoring };
                export namespace parser_1 {
                    let timeout_1: number;
                    export { timeout_1 as timeout };
                    export namespace options_2 {
                        let useTypeScript: boolean;
                        let strictMode: boolean;
                    }
                    export { options_2 as options };
                }
                export { parser_1 as parser };
            }
            namespace java {
                import extensions_4 = LANGUAGE_EXTENSIONS.java;
                export { extensions_4 as extensions };
                let skipPatterns_2: string[];
                export { skipPatterns_2 as skipPatterns };
                export namespace scoring_3 {
                    export namespace customScoring_2 {
                        let preferPublicClasses: number;
                        let preferAnnotations: number;
                        let preferInheritance: number;
                    }
                    export { customScoring_2 as customScoring };
                }
                export { scoring_3 as scoring };
                export namespace parser_2 {
                    let timeout_2: number;
                    export { timeout_2 as timeout };
                    export namespace options_3 {
                        let javaVersion: string;
                    }
                    export { options_3 as options };
                }
                export { parser_2 as parser };
                export namespace testGeneration_1 {
                    let enabled_3: boolean;
                    export { enabled_3 as enabled };
                    let templatePath_1: string;
                    export { templatePath_1 as templatePath };
                    let outputPath_1: string;
                    export { outputPath_1 as outputPath };
                    export namespace options_4 {
                        let useJUnit5: boolean;
                        let generateMockito: boolean;
                    }
                    export { options_4 as options };
                }
                export { testGeneration_1 as testGeneration };
            }
            namespace python {
                import extensions_5 = LANGUAGE_EXTENSIONS.python;
                export { extensions_5 as extensions };
                let skipPatterns_3: string[];
                export { skipPatterns_3 as skipPatterns };
                export namespace scoring_4 {
                    export namespace customScoring_3 {
                        let preferClasses: number;
                        let preferDunderMethods: number;
                        let preferPublicMethods: number;
                    }
                    export { customScoring_3 as customScoring };
                }
                export { scoring_4 as scoring };
                export namespace parser_3 {
                    let timeout_3: number;
                    export { timeout_3 as timeout };
                    export namespace options_5 {
                        let pythonVersion: string;
                        let enableAsync: boolean;
                    }
                    export { options_5 as options };
                }
                export { parser_3 as parser };
                export namespace testGeneration_2 {
                    let enabled_4: boolean;
                    export { enabled_4 as enabled };
                    let templatePath_2: string;
                    export { templatePath_2 as templatePath };
                    let outputPath_2: string;
                    export { outputPath_2 as outputPath };
                    export namespace options_6 {
                        let usePytest: boolean;
                        let generateFixtures: boolean;
                    }
                    export { options_6 as options };
                }
                export { testGeneration_2 as testGeneration };
            }
            namespace rust {
                import extensions_6 = LANGUAGE_EXTENSIONS.rust;
                export { extensions_6 as extensions };
                let skipPatterns_4: string[];
                export { skipPatterns_4 as skipPatterns };
                export namespace scoring_5 {
                    export namespace customScoring_4 {
                        export let preferPublicItems: number;
                        export let preferTraits: number;
                        let preferGenerics_1: number;
                        export { preferGenerics_1 as preferGenerics };
                        export let preferDerives: number;
                    }
                    export { customScoring_4 as customScoring };
                }
                export { scoring_5 as scoring };
                export namespace parser_4 {
                    let timeout_4: number;
                    export { timeout_4 as timeout };
                    export namespace options_7 {
                        let edition: string;
                    }
                    export { options_7 as options };
                }
                export { parser_4 as parser };
                export namespace testGeneration_3 {
                    let enabled_5: boolean;
                    export { enabled_5 as enabled };
                    let templatePath_3: string;
                    export { templatePath_3 as templatePath };
                    let outputPath_3: string;
                    export { outputPath_3 as outputPath };
                    export namespace options_8 {
                        let generateCargoToml: boolean;
                        let useCargoTest: boolean;
                    }
                    export { options_8 as options };
                }
                export { testGeneration_3 as testGeneration };
            }
            namespace go {
                import extensions_7 = LANGUAGE_EXTENSIONS.go;
                export { extensions_7 as extensions };
                let skipPatterns_5: string[];
                export { skipPatterns_5 as skipPatterns };
                export namespace scoring_6 {
                    export namespace customScoring_5 {
                        export let preferExportedSymbols: number;
                        let preferInterfaces_1: number;
                        export { preferInterfaces_1 as preferInterfaces };
                        export let preferMethods: number;
                    }
                    export { customScoring_5 as customScoring };
                }
                export { scoring_6 as scoring };
                export namespace parser_5 {
                    let timeout_5: number;
                    export { timeout_5 as timeout };
                    export namespace options_9 {
                        let goVersion: string;
                    }
                    export { options_9 as options };
                }
                export { parser_5 as parser };
                export namespace testGeneration_4 {
                    let enabled_6: boolean;
                    export { enabled_6 as enabled };
                    let templatePath_4: string;
                    export { templatePath_4 as templatePath };
                    let outputPath_4: string;
                    export { outputPath_4 as outputPath };
                    export namespace options_10 {
                        let useTestify: boolean;
                        let generateBenchmarks: boolean;
                    }
                    export { options_10 as options };
                }
                export { testGeneration_4 as testGeneration };
            }
            namespace php {
                import extensions_8 = LANGUAGE_EXTENSIONS.php;
                export { extensions_8 as extensions };
                let skipPatterns_6: string[];
                export { skipPatterns_6 as skipPatterns };
                export namespace scoring_7 {
                    export namespace customScoring_6 {
                        let preferClasses_1: number;
                        export { preferClasses_1 as preferClasses };
                        export let preferNamespaces: number;
                        export let preferVisibility: number;
                    }
                    export { customScoring_6 as customScoring };
                }
                export { scoring_7 as scoring };
                export namespace parser_6 {
                    let timeout_6: number;
                    export { timeout_6 as timeout };
                    export namespace options_11 {
                        let phpVersion: string;
                    }
                    export { options_11 as options };
                }
                export { parser_6 as parser };
                export namespace testGeneration_5 {
                    let enabled_7: boolean;
                    export { enabled_7 as enabled };
                    let templatePath_5: string;
                    export { templatePath_5 as templatePath };
                    let outputPath_5: string;
                    export { outputPath_5 as outputPath };
                    export namespace options_12 {
                        let usePHPUnit: boolean;
                        let generateMocks: boolean;
                    }
                    export { options_12 as options };
                }
                export { testGeneration_5 as testGeneration };
            }
            namespace ruby {
                import extensions_9 = LANGUAGE_EXTENSIONS.ruby;
                export { extensions_9 as extensions };
                let skipPatterns_7: string[];
                export { skipPatterns_7 as skipPatterns };
                export namespace scoring_8 {
                    export namespace customScoring_7 {
                        let preferClasses_2: number;
                        export { preferClasses_2 as preferClasses };
                        export let preferModules: number;
                        let preferPublicMethods_1: number;
                        export { preferPublicMethods_1 as preferPublicMethods };
                    }
                    export { customScoring_7 as customScoring };
                }
                export { scoring_8 as scoring };
                export namespace parser_7 {
                    let timeout_7: number;
                    export { timeout_7 as timeout };
                    export namespace options_13 {
                        let rubyVersion: string;
                    }
                    export { options_13 as options };
                }
                export { parser_7 as parser };
                export namespace testGeneration_6 {
                    let enabled_8: boolean;
                    export { enabled_8 as enabled };
                    let templatePath_6: string;
                    export { templatePath_6 as templatePath };
                    let outputPath_6: string;
                    export { outputPath_6 as outputPath };
                    export namespace options_14 {
                        let useRSpec: boolean;
                        let generateFactories: boolean;
                    }
                    export { options_14 as options };
                }
                export { testGeneration_6 as testGeneration };
            }
        }
        export namespace plugins_1 {
            let enabled_9: never[];
            export { enabled_9 as enabled };
            export let autoDiscovery: boolean;
            export let disabled: never[];
            export let configuration: {
                'java-integration': {
                    useAdvancedParsing: boolean;
                    cacheMetadata: boolean;
                };
                'rust-integration': {
                    useLezerParser: boolean;
                    enableIncrementalParsing: boolean;
                };
            };
        }
        export { plugins_1 as plugins };
    }
    export namespace scoring_9 {
        let minCandidateScore_1: number;
        export { minCandidateScore_1 as minCandidateScore };
        export namespace recency_1 {
            let maxBonus_1: number;
            export { maxBonus_1 as maxBonus };
            let halfLifeHours_1: number;
            export { halfLifeHours_1 as halfLifeHours };
        }
        export { recency_1 as recency };
        export namespace paths_1 {
            let positive_1: {
                '/src/': number;
                '/app/': number;
                '/lib/': number;
                '/core/': number;
                '/domain/': number;
                '/services/': number;
            };
            export { positive_1 as positive };
            let negative_1: {
                '/__tests__/': number;
                '/tests/': number;
                '/test/': number;
                '/spec/': number;
                '/.test.': number;
                '/.spec.': number;
                '/mock': number;
                '/temp/': number;
                '/deprecated/': number;
            };
            export { negative_1 as negative };
        }
        export { paths_1 as paths };
        let extensions_10: {
            '.ts': number;
            '.tsx': number;
            '.rs': number;
            '.java': number;
            '.go': number;
            '.py': number;
            '.rb': number;
            '.php': number;
            '.jsx': number;
            '.js': number;
        };
        export { extensions_10 as extensions };
        let custom_1: never[];
        export { custom_1 as custom };
    }
    export { scoring_9 as scoring };
    export namespace testGeneration_7 {
        let enabled_10: boolean;
        export { enabled_10 as enabled };
        export let defaultLanguage: string;
        export namespace global {
            export let outputBase: string;
            export let overwrite: boolean;
            export let generateAssertions: boolean;
            let generateMocks_1: boolean;
            export { generateMocks_1 as generateMocks };
        }
        export namespace templates {
            let customPath: null;
            namespace builtin {
                let javascript_1: string;
                export { javascript_1 as javascript };
                let typescript_1: string;
                export { typescript_1 as typescript };
                let java_1: string;
                export { java_1 as java };
                let python_1: string;
                export { python_1 as python };
                let rust_1: string;
                export { rust_1 as rust };
                let go_1: string;
                export { go_1 as go };
                let php_1: string;
                export { php_1 as php };
                let ruby_1: string;
                export { ruby_1 as ruby };
            }
        }
    }
    export { testGeneration_7 as testGeneration };
}
/**
 * Configuration Schema Validator
 */
export class ConfigSchemaValidator {
    errorHandler: ErrorHandler;
    /**
     * Validate configuration against the enhanced schema
     */
    validate(config: any): {
        valid: boolean;
        errors: string[];
    };
    validateDiscovery(discovery: any): string[];
    validateLanguages(languages: any): string[];
    validateScoring(scoring: any): string[];
    /**
     * Merge user config with default schema
     */
    mergeWithDefaults(userConfig: any): any;
    deepMerge(target: any, source: any): any;
}
export namespace LANGUAGE_EXTENSIONS {
    let javascript_2: string[];
    export { javascript_2 as javascript };
    let typescript_2: string[];
    export { typescript_2 as typescript };
    let java_2: string[];
    export { java_2 as java };
    let python_2: string[];
    export { python_2 as python };
    let rust_2: string[];
    export { rust_2 as rust };
    let go_2: string[];
    export { go_2 as go };
    let php_2: string[];
    export { php_2 as php };
    let ruby_2: string[];
    export { ruby_2 as ruby };
    export let csharp: string[];
    export let cpp: string[];
}
export namespace DEFAULT_LANGUAGE_CONFIG {
    let extensions_11: never[];
    export { extensions_11 as extensions };
    let skipPatterns_8: never[];
    export { skipPatterns_8 as skipPatterns };
    export namespace scoring_10 {
        let customScoring_8: {};
        export { customScoring_8 as customScoring };
    }
    export { scoring_10 as scoring };
    export namespace parser_8 {
        let timeout_8: number;
        export { timeout_8 as timeout };
        export let maxFileSize: number;
        let options_15: {};
        export { options_15 as options };
    }
    export { parser_8 as parser };
}
import { ErrorHandler } from "./error-handler";
