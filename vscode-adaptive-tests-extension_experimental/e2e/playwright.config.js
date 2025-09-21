"use strict";
/**
 * E2E Test Configuration
 * Comprehensive testing with Playwright for VS Code extension
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const path_1 = __importDefault(require("path"));
exports.default = (0, test_1.defineConfig)({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['list']
    ],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 10000,
        navigationTimeout: 30000
    },
    projects: [
        {
            name: 'vscode-electron',
            use: {
                ...test_1.devices['Desktop Electron'],
                launchOptions: {
                    executablePath: electronPath(),
                    args: [
                        '--extensionDevelopmentPath=' + extensionPath(),
                        '--extensionTestsPath=' + path_1.default.join(__dirname, 'tests'),
                        '--disable-gpu-sandbox',
                        '--disable-updates',
                        '--skip-welcome',
                        '--skip-release-notes',
                        '--disable-workspace-trust'
                    ]
                }
            }
        },
        {
            name: 'webview-chrome',
            use: { ...test_1.devices['Desktop Chrome'] },
            testMatch: /webview\.spec\.ts$/
        },
        {
            name: 'webview-safari',
            use: { ...test_1.devices['Desktop Safari'] },
            testMatch: /webview\.spec\.ts$/
        },
        {
            name: 'accessibility',
            use: { ...test_1.devices['Desktop Chrome'] },
            testMatch: /a11y\.spec\.ts$/
        },
        {
            name: 'performance',
            use: {
                ...test_1.devices['Desktop Chrome'],
                launchOptions: {
                    args: ['--enable-precise-memory-info']
                }
            },
            testMatch: /performance\.spec\.ts$/
        }
    ],
    webServer: {
        command: 'npm run dev',
        cwd: path_1.default.join(__dirname, '../webview-react'),
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120000
    }
});
function electronPath() {
    // Path to VS Code executable
    const platform = process.platform;
    switch (platform) {
        case 'darwin':
            return '/Applications/Visual Studio Code.app/Contents/MacOS/Electron';
        case 'linux':
            return '/usr/share/code/code';
        case 'win32':
            return 'C:\\Program Files\\Microsoft VS Code\\Code.exe';
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}
function extensionPath() {
    return path_1.default.resolve(__dirname, '..');
}
//# sourceMappingURL=playwright.config.js.map