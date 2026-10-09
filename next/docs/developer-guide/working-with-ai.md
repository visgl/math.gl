# Working with AI Coding Agents

math.gl provides a documentation index, individually retrievable Markdown pages, and an installable agent skill for developers using AI coding tools.

## Start from local truth[​](#start-from-local-truth "Direct link to Start from local truth")

Ask your agent to inspect installed `@math.gl/*` versions and public TypeScript declarations first. Stable and upcoming releases can expose different APIs. Use the stable [documentation index](https://visgl.github.io/math.gl/llms.txt) for released packages, or the [next index](https://visgl.github.io/math.gl/next/llms.txt) when working on master.

The index links to individual Markdown pages. Fetch the module overview and the relevant API or programming guide rather than loading the whole website. `llms-full.txt` is intentionally not generated. Documentation pages containing custom components are exported as rendered Markdown; standalone examples are excluded from the index.

## Install the skill[​](#install-the-skill "Direct link to Install the skill")

```
npx skills add visgl/math.gl --skill mathgl
```

The [mathgl skill](https://github.com/visgl/math.gl/tree/master/skills/mathgl) helps an agent choose package boundaries, preserve mutation semantics, identify coordinate conventions, and verify numerical results. It complements the documentation and your application's own instructions.

## Give the agent a numerical contract[​](#give-the-agent-a-numerical-contract "Direct link to Give the agent a numerical contract")

Include the package version, input and output types, units, axis order, coordinate reference system, and a known expected result. State whether inputs can be mutated and the accuracy your application needs.

For example:

```
Using our installed @math.gl/core version, rotate a point about the Z axis

by 90 degrees. Preserve the original point, use the documented angle units,

and verify [1, 0, 0] becomes approximately [0, 1, 0].
```

Core arithmetic usually mutates the receiver. Ask the agent to check cloning and aliasing explicitly. For geographic work, distinguish longitude/latitude degrees, projected coordinates, Earth-centered coordinates, screen pixels, and height conventions. Matrix order and precision should be verified with known points; round trips alone can conceal shared errors.

## Verify the result[​](#verify-the-result "Direct link to Verify the result")

Use independent reference values and tolerances appropriate to the algorithm and scale. Include projection boundaries, degenerate inputs, or antimeridian crossings when they matter. Check public exports and optional data dependencies before accepting generated code.

Repository contributors should follow the normal lint, build and test workflow. The offline cases in `test/llm` describe expected agent behavior and can guide manual evaluation without API keys or model execution in CI.
