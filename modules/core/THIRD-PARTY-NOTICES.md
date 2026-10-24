# @math.gl/core: sources and notices

This index distinguishes adapted or vendored source, separately installed
dependencies, datasets, and scientific references. It supplements the full
[package license](./LICENSE), source headers, and adjacent notices; it does not
replace or relicense them. Versions below identify the audited sources, not the
latest available upstream releases.

| Source / author | Use and retained notice |
| --- | --- |
| gl-matrix — Brandon Jones, Colin MacKenzie IV | Adapted kernels in `src/gl-matrix`; MIT; complete terms in [LICENSE](./LICENSE). This is retained source, not merely API inspiration. |
| three.js authors | Adapted math methods, including Euler conversion; MIT, [LICENSE](./LICENSE). Other methods provide API compatibility without implying source copying. |
| proj4js authors | Shared spheroid conversion arithmetic; MIT, [PROJ4-LICENSE.md](./PROJ4-LICENSE.md). |
| Stephen Oney / jsep contributors | Vendored jsep 1.4.0 parser; MIT, [version and modifications](./src/expressions/vendor/jsep/README.md), [license](./src/expressions/vendor/jsep/LICENSE.txt). |
| Don McCurdy / expression-eval | Adapted expression evaluator; MIT, [LICENSE](./LICENSE); provenance in `src/expressions/expression-eval.ts`. |
| Apache Software Foundation / Arrow JS | Adapted BigInt availability/fallback structure in `src/types/bigint.ts`; Apache-2.0. [Applicable NOTICE and comparison version](./ARROW-NOTICE.txt), [complete license](./APACHE-2.0-LICENSE.txt). The original port commit is not established; the comparison is against Arrow 4.0.0. |
