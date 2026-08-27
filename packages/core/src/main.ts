export * from './index';

import { analyzeSymptomInput } from './index';

// Provide a default export for runtime consumers that expect a module namespace
// object with analyzer available as a property.
export default {
  analyzeSymptomInput
};
