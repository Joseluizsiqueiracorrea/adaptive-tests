#!/usr/bin/env node

const { main } = require('@adaptive-tests/javascript/cli/create-adaptive-app');

main(process.argv).catch((error) => {
  console.error('Error running create-adaptive-app:', error);
  process.exit(1);
});
