import path from 'path';
import { getTypeScriptDiscoveryEngine } from '@adaptive-tests/typescript';

describe('TypeScript Calculator - Adaptive Tests', () => {
  const engine = getTypeScriptDiscoveryEngine(path.resolve(__dirname, '../..'));
  type CalculatorInstance = {
    add(a: number, b: number): number;
    subtract(a: number, b: number): number;
    multiply(a: number, b: number): number;
    divide(a: number, b: number): number;
    power(a: number, b: number): number;
    sqrt(value: number): number;
    getHistory(): string[];
    clearHistory(): void;
  };

  let Calculator: new () => CalculatorInstance;
  let calc: CalculatorInstance;

  beforeAll(async () => {
    Calculator = await engine.discoverTarget({
      name: 'Calculator',
      type: 'class',
      methods: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'clearHistory'],
      exports: 'Calculator'
    });
  });

  beforeEach(() => {
    calc = new Calculator();
  });

  it('discovers the Calculator class', () => {
    expect(typeof Calculator).toBe('function');
    expect(calc).toBeInstanceOf(Calculator);
  });

  it('adds two numbers', () => {
    expect(calc.add(4, 6)).toBe(10);
  });

  it('detects division by zero', () => {
    expect(() => calc.divide(4, 0)).toThrow('Division by zero');
  });

  it('tracks and clears history', () => {
    calc.add(1, 2);
    calc.multiply(2, 5);
    expect(calc.getHistory()).toHaveLength(2);
    calc.clearHistory();
    expect(calc.getHistory()).toHaveLength(0);
  });
});
