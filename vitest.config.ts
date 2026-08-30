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
  'test/bench/**',
  'test/size/**'
];

export default getVitestConfig({
  tsconfigProjects: ['./tsconfig.json', './tsconfig.test.json'],
  excludePatterns,
  projects: {
    node: {
      test: {
        include: includePatterns,
        setupFiles: ['./test/utils/node-test-setup.ts']
      }
    },
    browser: {
      test: {
        include: includePatterns,
        setupFiles: ['./test/utils/test-setup.ts']
      }
    },
    headless: {
      test: {
        include: includePatterns,
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
