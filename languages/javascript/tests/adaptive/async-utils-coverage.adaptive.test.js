const { AdaptiveTest, adaptiveTest } = require('../../src/index');

class AsyncUtilsCoverage extends AdaptiveTest {
  getTargetSignature() {
    return { name: 'AsyncOperationManager', type: 'class', exports: 'AsyncOperationManager', methods: ['execute','withTimeout','delay','executeParallel'] };
  }
  async runTests(AsyncOperationManager) {
    const mgr = new AsyncOperationManager({ timeout: 50, retries: 1 });
    const t0 = Date.now();
    const val = await mgr.execute(async ()=>'ok', { timeout: 100 });
    expect(val).toBe('ok');
    await expect(mgr.withTimeout(()=> new Promise((r)=>setTimeout(()=>r('x'), 10)), 20)).resolves.toBe('x');
    await mgr.delay(1);

    const ops = [
      async ()=> 'a',
      async ()=> { throw new Error('b'); },
      async ()=> 'c'
    ];
    const res = await mgr.executeParallel(ops, { maxConcurrency: 2, failFast: false });
    expect(res.filter(Boolean).length).toBe(2);
  }
}

adaptiveTest(AsyncUtilsCoverage);

