// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {getVitestConfig} from '@vis.gl/dev-tools';

const includePatterns = [
  'modules/**/*.spec.{ts,js}',
  'modules/web-mercator/test/fp32-limits.ts'
];

const excludePatterns = [
  '**/*.disabled.*',
  'modules/**/wip/**',
  // These suites were not imported by the previous aggregate test harness.
  'modules/core/test/threejs-tests/euler-three.spec.ts',
  'modules/core/test/threejs-tests/matrix3-three.spec.ts',
  'modules/web-mercator/test/spec/versus-mapbox/**',
  'test/bench/**/*.bench.*',
  'test/size/**'
];

export default getVitestConfig({
  tsconfigProjects: ['./tsconfig.json', './tsconfig.test.json'],
  excludePatterns,
  projects: {
    node: {
      test: {
        // Native workers inherit startup preloads, so private aliases also resolve outside Vite.
        execArgv: ['--import', new URL('./test/utils/register-worker-aliases.mjs', import.meta.url).href],
        include: [...includePatterns, 'scripts/deepmerge-security.spec.ts'],
        setupFiles: ['./test/utils/node-test-setup.ts']
      }
    },
    browser: {
      // Prebundle the grid oracle so browser tests do not reload midway through a run.
      optimizeDeps: {include: ['proj4/lib/datum_transform', 'geotiff']},
      test: {
        include: includePatterns,
        setupFiles: ['./test/utils/test-setup.ts']
      }
    },
    headless: {
      server: {
        headers: process.env.MATHGL_TEST_SHARED_MEMORY === '1' ? {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp'
        } : {}
      },
      define: {
        'globalThis.__mathglSharedMemoryExpected': JSON.stringify(
          process.env.MATHGL_TEST_SHARED_MEMORY === '1'
        )
      },
      optimizeDeps: {include: ['proj4/lib/datum_transform', 'geotiff']},
      test: {
        // Benchmarks use the same browser harness but run only when explicitly requested.
        include: process.env.MATHGL_BROWSER_BENCHMARKS === '1'
          ? ['test/bench/browser.spec.ts']
          : includePatterns,
        setupFiles: ['./test/utils/test-setup.ts']
      }
    }
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov'],
    include: ['modules/**/src/**/*.{js,jsx,cjs,mjs,ts,tsx}'],
    exclude: [
      '**/*disabled',
      '**/deprecated',
      '**/libs/**',
      '**/wip/**',
      '**/*.d.ts',
      '**/*.map',
      '**/*.{bundle,min}.{js,ts}',
      '**/{build,coverage,dist,node_modules,vendor,vendored}/**',
      'examples/**',
      'test/**',
      'modules/**/test/**',
      'modules/**/wip/**'
    ],
    excludeAfterRemap: true
  }
});
