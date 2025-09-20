#!/usr/bin/env node

const { LinkChecker } = require('linkinator');

const skipPatterns = [
  /^mailto:/i,
  /^tel:/i,
  /https:\/\/github\.com\/anon57396\/adaptive-tests\/actions/i,
  /https:\/\/www\.npmjs\.com\//i
];

async function main() {
  const checker = new LinkChecker();
  const broken = [];

  checker.on('link', (result) => {
    const url = result.url || '';

    if (!/^https?:/i.test(url)) {
      return; // Skip local and file links
    }

    if (skipPatterns.some((pattern) => pattern.test(url))) {
      return;
    }

    if (result.state === 'BROKEN') {
      broken.push({ url, status: result.status });
    }
  });

  await checker.check({
    path: ['README.md', 'CHANGELOG.md', 'docs'],
    recurse: true,
    silent: true,
    retry: true
  });

  if (broken.length > 0) {
    console.error('Detected broken external links:');
    for (const entry of broken) {
      console.error(`  [${entry.status}] ${entry.url}`);
    }
    process.exit(1);
  }

  console.log('All external links passed.');
}

main().catch((error) => {
  console.error('Link check failed:', error);
  process.exit(1);
});
