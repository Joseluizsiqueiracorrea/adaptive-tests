const fs = require('fs');
const path = require('path');

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
    if (info.kind === 'class' || info.kind === 'struct') score += 8;
    if (info.kind === 'module') score += 4;
    if (info.kind === 'function') score += 3;
    if (entry.access && entry.access.type === 'default') score += 1;
    const name = (entry.exportedName || info.name || '').toString();
    if (entry.exportedName && entry.exportedName === fallbackName) score += 4;
    if (entry.exportedName && fallbackName && entry.exportedName.toLowerCase() === fallbackName.toLowerCase()) score += 3;
    if (/Service$|Controller$|Provider$|Repository$|Client$|Manager$|Store$|Gateway$|Adapter$/i.test(name)) score += 4;
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
    assertions.push('// Add domain-specific assertions here');
  }
  return assertions;
};

const generateMethodBlocks = (signature, methods, options) => {
  if (!methods || methods.length === 0) {
    return '  // No public methods detected\n';
  }

  if (!options.applyAssertions) {
    const todoLines = methods
      .map(method => `    it.todo('TODO: ${method}');`)
      .join('\n');
    return "  describe('methods', () => {\n" + todoLines + "\n  });\n";
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
      const createInstance = () => new ${signature.name || 'Target'}(/* TODO: supply domain dependencies */);
      // Act
      ${invokeTarget}
      // Assert
      ${assertions.join('\n      ')}
    });
  });`;
  }).join('\n\n');

  return blocks + '\n';
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

const analyzeSourceFile = (engine, filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, path.extname(filePath));
  const metadata = engine.analyzeModuleExports(content, fileName);
  if (!metadata || !metadata.exports || metadata.exports.length === 0) {
    return null;
  }
  return metadata.exports;
};

const generateOutputPath = (root, sourcePath, options, exportName) => {
  const baseDir = options.outputDir || path.join(root, 'tests', 'adaptive');
  ensureDirSync(baseDir);
  const baseName = exportName || path.basename(sourcePath, path.extname(sourcePath));
  const ext = options.isTypeScript ? 'ts' : 'js';
  return path.join(baseDir, `${baseName}.test.${ext}`);
};

async function processSingleFile(engine, filePath, options, results) {
  const exports = analyzeSourceFile(engine, filePath);
  if (!exports || exports.length === 0) {
    results.skippedNoExport.push(filePath);
    return;
  }

  let selectedExports;
  if (options.allExports) {
    selectedExports = exports;
  } else if (options.exportName) {
    selectedExports = exports.filter((entry) => {
      const infoName = entry.info && entry.info.name;
      const exportName = entry.access && entry.access.name;
      return infoName === options.exportName || exportName === options.exportName;
    });
    if (selectedExports.length === 0) {
      selectedExports = [pickBestExport(exports, options.exportName)];
    }
  } else {
    selectedExports = [pickBestExport(exports, path.basename(filePath, path.extname(filePath)))];
  }

  const root = options.root || process.cwd();

  for (const exportEntry of selectedExports) {
    const signature = buildSignature(exportEntry) || {};
    if (!signature.name) signature.name = exportEntry.exportedName || 'Target';
    const methods = signature.methods || [];
    const outputPath = generateOutputPath(root, filePath, options, options.allExports ? signature.name : null);
    const content = generateTestContent({
      signature,
      methods,
      isTypeScript: options.isTypeScript,
      applyAssertions: options.applyAssertions
    });

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
  const configuredExtensions = engine.config.discovery.extensions || ['.js', '.ts', '.tsx'];
  const extensions = Array.from(new Set(configuredExtensions));
  const files = fs.statSync(entryPath).isDirectory()
    ? gatherSourceFiles(entryPath, extensions)
    : [entryPath];

  for (const file of files) {
    await processSingleFile(engine, file, options, results);
  }
}

module.exports = { processSingleFile, runBatch, gatherSourceFiles, analyzeSourceFile };
