# Earth Models and Geoid Heights

Use a sphere or ellipsoid for coordinate geometry, and a geoid model when converting between ellipsoidal and orthometric heights.

| Model | Represents | math.gl support |
| --- | --- | --- |
| Sphere | A surface with one radius | Spherical coordinates and spherical map projections |
| Ellipsoid | A surface defined by its axes | `Ellipsoid` and the shared `SpheroidParameters` contract |
| Geoid | A gravity-based reference surface near mean sea level | Geoid heights evaluated from a supplied grid |

These models serve different purposes. A spherical map projection does not describe terrain or establish a height reference; an ellipsoid supplies geometric coordinates, not a gravity model.

## Convert heights

Geoid height N is the separation between the geoid and the reference ellipsoid. Ellipsoidal height h and orthometric height H satisfy:

```text
h = H + N
```

`geoid.getHeight(latitude, longitude)` returns N in metres. The argument order is latitude first, unlike most longitude/latitude APIs in math.gl.

Use a grid appropriate to the application's reference system and accuracy requirements. The package includes optional EGM96 grids: a 1° preview for visualization and a 15′ grid for height conversion. Preview interpolation does not inherit the original grid's error estimates. See the [geoid overview](../README.md) for loading data and attribution.

Geoid heights are not terrain elevations. When height conversion is part of a CRS operation, use an explicitly configured [projection pipeline](../../projection/api-reference/projection-pipeline.md) and the required grid data.
