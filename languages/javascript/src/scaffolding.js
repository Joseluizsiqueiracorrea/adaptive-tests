const fs = require('fs');
const path = require('path');
const { LanguagePluginRegistry } = require('./language-plugin-registry');

const ensureDirSync = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value instanceof Set) return Array.from(value);
  return [value];
};

const pickBestExport = (exports, fallbackName) => {
  if (!exports || exports.length === 0) {
    return null;
  }
  const priority = (entry) => {
    const info = entry.info || {};
    let score = 0;
    // Kind preference
    if (info.kind === 'class' || info.kind === 'struct') score += 8;
    if (info.kind === 'module') score += 4;
    if (info.kind === 'function') score += 3;
    // Default export slight boost
    if (entry.access && entry.access.type === 'default') score += 1;
    // Name proximity to filename
    if (entry.exportedName && entry.exportedName === fallbackName) score += 4;
    if (entry.exportedName && fallbackName && entry.exportedName.toLowerCase() === fallbackName.toLowerCase()) score += 3;
    // Domain signals
    const name = (entry.exportedName || info.name || '').toString();
    if (/Service$|Controller$|Provider$|Repository$|Client$|Manager$|Store$|Gateway$|Adapter$/i.test(name)) score += 4;
    // Method richness
    if (info.methods && info.methods.length > 0) score += Math.min(info.methods.length, 4);
    return score;
  };
  return [...exports].sort((a, b) => priority(b) - priority(a))[0];
};

const buildSignature = (exportEntry) => {
  if (!exportEntry) return {};
  const info = exportEntry.info || {};
  const signature = {};
  if (info.name) signature.name = info.name;
  if (info.kind && info.kind !== 'unknown') signature.type = info.kind;
  if (exportEntry.access && exportEntry.access.type === 'named' && exportEntry.access.name) {
    signature.exports = exportEntry.access.name;
  }
  const methods = toArray(info.methods).filter(Boolean);
  if (methods.length > 0) signature.methods = methods;
  const properties = toArray(info.properties).filter(Boolean);
  if (properties.length > 0) signature.properties = properties;
  if (info.extends) signature.extends = info.extends;
  return signature;
};

const formatSignatureLines = (signature, indent = '    ') => {
  const lines = [];
  const push = (key, value) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      lines.push(`${indent}${key}: [${value.map(v => `'${v}'`).join(', ')}],`);
      return;
    }
    lines.push(`${indent}${key}: '${value}',`);
  };
  push('name', signature.name);
  push('type', signature.type);
  push('exports', signature.exports);
  push('extends', signature.extends);
  push('methods', signature.methods);
  push('properties', signature.properties);
  if (lines.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
  }
  return lines.join('\n');
};

const inferAssertions = (method) => {
  const assertions = [];
  if (/^(get|fetch|load|find|query)/i.test(method)) {
    assertions.push('expect(result).toBeDefined();');
    assertions.push("// If this returns a collection: expect(Array.isArray(result)).toBe(true);");
  } else if (/^(list|all)/i.test(method)) {
    assertions.push('expect(Array.isArray(result)).toBe(true);');
    assertions.push('// expect(result.length).toBeGreaterThan(0);');
  } else if (/^(is|has|can|should)/i.test(method)) {
    assertions.push('expect(typeof result).toBe(\'boolean\');');
    assertions.push('// expect(result).toBe(true);');
  } else if (/(create|add|insert|save)/i.test(method)) {
    assertions.push('expect(result).toBeDefined();');
    assertions.push("expect(result).toHaveProperty('id');");
  } else if (/(delete|remove)/i.test(method)) {
    assertions.push('expect(result).toBeDefined();');
    assertions.push('// expect(result).toBe(true);');
  } else if (/(count|size|length|total)/i.test(method)) {
    assertions.push('expect(typeof result).toBe(\'number\');');
  } else {
    assertions.push('expect(result).toBeDefined();');
    assertions.push('// Add specific assertions based on expected behaviour');
  }
  return assertions;
};

