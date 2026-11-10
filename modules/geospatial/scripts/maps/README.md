# Maps bundle budgets

The existing projection bundle-check CI entry also invokes this checker.
Run it independently after `yarn build`:

```sh
node modules/geospatial/scripts/maps/check-bundle-budget.mjs
node modules/geospatial/scripts/maps/check-bundle-budget.mjs --measure
```

The checker bundles public package imports as minified browser ESM targeting ES2020,
then records raw and level-9 gzip bytes. CI uses Node 24.22.1; use the same version
when updating gzip budgets in `test/maps/bundle-budgets.json`.

| Fixture | Minified bytes | Gzip bytes |
| --- | ---: | ---: |
| Engine without presets | 9,054 | 3,488 |
| Albers USA point map | 24,526 | 9,288 |
| Albers USA with geometry | 70,730 | 25,106 |
| Raster surface builders | 4,045 | 1,823 |
| Surface transition builder | 5,526 | 2,388 |
| Feature transitions | 36,475 | 12,182 |
| Explicit full preset catalogue | 193,846 | 73,431 |

These are isolated library fixtures, not complete application download sizes.
The full catalogue intentionally includes all presets and elastic domain compilation.
Named preset imports avoid that cost. Consumers must use a bundler that eliminates
unused ESM exports; loading the CommonJS aggregate directly is not this measurement.

In addition to byte limits, retained-module assertions reject polygon clipping,
unrelated presets, and hinge machinery in lightweight fixtures. Geometry fixtures
must retain polygon clipping, so the check cannot pass by accidentally dropping the
operation it is intended to measure. Review dependency changes before updating a
budget; do not increase limits solely to silence a regression.

The baseline includes the merged polar-domain and empty-visible-world fixes from
#472. Only the surface-transition minified allowance increased after rebasing;
other limits and retained-dependency assertions are unchanged.
