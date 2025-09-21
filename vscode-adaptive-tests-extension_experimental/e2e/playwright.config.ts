/**
 * E2E Test Configuration
 * Comprehensive testing with Playwright for VS Code extension
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
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
        ...devices['Desktop Electron'],
        launchOptions: {
          executablePath: electronPath(),
          args: [
            '--extensionDevelopmentPath=' + extensionPath(),
            '--extensionTestsPath=' + path.join(__dirname, 'tests'),
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
      use: { ...devices['Desktop Chrome'] },
      testMatch: /webview\.spec\.ts$/
    },

    {
      name: 'webview-safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: /webview\.spec\.ts$/
    },

    {
      name: 'accessibility',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /a11y\.spec\.ts$/
    },

    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-precise-memory-info']
        }
      },
      testMatch: /performance\.spec\.ts$/
    }
  ],

  webServer: {
    command: 'npm run dev',
    cwd: path.join(__dirname, '../webview-react'),
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});

function electronPath(): string {
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

function extensionPath(): string {
  return path.resolve(__dirname, '..');
}