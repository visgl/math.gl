# @math.gl/web-mercator: sources and notices

This index distinguishes adapted or vendored source, separately installed
dependencies, datasets, and scientific references. It supplements the full
[package license](./LICENSE), source headers, and adjacent notices; it does not
replace or relicense them. Versions below identify the audited sources, not the
latest available upstream releases.

| Source / author | Use and retained notice |
| --- | --- |
| Jarke J. van Wijk and Wim A. A. Nuij | *Smooth and efficient zooming and panning* (2003), the algorithm cited by `flyToViewport`; [author-hosted paper](https://www.win.tue.nl/~vanwijk/zoompan.pdf). This is mathematical attribution. |
| Mapbox GL JS / react-map-gl | Viewport and fly-to API compatibility references in source comments. These references do not assert compatibility with every version or license copied code from current Mapbox releases. |

math.gl-authored viewport utilities are MIT licensed; see [LICENSE](./LICENSE).
Numerical vector operations use `@math.gl/core`, whose retained gl-matrix source
has its own upstream attribution.
