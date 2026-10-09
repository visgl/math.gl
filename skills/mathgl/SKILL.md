---
name: mathgl
description: Build and debug JavaScript or TypeScript 3D and geospatial mathematics with math.gl. Use for math.gl vectors, matrices, rotations, map coordinates, CRS transformations, and geometry; rendering belongs to the consuming framework.
---

# math.gl

Check the application's installed package versions and public declarations before choosing an API. This repository's master documentation describes the upcoming release; stable applications can have different exports. Start with https://visgl.github.io/math.gl/llms.txt for stable documentation or https://visgl.github.io/math.gl/next/llms.txt for master, then fetch only relevant Markdown pages.

Select the module that owns the task. Read [architecture](references/architecture.md) for package boundaries and [numerical conventions](references/numerical-conventions.md) for mutation, units, coordinate frames, and precision.

Use named public imports and documented subpaths. Do not infer exports from internal files or copy deprecated APIs from older examples. Verify the package's `package.json` exports and `src/index.ts` when working in this repository.

When investigating incorrect results, record input/output units, axis order, coordinate frame, matrix multiplication order, and whether inputs were mutated. Check an independently known result as well as a round trip: inverse operations can share the same mistake. Use tolerances suited to the scale and algorithm, rather than increasing global epsilon to hide errors.

For repository changes, read [contributing](references/contributing.md). Keep application integration and library implementation scoped to the user's request.
