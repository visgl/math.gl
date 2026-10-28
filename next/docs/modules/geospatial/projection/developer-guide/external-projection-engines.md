# Using external projection engines

External libraries can provide CRS definitions, execute coordinate operations, or do both. Use the opt-in [`CRSResolver`](https://visgl.github.io/math.gl/next/docs/modules/geospatial/crs/api-reference/resolver.md) for definition lookup. Libraries with synchronous coordinate operations can also implement the [`ProjectionEngine`](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/api-reference/projection-engine.md) interface. Applications written against math.gl's projection interfaces can still use external projection engines through these adapters. math.gl does not register or load external libraries for you, and they are not dependencies of published math.gl packages.

## Integrate proj-wasm[​](#integrate-proj-wasm "Direct link to Integrate proj-wasm")

[proj-wasm](https://github.com/willcohen/clj-proj) provides PROJ through WebAssembly. The [runnable Node and browser example](https://github.com/visgl/math.gl/tree/master/examples/geospatial/proj-wasm-crs) pins **0.1.0** and demonstrates two distinct uses of its public API.

### Resolve definitions for native math.gl execution[​](#resolve-definitions-for-native-mathgl-execution "Direct link to Resolve definitions for native math.gl execution")

The example's `createProjWasmProvider` owns a PROJ context, disables network access, uses `projCreateFromDatabase` and `projAsProjjson`, and destroys each temporary PJ object. It records the package and EPSG database revision in lookup provenance. Its source is in `examples/geospatial/proj-wasm-crs/provider.mjs`:

```
import * as proj from 'proj-wasm';

import {createCRSResolver} from '@math.gl/geospatial/crs';

import {FullProjectionEngine} from '@math.gl/geospatial/projection';

import {createProjWasmProvider} from './provider.mjs';



await proj.init({workers: 1});

let backend;

try {

  backend = await createProjWasmProvider(proj);

  const resolver = createCRSResolver({providers: [backend.provider]});

  const engine = new FullProjectionEngine({resolver});

  const projection = await engine.createProjectionAsync({to: 'EPSG:8857'});

  const xyz = projection.project([12, 55, 123]); // Native, synchronous Equal Earth.

} finally {

  try { await backend?.dispose(); }

  finally { await proj.shutdown(); }

}
```

Initialization and lookup are asynchronous. The prepared native transform then runs synchronously and retains math.gl's validation and dimensional conventions. Resolution expands the identifier catalogue, not the set of supported native operations: the example resolves compound `EPSG:7405` but verifies that strict native execution still rejects it. A resolved CRS does not establish that required datum grids, epoch handling or vertical operations are available.

Keep the worker pool application-owned when sharing it. Dispose the provider only after preparation is complete, and create a fresh resolver if its catalogue or configuration changes. The example serves locked dependencies and adjacent WASM, worker and database assets locally; its browser smoke test rejects external requests.

### Execute operations with proj-wasm itself[​](#execute-operations-with-proj-wasm-itself "Direct link to Execute operations with proj-wasm itself")

proj-wasm 0.1.0's public worker API remains asynchronous after initialization. `createProjectionAsync()` in math.gl must return a **synchronous** `PreparedProjection`, so returning promises from its point or buffer methods would violate the contract. Use a separate asynchronous preprocessing step for direct PROJ execution.

The runnable example calls `projCreateCrsToCrs`, normalizes authority axes with `projNormalizeForVisualization`, and awaits `projTransArray`. It compares this independent PROJ result with native math.gl for `EPSG:8857`, then releases both operations and their context. Input is explicitly longitude/latitude/ellipsoidal height; do not map an arbitrary fourth measure ordinate to PROJ's time ordinate. Network/grid acquisition and operation selection remain application policies.

Node integration tests and a Chromium smoke test exercise the actual pinned package, including offline asset loading, inverse coordinates and unsupported CRS behavior. Provider unit tests cover lifecycle and failures. See the example README for build, test and serving commands.

## Switch engines in the same application[​](#switch-engines-in-the-same-application "Direct link to Switch engines in the same application")

Applications written against math.gl's projection interfaces can still work with external projection engines using this recipe: adapt a backend to `ProjectionEngine`, return a synchronous `PreparedProjection`, and inject it into the application. The rendering code below is unchanged when you select math.gl, proj4js or D3.

<!-- -->

The same application projects a graticule and a location through the selected engine.

Preparing engine…

XY only · latitude −80° to 80° · spherical Mercator · D3 scale 6,378,137, zero translation, north-positive Y. No datum or height conversion.

[Open the separate example page](https://visgl.github.io/math.gl/next/examples/external-projection-engines) for the recipe, source and limits. The comparison uses XY spherical Mercator with matching units and axes; it does not imply that all backend CRS or geometry capabilities coincide.

## Synchronous adapters[​](#synchronous-adapters "Direct link to Synchronous adapters")

Install the backend you need:

```
yarn add proj4

# Or, for cartographic display projections:

yarn add d3-geo

yarn add --dev @types/d3-geo
```

## Share the transform plumbing[​](#share-the-transform-plumbing "Direct link to Share the transform plumbing")

An engine must return the full `PreparedProjection` interface, including synchronous, reusable-output and in-place buffer methods. The following helper implements that interface for **two-dimensional coordinates only**. It rejects extra ordinates rather than silently treating height as a horizontal coordinate. It allocates temporary arrays, so it is a starting point for integration, not an optimized batch backend.

point-projection.ts

```
import type {PreparedProjection} from '@math.gl/geospatial/projection/types';



type Buffer = Float32Array | Float64Array;

type Coordinate = readonly number[] | Buffer;

type Output = number[] | Buffer;

type PointOperation = (point: [number, number]) => readonly number[] | null;



export function pointProjection(

  forward: PointOperation,

  inverse: PointOperation

): PreparedProjection {

  function convert(input: Coordinate, operation: PointOperation): number[] {

    if (input.length !== 2 || !Array.from(input).every(Number.isFinite)) {

      throw new Error('Expected two finite coordinates');

    }

    const result = operation([input[0], input[1]]);

    if (!result || result.length !== 2 ||

        !Number.isFinite(result[0]) || !Number.isFinite(result[1])) {

      throw new Error('Point is outside the supported projection domain');

    }

    return [result[0], result[1]];

  }



  function write<T extends Output>(

    input: Coordinate, output: T, operation: PointOperation

  ): T {

    if (output.length < 2) throw new Error('Output needs space for two coordinates');

    const result = convert(input, operation);

    if (output instanceof Float32Array && !result.every(x => Number.isFinite(Math.fround(x)))) {

      throw new Error('Projected coordinate exceeds Float32 range');

    }

    output[0] = result[0];

    output[1] = result[1];

    return output;

  }



  function flat<T extends Buffer>(

    buffer: T, dimension: number, operation: PointOperation

  ): T {

    if (dimension !== 2 || buffer.length % 2 !== 0) {

      throw new Error('Expected a packed XY buffer with dimension 2');

    }

    // Stage all results so an invalid point leaves the input buffer unchanged.

    const result = (buffer instanceof Float32Array

      ? new Float32Array(buffer.length)

      : new Float64Array(buffer.length)) as T;

    for (let i = 0; i < buffer.length; i += 2) {

      const point = convert([buffer[i], buffer[i + 1]], operation);

      result[i] = point[0];

      result[i + 1] = point[1];

      if (!Number.isFinite(result[i]) || !Number.isFinite(result[i + 1])) {

        throw new Error('Projected coordinate exceeds buffer range');

      }

    }

    buffer.set(result);

    return buffer;

  }



  const project = (input: readonly number[]) => convert(input, forward);

  const unproject = (input: readonly number[]) => convert(input, inverse);

  const projectTo = <T extends Output>(input: Coordinate, output: T): T =>

    write(input, output, forward);

  const unprojectTo = <T extends Output>(input: Coordinate, output: T): T =>

    write(input, output, inverse);

  const projectFlat = <T extends Buffer>(buffer: T, dimension = 2): T =>

    flat(buffer, dimension, forward);

  const unprojectFlat = <T extends Buffer>(buffer: T, dimension = 2): T =>

    flat(buffer, dimension, inverse);



  return {

    lossy: false, // No dimensions or CRS components are silently discarded.

    preload: async () => {},

    project, unproject, projectTo, unprojectTo, projectFlat, unprojectFlat,

    projectSync: project, unprojectSync: unproject,

    projectToSync: projectTo, unprojectToSync: unprojectTo,

    projectFlatSync: projectFlat, unprojectFlatSync: unprojectFlat

  };

}
```

## Wrap proj4js[​](#wrap-proj4js "Direct link to Wrap proj4js")

[Proj4js](https://proj4js.org/) prepares a converter with `proj4(from, to)` and exposes `forward` and `inverse` methods. The adapter accepts string definitions (PROJ strings, WKT or registered names), with WGS84 as the default at both ends. It forwards `enforceAxis` in both directions. Register additional named definitions and any required datum grids with proj4 before creating a transform.

proj4-engine.ts

```
import proj4 from 'proj4';

import type {CreateProjectionOptions, ProjectionEngine} from '@math.gl/geospatial/projection/types';

import {pointProjection} from './point-projection';



export class Proj4Engine implements ProjectionEngine {

  createProjection({from = 'WGS84', to = 'WGS84', enforceAxis = false, mode}:

    CreateProjectionOptions = {}) {

    if (typeof from !== 'string' || typeof to !== 'string' || mode !== undefined) {

      throw new Error('This adapter supports string CRS definitions and no mode option');

    }

    const converter = proj4(from, to);

    return pointProjection(

      point => converter.forward(point, enforceAxis),

      point => converter.inverse(point, enforceAxis)

    );

  }



  async createProjectionAsync(options: CreateProjectionOptions = {}) {

    return this.createProjection(options);

  }

}



const engine: ProjectionEngine = new Proj4Engine();

const projection = await engine.createProjectionAsync({to: 'EPSG:3857'});

const xy = projection.project([12, 55]);

const lonLat = projection.unproject(xy);

const points = new Float64Array([12, 55, 3, 45]);

projection.projectFlat(points); // Mutates and returns points.
```

CRS interpretation, datum handling and errors come from proj4js, not math.gl's normalizer. This wrapper does not provide math.gl's strict CRS validation or horizontal extraction mode, so it rejects `mode` explicitly.

## Wrap a D3 projection[​](#wrap-a-d3-projection "Direct link to Wrap a D3 projection")

[D3 projections](https://d3js.org/d3-geo/projection) map longitude/latitude in degrees to display coordinates. Their scale, translation, rotation and Y direction are part of that mapping. They use spherical geometry; their output is not an EPSG projected CRS in metres. Use an application name such as `display:mercator` for the target.

Supply a factory that creates a fresh configured D3 projection for every transform. This prevents later configuration changes from affecting other transforms. This example supports only WGS84 longitude/latitude input and requires an inverse.

d3-engine.ts

```
import {geoMercator, type GeoProjection} from 'd3-geo';

import type {CreateProjectionOptions, ProjectionEngine} from '@math.gl/geospatial/projection/types';

import {pointProjection} from './point-projection';



export class D3Engine implements ProjectionEngine {

  constructor(private readonly makeProjection: () => GeoProjection) {}



  createProjection({from = 'WGS84', to = 'display:mercator', enforceAxis, mode}:

    CreateProjectionOptions = {}) {

    if ((from !== 'WGS84' && from !== 'EPSG:4326') || to !== 'display:mercator' ||

        enforceAxis || mode !== undefined) {

      throw new Error('Expected longitude/latitude to display:mercator');

    }

    const projection = this.makeProjection();

    const invert = projection.invert;

    if (!invert) throw new Error('The D3 projection must support invert');

    return pointProjection(

      point => projection(point),

      point => invert.call(projection, point)

    );

  }



  async createProjectionAsync(options: CreateProjectionOptions = {}) {

    return this.createProjection(options);

  }

}



const engine: ProjectionEngine = new D3Engine(() =>

  geoMercator().scale(150).translate([480, 250])

);

const projection = await engine.createProjectionAsync({to: 'display:mercator'});

const screen = projection.project([12, 55]);

const lonLat = projection.unproject(screen);

const output = new Float64Array(2);

projection.projectTo([12, 55], output); // Writes into output.
```

To use another invertible D3 projection, change the factory and the accepted target identifier together. A finite point result does not guarantee visibility: direct point projection bypasses D3's stream clipping. For lines and polygons, retain [`geoPath`](https://d3js.org/d3-geo/path) and D3's streaming pipeline for clipping, antimeridian splitting and adaptive resampling. Inversion can also be ambiguous outside a projection's useful domain; validate the domain required by your app.

## Use either backend in application code[​](#use-either-backend-in-application-code "Direct link to Use either backend in application code")

Consumers that also need `CRSEngine.getCRS()` require metadata, rendering bounds, normalization and sizing policy in addition to a prepared transform. Use the optional [`createCRSDescriptor`](https://visgl.github.io/math.gl/next/docs/modules/geospatial/crs/api-reference/crs-descriptor.md) helper to assemble those backend-owned decisions without math.gl's native CRS normalizer. Import the builder and descriptor types from the existing CRS entry point:

```
import {createCRSDescriptor, type CRSDescriptorOptions} from '@math.gl/geospatial/crs';
```

The helper adds no dependency on proj4js, D3 or proj-wasm. Applications install and own their chosen backend. Its tested proj4js example covers synchronous conversions and reusable outputs. Descriptor converters must be synchronous: preparing a backend asynchronously does not make an asynchronous point API usable as a converter.

For **proj-wasm**, use its asynchronous API for definition resolution followed by native math.gl preparation, or for separate asynchronous coordinate preprocessing. Do not pass promise-returning operations to `createCRSDescriptor`; it rejects them. See the [builder's contracts and limitations](https://visgl.github.io/math.gl/next/docs/modules/geospatial/crs/api-reference/crs-descriptor.md). The builder supplies metadata and rendering policy plumbing; it does not adapt an async execution API into a synchronous one.

Accept `ProjectionEngine` in consumers and select the backend at setup time. Use `createProjectionAsync()` when you want a ready synchronous `PreparedProjection`, including when the engine might use lazy math.gl algorithms. The method does not make these external adapters asynchronous internally or load external grid data.

The interface unifies method names, not projection semantics or capabilities. Keep the supported CRS pairs, units, axis conventions and dimensional limits of each adapter explicit. A new backend does not become a math.gl `ProjectionPlugin`; use a plugin instead when math.gl should own CRS parsing and datum operations.

## Asynchronous proj-wasm batches before rendering[​](#asynchronous-proj-wasm-batches-before-rendering "Direct link to Asynchronous proj-wasm batches before rendering")

Applications written against math.gl's projection interfaces can also use asynchronous external engines by separating preprocessing from synchronous rendering. The extended [proj-wasm example](https://github.com/visgl/math.gl/tree/master/examples/geospatial/proj-wasm-crs) prepares one normalized operation, transforms bounded packed XYZ batches, retains source row IDs, and transfers the resulting buffers to a math.gl task worker. It exercises real proj-wasm in both Node and Chromium; proj-wasm remains a private example dependency.

Its latest-view runner discards superseded results, while the processor serializes operation reuse, rejects partial failures and drains accepted work before disposal. Cancellation is cooperative rather than native-call preemption. Copying into and out of upstream WASM is separate from the explicitly verified transfer of completed buffers to the downstream task. Changed CRS/operation/grid state requires a new processor; source data and view revisions must still participate in result invalidation.

This recipe does not put Promise-returning functions into `CRSDescriptor.converter`. An async-only engine produces prepared geometry before the renderer consumes it. It also does not infer spherical stream clipping or repair topology: combine it with explicit geometry preparation for lines, polygons and rasters. Its XYZ/time policy and ownership boundaries are documented in the example README.
