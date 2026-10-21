# Wrap proj4 and D3 projections

Applications can implement the [`ProjectionEngine`](../api-reference/projection-engine.md)
interface around another library. This lets consumers accept a common factory while
leaving coordinate conversion to proj4js or D3. These are application adapters;
math.gl does not register or load these libraries for you.

Install the backend you need:

```sh
yarn add proj4
# Or, for cartographic display projections:
yarn add d3-geo
yarn add --dev @types/d3-geo
```

## Share the transform plumbing

An engine must return the full `ProjectionInstance` interface, including synchronous,
reusable-output and in-place buffer methods. The following helper implements that
interface for **two-dimensional coordinates only**. It rejects extra ordinates rather
than silently treating height as a horizontal coordinate. It allocates temporary
arrays, so it is a starting point for integration, not an optimized batch backend.

```typescript title="point-projection.ts"
import type {ProjectionInstance} from '@math.gl/projection/types';

type Buffer = Float32Array | Float64Array;
type Coordinate = readonly number[] | Buffer;
type Output = number[] | Buffer;
type PointOperation = (point: [number, number]) => readonly number[] | null;

export function pointProjection(
  forward: PointOperation,
  inverse: PointOperation
): ProjectionInstance {
  function convert(input: Coordinate, operation: PointOperation): number[] {
    if (input.length !== 2 || !Array.from(input).every(Number.isFinite)) {
      throw new Error('Expected two finite coordinates');
    }
    const result = operation([input[0], input[1]]);
    if (!result || !Number.isFinite(result[0]) || !Number.isFinite(result[1])) {
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

## Wrap proj4js

[Proj4js](https://proj4js.org/) prepares a converter with `proj4(from, to)` and
exposes `forward` and `inverse` methods. The adapter accepts string definitions
(PROJ strings, WKT or registered names), with WGS84 as the default at both ends.
It forwards `enforceAxis` in both directions. Register additional named definitions
and any required datum grids with proj4 before creating a transform.

```typescript title="proj4-engine.ts"
import proj4 from 'proj4';
import type {CreateProjectionOptions, ProjectionEngine} from '@math.gl/projection/types';
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

CRS interpretation, datum handling and errors come from proj4js, not math.gl's
normalizer. This wrapper does not provide math.gl's strict CRS validation or
horizontal extraction mode, so it rejects `mode` explicitly.

## Wrap a D3 projection

[D3 projections](https://d3js.org/d3-geo/projection) map longitude/latitude in degrees
to display coordinates. Their scale, translation, rotation and Y direction are part
of that mapping. They use spherical geometry; their output is not an EPSG projected
CRS in metres. Use an application name such as `display:mercator` for the target.

Supply a factory that creates a fresh configured D3 projection for every transform.
This prevents later configuration changes from affecting other transforms. This
example supports only WGS84 longitude/latitude input and requires an inverse.

```typescript title="d3-engine.ts"
import {geoMercator, type GeoProjection} from 'd3-geo';
import type {CreateProjectionOptions, ProjectionEngine} from '@math.gl/projection/types';
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

To use another invertible D3 projection, change the factory and the accepted target
identifier together. A finite point result does not guarantee visibility: direct
point projection bypasses D3's stream clipping. For lines and polygons, retain
[`geoPath`](https://d3js.org/d3-geo/path) and D3's streaming pipeline for clipping,
antimeridian splitting and adaptive resampling. Inversion can also be ambiguous
outside a projection's useful domain; validate the domain required by your app.

## Use either backend in application code

Accept `ProjectionEngine` in consumers and select the backend at setup time. Use
`createProjectionAsync()` when you want a ready synchronous `ProjectionInstance`,
including when the engine might use lazy math.gl algorithms. The method does not
make these external adapters asynchronous internally or load external grid data.

The interface unifies method names, not projection semantics or capabilities.
Keep the supported CRS pairs, units, axis conventions and dimensional limits of
each adapter explicit. A new backend does not become a math.gl `ProjectionPlugin`;
use a plugin instead when math.gl should own CRS parsing and datum operations.
