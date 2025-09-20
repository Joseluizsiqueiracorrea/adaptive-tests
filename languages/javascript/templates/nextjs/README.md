# Next.js Template with Adaptive Tests

This template provides a complete Next.js application pre-configured with adaptive tests for JavaScript/TypeScript development.

## Features

- Next.js 14+ with App Router
- TypeScript support
- Pre-configured adaptive test suites
- ESLint and Prettier configuration
- Tailwind CSS integration

## Quick Start

```bash
# Create new Next.js project with adaptive tests
npx create-next-app@latest my-app --template https://github.com/anon57396/adaptive-tests/languages/javascript/templates/nextjs

# Or use this template directly
git clone https://github.com/anon57396/adaptive-tests.git
cd adaptive-tests/languages/javascript/templates/nextjs
npm install
npm run dev
```

## Project Structure

```
my-nextjs-app/
├── app/                    # Next.js App Router
├── components/            # Reusable components
├── lib/                   # Utility functions
├── tests/                 # Traditional tests
├── tests-adaptive/        # Adaptive test suites
├── adaptive-tests.config.js
└── package.json
```

## Adaptive Test Examples

The template includes adaptive tests for:
- API routes discovery
- Component testing
- Database integration testing
- Configuration validation

## Running Tests

```bash
# Traditional tests
npm test

# Adaptive tests only
npm run test:adaptive

# Full validation (traditional + adaptive)
npm run validate
```

## Configuration

The adaptive tests are configured in `adaptive-tests.config.js`:

```javascript
module.exports = {
  discovery: {
    rootPath: './src',
    scoring: {
      allowLooseNameMatch: true,
      looseNamePenalty: -10
    }
  },
  languages: ['javascript', 'typescript']
};
```

## Migration from Traditional Tests

To convert existing traditional tests to adaptive tests:

```bash
npx adaptive-tests migrate --input tests/ --output tests-adaptive/
```

This will automatically convert your existing test files to use the discovery engine instead of hardcoded imports.