const generateMethodBlocks = (signature, methods, options) => {
  if (!methods || methods.length === 0) {
    return '  // No public methods detected\n';
  }

  if (!options.applyAssertions) {
    return `  describe('methods', () => {${methods.map(method => `    it.todo('TODO: ${method}');`).join('\n')}\n  });\n`;
  }

  const blocks = methods.map((method) => {
    const assertions = inferAssertions(method);
    const asyncCall = options.asyncHint && /(get|fetch|load|find|list|query|create|add|insert|save|update|patch|delete|remove|login|authenticate|signin)/i.test(method);
    const invokeTarget = signature.type === 'class'
      ? `const instance = createInstance();\n      const result = ${asyncCall ? 'await ' : ''}instance.${method}();`
      : `const result = ${asyncCall ? 'await ' : ''}${signature.name}.${method}();`;
    const awaitNeeded = /await /.test(invokeTarget);
    return `  describe('${method}', () => {
    it('should handle ${method}', ${awaitNeeded ? 'async ' : ''}() => {
      // Arrange
      const createInstance = () => new ${signature.name || 'Target'}(/* TODO: deps e.g. { config, repo, client, options } */);
      // Act
      ${invokeTarget}
      // Assert
      ${assertions.join('\n      ')}
    });
  });`;
  }).join('\n\n');

  return blocks + '\n';
};

// eslint-disable-next-line no-unused-vars
const slugify = (value) => {
  return (value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'target';
};

const getLanguagePlugin = async (language) => {
  const registry = LanguagePluginRegistry.getInstance();
  return await registry.getPlugin(language);
};

const analyzeJavaFile = async (filePath) => {
    const javaIntegration = await getLanguagePlugin('java');
    if (!javaIntegration) return null;
    const javaMetadata = await javaIntegration.collector.parseFile(filePath);
    if (!javaMetadata) return null;
    const exports = [];
    const addType = (type) => {
        if (!type) return;
        const methods = (type.methods || []).filter(method => !method.isConstructor).map(method => method.name);
        exports.push({
            exportedName: type.name,
            access: { type: 'default' },
            info: {
                name: type.name,
                fullName: type.fullName,
                kind: type.type,
                methods,
                annotations: (type.annotations || []).map(annotation => annotation.name),
                extends: type.extends,
                implements: type.implements,
                javaType: type
            }
        });
    };
    javaMetadata.classes.forEach(addType);
    javaMetadata.interfaces.forEach(addType);
    javaMetadata.enums.forEach(addType);
    javaMetadata.records.forEach(addType);
    return { exports, javaMetadata };
};

const findJavaTarget = (javaMetadata, info) => {
    if (!javaMetadata) return null;
    const fullName = info.fullName || info.name;
    const candidates = [
        ...javaMetadata.classes,
        ...javaMetadata.interfaces,
        ...javaMetadata.enums,
        ...javaMetadata.records
    ];
    let match = candidates.find(type => type.fullName === fullName);
    if (!match) {
        match = candidates.find(type => type.name === info.name);
    }
    return match || candidates[0];
};

const generateJavaOutputPath = (root, filePath, options, targetName, javaMetadata) => {
    const baseName = targetName || path.basename(filePath, '.java');
    const testFileName = `${baseName}Test.java`;
    const relative = path.relative(root, filePath);
    const segments = relative.split(path.sep);
    const mainJavaIndex = segments.findIndex((seg, i) =>
        i < segments.length - 2 &&
        seg === 'src' &&
        segments[i + 1] === 'main' &&
        segments[i + 2] === 'java'
    );
    if (mainJavaIndex !== -1) {
        const testSegments = [...segments];
        testSegments[mainJavaIndex + 1] = 'test';
        testSegments[testSegments.length - 1] = testFileName;
        return path.join(root, ...testSegments);
    }
    const mainIndex = segments.findIndex((seg, i) =>
        i < segments.length - 1 &&
        seg === 'src' &&
        segments[i + 1] === 'main'
    );
    if (mainIndex !== -1) {
        const pkgSegments = segments.slice(mainIndex + 3, -1);
        return path.join(root, 'src', 'test', 'java', ...pkgSegments, testFileName);
    }
    const packageName = javaMetadata && javaMetadata.packageName;
    const baseDir = options.outputDir || path.join(root, 'tests', 'java');
    if (packageName) {
        return path.join(baseDir, ...packageName.split('.'), testFileName);
    }
    return path.join(baseDir, testFileName);
};

const generateJavaTestContent = async ({ signature, javaMetadata, javaType, options = {} }) => {
    const javaIntegration = await getLanguagePlugin('java');
    if (!javaIntegration) throw new Error('Java language plugin not available');
    const target = javaType || findJavaTarget(javaMetadata, signature);
    if (!target) throw new Error('Unable to resolve Java target type for scaffolding');
    const packageName = options.packageName ?? target.packageName ?? javaMetadata?.packageName ?? null;
    return javaIntegration.generateJUnitTest({
        target,
        signature,
        options: {
            packageName,
            testClassName: `${target.name}Test`
        }
    });
};

const analyzeSourceFile = (engine, filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, path.extname(filePath));
  const metadata = engine.analyzeModuleExports(content, fileName);
  if (!metadata || !metadata.exports || metadata.exports.length === 0) {
    return null;
  }
  return metadata.exports;
};

