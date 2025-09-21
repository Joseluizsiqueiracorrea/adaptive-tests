/**
 * Enhanced Configuration Schema for Adaptive Tests
 *
 * Supports language-specific options and settings for better
 * customization and integration with different programming languages.
 */

const { ErrorHandler } = require('./error-handler');

const LANGUAGE_EXTENSIONS = {
  javascript: ['.js', '.mjs', '.cjs'],
  typescript: ['.ts', '.tsx']
};

const DEFAULT_LANGUAGE_CONFIG = {
  enabled: true,
  extensions: [],
  skipPatterns: [],
  scoring: {
    nameMatching: {
      exactMatch: 50,
      caseInsensitive: 35,
      partialMatch: 25,
      penalty: -15
    },
    typeMatching: {
      exact: 20,
      compatible: 10,
      penalty: -25
    },
    methodMatching: {
      perMethod: 10,
      allMethodsBonus: 15,
      penalty: -12
    },
    customScoring: {}
  },
  parser: {
    timeout: 5000,
    maxFileSize: 1024 * 1024, // 1MB
    options: {}
  },
  testGeneration: {
    enabled: true,
    templatePath: null,
    outputPath: null,
    options: {}
  }
};

const ENHANCED_CONFIG_SCHEMA = {
  discovery: {
    // Global discovery settings
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
    maxDepth: 10,
    concurrency: 8,
    skipDirectories: [
      'node_modules', '.git', 'coverage', 'dist', 'build', 'target',
      '__tests__', '__pycache__', '.next', '.nuxt', 'deps'
    ],
    cache: {
      enabled: true,
      file: '.adaptive-tests-cache.json',
      ttl: 24 * 60 * 60,
      logWarnings: false
    },
    scoring: {
      minCandidateScore: -100,
      allowLooseNameMatch: true,
      looseNamePenalty: -25,
      recency: {
        maxBonus: 0,
        halfLifeHours: 6
      },
      paths: {
        positive: {
          '/src/': 12,
          '/app/': 6,
          '/lib/': 4,
          '/core/': 4
        },
        negative: {
          '/__tests__/': -50,
          '/__mocks__/': -45,
          '/tests/': -40,
          '/test/': -35,
          '/spec/': -35,
          '/mock': -30,
          '/mocks/': -30,
          '/fake': -25,
          '/stub': -25,
          '/fixture': -15,
          '/fixtures/': -15,
          '/temp/': -15,
          '/tmp/': -15,
          '/sandbox/': -15,
          '/deprecated/': -20,
          '/broken': -60
        }
      },
      fileName: {
        exactMatch: 45,
        caseInsensitive: 30,
        partialMatch: 8,
        regexMatch: 12
      },
      extensions: {
        '.ts': 18,
        '.tsx': 18,
        '.mjs': 6,
        '.cjs': 4,
        '.js': 0
      },
      typeHints: {
        class: 15,
        function: 12,
        module: 10
      },
      methods: {
        perMention: 3,
        maxMentions: 5
      },
      exports: {
        moduleExports: 30,
        namedExport: 30,
        defaultExport: 30
      },
      names: {
        perMention: 2,
        maxMentions: 5
      },
      target: {
        exactName: 35
      },
      custom: []
    },
    security: {
      allowUnsafeRequires: false,
      blockedTokens: [
        'process.exit(',
        'child_process.exec',
        'child_process.spawn',
        'child_process.fork',
        'fs.rmSync',
        'fs.rmdirSync',
        'fs.unlinkSync',
        'rimraf'
      ]
    },

    // Language-specific discovery settings
    languages: {
      javascript: {
        ...DEFAULT_LANGUAGE_CONFIG,
        extensions: LANGUAGE_EXTENSIONS.javascript,
        skipPatterns: ['*.min.js', '*.bundle.js'],
        scoring: {
          ...DEFAULT_LANGUAGE_CONFIG.scoring,
          customScoring: {
            preferModernSyntax: 10, // ES6+ features
            preferFunctionalStyle: 5
          }
        },
        parser: {
          timeout: 3000,
          options: {
            allowReturnOutsideFunction: true,
            plugins: ['jsx', 'dynamicImport']
          }
        }
      },

      typescript: {
        ...DEFAULT_LANGUAGE_CONFIG,
        extensions: LANGUAGE_EXTENSIONS.typescript,
        skipPatterns: ['*.d.ts'],
        scoring: {
          ...DEFAULT_LANGUAGE_CONFIG.scoring,
          customScoring: {
            preferTypedCode: 15,
            preferGenerics: 10,
            preferInterfaces: 8
          }
        },
        parser: {
          timeout: 5000,
          options: {
            useTypeScript: true,
            strictMode: true
          }
        }
      }
    }
  },

  // Global scoring configuration (applies to all languages unless overridden)
  scoring: {
    minCandidateScore: -100,
    recency: {
      maxBonus: 10,
      halfLifeHours: 6
    },

    // Path scoring (applies globally)
    paths: {
      positive: {
        '/src/': 12,
        '/app/': 10,
        '/lib/': 8,
        '/core/': 8,
        '/domain/': 15,
        '/services/': 12
      },
      negative: {
        '/__tests__/': -50,
        '/tests/': -40,
        '/test/': -35,
        '/spec/': -35,
        '/.test.': -100,
        '/.spec.': -100,
        '/mock': -30,
        '/temp/': -30,
        '/deprecated/': -40
      }
    },

    // Global extension preferences
    extensions: {
      '.ts': 20,
      '.tsx': 18,
      '.jsx': 5,
      '.js': 0
    },

    // Custom scoring functions (language-agnostic)
    custom: []
  },

  // Test generation configuration
  testGeneration: {
    enabled: true,
    defaultLanguage: 'javascript',

    // Global test generation settings
    global: {
      outputBase: 'tests/adaptive',
      overwrite: false,
      generateAssertions: true,
      generateMocks: false
    },

    // Template configuration
    templates: {
      customPath: null, // Path to custom templates

      // Built-in template configurations
      builtin: {
        javascript: 'jest',
        typescript: 'jest-ts'
      }
    }
  }
};

