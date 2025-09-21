const { getDiscoveryEngine } = require('@adaptive-tests/javascript');

describe('Calculator – adaptive discovery', () => {
  const engine = getDiscoveryEngine();
  let Calculator;

  beforeAll(async () => {
    Calculator = await engine.discoverTarget({
      name: 'Calculator',
      type: 'class',
      methods: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'getHistory', 'clearHistory'],
      properties: ['history']
    });
  });

  const createCalculator = () => new Calculator();

  it('discovers the target', () => {
    expect(Calculator).toBeDefined();
  });

  describe('operations', () => {
    it('adds numbers', () => {
      const calculator = createCalculator();
      expect(calculator.add(2, 3)).toBe(5);
    });

    it('subtracts numbers', () => {
      const calculator = createCalculator();
      expect(calculator.subtract(7, 2)).toBe(5);
    });

    it('multiplies numbers', () => {
      const calculator = createCalculator();
      expect(calculator.multiply(4, 6)).toBe(24);
    });

    it('divides numbers and guards against divide-by-zero', () => {
      const calculator = createCalculator();
      expect(calculator.divide(9, 3)).toBe(3);
      expect(() => calculator.divide(9, 0)).toThrow('Division by zero');
    });

    it('raises numbers to a power', () => {
      const calculator = createCalculator();
      expect(calculator.power(2, 5)).toBe(32);
    });

    it('computes square roots', () => {
      const calculator = createCalculator();
      expect(calculator.sqrt(81)).toBe(9);
      expect(() => calculator.sqrt(-1)).toThrow('Cannot take square root of negative number');
    });
  });

  describe('history tracking', () => {
    it('records operations and can be cleared', () => {
      const calculator = createCalculator();
      calculator.add(1, 2);
      calculator.divide(8, 2);

      const history = calculator.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toContain('1 + 2 = 3');
      expect(history[1]).toContain('8 / 2 = 4');

      calculator.clearHistory();
      expect(calculator.getHistory()).toHaveLength(0);
    });
  });
});
