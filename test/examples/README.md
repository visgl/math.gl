# Example checks

After installing dependencies and building library packages, run all example checks from the repository root:

```sh
yarn test-examples
```

Use `yarn test-examples:node` or `yarn test-examples:browser` to run one environment.
Append a path fragment or example name to filter the checks:

```sh
yarn test-examples:node projection-domains
yarn test-examples:browser proj-wasm-crs
```

Node checks discover every `*.test.js`, `*.test.mjs`, and `*.test.ts` under `modules/<owner>/test/examples/`,
including nested projection-domain suites. Shared runner, Vite infrastructure, and cross-example checks remain in this directory. They build the selected applications and run matching test TypeScript configurations first.
Browser checks discover `browser-test.mjs` and `run-browser.mjs` entry points and use the root
Playwright installation. They build each selected example before checking it; the solar harness
builds its own application and test pages. Each subprocess reports its example or test path.

Add `--list` to inspect the selected checks without running them. Set
`PLAYWRIGHT_EXECUTABLE_PATH` to use an existing browser executable.
The CRS and projection-domain browser checks use Vite preview by default; set
`EXAMPLE_SERVER_MODE=development` to exercise their development servers instead.
