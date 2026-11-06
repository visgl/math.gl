# Projection

<!-- -->

Choose a coordinate system, build a transformation, and explore how the world can be mapped. Start with the foundations or jump into the topic you need.

01

## Foundations

Start with coordinate systems, then choose a projection and understand its limits.

### [Start here](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/api-guide.md)

[A first transformation and the main APIs you’ll use.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/api-guide.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/api-guide.md)

### [Coordinates](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/coordinate-systems)

[Units, axis order, reference frames, and height.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/coordinate-systems)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/coordinate-systems)

### [Projections](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/projections)

[Compare projection families and their trade-offs.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/projections)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/projections)

### [Support](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/support)

[Check which definitions and operations are supported.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/support)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/support)

02

## Transforms

Build reusable transformation pipelines and connect them to your application.

### [Projection engine](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/projection-engine)

[Resolve CRS definitions and reuse transformations.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/projection-engine)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/projection-engine)

### [External engines](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/external-projection-engines.md)

[Integrate proj4, D3, or an application-owned engine.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/external-projection-engines.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/external-projection-engines.md)

### [Deformation](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/deformation-models)

[Work with velocity models and coordinate epochs.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/deformation-models)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/deformation-models)

### [Map engine](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/map-engine.md)

[Prepare geometry for clipping, layout, and display.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/map-engine.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/map-engine.md)

03

## Layouts

Explore maps that go beyond a single continuous projection.

### [Discontinuous maps](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/discontinuous-projections.md)

[Use interruptions, insets, and multiple charts.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/discontinuous-projections.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/discontinuous-projections.md)

### [Myriahedral maps](https://visgl.github.io/math.gl/next/docs/modules/geospatial/myriahedral-maps.md)

[Unfold the globe into a geographically organized net.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/myriahedral-maps.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/myriahedral-maps.md)

### [Elastic maps](https://visgl.github.io/math.gl/next/docs/modules/geospatial/elastic-maps.md)

[Explore flexible, mesh-based map projections.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/elastic-maps.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/elastic-maps.md)

### [Catalogue](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/projection-catalog.md)

[Browse the available world projection families.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/projection-catalog.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/projection-catalog.md)

### [Map layouts](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous.md)

[Understand chart placement and layout composition.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous.md)

### [Myriahedral construction](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/myriahedral-projections.md)

[Build panel layouts and choose cuts.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/myriahedral-projections.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/myriahedral-projections.md)

### [Myriahedral API](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/myriahedral.md)

[Configure and evaluate a panel-based map.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/myriahedral.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/myriahedral.md)

04

## Validation

Inspect the evidence behind numerical accuracy and performance.

### [Accuracy and qualification](https://visgl.github.io/math.gl/next/docs/modules/geospatial/guide/projection/validation.md)

[Supported domains, independent references, audits, and measurements.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/guide/projection/validation.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/guide/projection/validation.md)
