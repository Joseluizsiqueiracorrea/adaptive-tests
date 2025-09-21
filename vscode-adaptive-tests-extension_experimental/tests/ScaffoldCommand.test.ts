import { describe, expect, it, beforeEach, vi } from 'vitest';
import path from 'path';

const createdFiles: string[] = [];

const DiscoveryEngineMock = vi.fn(function (this: any, root: string) {
  this.root = root;
});

const processSingleFileMock = vi.fn(async (_engine: any, filePath: string, options: any, results: any) => {
  const relative = path.relative(options.root, filePath);
  const filename = path.basename(relative).replace(path.extname(relative), '.test.js');
  const outputFile = path.join(options.root, options.outputDir, filename);
  createdFiles.push(outputFile);
  results.created.push(outputFile);
});

const vscodeWindow = {
  showErrorMessage: vi.fn(),
  showInformationMessage: vi.fn().mockResolvedValue('Open Test File'),
  showWarningMessage: vi.fn(),
  showTextDocument: vi.fn(),
  withProgress: vi.fn(async (_options: any, task: any) => {
    await task({ report: vi.fn() });
  }),
  activeTextEditor: {
    document: {
      uri: { fsPath: '/workspace/src/active.js' }
    }
  }
};

const vscodeWorkspace = {
  openTextDocument: vi.fn(async (target: string) => ({ uri: { fsPath: target } })),
  getWorkspaceFolder: vi.fn(() => ({ uri: { fsPath: '/workspace' } })),
  getConfiguration: vi.fn(() => ({
    get: (key: string, defaultValue: any) => {
      if (key === 'scaffold.outputDirectory') {
        return 'tests/adaptive';
      }
      if (key === 'scaffold.autoOpen') {
        return true;
      }
      return defaultValue;
    }
  }))
};

vi.mock('@adaptive-tests/javascript', () => ({
  __esModule: true,
  DiscoveryEngine: DiscoveryEngineMock,
  processSingleFile: processSingleFileMock
}));

vi.mock('vscode', () => ({
  window: vscodeWindow,
  workspace: vscodeWorkspace,
  ProgressLocation: { Notification: 1 },
  Uri: { file: (fsPath: string) => ({ fsPath }) }
}));

describe('ScaffoldCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    processSingleFileMock.mockClear();
    DiscoveryEngineMock.mockClear();
    createdFiles.length = 0;
  });

  it('warns when an unsupported extension is provided', async () => {
    const { ScaffoldCommand } = await import('../src/commands/ScaffoldCommand');
    const command = new ScaffoldCommand();

    await command.execute({ fsPath: '/workspace/src/notes.txt' } as any);

    expect(vscodeWindow.showWarningMessage).toHaveBeenCalledWith(expect.stringContaining('not supported'));
    expect(processSingleFileMock).not.toHaveBeenCalled();
  });

  it('scaffolds via adaptive-tests engine for supported files and opens generated test file', async () => {
    const { ScaffoldCommand } = await import('../src/commands/ScaffoldCommand');
    const command = new ScaffoldCommand();

    const targetUri = { fsPath: '/workspace/src/foo.js' } as any;
    await command.execute(targetUri);

    expect(DiscoveryEngineMock).toHaveBeenCalledWith('/workspace');

    expect(processSingleFileMock).toHaveBeenCalledTimes(1);
    const [engine, filePath, options] = processSingleFileMock.mock.calls[0];
    expect(filePath).toBe('/workspace/src/foo.js');
    expect(options).toMatchObject({
      root: '/workspace',
      outputDir: 'tests/adaptive',
      force: false,
      applyAssertions: true
    });

    const expectedOutput = '/workspace/tests/adaptive/foo.test.js';
    expect(createdFiles).toContain(expectedOutput);
    expect(vscodeWorkspace.openTextDocument).toHaveBeenCalledWith(expectedOutput);
    expect(vscodeWindow.showTextDocument).toHaveBeenCalled();
  });
});