const generateTestContent = ({
  signature,
  methods,
  isTypeScript,
  applyAssertions
}) => {
  const lines = formatSignatureLines(signature);
  const importLine = isTypeScript
    ? `import { getDiscoveryEngine } from '@adaptive-tests/javascript';` 
    : `const { getDiscoveryEngine } = require('@adaptive-tests/javascript');`;

  const targetVar = signature.name || 'Target';
  const methodBlocks = generateMethodBlocks(signature, methods, { applyAssertions, asyncHint: true });

  return `${importLine}\n\ndescribe('${targetVar} – adaptive discovery', () => {
  const engine = getDiscoveryEngine();
  let ${targetVar};

  beforeAll(async () => {
    ${targetVar} = await engine.discoverTarget({
${lines ? `${lines}\n` : ''}    });
  });

  it('discovers the target', () => {
    expect(${targetVar}).toBeDefined();
  });

${methodBlocks || ''}  // TODO: add domain-specific assertions here
});
`;
};

const generateOutputPath = (root, sourcePath, options, exportName) => {
  const baseDir = options.outputDir || path.join(root, 'tests', 'adaptive');
  ensureDirSync(baseDir);
  const baseName = exportName || path.basename(sourcePath, path.extname(sourcePath));
  const ext = options.isTypeScript ? 'ts' : 'js';
  return path.join(baseDir, `${baseName}.test.${ext}`);
};

async function processSingleFile(engine, filePath, options, results) {
    const ext = path.extname(filePath);
    const isJava = ext === '.java';
    let exports, javaMetadata;

    if (isJava) {
        const javaResult = await analyzeJavaFile(filePath);
        if (!javaResult || !javaResult.exports || javaResult.exports.length === 0) {
            results.skippedNoExport.push(filePath);
            return;
        }
        exports = javaResult.exports;
        javaMetadata = javaResult.javaMetadata;
    } else {
        exports = analyzeSourceFile(engine, filePath);
        if (!exports || exports.length === 0) {
            results.skippedNoExport.push(filePath);
            return;
        }
    }

    let selectedExports;
    if (options.allExports) {
        selectedExports = exports;
    } else if (options.exportName) {
        selectedExports = exports.filter(e => (e.info && e.info.name === options.exportName) || (e.access && e.access.name === options.exportName));
        if (selectedExports.length === 0) selectedExports = [pickBestExport(exports, options.exportName)];
    } else {
        selectedExports = [pickBestExport(exports, path.basename(filePath, path.extname(filePath)))];
    }

    for (const exportEntry of selectedExports) {
        const signature = buildSignature(exportEntry) || {};
        if (!signature.name) signature.name = exportEntry.exportedName || 'Target';
        const methods = signature.methods || [];

        let outputPath, content;

        if (isJava) {
            const javaType = exportEntry.info.javaType;
            const targetName = options.allExports ? signature.name : signature.name || path.basename(filePath, '.java');
            outputPath = generateJavaOutputPath(options.root, filePath, options, targetName, javaMetadata);
            content = await generateJavaTestContent({ signature, javaMetadata, javaType, options: { packageName: javaMetadata?.packageName } });
        } else {
            outputPath = generateOutputPath(options.root, filePath, options, options.allExports ? signature.name : null);
            content = generateTestContent({ signature, methods, isTypeScript: options.isTypeScript, applyAssertions: options.applyAssertions });
        }

        if (fs.existsSync(outputPath) && !options.force) {
            results.skippedExisting.push(outputPath);
            continue;
        }

        ensureDirSync(path.dirname(outputPath));
        fs.writeFileSync(outputPath, content, 'utf8');
        results.created.push(outputPath);
    }
}

const gatherSourceFiles = (dir, extensions) => {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...gatherSourceFiles(fullPath, extensions));
      return;
    }
    if (!entry.isFile()) return;
    const ext = path.extname(entry.name);
    if (!extensions.includes(ext)) return;
    if (entry.name.includes('.test.') || entry.name.includes('.spec.')) return;
    files.push(fullPath);
  });
  return files;
};

async function runBatch(engine, entryPath, options, results) {
    const extensions = engine.config.discovery.extensions || ['.js', '.ts', '.tsx'];
    if (!extensions.includes('.java')) extensions.push('.java');
    const files = fs.statSync(entryPath).isDirectory()
        ? gatherSourceFiles(entryPath, extensions)
        : [entryPath];

    for (const file of files) {
        await processSingleFile(engine, file, options, results);
    }
}

module.exports = { processSingleFile, runBatch, gatherSourceFiles, analyzeSourceFile };
