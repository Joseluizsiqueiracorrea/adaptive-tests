/**
 * Adaptive Tests for ResultAssembler
 *
 * These tests use the adaptive testing framework to test the ResultAssembler
 * by discovering it dynamically and testing its real functionality.
 */

const { AdaptiveTest, adaptiveTest } = require('../../src/index');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Test the ResultAssembler class using adaptive discovery
 */
class ResultAssemblerAdaptiveTest extends AdaptiveTest {
    getTargetSignature() {
        return {
            name: 'ResultAssembler',
            type: 'class',
            exports: 'ResultAssembler',
            methods: [
                'resolveCandidate',
                'tryGetCachedTarget',
                'storeResolution',
                'loadModule',
                'ensureCacheLoaded',
                'saveCacheToDisk',
                'isPathSafeForLoad',
                'getCacheKey'
            ]
        };
    }

    async runTests(ResultAssembler) {
        // Mock dependencies
        const mockCandidateEvaluator = {
            isCandidateSafe: jest.fn().mockReturnValue(true),
            selectExportFromMetadata: jest.fn().mockReturnValue(null),
            validateTarget: jest.fn().mockReturnValue(true),
            extractExportByAccess: jest.fn().mockReturnValue({}),
            resolveTargetFromModule: jest.fn().mockReturnValue({ target: {}, access: { type: 'default' } })
        };

        const mockModuleVersions = new Map();
        const mockCachedModules = new Set();
        const mockCleanupFn = jest.fn();
        const mockEnsureTS = jest.fn();

        const assembler = new ResultAssembler({
            rootPath: process.cwd(),
            candidateEvaluator: mockCandidateEvaluator,
            moduleVersions: mockModuleVersions,
            cachedModules: mockCachedModules,
            cleanupCachedModules: mockCleanupFn,
            ensureTypeScriptSupport: mockEnsureTS,
            runtimeCache: new Map(),
            persistentCache: {},
            cacheConfig: {
                enabled: true,
                file: '.test-cache.json',
                logWarnings: false,
                ttlMs: 60000
            }
        });

        // Test basic functionality
        expect(assembler).toBeInstanceOf(ResultAssembler);
        expect(typeof assembler.resolveCandidate).toBe('function');
        expect(typeof assembler.tryGetCachedTarget).toBe('function');
        expect(typeof assembler.storeResolution).toBe('function');
        expect(typeof assembler.loadModule).toBe('function');
        expect(typeof assembler.ensureCacheLoaded).toBe('function');
        expect(typeof assembler.saveCacheToDisk).toBe('function');
        expect(typeof assembler.isPathSafeForLoad).toBe('function');
        expect(typeof assembler.getCacheKey).toBe('function');

        // Test cache key generation
        const signature1 = { name: 'TestClass', type: 'class' };
        const signature2 = { name: 'TestFunction', type: 'function' };
        
        const key1 = assembler.getCacheKey(signature1);
        const key2 = assembler.getCacheKey(signature2);
        
        expect(typeof key1).toBe('string');
        expect(typeof key2).toBe('string');
        expect(key1).not.toBe(key2);
        
        // Same signature should produce same key
        const key1Again = assembler.getCacheKey(signature1);
        expect(key1).toBe(key1Again);

        // Test cache expiry logic
        const expiredEntry = {
            timestamp: Date.now() - 120000 // 2 minutes ago
        };
        const freshEntry = {
            timestamp: Date.now() - 30000 // 30 seconds ago
        };
        
        expect(assembler.isCacheEntryExpired(expiredEntry)).toBe(true);
        expect(assembler.isCacheEntryExpired(freshEntry)).toBe(false);

        // Test cache serialization
        const testValue = {
            name: 'TestClass',
            regex: /test/gi,
            array: ['a', 'b'],
            func: function namedFunction() {},
            nested: { key: 'value' }
        };
        
        const serialized = assembler.serializeCacheValue(testValue);
        expect(serialized).toBeDefined();
        expect(serialized.name).toBe('TestClass');
        expect(serialized.regex).toEqual({ __type: 'RegExp', source: 'test', flags: 'gi' });
        expect(serialized.array).toEqual(['a', 'b']);
        expect(serialized.func).toEqual({ __type: 'Function', name: 'namedFunction' });
        expect(serialized.nested).toEqual({ key: 'value' });

        // Test that cache loading doesn't throw
        await expect(assembler.ensureCacheLoaded()).resolves.not.toThrow();

        // End-to-end cache store + load
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'adaptive-ra-'));
        const moduleFile = path.join(tempRoot, 'example-module.js');
        fs.writeFileSync(moduleFile, "module.exports = function Example(){ return 'ok'; };\n", 'utf8');

        const runtimeCache = new Map();
        const persistentCache = {};
        const assembler2 = new ResultAssembler({
            rootPath: tempRoot,
            candidateEvaluator: {
                isCandidateSafe: (candidate) => !((candidate.content || '').toLowerCase().includes('process.exit(')),
                selectExportFromMetadata: () => null,
                extractExportByAccess: (moduleExports) => moduleExports,
                validateTarget: () => ({ score: 10 }),
                resolveTargetFromModule: (moduleExports) => ({ target: moduleExports, access: { type: 'direct' } })
            },
            moduleVersions: new Map(),
            cachedModules: new Set(),
            cleanupCachedModules: () => {},
            ensureTypeScriptSupport: () => {},
            runtimeCache,
            persistentCache,
            cacheConfig: { enabled: true, file: 'cache.json', logWarnings: false, ttlMs: 5 }
        });

        const sig = { name: 'Example', type: 'function' };
        const cacheKey = assembler2.getCacheKey(sig);
        const candidate = { path: moduleFile, score: 100, mtimeMs: fs.statSync(moduleFile).mtimeMs };
        const resolved = { target: require(moduleFile), access: { type: 'direct' } };
        await assembler2.storeResolution(cacheKey, candidate, resolved);

        const loadedTarget = await assembler2.tryGetCachedTarget(cacheKey, sig);
        expect(typeof loadedTarget).toBe('function');
        expect(loadedTarget()).toBe('ok');

        // Safety recheck when file becomes unsafe (forces persistent path)
        runtimeCache.clear();
        fs.writeFileSync(moduleFile, "process.exit(0); module.exports = function Example(){ return 'ok'; };\n", 'utf8');
        const blocked = await assembler2.tryGetCachedTarget(cacheKey, sig);
        expect(blocked).toBeNull();

        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
}

// Run the adaptive test
adaptiveTest(ResultAssemblerAdaptiveTest);

