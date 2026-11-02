# Security

math.gl is a collection of libraries used within an application. The application is responsible for deciding which code and data to trust, validating inputs, and enforcing resource limits. This page describes considerations, not a security audit or a guarantee that all inputs are safe.

## Reporting vulnerabilities

Report suspected vulnerabilities privately through the [math.gl security policy](https://github.com/visgl/math.gl/security/policy). Do not disclose an unpatched vulnerability in a public issue.

## Untrusted data and computation

- Bound input size, nesting, geometry complexity, and the number of operations before processing data from untrusted sources. Malformed or unusually complex WKB, GeoArrow, geometries, expressions, or model data can cause errors or consume excessive CPU or memory. Handle parsing and calculation errors at the application boundary.
- Validate numeric inputs and outputs for the application's domain, including non-finite values, coordinate ranges, and expected precision. Incorrect results can have security or safety consequences when used in downstream decisions.
- Treat expressions, their context, and registered functions as a trust boundary. An expression may invoke functions made available to it; register only functions appropriate for the caller and avoid exposing sensitive objects or side effects. Limit expression size and evaluation work for untrusted input. The experimental expression API is not a general-purpose sandbox.
- Apply limits outside the library where necessary, such as request size limits, concurrency limits, timeouts, or process isolation. A timeout in the caller alone does not necessarily interrupt synchronous computation.

## Tasks and workers

`@math.gl/core/tasks` can execute task code locally or in workers. Consider these boundaries when configuring a runner and processing untrusted inputs:

- **Executable code:** Task implementations, worker scripts, and dynamically loaded libraries are code with the privileges of their execution environment. Select them from trusted sources; do not let untrusted input choose arbitrary scripts, URLs, or module paths.
- **Isolation:** A worker can improve responsiveness, but it is not by itself a security sandbox. Use an appropriately isolated process or service when executing untrusted code, and restrict its filesystem, network, credentials, and other privileges.
- **Messages and resources:** Validate messages and transferred data on both sides of the boundary. Bound queue length, concurrency, input and output size, and execution time; define cancellation and cleanup behavior. Account for transferred buffers becoming unavailable to the sender and for shared mutable memory where applicable.
- **Remote assets:** If an application fetches worker code or data, control allowed origins and redirects, use trusted transport, and consider server-side request forgery when URLs reach a server. Apply the application's content security policy and avoid exposing credentials to untrusted destinations.

`maxConcurrency` bounds active task lifetimes, but does not bound the bytes held by queued calls. Limit admission and input sizes upstream. Worker cancellation terminates the worker and cannot guarantee task cleanup; local tasks must cooperate with cancellation, and synchronous work cannot respond to an abort mid-call. See the [tasks guide](../modules/core/tasks/README.md) for execution and ownership details.

## Dependencies and distribution

math.gl packages have different dependency sets; inspect the relevant package manifests and your resolved dependency tree, including transitive dependencies. Keep dependencies and lockfiles updated, review security advisories, and use your package manager's audit and integrity facilities. Build-time tools and website or example dependencies have a different exposure from runtime dependencies, but can still affect the software supply chain.

Install packages and obtain external data from trusted sources. Review dependency and build changes, protect publishing credentials, and use least privilege in build and release environments.
