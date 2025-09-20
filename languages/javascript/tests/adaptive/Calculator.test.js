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

  it('discovers the target', () => {
    expect(Calculator).toBeDefined();
  });

  describe('methods', () => {    it.todo('TODO: add');
    it.todo('TODO: subtract');
    it.todo('TODO: multiply');
    it.todo('TODO: divide');
    it.todo('TODO: power');
    it.todo('TODO: sqrt');
    it.todo('TODO: getHistory');
    it.todo('TODO: clearHistory');
  });
  // TODO: add domain-specific assertions here
});
