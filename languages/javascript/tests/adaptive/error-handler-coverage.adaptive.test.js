const { AdaptiveTest, adaptiveTest } = require('../../src/index');

class AdaptiveErrorCoverage extends AdaptiveTest {
  getTargetSignature() {
    return { name: 'AdaptiveError', type: 'class', exports: 'AdaptiveError', methods: ['toJSON'] };
  }
  async runTests(AdaptiveError) {
    const e1 = new AdaptiveError('m', 'C', { a: 1 });
    expect(e1).toBeInstanceOf(Error);
    expect(e1.name).toBe('AdaptiveError');
    expect(e1.code).toBe('C');
    expect(e1.context).toEqual({ a: 1 });
    const j = e1.toJSON();
    expect(j.name).toBe('AdaptiveError');
    expect(typeof j.stack).toBe('string');
    const e2 = new AdaptiveError('x', 'Y');
    expect(e2.context).toEqual({});
  }
}

class ErrorHandlerCoverage extends AdaptiveTest {
  getTargetSignature() {
    return { name: 'ErrorHandler', type: 'class', exports: 'ErrorHandler', methods: ['logError','logWarning','logDebug','handleFileError','handleParseError','handleProcessError','safeAsync','safeSync','createChild'] };
  }
  async runTests(ErrorHandler) {
    const orig = { ...process.env };
    const eSpy = jest.spyOn(console, 'error').mockImplementation();
    const wSpy = jest.spyOn(console, 'warn').mockImplementation();
    const lSpy = jest.spyOn(console, 'log').mockImplementation();

    let h = new ErrorHandler('comp');
    h.isDebugMode = true;
    h.logError(new Error('err'));
    expect(eSpy).toHaveBeenCalled();

    const { AdaptiveError } = require('../../src/error-handler');
    h.logError(new AdaptiveError('E','CODE',{k:1}), { ctx: 1 });
    expect(eSpy).toHaveBeenCalled();

    h.logWarning('warn', { a: 1 });
    h.logDebug('dbg', { b: 2 });
    expect(wSpy).toHaveBeenCalled();
    expect(lSpy).toHaveBeenCalled();

    let r;
    r = h.handleFileError(Object.assign(new Error('nf'), { code: 'ENOENT' }), '/x');
    expect(r.error).toBe('FILE_NOT_FOUND');
    r = h.handleFileError(Object.assign(new Error('ad'), { code: 'EACCES' }), '/x');
    expect(r.error).toBe('ACCESS_DENIED');
    r = h.handleFileError(Object.assign(new Error('isdir'), { code: 'EISDIR' }), '/x');
    expect(r.error).toBe('IS_DIRECTORY');
    r = h.handleFileError(Object.assign(new Error('generic'), { code: 'EOTHER' }), '/x');
    expect(r.error).toBe('FILE_ERROR');

    r = h.handleParseError(Object.assign(new Error('SyntaxError'), { name: 'SyntaxError' }), '/x', 'js');
    expect(r.error).toBe('SYNTAX_ERROR');
    r = h.handleParseError(new Error('Parse'), '/x', 'js');
    expect(r.error).toBe('PARSE_ERROR');

    r = h.handleProcessError(Object.assign(new Error('nf'), { code: 'ENOENT' }), 'py', '/x');
    expect(r.error).toBe('COMMAND_NOT_FOUND');
    r = h.handleProcessError(Object.assign(new Error('to'), { code: 'TIMEOUT' }), 'py', '/x');
    expect(r.error).toBe('COMMAND_TIMEOUT');
    r = h.handleProcessError(new Error('g'), 'py', '/x');
    expect(r.error).toBe('PROCESS_ERROR');

    r = await h.safeAsync(async ()=>'ok');
    expect(r).toEqual({ success:true, data:'ok'});
    r = await h.safeAsync(async ()=>{ const e=new Error('X'); e.code='XC'; throw e; });
    expect(r).toEqual({ success:false, error:'XC', message:'X'});
    r = h.safeSync(()=> 's');
    expect(r).toEqual({ success:true, data:'s'});
    r = h.safeSync(()=> { const e=new Error('S'); e.code='SC'; throw e; });
    expect(r).toEqual({ success:false, error:'SC', message:'S'});

    const child = h.createChild('child');
    expect(child.component).toContain('child');

    process.env = orig;
    eSpy.mockRestore(); wSpy.mockRestore(); lSpy.mockRestore();
  }
}

class ErrorCodesCoverage extends AdaptiveTest {
  getTargetSignature() {
    // Discover the module via its primary class, then validate ErrorCodes from the same module
    return { name: 'ErrorHandler', type: 'class', exports: 'ErrorHandler' };
  }
  async runTests() {
    const { ErrorCodes } = require('../../src/error-handler');
    const keys = [ 'FILE_NOT_FOUND','ACCESS_DENIED','IS_DIRECTORY','SYNTAX_ERROR','PARSE_ERROR','COMMAND_NOT_FOUND','COMMAND_TIMEOUT','PROCESS_ERROR','PLUGIN_NOT_FOUND','INVALID_SIGNATURE','METADATA_INVALID' ];
    keys.forEach(k => expect(ErrorCodes[k]).toBe(k));
  }
}

adaptiveTest(AdaptiveErrorCoverage);
adaptiveTest(ErrorHandlerCoverage);
adaptiveTest(ErrorCodesCoverage);
