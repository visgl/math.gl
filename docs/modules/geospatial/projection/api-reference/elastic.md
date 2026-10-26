# Elastic sampled maps

<p class="badges"><img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" /> <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" /></p>

For background, an interactive example, numerical limits, and attribution, see
[Elastic maps](../../elastic-maps.md). All APIs on this page are new in v5.0 and experimental.

## `MapDefinition: {type: 'elastic', data}`

Selects a sampled map in `new MapEngine(description)`. `data` is an
`ElasticMapData` value containing finite JSON numbers and nulls. The engine snapshots
it; later caller mutation does not change the compiled map. Output scale comes from
`MapDescription.radius` (default 1). The map supports points, lines, polygons,
layout fitting, inverse picking, and globe evaluation. It is not hinged.

## `elasticI`, `elasticII`, `elasticIII`

Optional datasets imported from `@math.gl/geospatial/elastic`. These are the three
published coordinate tables, not names that cause implicit network loading.
Their `radius: 6371` normalizes kilometer coordinates to approximately unit-globe scale.

## `parseElasticMap(text, options?)`

Imported from `@math.gl/geospatial/discontinuous`. Parses the author's published
text representation into JSON-safe `ElasticMapData`. Converts latitude/longitude
pairs to longitude/latitude and missing nodes from `NaN` to `null`. Recognizes the
boundary orientation convention, including complement sections. Validates the
trailing outline and inverse-table syntax; those inverse hints are not used.

`options.radius` specifies the output normalization radius in table units; default
6371. Compilation validates the geometry and grid. Malformed/truncated text,
unbounded dimensions, and unexpected trailing data throw. Input is limited to
32 million characters, 64 sections, and one million nodes per section.

## `createElasticMap(data, {radius = 1}?)`

Compiles a lower-level `MapSurface` with the same projection methods used by
MapEngine. It copies the grid values and compiled domains. `radius` must be positive
and finite. Most applications should construct MapEngine for viewport fitting,
picking, sampling defaults, and transition planning.

## `ElasticMapData` and `ElasticSection`

```typescript
type ElasticMapData = {
  version: 1;
  name: string;
  radius: number; // positive normalization radius, in table output units
  sections: readonly ElasticSection[];
};
type ElasticSection = {
  id: string;
  boundary: readonly (readonly [number, number])[];
  complement?: boolean;
  rows: number;
  columns: number;
  values: readonly (number | null)[];
};
```

Boundaries are closed straight segments in the longitude/latitude rectangle
`[-180, 180] × [-90, 90]`. They can be concave; `complement: true` selects the area
outside the ring within that rectangle. Keep explicit ±180° edges and polar edges.
Do not unwrap a boundary outside the rectangle.

Grid rows run uniformly from −90° to +90°, columns from −180° to +180°. Values
are interleaved x/y pairs, row-major, with length `rows * columns * 2`.
Both coordinates of an undefined node must be null. Every covered cell needs
valid interpolation nodes; geometry encountering an undefined interior throws
instead of silently producing holes or false connections. Point queries there return null.

## `MapSurface`

The rendering contract implemented by analytic and sampled maps: `regions`,
`seams`, `findRegions`, `containsConvexPolygon`, `projectPoint`, `unprojectPoint`,
`projectLine`, `projectPolygon`, and `getRegionOutlines`.

Regions provide convex geographic envelopes, while the methods apply the true
coverage. Elastic's `containsConvexPolygon` approves a ring only when an enclosing spherical
cap avoids every coverage boundary and every required interpolation node is defined.
Cells near cuts use full clipping, including narrow concavities and holes. For
sampled maps, seam edge indices refer to flattened coverage-ring edges. Treat
seam classification as descriptive; clipping uses the actual section polygons.
