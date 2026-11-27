# @math.gl/dggs: sources and notices

This index distinguishes adapted or vendored source, separately installed
dependencies, datasets, and scientific references. It supplements the full
[package license](./LICENSE), source headers, and adjacent notices; it does not
replace or relicense them. Versions below identify the audited sources, not the
latest available upstream releases.

| Source / author | Use and retained notice |
| --- | --- |
| Jon Atkins and AJ ONeal / s2-geometry | Adapted S2 geometry code; ISC notice retained in `src/s2-geometry/s2-geometry.ts` and [LICENSE](./LICENSE). |
| CesiumJS contributors | Adapted S2 token handling; Apache-2.0, [LICENSE](./LICENSE). |
| Google S2 | Algorithm/reference documentation: [S2 developer guide](https://s2geometry.io/devguide/s2cell_hierarchy). A reference does not imply that the whole S2 library is bundled. |

A5, H3 and Plus Code decoders use separately installed `a5-js`, `h3-js`, and
`open-location-code` dependencies. Their upstream licenses and notices remain in
those packages; see [A5](https://github.com/felixpalmer/a5), [H3](https://github.com/uber/h3-js),
and [Open Location Code](https://github.com/google/open-location-code).
