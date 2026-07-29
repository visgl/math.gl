# devtools-extensions

`devtools-extensions` contains repo-owned development helpers that can later be upstreamed into
`@vis.gl/dev-tools`.

Current support:

- Biome base configuration and the root lint wrapper used by `yarn lint` and `yarn lint fix`

Boundary:

- Reusable defaults and helper code live in `dev-modules/devtools-extensions`.
- Repository-specific file scope, lint rules, and overrides stay in `biome.jsonc`.
