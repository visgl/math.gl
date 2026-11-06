# Security

math.gl provides building blocks for numerical and geospatial applications. This guide helps you choose trusted code and data, manage dependencies, and set appropriate limits for your application.

## Reporting vulnerabilities

We welcome private reports that help keep math.gl and its users safe. Please use the [math.gl security policy](https://github.com/visgl/math.gl/security/policy) to report a suspected vulnerability and coordinate disclosure with the maintainers.

## Working with data

Input validation and resource limits help applications process data reliably, especially when it comes from an untrusted source.

- **Set resource limits.** Bound input size, nesting, geometry complexity, and the number of operations. Complex or malformed WKB, GeoArrow, geometries, expressions, or model data can consume substantial CPU or memory. Handle errors at the application boundary.
- **Check numeric values.** Validate input and output ranges, non-finite values, and precision against the needs of your application, especially when results inform downstream decisions.
- **Choose expression capabilities.** Expressions can invoke registered functions and use the supplied context. Expose only the functions and data appropriate for the caller, and limit expression size and evaluation work. The experimental expression API is not a general-purpose sandbox.
- **Enforce limits at the right boundary.** Request limits, concurrency limits, timeouts, and process isolation can complement library-level checks. A caller's timeout alone does not necessarily interrupt synchronous computation.

## Tasks and workers

`@math.gl/core/tasks` can run tasks locally or in workers, making it easier to keep applications responsive. The application selects the code to execute and controls the resources available to it.

- **Use trusted code.** Task implementations, worker scripts, and dynamically loaded libraries run with the privileges of their environment. Select them from trusted sources and prevent untrusted input from choosing arbitrary scripts, URLs, or module paths.
- **Choose an isolation boundary.** Workers help with responsiveness but are not security sandboxes. For untrusted code, use an appropriately isolated process or service with restricted filesystem, network, credentials, and other privileges.
- **Manage messages and memory.** Validate data on both sides of the boundary and bound queue length, input and output sizes, and execution time. Transferring a buffer detaches the sender's aliases; shared storage remains mutable across contexts.
- **Control remote assets.** For worker code or data loaded over the network, control origins and redirects, use trusted transport, and configure the application's content security policy. On servers, guard against requests to unintended destinations and avoid exposing credentials.

`maxConcurrency` bounds active task lifetimes; queued bytes require a separate application-level limit. Worker cancellation terminates the worker and cannot guarantee task cleanup. Local tasks must cooperate with cancellation, and synchronous work cannot respond to an abort mid-call. See the [tasks guide](../modules/core/tasks/README.md) for execution and ownership details.

## Dependency inventory

The following inventory shows the direct runtime dependencies declared by the published workspace packages on the current development branch. Subpath imports belong to their parent package. Versions and transitive dependencies can change; consult the package manifests and your lockfile for the exact versions in your application.

| Package | Direct math.gl dependencies | Direct third-party runtime dependencies |
| --- | --- | --- |
| `@math.gl/core` | None | None |
| `@math.gl/dggs` | `@math.gl/core` | `a5-js`, `h3-js`, `open-location-code` |
| `@math.gl/earth` | `@math.gl/core` | `astronomy-engine` |
| `@math.gl/geometry` | `@math.gl/core` | None |
| `@math.gl/geospatial` | `@math.gl/core`, `@math.gl/geometry`, `@math.gl/web-mercator` | `@mapbox/martini`, `polygon-clipping` |
| `@math.gl/web-mercator` | `@math.gl/core` | None |

This table covers declared runtime dependencies, not transitive dependencies, optional application-provided integrations, or development, test, website, and example dependencies. The latter can still affect the build and release supply chain.

## Keeping dependencies secure

A regular dependency review helps keep applications and builds up to date. Review advisories, maintain lockfiles, and use your package manager's audit and integrity facilities. Obtain packages and external data from trusted sources, review dependency and build changes, and protect publishing credentials with least privilege.
