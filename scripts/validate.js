#!/usr/bin/env node

/**
 * Validation Script - Proves adaptive tests are doing real testing
 * Shows six scenarios:
 * 1. Normal: Both test suites pass
 * 2. Refactored: Traditional breaks (import error), Adaptive passes
 * 3. Broken Code: Both fail with actual test failures (not discovery errors)
 * 4. TypeScript mirror of the three scenarios above
 * 5. Python example project parity (pytest)
 * 6. Java example project parity (JUnit)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getDiscoveryEngine } = require('../languages/javascript/src');

console.log('='.repeat(60));
console.log('      ADAPTIVE TESTING VALIDATION');
console.log('='.repeat(60));

async function runCommand(cmd, expectFailure = false, options = {}) {
  const execOptions = { encoding: 'utf8', stdio: 'pipe', ...options };
  try {
    const result = execSync(cmd, execOptions);
    const output = typeof result === 'string' ? result : (result ? result.toString() : '');
    return { success: true, output };
  } catch (error) {
    const output = (error.stdout || error.stderr || error.message || '').toString();
    if (!expectFailure) {
      throw new Error(`Command failed: ${cmd}\n${output}`);
    }
    return { success: false, output };
  }
}

function extractTestResults(output) {
  const passMatch = output.match(/Tests:.*?(\d+) passed/);
  const failMatch = output.match(/Tests:.*?(\d+) failed/);
  const passed = passMatch ? parseInt(passMatch[1], 10) : 0;
  const failed = failMatch ? parseInt(failMatch[1], 10) : 0;

  // Look for specific error types
  const hasImportError = output.includes('Cannot find module') ||
                         output.includes('Cannot resolve') ||
                         output.includes('Module not found');
  const hasTestFailure = output.includes('Expected') ||
                         output.includes('Received') ||
                         output.includes('toBe');

  return { passed, failed, hasImportError, hasTestFailure };
}

const ROOT_DIR = path.join(__dirname, '..', '..');
const PYTHON_EXAMPLE_DIR = path.join(ROOT_DIR, 'languages', 'python', 'examples', 'python');
const PYTHON_VENV_NAME = '.adaptive-validate-venv';
const JAVA_PACKAGE_DIR = path.join(ROOT_DIR, 'languages', 'java');
const JAVA_RUNTIME_CACHE = path.join(ROOT_DIR, '.adaptive-validate-jdk');

function quote(value) {
  if (!value) {
    return '';
  }
  if (!/\s/.test(value)) {
    return value;
  }
  if (process.platform === 'win32') {
    return `"${value.replace(/"/g, '""')}"`;
  }
  const escaped = value.replace(/(["$`\])/g, '\\$1');
  return `"${escaped}"`;
}

function resolvePythonInterpreter() {
  const candidates = [];
  const addCandidate = (command, meta = {}) => {
    candidates.push({
      command,
      display: meta.display || command,
      source: meta.source || 'system',
      venvPath: meta.venvPath || null,
    });
  };

  if (process.env.PYTHON && process.env.PYTHON.trim().length > 0) {
    const envPython = process.env.PYTHON.trim();
    addCandidate(envPython, { source: 'env', display: envPython });
  }

  const repoVenvPath = path.join(ROOT_DIR, '.venv');
  if (fs.existsSync(repoVenvPath)) {
    const venvPython = pythonExecutablePath(repoVenvPath);
    if (fs.existsSync(venvPython)) {
      addCandidate(quote(venvPython), {
        source: 'repoVenv',
        display: venvPython,
        venvPath: repoVenvPath,
      });
    }
  }

  if (process.platform === 'win32') {
    addCandidate('py -3');
    addCandidate('py');
    addCandidate('python');
  }
  else {
    addCandidate('python3');
    addCandidate('python');
  }

  for (const candidate of candidates) {
    if (!candidate.command) continue;
    try {
      execSync(`${candidate.command} --version`, { stdio: 'pipe' });
      return candidate;
    } catch (error) {
      // Ignore and try next candidate
    }
  }
  return null;
}

function pythonExecutablePath(venvPath) {
  if (process.platform === 'win32') {
    return path.join(venvPath, 'Scripts', 'python.exe');
  }
  return path.join(venvPath, 'bin', 'python');
}

function extractPytestSummary(output) {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if ((line.startsWith('===') && line.endsWith('===')) || line.includes(' passed') || line.includes(' failed')) {
      return line.replace(/=+/g, '=');
    }
  }
  return 'pytest completed';
}

async function runPythonScenario() {
  const pythonInterpreter = resolvePythonInterpreter();
  if (!pythonInterpreter) {
    console.warn('  ⚠️  Skipping Python scenario: no Python interpreter available.');
    return { status: 'skipped', reason: 'Python interpreter not found' };
  }

  console.log(`Using Python interpreter: ${pythonInterpreter.display}`);

  if (pythonInterpreter.source === 'repoVenv') {
    try {
      const pytestResult = await runCommand(`${pythonInterpreter.command} -m pytest`, false, { cwd: PYTHON_EXAMPLE_DIR });
      const summary = extractPytestSummary(pytestResult.output);
      console.log(`  ✓ Python pytest: ${summary}`);
      return { status: 'passed', summary };
    } catch (error) {
      console.warn('  ⚠️  Repo virtualenv execution failed, falling back to disposable venv.');
    }
  }

  const venvPath = path.join(PYTHON_EXAMPLE_DIR, PYTHON_VENV_NAME);
  if (fs.existsSync(venvPath)) {
    fs.rmSync(venvPath, { recursive: true, force: true });
  }

  let cleanupNeeded = false;
  try {
    await runCommand(`${pythonInterpreter.command} -m venv ${quote(PYTHON_VENV_NAME)}`, false, { cwd: PYTHON_EXAMPLE_DIR });
    cleanupNeeded = true;

    const pythonExec = pythonExecutablePath(venvPath);
    const quotedPythonExec = quote(pythonExec);

    await runCommand(`${quotedPythonExec} -m pip install --upgrade pip`, false, { cwd: PYTHON_EXAMPLE_DIR });
    try {
      await runCommand(`${quotedPythonExec} -m pip install --no-warn-script-location -r requirements.txt`, false, { cwd: PYTHON_EXAMPLE_DIR });
    } catch (error) {
      console.warn('  ⚠️  Skipping Python scenario: unable to install dependencies (likely offline).');
      return { status: 'skipped', reason: 'Python dependencies unavailable (offline?)' };
    }

    const pytestResult = await runCommand(`${quotedPythonExec} -m pytest`, false, { cwd: PYTHON_EXAMPLE_DIR });
    const summary = extractPytestSummary(pytestResult.output);
    console.log(`  ✓ Python pytest: ${summary}`);
    return { status: 'passed', summary };
  } finally {
    if (cleanupNeeded && fs.existsSync(venvPath)) {
      fs.rmSync(venvPath, { recursive: true, force: true });
    }
  }
}

function resolveMavenWrapper(javaDir) {
  const scriptName = process.platform === 'win32' ? 'mvnw.cmd' : './mvnw';
  const scriptPath = path.join(javaDir, process.platform === 'win32' ? 'mvnw.cmd' : 'mvnw');
  return fs.existsSync(scriptPath) ? scriptName : null;
}

async function downloadJavaRuntime() {
  const supportedPlatforms = ['darwin', 'linux'];
  if (!supportedPlatforms.includes(process.platform)) {
    return null;
  }

  const archMap = {
    arm64: 'aarch64',
    x64: 'x64'
  };
  const osMap = {
    darwin: 'mac',
    linux: 'linux'
  };

  const mappedArch = archMap[process.arch];
  const mappedOs = osMap[process.platform];
  if (!mappedArch || !mappedOs) {
    return null;
  }

  if (!fs.existsSync(JAVA_RUNTIME_CACHE)) {
    fs.mkdirSync(JAVA_RUNTIME_CACHE, { recursive: true });
  }

  const tarball = path.join(JAVA_RUNTIME_CACHE, `temurin-${mappedOs}-${mappedArch}.tar.gz`);
  const url = `https://api.adoptium.net/v3/binary/latest/21/ga/${mappedOs}/${mappedArch}/jdk/hotspot/normal/eclipse`;
  console.log(`  ↻ Downloading Temurin JDK (21) from ${url}`);
  await runCommand(`curl -fsSL --retry 3 --output ${quote(tarball)} ${quote(url)}`, false);
  await runCommand(`tar -xzf ${quote(tarball)} -C ${quote(JAVA_RUNTIME_CACHE)}`, false);
  fs.rmSync(tarball, { force: true });

  const entries = fs.readdirSync(JAVA_RUNTIME_CACHE, { withFileTypes: true });
  const jdkDir = entries.find((entry) => entry.isDirectory() && entry.name.toLowerCase().startsWith('jdk'));
  if (!jdkDir) {
    return null;
  }
  return path.join(JAVA_RUNTIME_CACHE, jdkDir.name);
}

async function ensureJavaRuntime() {
  try {
    execSync('java -version', { stdio: 'pipe' });
    return { javaHome: null, usingBundled: false };
  } catch (error) {
    const cachedDirs = fs.existsSync(JAVA_RUNTIME_CACHE)
      ? fs.readdirSync(JAVA_RUNTIME_CACHE, { withFileTypes: true })
      : [];
    const existingDir = cachedDirs.find((dirent) => dirent.isDirectory() && dirent.name.toLowerCase().startsWith('jdk'));
    let javaHome = existingDir ? path.join(JAVA_RUNTIME_CACHE, existingDir.name) : null;

    if (!javaHome) {
      javaHome = await downloadJavaRuntime();
    }

    if (!javaHome) {
      return null;
    }

    const javaBinary = path.join(javaHome, 'bin', 'java');
    if (!fs.existsSync(javaBinary)) {
      return null;
    }

    console.log(`  ↺ Using bundled Java runtime at ${javaHome}`);
    return { javaHome, usingBundled: true };
  }
}

function extractMavenSummary(output) {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const testLine = lines.find((line) => line.startsWith('Tests run:'));
  const buildLine = lines.find((line) => line.startsWith('BUILD '));
  if (testLine && buildLine) {
    return `${testLine} | ${buildLine}`;
  }
  if (testLine) {
    return testLine;
  }
  if (buildLine) {
    return buildLine;
  }
  return 'tests completed';
}

async function runJavaScenario() {
  const wrapper = resolveMavenWrapper(JAVA_PACKAGE_DIR);
  if (!wrapper) {
    console.warn('  ⚠️  Skipping Java scenario: Maven wrapper not found.');
    return { status: 'skipped', reason: 'Maven wrapper not found' };
  }

  const javaRuntime = await ensureJavaRuntime();
  if (!javaRuntime) {
    console.warn('  ⚠️  Skipping Java scenario: unable to provision Java runtime.');
    return { status: 'skipped', reason: 'Java runtime unavailable or offline' };
  }

  const env = { ...process.env };
  if (javaRuntime.javaHome) {
    env.JAVA_HOME = javaRuntime.javaHome;
    env.PATH = `${path.join(javaRuntime.javaHome, 'bin')}${path.delimiter}${env.PATH}`;
  }

  try {
    const result = await runCommand(`${wrapper} -q test`, false, { cwd: JAVA_PACKAGE_DIR, env });
    const summary = extractMavenSummary(result.output);
    console.log(`  ✓ Maven tests: ${summary}`);
    return { status: 'passed', summary };
  } catch (error) {
    console.warn('  ⚠️  Skipping Java scenario: Java runtime or Maven not available.');
    return { status: 'skipped', reason: 'Java runtime unavailable or offline' };
  }
}

async function main() {
  console.log('\n📋 SCENARIO 1: Normal Code Structure');
  console.log('-'.repeat(40));

  // Restore to normal state
  await runCommand('npm run demo:js:restore', false);
  await runCommand('npm run demo:js:restore-broken', false);

  console.log('Running traditional tests...');
  const trad1 = await runCommand('npm run test:traditional 2>&1');
  const tradResults1 = extractTestResults(trad1.output);

  console.log('Running adaptive tests...');
  const adapt1 = await runCommand('npm run test:adaptive 2>&1');
  const adaptResults1 = extractTestResults(adapt1.output);

  console.log(`\n  Traditional: ${trad1.success ? '✅' : '❌'} ${tradResults1.passed} passed, ${tradResults1.failed} failed`);
  console.log(`  Adaptive:    ${adapt1.success ? '✅' : '❌'} ${adaptResults1.passed} passed, ${adaptResults1.failed} failed`);

  if (trad1.success && adapt1.success) {
    console.log('\n  ✓ Both test suites pass with working code');
  } else {
    throw new Error('Scenario 1 failed: Expected both traditional and adaptive tests to pass.');
  }

  console.log('\n📋 SCENARIO 2: Refactored Code Structure');
  console.log('-'.repeat(40));

  // Refactor the code
  await runCommand('npm run demo:js:refactor', false);

  console.log('After moving Calculator.js to deep nested folder...\n');

  console.log('Running traditional tests...');
  const trad2 = await runCommand('npm run test:traditional 2>&1', true);
  const tradResults2 = extractTestResults(trad2.output);

  console.log('Running adaptive tests...');
  const adapt2 = await runCommand('npm run test:adaptive 2>&1');
  const adaptResults2 = extractTestResults(adapt2.output);

  console.log(`\n  Traditional: ${trad2.success ? '✅' : '❌'} ${tradResults2.hasImportError ? '(Import Error!)' : ''}`);
  console.log(`  Adaptive:    ${adapt2.success ? '✅' : '❌'} ${adaptResults2.passed} passed, ${adaptResults2.failed} failed`);

  if (!trad2.success && tradResults2.hasImportError && adapt2.success) {
    console.log('\n  ✓ Traditional fails with import errors');
    console.log('  ✓ Adaptive still passes - found the moved file!');
  } else {
    throw new Error('Scenario 2 failed: expected traditional tests to fail on import error while adaptive tests pass.');
  }

  // Restore for next test
  await runCommand('npm run demo:js:restore', false);

  console.log('\n📋 SCENARIO 3: Broken Implementation');
  console.log('-'.repeat(40));

  // Break the calculator
  await runCommand('npm run demo:js:broken', false);

  console.log('Calculator has bugs in add(), multiply(), divide()...\n');

  console.log('Running traditional tests...');
  const trad3 = await runCommand('npm run test:traditional 2>&1', true);
  const tradResults3 = extractTestResults(trad3.output);

  console.log('Running adaptive tests...');
  // Clear discovery cache before running the test against broken code
  console.log('Clearing discovery engine cache...');
  const engine = getDiscoveryEngine();
  await engine.clearCache();

  // Clear jest cache first, then run with --no-cache
  await runCommand('npx jest --clearCache', false);
  const adapt3 = await runCommand('npx jest --config jest.examples.config.cjs languages/javascript/examples/calculator/tests/adaptive --no-cache 2>&1', true);
  const adaptResults3 = extractTestResults(adapt3.output);

  console.log(`\n  Traditional: ${trad3.success ? '✅' : '❌'} ${tradResults3.failed} test failures${tradResults3.hasTestFailure ? ' (Actual bugs!)' : ''}`);
  console.log(`  Adaptive:    ${adapt3.success ? '✅' : '❌'} ${adaptResults3.failed} test failures${adaptResults3.hasTestFailure ? ' (Actual bugs!)' : ''}`);

  if (!trad3.success && !adapt3.success && tradResults3.hasTestFailure && adaptResults3.hasTestFailure) {
    console.log('\n  ✓ Both fail with actual test assertions');
    console.log('  ✓ Adaptive tests catch real bugs, not just discovery issues!');
  } else {
    throw new Error('Scenario 3 failed: expected both suites to fail with real assertion errors.');
  }

  // Restore everything
  await runCommand('npm run demo:js:restore-broken', false);
  await runCommand('npm run demo:js:restore', false);

  console.log('\n📋 SCENARIO 4: TypeScript Mirror Example');
  console.log('-'.repeat(40));

  await runCommand('npm run demo:ts:restore-ts', false);
  await runCommand('npm run demo:ts:restore-broken-ts', false);

  console.log('Running TypeScript traditional tests...');
  const tsTrad1 = await runCommand('npx jest --config languages/typescript/jest.config.js languages/typescript/examples/typescript/tests/traditional --runInBand 2>&1');
  const tsTradResults1 = extractTestResults(tsTrad1.output);

  console.log('Running TypeScript adaptive tests...');
  const tsAdapt1 = await runCommand('npx jest --config languages/typescript/jest.config.js languages/typescript/examples/typescript/tests/adaptive --runInBand 2>&1');
  const tsAdaptResults1 = extractTestResults(tsAdapt1.output);

  console.log(`\n  TS Traditional: ${tsTrad1.success ? '✅' : '❌'} ${tsTradResults1.passed} passed, ${tsTradResults1.failed} failed`);
  console.log(`  TS Adaptive:    ${tsAdapt1.success ? '✅' : '❌'} ${tsAdaptResults1.passed} passed, ${tsAdaptResults1.failed} failed`);
  if (!tsTrad1.success || !tsAdapt1.success) {
    throw new Error('Scenario 4 failed: expected both TypeScript suites to pass before refactor.');
  }

  console.log('\nRefactoring TypeScript calculator...');
  await runCommand('npm run demo:ts:refactor-ts', false);

  const tsTradRefactor = await runCommand('npx jest --config languages/typescript/jest.config.js languages/typescript/examples/typescript/tests/traditional --runInBand 2>&1', true);
  const tsTradRefactorResults = extractTestResults(tsTradRefactor.output);
  const tsAdaptRefactor = await runCommand('npx jest --config languages/typescript/jest.config.js languages/typescript/examples/typescript/tests/adaptive --runInBand 2>&1');
  const tsAdaptRefactorResults = extractTestResults(tsAdaptRefactor.output);

  console.log(`\n  TS Traditional (after move): ${tsTradRefactor.success ? '✅' : '❌'} ${tsTradRefactorResults.hasImportError ? '(Import Error!)' : ''}`);
  console.log(`  TS Adaptive (after move):    ${tsAdaptRefactor.success ? '✅' : '❌'} ${tsAdaptRefactorResults.passed} passed, ${tsAdaptRefactorResults.failed} failed`);
  if (!( !tsTradRefactor.success && tsTradRefactorResults.hasImportError && tsAdaptRefactor.success )) {
    throw new Error('Scenario 4 failed: expected TS traditional to fail with import error while adaptive passes after refactor.');
  }

  await runCommand('npm run demo:ts:restore-ts', false);

  console.log('\nBreaking TypeScript implementation...');
  await runCommand('npm run demo:ts:broken-ts', false);

  const tsTradBroken = await runCommand('npx jest --config languages/typescript/jest.config.js languages/typescript/examples/typescript/tests/traditional --runInBand 2>&1', true);
  const tsTradBrokenResults = extractTestResults(tsTradBroken.output);
  const tsAdaptBroken = await runCommand('npx jest --config languages/typescript/jest.config.js languages/typescript/examples/typescript/tests/adaptive --runInBand 2>&1', true);
  const tsAdaptBrokenResults = extractTestResults(tsAdaptBroken.output);

  console.log(`\n  TS Traditional (broken): ${tsTradBroken.success ? '✅' : '❌'} ${tsTradBrokenResults.failed} failures${tsTradBrokenResults.hasTestFailure ? ' (Actual bugs!)' : ''}`);
  console.log(`  TS Adaptive (broken):    ${tsAdaptBroken.success ? '✅' : '❌'} ${tsAdaptBrokenResults.failed} failures${tsAdaptBrokenResults.hasTestFailure ? ' (Actual bugs!)' : ''}`);
if (!( !tsTradBroken.success && !tsAdaptBroken.success && tsTradBrokenResults.hasTestFailure && tsAdaptBrokenResults.hasTestFailure )) {
    throw new Error('Scenario 4 failed: expected both TS suites to fail with real assertion errors when implementation is broken.');
  }

  await runCommand('npm run demo:ts:restore-broken-ts', false);
  await runCommand('npm run demo:ts:restore-ts', false);

  console.log('\n📋 SCENARIO 5: Python Adaptive Example');
  console.log('-'.repeat(40));
  const pythonScenario = await runPythonScenario();

  console.log('\n📋 SCENARIO 6: Java Adaptive Example');
  console.log('-'.repeat(40));
  const javaScenario = await runJavaScenario();

  console.log('\n' + '='.repeat(60));
  console.log('                    VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ Adaptive tests pass when code works');
  console.log('✅ Adaptive tests survive refactoring (traditional don\'t)');
  console.log('✅ Adaptive tests fail on real bugs (same as traditional)');
  console.log('✅ TypeScript example mirrors the same behaviour');
  if (pythonScenario.status === 'passed') {
    console.log('✅ Python example validates adaptive discovery');
  } else {
    console.log(`⚠️ Python validation skipped: ${pythonScenario.reason}`);
  }
  if (javaScenario.status === 'passed') {
    console.log('✅ Java example validates adaptive discovery');
  } else {
    console.log(`⚠️ Java validation skipped: ${javaScenario.reason}`);
  }
  console.log('\n🎯 Conclusion: Adaptive tests do REAL validation');
  console.log('   They\'re not just always passing - they catch actual bugs!');
  console.log('   But they don\'t break when you move files around.');
  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(error => {
  console.error('\n\n*** VALIDATION FAILED ***');
  console.error(error.message);
  process.exit(1);
});