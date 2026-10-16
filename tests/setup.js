// Shared test setup. Component tests opt into jsdom with
// `// @vitest-environment jsdom` at the top of the file.
import { afterEach } from 'vitest';

afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
