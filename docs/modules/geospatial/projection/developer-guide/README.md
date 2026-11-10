---
slug: /modules/geospatial/guide/projection
---

# Projection

import GuideHub from '@site/src/components/guide-hub';

Choose a coordinate system, build a transformation, and explore how the world can be mapped. Start with the foundations or jump into the topic you need.

<GuideHub sections={[
  {
    "title": "Foundations",
    "description": "Start with coordinate systems, then choose a projection and understand its limits.",
    "items": [
      {
        "title": "Start here",
        "to": "/docs/modules/geospatial/projection/developer-guide/api-guide",
        "description": "A first transformation and the main APIs you’ll use."
      },
      {
        "title": "Coordinates",
        "to": "/docs/modules/geospatial/projection/coordinate-systems",
        "description": "Units, axis order, reference frames, and height."
      },
      {
        "title": "Projections",
        "to": "/docs/modules/geospatial/projection/projections",
        "description": "Compare projection families and their trade-offs."
      },
      {
        "title": "Support",
        "to": "/docs/modules/geospatial/projection/support",
        "description": "Check which definitions and operations are supported."
      }
    ]
  },
  {
    "title": "Transforms",
    "description": "Build reusable transformation pipelines and connect them to your application.",
    "items": [
      {
        "title": "Projection engine",
        "to": "/docs/modules/geospatial/projection/projection-engine",
        "description": "Resolve CRS definitions and reuse transformations."
      },
      {
        "title": "External engines",
        "to": "/docs/modules/geospatial/projection/developer-guide/external-projection-engines",
        "description": "Integrate proj4, D3, or an application-owned engine."
      },
      {
        "title": "Deformation",
        "to": "/docs/modules/geospatial/projection/deformation-models",
        "description": "Work with velocity models and coordinate epochs."
      },
      {
        "title": "Map engine",
        "to": "/docs/modules/geospatial/maps/developer-guide/map-engine",
        "description": "Prepare geometry for clipping, layout, and display."
      }
    ]
  },
  {
    "title": "Layouts",
    "description": "Explore maps that go beyond a single continuous projection.",
    "items": [
      {
        "title": "Discontinuous maps",
        "to": "/docs/modules/geospatial/maps/developer-guide/discontinuous-projections",
        "description": "Use interruptions, insets, and multiple charts."
      },
      {
        "title": "Myriahedral maps",
        "to": "/docs/modules/geospatial/maps/myriahedral-maps",
        "description": "Unfold the globe into a geographically organized net."
      },
      {
        "title": "Elastic maps",
        "to": "/docs/modules/geospatial/maps/elastic-maps",
        "description": "Explore flexible, mesh-based map projections."
      },
      {
        "title": "Catalogue",
        "to": "/docs/modules/geospatial/maps/projection-catalog",
        "description": "Browse the available world projection families."
      },
      {
        "title": "Map layouts",
        "to": "/docs/modules/geospatial/maps",
        "description": "Understand chart placement and layout composition."
      },
      {
        "title": "Myriahedral construction",
        "to": "/docs/modules/geospatial/maps/developer-guide/myriahedral-projections",
        "description": "Build panel layouts and choose cuts."
      },
      {
        "title": "Myriahedral API",
        "to": "/docs/modules/geospatial/maps/myriahedral",
        "description": "Configure and evaluate a panel-based map."
      }
    ]
  },
  {
    "title": "Validation",
    "description": "Inspect the evidence behind numerical accuracy and performance.",
    "items": [
      {
        "title": "Accuracy and qualification",
        "to": "/docs/modules/geospatial/guide/projection/validation",
        "description": "Supported domains, independent references, audits, and measurements."
      }
    ]
  }
]} />
