# How It Works: Discovery, Scoring, and “Why”

This guide explains exactly how the discovery engine ranks candidates and how to use the Discovery Lens CLI to verify the reasoning in your own repo.

## The Discovery Lifecycle

1. **Candidate Collection:** The engine scans your project for files that could potentially match the signature. It uses a set of heuristics to exclude irrelevant files, such as files in `node_modules`, `.git`, and other common temporary or build-related directories.

2. **Scoring (Static Analysis):** Each candidate file is scored based on a set of categories. This is a static analysis step, meaning the engine does not execute any code. It only reads the content of the files.

3. **Structural Validation (Dynamic Analysis):** The top-scoring candidates are loaded in a sandboxed environment to validate their structure against the signature. This is a dynamic analysis step, but it's done safely and without executing the entire module.

4. **Returning the Best Match:** The first candidate that passes structural validation is returned as the best match.

## Scoring Categories

| Category | Description | Default Weight |
|---|---|---|
| **File Name** | How closely the file name matches the `name` in the signature. | 45 |
| **Path** | Hints from the file path (e.g., `/src/` is good, `/tests/` is bad). | 12 to -30 |
| **Type Hints** | Lightweight regex checks for `class`, `function`, etc. | 10 to 15 |
| **Exports** | Hints of `export` keywords. | 30 |
| **Methods** | Mentions of method names from the signature. | 3 per mention |
| **Name Mentions** | Mentions of the `name` from the signature. | 2 per mention |
| **Recency** | A bonus for recently modified files (disabled by default). | 0 |

### Scoring in Action

Let's say you have a signature `{ name: 'UserService', type: 'class' }` and a file `src/services/UserService.js`. Here's how it might be scored:

- **File Name:** `+45` (exact match)
- **Path:** `+12` (in `/src/`)
- **Type Hints:** `+15` (contains `class UserService`)
- **Exports:** `+30` (contains `export default UserService`)
- **Name Mentions:** `+4` (mentions `UserService` twice)

**Total Score:** 106

## Language Integrations

| Language | Discovery Strategy | CLI Hooks |
|---|---|---|
| **JavaScript** | Babel AST | `discover`, `why`, `scaffold`, `enable-invisible` |
| **TypeScript** | TypeScript Compiler API | `discover`, `why`, `scaffold` |
| **Python** | Python's `ast` module | `discover`, `scaffold`, `why` |
| **Java** | `java-parser` | `discover`, `scaffold` |

## Using the Discovery Lens (`why`)

If you're ever wondering why a certain file was or was not chosen, the `why` command is your best friend. It gives you a detailed breakdown of the scoring for each candidate.

```bash
npx adaptive-tests why '{"name":"UserService"}' --json
```

This will output a JSON object with a ranked list of candidates and their scores. You can use this information to debug your signatures and fine-tune your configuration.

## Customization

You can customize the discovery process by creating an `adaptive-tests.config.js` file in the root of your project.

### Custom Scoring

You can add your own custom scorers to the `discovery.scoring.custom` array. Each scorer is a function that takes a candidate, a signature, and the file content, and returns a number.

```javascript
// adaptive-tests.config.js
module.exports = {
  discovery: {
    scoring: {
      custom: [
        {
          name: 'my-rule',
          scorer: (candidate, signature, content) => {
            if (content.includes('@deprecated')) {
              return -100;
            }
            return 0;
          }
        }
      ]
    }
  }
};
```

### Other Configuration Options

You can also configure:

- **Paths to include or exclude:** `discovery.paths.positive` and `discovery.paths.negative`
- **File extensions to consider:** `discovery.extensions`
- **Scoring weights for each category:** `discovery.scoring`

**[→ See the full Configuration Guide](docs/CONFIGURATION.md)**
