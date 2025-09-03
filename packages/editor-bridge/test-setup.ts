(globalThis as any).window = (globalThis as any).window || window;
(globalThis as any).__WEBEXP_TEST__ = true;
import './src/index.ts';
