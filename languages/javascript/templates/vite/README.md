# Vite Template with Adaptive Tests

Modern Vite.js application template with pre-configured adaptive testing infrastructure for JavaScript/TypeScript development.

## Features

- ⚡ Vite 5+ for fast development
- ⚛️ React 18+ with modern patterns
- 📦 TypeScript support
- 🎨 UnoCSS for styling
- 🧪 Comprehensive adaptive test suites
- 📱 PWA ready configuration

## Quick Start

```bash
# Create new Vite project with adaptive tests
npm create vite@latest my-vite-app -- --template https://github.com/anon57396/adaptive-tests/languages/javascript/templates/vite

# Or clone and use directly
git clone https://github.com/anon57396/adaptive-tests.git
cd adaptive-tests/languages/javascript/templates/vite
npm install
npm run dev
```

## Project Structure

```
my-vite-app/
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   └── main.tsx          # App entry point
├── tests/                # Traditional tests
├── tests-adaptive/       # Adaptive test suites
├── adaptive-tests.config.js
└── vite.config.ts
```

## Adaptive Test Examples

The template includes adaptive tests for:

- Component discovery and testing
- Custom hooks validation
- Utility function testing
- Build configuration verification

## Running Tests

```bash
# Traditional tests
npm test

# Adaptive tests only
npm run test:adaptive

# Full validation suite
npm run validate
```

## Configuration

Adaptive tests configuration in `adaptive-tests.config.js`:

```javascript
module.exports = {
  discovery: {
    rootPath: './src',
    scoring: {
      allowLooseNameMatch: true,
      looseNamePenalty: -5
    }
  },
  languages: ['javascript', 'typescript']
};
```

## Vite Plugin Integration

The template includes `vite-plugin-adaptive` (preview) for build-time hooks:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import adaptive from 'vite-plugin-adaptive' // preview helper

export default defineConfig({
  plugins: [
    adaptive({
      discovery: {
        precompile: true,
        cacheDir: '.adaptive-cache'
      }
    })
  ]
})
