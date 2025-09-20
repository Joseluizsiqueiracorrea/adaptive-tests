import adaptiveExports from './index.js';

const {
  DiscoveryEngine,
  AdaptiveTest,
  getDiscoveryEngine,
  adaptiveTest,
  discover,
  ConfigLoader,
  ScoringEngine,
  DEFAULT_CONFIG,
  ...rest
} = adaptiveExports;

export {
  DiscoveryEngine,
  AdaptiveTest,
  getDiscoveryEngine,
  adaptiveTest,
  discover,
  ConfigLoader,
  ScoringEngine,
  DEFAULT_CONFIG
};

export default {
  DiscoveryEngine,
  AdaptiveTest,
  getDiscoveryEngine,
  adaptiveTest,
  discover,
  ConfigLoader,
  ScoringEngine,
  DEFAULT_CONFIG,
  ...rest
};
