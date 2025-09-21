#!/usr/bin/env node

const { main } = require('@adaptive-tests/javascript/cli/init');

main(process.argv).catch((error) => {
  console.error('Error running adaptive-tests CLI:', error);
  process.exit(1);
});
