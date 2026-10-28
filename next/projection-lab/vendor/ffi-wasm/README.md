# clj-native

[![CI](https://github.com/willcohen/clj-native/actions/workflows/ci.yml/badge.svg)](https://github.com/willcohen/clj-native/actions/workflows/ci.yml)
[![Clojars](https://img.shields.io/clojars/v/net.willcohen/native.svg)](https://clojars.org/net.willcohen/native)
[![npm](https://img.shields.io/npm/v/ffi-wasm.svg)](https://www.npmjs.com/package/ffi-wasm)

clj-native helps a Clojure or Squint (ClojureScript) library bind a C library.
The library declares each C function one time. It can then call the function
on each of the three backends below.

## Install

npm: [`ffi-wasm`](https://www.npmjs.com/package/ffi-wasm). Clojars:
[`net.willcohen/native`](https://clojars.org/net.willcohen/native), with the
namespaces `net.willcohen.native.*`. The badges show the current version. Do
not use a version range, because the API can change.

## Use

Make one library value with `dispatch/library`. Call each C function with
`dispatch/call!`. Register one handler spec for each library with
`workload-pool/register-handler!`. The docstrings of these functions give
their options.

## Backends

The host and the build of the C library select the backend.

|                | native `.so`, `.dylib`, `.dll`    | emscripten `.wasm`                   |
|----------------|-----------------------------------|--------------------------------------|
| **JVM**        | Panama, through dt-ffi (`:ffi`)   | GraalWasm, through `ccall` (`:graal`) |
| **JavaScript** | not possible                      | worker pool, through `ccall`         |

A JavaScript host cannot load a native library. The worker pool uses
[worker-router](https://github.com/willcohen/worker-router), which runs on
Node `worker_threads` and in browser Web Workers.

The two WASM backends load the same emscripten build and call C through its
`ccall`. `dispatch/library` computes the `ccall` types of each function one
time. The FFI backend binds each C symbol directly and ignores these types.

On the JVM, `platform-state/try-init!` runs the FFI bootstrap and records
`:ffi`. If the FFI bootstrap throws, `try-init!` runs the GraalVM bootstrap
and records `:graal`. After `platform-state/force-graal!`, the next init runs
only the GraalVM bootstrap.

The GraalVM backend has a different memory model and a polyglot lock. The
`graal-wasm` namespace docstring gives the lock rules. It also gives the
exports that the emscripten module must have. The `bootstrap-graal-module!`
docstring gives the loader options.

## Build helpers

These parts make the files that the backends load:

- `net.willcohen.native.build`, in `src/bb`, makes the native library and the
  emscripten `.wasm` with its loader. It runs on babashka only.
- `gen-handler` makes the handler module for the JavaScript worker pool.
- `flake.nix` supplies the toolchain. Refer to [Nix flake](#nix-flake).

The `build.clj` at the repository root is only the tools.build script for the
clj-native jar.

## Heap helpers

Because the JVM and JavaScript get access to the emscripten heap through
different APIs, clj-native has one implementation of each helper for each
host.

| Helper | JVM | JavaScript (npm) |
|---|---|---|
| ccall | `graal-wasm/ccall` | `handler-heap/ccallMethod` |
| heap read and write | `graal-wasm/read-heap-array`, `heap-write-bytes!` | `heapHelpers` `heap*_get`, `heap*_set` |
| malloc, free, UTF-8 | `graal-wasm/malloc`, `free-on-heap`, `utf8->string` | `heapHelpers` `malloc`, `free`, `utf8_to_string` |
| blocking HTTP for C | `net.willcohen.native.http` | `http-bridge`, with `fetch-worker` on Node |
| callback from C to the host | `callbacks` (Panama upcall), `graal-wasm/put-js-globals!` | a method of the consumer handler |
| C string array to strings | `graal-wasm/string-array-pointer->strs` | none |
| C struct to map | `graal-wasm/read-struct` | none |

`heapHelpers(getModule)` returns an object of methods. Spread it into the
object that the `methods(ffi)` of the overrides module returns, before the
consumer's own keys. A consumer key with the same name replaces the helper.

On JavaScript, a consumer writes its string-array and struct reads in its own
overrides module, which knows the struct layouts of its library. On the JVM,
`read-struct` takes the layout as an argument.

## Packages

The npm package [`ffi-wasm`](https://www.npmjs.com/package/ffi-wasm) ships
its own modules in `dist/`. `ffi-wasm.mjs` is an esbuild bundle of the page
side. `handler.mjs` holds the worker side. The modules that the two share are
files of their own, and each importer imports them by a relative path, so a
page or a Node process loads one copy of each. `./handler`, `./handler-*`,
`./http-bridge`, `./fetch-worker` and `./test-runner` point at their own
files, and each other subpath points at `ffi-wasm.mjs`. `dist/` holds no other
package: a page maps `ffi-wasm`, `worker-router`,
`worker-router/worker-bootstrap`, `comlink`, `squint-cljs/` and
`resource-tracker` in its importmap, one copy of each. A page that imports a
subpath also maps it to the file of that subpath.

A module worker does not use the importmap of the page. `handler.mjs` and the
shared modules import only each other and `node:` builtins, and `init-pool!`
gives each handler the URL of `handler.mjs`. Worker code imports
`ffi-wasm/handler` or a worker-side subpath, not `ffi-wasm`. A bundler of
worker code marks `node:*` as external. The `gen-handler-source` docstring
gives the contract of the overrides module.

Besides `dist/`, the package holds `macros.cljc`, because squint expands the
macros at compile time, and `macros.mjs`, which the squint output of a
consumer imports by path.

The jar [`net.willcohen/native`](https://clojars.org/net.willcohen/native)
holds the source of these 13 namespaces, and a clj-kondo config export. It
holds no `.mjs` file. Each namespace docstring is the reference.

| Namespace | Contents |
|---|---|
| `dispatch` | `library` and `call!`, the call path for each C function |
| `macros` | Helpers for a consumer's wrapper macro |
| `workload-pool` | The handler registry above `pool`, and the JVM executor slots |
| `pool` | The worker-router wrapper, on CLJS |
| `platform-state` | Backend selection and init |
| `platform` | JVM platform detection, and the FFI bootstrap |
| `graal-wasm` | The JVM WASM backend, on GraalVM polyglot |
| `ffi-mem` | JVM native-memory reads and writes, for the FFI backend |
| `callbacks` | JVM dt-ffi upcall registration |
| `http` | The blocking host HTTP transport for a WASM or native library |
| `gen-handler` | The build-time generator of the handler module |
| `build` | Build helpers for a consumer's bb tasks, in `src/bb` |
| `test-runner` | A `cljs.test` runner that always exits the Node process |

## Build, test and deploy

```sh
bb build:js          # compile the npm .cljc modules to .mjs
bb jar               # build the JVM jar (net.willcohen/native)
bb test              # run test:clj, test:cljs and test:bb
bb deploy:npm        # publish ffi-wasm to npm
bb deploy:clojars    # publish net.willcohen/native to Clojars
```

Each test directory holds the suites of one runtime:

- `test/clj/`: JVM suites (`clojure.test`), for `bb test:clj`.
- `test/cljc/`: suites for both runtimes. `test:clj` and `test:cljs` run the
  same body.
- `test/cljs/`: CLJS suites (`cljs.test`), for `bb test:cljs`. squint compiles
  them, and Node runs them.
- `test/bb/`: tests of the babashka build helpers, for `bb test:bb`.

## Nix flake

Add the flake as an input to a build or a dev shell:

```nix
inputs.clj-native.url = "github:willcohen/clj-native";
```

`devShells.default` is the clj-native dev shell. It has the Clojure toolchain,
zig, and Node for the tests.

`lib.<system>.mkCrossShells` returns the `devShells` set (`default`) for a
library that binds a C library. Its arguments are `jdk`, `extraBuildInputs`
and `extraDevInputs`. `lib.<system>.actualSystem` is the real system in a
NixOS container, where `system` can name the host.

### Linux and Windows libraries with zig

The dev shell has zig, `readelf` and `llvm-readobj`. zig builds the Linux and
Windows libraries on a Linux or macOS host.
`net.willcohen.native.build/zig-toolchain!` writes the compiler wrappers for
one of five resource directories. It returns the env, the configure `--host`
and the CMake args.

| Directory | zig target | Loads on |
|---|---|---|
| `linux-amd64`, `linux-aarch64` | `<arch>-linux-gnu.2.28` | glibc 2.28 and later |
| `linux-amd64-musl`, `linux-aarch64-musl` | `<arch>-linux-musl` | musl |
| `windows-amd64` | `x86_64-windows-gnu` | Windows 10 and later |

On musl Linux, `platform/extract-and-bind-library!` tries `<os>-<arch>-musl/`
first, and then `<os>-<arch>/`.

zig links compiler-rt into each library. For C++ code, zig also links libc++,
libc++abi and libunwind into the library, in place of libstdc++ and libgcc.
These LLVM runtimes are under Apache-2.0 WITH LLVM-exception.

zig links libc dynamically. From glibc, a `linux-<arch>` library holds only
the libc_nonshared wrappers, for example `stat` and `atexit`. The glibc link
exception covers these wrappers. A `windows-amd64` library holds mingw-w64
runtime code, under the ZPL 2.1 and permissive licenses. Ship their notices
with the library.

With the env and the CMake args of `zig-toolchain!`, a build finds no library,
header or pkg-config file on the build machine. Give each dependency to CMake
by its path, for example `-DZLIB_LIBRARY`.

### Library checks

After the build, check each library before it ships. Each check prints `OK`,
or throws with a list of the errors.

`check-linux-lib!` reads the library with `readelf`. It throws when the
library is not a shared object for the arch of its directory. It also throws
when the library has a run path, or needs libstdc++ or libgcc. A glibc library
can load only glibc libraries, up to glibc 2.28. A musl library can load only
`libc.so`.

`check-windows-lib!` reads the DLL with `llvm-readobj`. It throws when the
file is not an AMD64 DLL. It also throws when the DLL imports a DLL other than
KERNEL32, SHELL32 or the UCRT (`api-ms-win-crt-*`), for example a mingw
runtime DLL.

`check-darwin-lib!` reads the dylib with `otool`. It throws for a universal
binary, because each resource directory takes a thin dylib. It also throws
when the dylib loads a library outside `/usr/lib` and `/System/Library`, or
has a run path. A run path names a directory on the build machine.

## License

Apache-2.0 WITH LLVM-exception. Refer to [`LICENSE`](LICENSE).
