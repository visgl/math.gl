# Projection

<!-- -->

Choose a coordinate system, build a transformation, and explore how the world can be mapped. Start with the foundations or jump into the topic you need.

01

## Foundations

Start with coordinate systems, then choose a projection and understand its limits.

### [Start here](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/api-guide.md)

[A first transformation and the main APIs you’ll use.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/api-guide.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/api-guide.md)

### [Coordinates](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/coordinate-systems.md)

[Units, axis order, reference frames, and height.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/coordinate-systems.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/coordinate-systems.md)

### [Projections](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/projections.md)

[Compare projection families and their trade-offs.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/projections.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/projections.md)

### [Support](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/support.md)

[Check which definitions and operations are supported.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/support.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/support.md)

02

## Transforms

Build reusable transformation pipelines and connect them to your application.

### [Projection engine](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/projection-engine.md)

[Resolve CRS definitions and reuse transformations.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/projection-engine.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/projection-engine.md)

### [External engines](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/external-projection-engines.md)

[Integrate proj4, D3, or an application-owned engine.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/external-projection-engines.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/external-projection-engines.md)

### [Deformation](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/deformation-models.md)

[Work with velocity models and coordinate epochs.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/deformation-models.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/deformation-models.md)

### [Map engine](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/developer-guide/map-engine.md)

[Prepare geometry for clipping, layout, and display.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/developer-guide/map-engine.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/developer-guide/map-engine.md)

03

## Layouts

Explore maps that go beyond a single continuous projection.

### [Discontinuous maps](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/developer-guide/discontinuous-projections.md)

[Use interruptions, insets, and multiple charts.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/developer-guide/discontinuous-projections.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/developer-guide/discontinuous-projections.md)

### [Myriahedral maps](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/myriahedral-maps.md)

[Unfold the globe into a geographically organized net.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/myriahedral-maps.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/myriahedral-maps.md)

### [Elastic maps](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/elastic-maps.md)

[Explore flexible, mesh-based map projections.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/elastic-maps.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/elastic-maps.md)

### [Catalogue](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/projection-catalog.md)

[Browse the available world projection families.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/projection-catalog.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/projection-catalog.md)

### [Map layouts](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps.md)

[Understand chart placement and layout composition.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps.md)

### [Myriahedral construction](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/developer-guide/myriahedral-projections.md)

[Build panel layouts and choose cuts.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/developer-guide/myriahedral-projections.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/developer-guide/myriahedral-projections.md)

### [Myriahedral API](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/myriahedral.md)

[Configure and evaluate a panel-based map.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/myriahedral.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/myriahedral.md)

04

## Validation

Inspect the evidence behind numerical accuracy and performance.

### [Accuracy and qualification](https://visgl.github.io/math.gl/next/docs/modules/geospatial/guide/projection/validation.md)

[Supported domains, independent references, audits, and measurements.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/guide/projection/validation.md)

[↗](https://visgl.github.io/math.gl/next/docs/modules/geospatial/guide/projection/validation.md)
