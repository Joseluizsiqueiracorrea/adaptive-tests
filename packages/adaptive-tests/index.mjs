import adaptiveDefault from '@adaptive-tests/javascript/src/index.mjs';

let typescript;
try {
  typescript = await import('@adaptive-tests/typescript');
} catch (error) {
  typescript = undefined;
}

if (typescript && typeof adaptiveDefault === 'object' && !Reflect.has(adaptiveDefault, 'typescript')) {
  Reflect.set(adaptiveDefault, 'typescript', typescript);
}

export * from '@adaptive-tests/javascript/src/index.mjs';
export { adaptiveDefault as default };
export { typescript };