/**
 * Configuration Schema Validator
 */
class ConfigSchemaValidator {
  constructor() {
    this.errorHandler = new ErrorHandler('config-validator');
  }

  /**
   * Validate configuration against the enhanced schema
   */
  validate(config) {
    const errors = [];

    // Validate discovery section
    if (config.discovery) {
      errors.push(...this.validateDiscovery(config.discovery));
    }

    // Validate language configurations
    if (config.discovery?.languages) {
      errors.push(...this.validateLanguages(config.discovery.languages));
    }

    // Validate scoring configuration
    if (config.scoring) {
      errors.push(...this.validateScoring(config.scoring));
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateDiscovery(discovery) {
    const errors = [];

    if (discovery.maxDepth && (typeof discovery.maxDepth !== 'number' || discovery.maxDepth < 1)) {
      errors.push('discovery.maxDepth must be a positive number');
    }

    if (discovery.extensions && !Array.isArray(discovery.extensions)) {
      errors.push('discovery.extensions must be an array');
    }

    if (discovery.skipDirectories && !Array.isArray(discovery.skipDirectories)) {
      errors.push('discovery.skipDirectories must be an array');
    }

    if (discovery.concurrency !== undefined) {
      const value = Number(discovery.concurrency);
      if (!Number.isFinite(value) || value < 1) {
        errors.push('discovery.concurrency must be a positive number');
      }
    }

    if (discovery.cache) {
      if (typeof discovery.cache !== 'object') {
        errors.push('discovery.cache must be an object');
      } else if ('enabled' in discovery.cache && typeof discovery.cache.enabled !== 'boolean') {
        errors.push('discovery.cache.enabled must be a boolean');
      }
    }

    if (discovery.scoring && typeof discovery.scoring !== 'object') {
      errors.push('discovery.scoring must be an object');
    }

    return errors;
  }

  validateLanguages(languages) {
    const errors = [];

    for (const [lang, config] of Object.entries(languages)) {
      if (!config || typeof config !== 'object') {
        errors.push(`Language config for '${lang}' must be an object`);
        continue;
      }

      if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
        errors.push(`${lang}.enabled must be a boolean`);
      }

      if (config.extensions && !Array.isArray(config.extensions)) {
        errors.push(`${lang}.extensions must be an array`);
      }

      if (config.parser?.timeout && typeof config.parser.timeout !== 'number') {
        errors.push(`${lang}.parser.timeout must be a number`);
      }
    }

    return errors;
  }

  validateScoring(scoring) {
    const errors = [];

    if (scoring.minCandidateScore && typeof scoring.minCandidateScore !== 'number') {
      errors.push('scoring.minCandidateScore must be a number');
    }

    if (scoring.custom && !Array.isArray(scoring.custom)) {
      errors.push('scoring.custom must be an array');
    }

    return errors;
  }

  /**
   * Merge user config with default schema
   */
  mergeWithDefaults(userConfig) {
    return this.deepMerge(ENHANCED_CONFIG_SCHEMA, userConfig || {});
  }

  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}

module.exports = {
  ENHANCED_CONFIG_SCHEMA,
  ConfigSchemaValidator,
  LANGUAGE_EXTENSIONS,
  DEFAULT_LANGUAGE_CONFIG
};