/**
 * Adaptive Tests for ScoringEngine
 *
 * These tests use the adaptive testing framework to test the ScoringEngine
 * by discovering it dynamically and testing its actual functionality.
 */

const { AdaptiveTest, adaptiveTest } = require('../../src/index');

/**
 * Test the ScoringEngine class using adaptive discovery
 */
class ScoringEngineAdaptiveTest extends AdaptiveTest {
    getTargetSignature() {
        return {
            name: 'ScoringEngine',
            type: 'class',
            exports: 'ScoringEngine',
            methods: [
                'calculateScore',
                'computeScore',
                'scorePath',
                'scoreExtension',
                'scoreFileName'
            ]
        };
    }

    async runTests(ScoringEngine) {
        const engine = new ScoringEngine({
            discovery: {
                scoring: {
                    extensions: {
                        '.js': 10,
                        '.ts': 8
                    },
                    fileName: {
                        exactMatch: 45,
                        caseInsensitive: 30,
                        partialMatch: 8
                    },
                    typeHints: {
                        'class': 15,
                        'function': 12
                    },
                    methods: {
                        perMention: 3,
                        maxMentions: 5
                    },
                    paths: {
                        positive: {
                            '/src/': 12,
                            '/lib/': 8
                        },
                        negative: {
                            '/test/': -10
                        }
                    }
                }
            }
        });

        const mockCandidate = {
            path: '/test/Calculator.js',
            fileName: 'Calculator',
            relativePath: 'src/Calculator.js'
        };

        const mockSignature = {
            name: 'Calculator',
            type: 'class',
            methods: ['add', 'subtract']
        };

        const mockContent = 'class Calculator { add() {} subtract() {} }';

        // Test basic functionality
        expect(engine).toBeInstanceOf(ScoringEngine);
        expect(typeof engine.calculateScore).toBe('function');
        expect(typeof engine.calculateScoreDetailed).toBe('function');

        // Test scoring
        const score = engine.calculateScore(mockCandidate, mockSignature, mockContent);
        expect(typeof score).toBe('number');

        // Test detailed scoring with breakdown verification
        const detailedResult = engine.calculateScoreDetailed(mockCandidate, mockSignature, mockContent);
        expect(detailedResult).toBeDefined();
        expect(typeof detailedResult.totalScore).toBe('number');
        expect(typeof detailedResult.breakdown).toBe('object');
        expect(Array.isArray(detailedResult.details)).toBe(true);

        // Verify breakdown contains expected categories
        const { breakdown } = detailedResult;
        expect(breakdown).toHaveProperty('path');
        expect(breakdown).toHaveProperty('extension');
        expect(breakdown).toHaveProperty('fileName');
        expect(breakdown).toHaveProperty('typeHints');
        expect(breakdown).toHaveProperty('methods');

        // Verify path scoring contributed
        expect(typeof breakdown.path).toBe('number');
        expect(breakdown.path).toBe(-10); // Should be negative due to /test/ path

        // Verify extension scoring contributed
        expect(typeof breakdown.extension).toBe('number');
        expect(breakdown.extension).toBe(10); // .js extension

        // Verify fileName scoring contributed
        expect(typeof breakdown.fileName).toBe('number');
        expect(breakdown.fileName).toBe(45); // Exact match

        // Verify typeHints scoring contributed
        expect(typeof breakdown.typeHints).toBe('number');
        expect(breakdown.typeHints).toBe(15); // class type hint

        // Verify methods scoring contributed
        expect(typeof breakdown.methods).toBe('number');
        expect(breakdown.methods).toBeGreaterThan(0); // Should find method mentions

        // Test individual scoring methods
        expect(engine.scoreExtension('/test/file.js')).toBe(10);
        expect(engine.scoreExtension('/test/file.ts')).toBe(8);

        // Test file name scoring
        expect(engine.scoreFileName('Calculator', mockSignature)).toBe(45);
        expect(engine.scoreFileName('calculator', mockSignature)).toBe(30);
        expect(engine.scoreFileName('MyCalculatorClass', mockSignature)).toBe(8); // partial match

        // Test path scoring
        expect(engine.scorePath('/src/Calculator.js')).toBe(12);
        expect(engine.scorePath('/test/Calculator.js')).toBe(-10);
        expect(engine.scorePath('/lib/Calculator.js')).toBe(8);

        // Test type hints scoring
        expect(engine.scoreTypeHints('class MyClass {}', { type: 'class' })).toBe(15);
        expect(engine.scoreTypeHints('function myFunc() {}', { type: 'function' })).toBe(12);
        expect(engine.scoreTypeHints('const x = 5;', { type: 'class' })).toBe(0);

        // Test method mentions scoring
        const methodContent = 'add() { return 1; } subtract() { return 2; }';
        const methodScore = engine.scoreMethodMentions(methodContent, ['add', 'subtract']);
        expect(methodScore).toBe(6); // 2 methods * 3 points each
    }
}

// Run the adaptive test
adaptiveTest(ScoringEngineAdaptiveTest);