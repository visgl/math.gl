# Geospatial terminology

Geospatial code combines several kinds of geometry: coordinates in a reference system, paths on a curved surface, straight lines in three-dimensional space, and projected shapes on a map. This guide defines the terms used throughout math.gl and distinguishes concepts that can look similar in a rendering.

Start with [geodesic](#geodesic), [rhumb line](#rhumb-line-loxodrome), [chord](#chord), and [ellipsoid](#ellipsoid-and-spheroid). For the mathematical construction of map families, see [map projection families](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous/projection-catalog.md).

## Earth and surface models[​](#earth-and-surface-models "Direct link to Earth and surface models")

### Sphere[​](#sphere "Direct link to Sphere")

A surface whose points are all the same distance R from its center. A spherical Earth model is useful for visualization and many world-map formulas, but its distances and areas differ from those on an ellipsoid. A radius is part of the model, not an interchangeable choice of units.

### Ellipsoid and spheroid[​](#ellipsoid-and-spheroid "Direct link to Ellipsoid and spheroid")

An **ellipsoid** satisfies `x²/a² + y²/b² + z²/c² = 1`, where a, b, and c are its semiaxes. A **spheroid**, or ellipsoid of revolution, has two equal semiaxes. Earth reference ellipsoids are usually oblate spheroids: the equatorial radius is larger than the polar radius. A triaxial ellipsoid can have three different semiaxes. An ellipsoid models a smooth reference surface, not terrain or sea level.

For an oblate spheroid, a commonly denotes the equatorial semimajor axis and b the polar semiminor axis. **Flattening** is `f = (a − b) / a`; **first eccentricity squared** is `e² = f(2 − f)`. Inverse flattening is `1/f`, when f is nonzero.

See [Ellipsoid](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/ellipsoid.md) for geometry and conversions.

### Geoid and terrain[​](#geoid-and-terrain "Direct link to Geoid and terrain")

The **geoid** is a gravity equipotential surface used as a reference for physical heights and associated with mean sea level. It is irregular relative to an ellipsoid. **Terrain** is the actual ground surface; a **digital elevation model (DEM)** samples some specified surface and height reference. A DEM is not necessarily ellipsoidal, and a geoid model is not a terrain model.

### Normal and tangent plane[​](#normal-and-tangent-plane "Direct link to Normal and tangent plane")

A **surface normal** is perpendicular to the surface at a point. On a sphere it is radial; on an ellipsoid it generally does not point through the center. A **tangent plane** passes through the point and is perpendicular to its normal. It approximates the surface locally; distances in that plane are not generally surface distances over a large region.

## Coordinates and reference systems[​](#coordinates-and-reference-systems "Direct link to Coordinates and reference systems")

| Term                                    | Meaning                                                                                                                                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Longitude                               | Angular position around the polar axis, measured from a prime meridian. It becomes indeterminate at a pole.                                                                                                |
| Geodetic latitude                       | Angle between the ellipsoid's outward normal and the equatorial plane. Geographic ellipsoid coordinates normally use this latitude.                                                                        |
| Geocentric latitude                     | Angle between the center-to-point direction and the equatorial plane. It generally differs from geodetic latitude on an ellipsoid.                                                                         |
| Meridian                                | A constant-longitude curve connecting the poles. The prime meridian defines longitude zero.                                                                                                                |
| Parallel                                | A constant-latitude curve. On a sphere, only the equator is also a great circle.                                                                                                                           |
| Antimeridian                            | The meridian opposite a chosen prime or central meridian. ±180° are two common representations of the same longitude relative to Greenwich.                                                                |
| Antipodal points                        | Opposite points through the center of a sphere or ellipsoid. On a sphere, antipodal endpoints admit infinitely many shortest great-circle routes.                                                          |
| ECEF                                    | Earth-centered, Earth-fixed Cartesian coordinates. The axes rotate with Earth; positions are commonly expressed in metres.                                                                                 |
| ENU                                     | A local east, north, up frame. Its origin and definition of up must be specified; ellipsoidal up follows the surface normal.                                                                               |
| CRS                                     | A coordinate reference system: a coordinate system related to Earth through a datum or reference frame. Its axis order, units, and height interpretation matter.                                           |
| Datum / reference frame                 | The reference that anchors coordinates to Earth. An ellipsoid alone does not specify the position, orientation, realization, or time dependence of a geodetic frame.                                       |
| WGS84                                   | A geodetic reference system with an associated ellipsoid and reference-frame realizations. “WGS84 ellipsoid” specifies a surface shape; it does not specify every detail of a coordinate reference system. |
| Coordinate epoch                        | The time at which coordinates represent a position in a time-dependent frame. It can differ from the frame's reference epoch.                                                                              |
| Geographic / projected / geocentric CRS | Respectively, angular coordinates on a reference surface, planar coordinates from a map projection, and three-dimensional Earth-centered coordinates.                                                      |
| EPSG identifier                         | A registry identifier for a CRS or other geodetic object. It is not a universal declaration of array order or a substitute for inspecting the object's definition.                                         |

math.gl's geographic convenience APIs generally use longitude first, angles in degrees, and ellipsoidal height in metres. A CRS-defined axis order can differ. Check the particular API rather than assuming every three-number array means the same thing. See [coordinate reference systems](https://visgl.github.io/math.gl/next/docs/modules/geospatial/crs/developer-guide/coordinate-reference-systems.md).

## Heights and vertical references[​](#heights-and-vertical-references "Direct link to Heights and vertical references")

| Term                         | Meaning                                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Ellipsoidal height, h        | Height relative to a reference ellipsoid, measured along its normal. It is not automatically height above sea level.                           |
| Orthometric height, H        | A gravity-based height referenced to the geoid, associated with distance along the plumb line. Commonly used for physical elevations.          |
| Geoid height / undulation, N | Separation between a geoid model and its reference ellipsoid. With compatible references, the usual height-conversion relation is `h ≈ H + N`. |
| Vertical datum               | The reference defining a height system. Two datasets labeled “elevation in metres” may use different vertical datums.                          |
| Altitude / elevation         | Context-dependent names for height. Specify the surface, datum, and units instead of relying on the name alone.                                |

A height conversion requires compatible horizontal and vertical references and the appropriate model; subtracting an arbitrary geoid grid is not sufficient. See the [geoid module](https://visgl.github.io/math.gl/next/docs/modules/earth/geoid.md) and [NOAA's geoid model documentation](https://geodesy.noaa.gov/GEOID/).

## Paths, directions, and distances[​](#paths-directions-and-distances "Direct link to Paths, directions, and distances")

### Geodesic[​](#geodesic "Direct link to Geodesic")

A path that is locally straight on a surface, with zero geodesic curvature. Sufficiently short segments minimize surface distance, but an extended geodesic need not be the globally shortest route between its endpoints. A shortest-path geodesic solver chooses a minimizing segment; this distinction matters near antipodal points and when continuing a path beyond an endpoint.

On a sphere, geodesics are great circles. On an ellipsoid, a general geodesic is not a planar circle. Its bearing usually changes along the route. See [ellipsoid geodesics](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/ellipsoid-geodesic.md) and [geodesic paths](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/geodesic-path.md).

### Great circle, small circle, and arc[​](#great-circle-small-circle-and-arc "Direct link to Great circle, small circle, and arc")

A **great circle** is the intersection of a sphere with a plane through its center. A **small circle** comes from an intersecting plane that does not pass through the center. An **arc** is a portion of a curve; the word alone does not specify whether it is a geodesic, a small-circle arc, or another path.

Two distinct, non-antipodal points on a sphere determine a shorter **minor arc** and a longer **major arc** on one great circle. For central angle θ in radians, the minor-arc length is `R θ`, with `0 < θ < π`. Coincident or antipodal endpoints require additional choices when a route, rather than just a distance, is needed.

### Rhumb line (loxodrome)[​](#rhumb-line-loxodrome "Direct link to Rhumb line (loxodrome)")

A surface path of constant azimuth relative to local true north: it crosses meridians at a constant angle. A rhumb line generally differs from a shortest geodesic. On a normal Mercator map it appears as a straight line; an east–west rhumb follows a parallel, which is not generally a geodesic.

“Constant bearing” here means true-north bearing, not a constant uncorrected magnetic-compass reading. See [ellipsoid rhumb lines](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/ellipsoid-rhumb.md).

### Chord[​](#chord "Direct link to Chord")

The straight three-dimensional segment joining two points. Between distinct points on a convex globe surface, its interior lies inside the globe rather than on the surface. On a sphere with central angle θ, chord length is `2R sin(θ/2)`, while the minor great-circle arc length is `R θ`.

For endpoints 90° apart, the arc is about `1.571 R` and the chord `1.414 R`. Linearly interpolating their ECEF coordinates follows the chord. Normalizing those interpolated positions onto a sphere follows the minor great-circle arc for non-antipodal endpoints, but generally not at constant speed. Spherical linear interpolation (**slerp**) provides constant angular speed along that arc.

### Bearing, azimuth, and direct/inverse problems[​](#bearing-azimuth-and-directinverse-problems "Direct link to Bearing, azimuth, and direct/inverse problems")

**Azimuth** is a direction angle in a specified local reference, commonly clockwise from true north. **Bearing** is often used for the same concept, but conventions differ. Grid north, geodetic true north, and magnetic north are not interchangeable. **Grid convergence** measures the angular relationship between grid north and true north, with sign depending on the convention.

The **direct geodesic problem** finds an endpoint from a starting point, initial azimuth, and distance. The **inverse geodesic problem** finds distance and azimuths from two endpoints. This use of “inverse” is distinct from inverse map projection.

| Distance or line   | Where it is measured                  | Typical use                                                            |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------------- |
| Geodesic distance  | Along the reference surface           | Shortest surface routes                                                |
| Rhumb distance     | Along a constant-azimuth surface path | Fixed-heading routes                                                   |
| Chord distance     | Along a straight segment in 3D        | Cartesian geometry and line-of-sight calculations                      |
| Projected distance | In planar map coordinates             | Map geometry; ground distance requires accounting for projection scale |
| Screen distance    | In display pixels                     | Interaction, rendering tolerances, and labels                          |

## Projections and distortion[​](#projections-and-distortion "Direct link to Projections and distortion")

A **map projection** assigns planar coordinates to locations on a curved reference surface. A **forward projection** maps geographic to planar coordinates; an **inverse projection** attempts the reverse. Inverses can be undefined, non-unique, or restricted to a particular chart.

| Term                           | Meaning                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conformal                      | Preserves local angles and infinitesimal shape at regular points. It does not preserve general areas or finite shapes.                                     |
| Equal-area / equivalent        | Preserves areas up to a constant scale factor. It does not imply preservation of angles or lengths.                                                        |
| Equidistant                    | Preserves specified distances, for example from a center or along selected lines. No flat map preserves every pairwise distance on a spherical region.     |
| Azimuthal                      | In the normal construction, positions are arranged by distance and direction from a chosen center. The radial function determines the distortion property. |
| Compromise projection          | Balances distortion without exactly preserving a single property everywhere; Robinson is an example.                                                       |
| Scale factor                   | Local projected length divided by the corresponding reference-surface length. It can vary with position and direction.                                     |
| Standard parallel              | A selected parallel with the projection's prescribed true-scale condition. It is not necessarily the center of the map.                                    |
| Central meridian               | The longitude used as the projection's reference meridian, often its symmetry axis.                                                                        |
| False easting / false northing | Constant offsets added to projected coordinates, often to avoid negative values. They change coordinate values without changing projection distortion.     |
| Aspect                         | Orientation of a projection relative to the globe: normal, transverse, or oblique. It differs from rotating the finished image in its plane.               |
| Graticule                      | The displayed network of meridians and parallels. It is not necessarily the computational mesh.                                                            |
| Jacobian                       | The matrix of local derivatives of a coordinate mapping. It describes local scale and deformation at regular points.                                       |
| Tissot indicatrix              | The infinitesimal ellipse obtained by projecting a small circle on the surface; its axes illustrate local directional scale.                               |
| Singularity                    | A location where the mapping or its inverse ceases to be regular, such as a collapsed pole or an infinite projected coordinate.                            |

A CRS **conversion** changes coordinate representations without changing the underlying datum; a **transformation** changes the datum or reference frame and can involve empirical parameters, grids, and epochs. A projection formula alone is not a complete datum transformation. See the [projection guide](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/api-guide.md).

## Charts, cuts, and map layouts[​](#charts-cuts-and-map-layouts "Direct link to Charts, cuts, and map layouts")

| Term                 | Meaning in math.gl's map documentation                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chart / region       | A geographic domain with its own projection and planar placement. This is an implementation chart, not necessarily a globally invertible mathematical coordinate chart. |
| Domain / footprint   | The geographic area a chart represents. A finite projected coordinate does not by itself establish domain membership.                                                   |
| Spherical cap        | The part of a sphere within a given angular distance of a center. Its boundary is usually a small circle; a hemispherical cap has a great-circle boundary.              |
| Horizon              | A visibility boundary for a specified viewpoint or projection. It is not always a hemisphere boundary.                                                                  |
| Clipping             | Intersecting geometry with a domain and retaining the inside pieces. Correct clipping can add boundary vertices and split polygons.                                     |
| Seam                 | A boundary between charts, classified as a join or cut according to their placed boundary images.                                                                       |
| Join                 | A seam where neighboring chart images meet continuously. A join need not be drawn as an outline.                                                                        |
| Cut / interruption   | A seam opened in the planar layout. Geometry crossing it must be split rather than connected across the gap.                                                            |
| Segmented map        | A map constructed from multiple charts. Segmentation alone does not imply visible cuts or disconnected pieces.                                                          |
| Connected / disjoint | Whether pieces remain connected through their retained joins. A connected star map can still contain open cuts.                                                         |
| Lobe                 | A geographic section of an interrupted map, often with its own central meridian.                                                                                        |
| Inset                | A separately placed regional map, sometimes with a different scale or projection.                                                                                       |
| Polyhedral net       | A planar arrangement of projected polyhedron faces, joined along selected edges.                                                                                        |
| Hinge                | An edge and rotation axis relating adjacent faces during rigid unfolding. A continuous chart join does not automatically define a hinge.                                |
| Myriahedral map      | A map built from many small faces, with cuts and retained adjacencies determining the unfolding layout.                                                                 |

Longitude **wrapping** changes a coordinate's numeric representative, for example 181° to −179°. It does not split a line or polygon at a cut. **Unwrapping** chooses continuous longitude representatives along a sequence; it also does not remove geometric seams. See [discontinuous maps](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/discontinuous-projections.md) and the [MapEngine reference](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/api-reference/map-engine.md).

## Sampling, meshes, and tiles[​](#sampling-meshes-and-tiles "Direct link to Sampling, meshes, and tiles")

| Term                               | Meaning                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tessellation / triangulation       | Replacing a surface or polygon with simpler pieces, often triangles. Triangles must respect cuts and holes.                                                                          |
| Subdivision / densification        | Adding vertices to approximate a curved path or surface more closely. The interpolation model determines where those vertices lie.                                                   |
| Adaptive sampling                  | Refining where an error estimate exceeds a tolerance, rather than using a fixed number of segments everywhere.                                                                       |
| Tolerance                          | An allowed numerical or approximation error in stated units. Angular, projected-coordinate, and pixel tolerances are different quantities.                                           |
| Accuracy / precision               | Accuracy describes agreement with a reference or true value; precision describes repeatability or numerical detail. More decimal places do not guarantee better positional accuracy. |
| Resolution                         | Sampling detail, such as grid spacing or pixels per map unit. It does not by itself measure positional accuracy.                                                                     |
| Level of detail (LOD) / zoom level | A dataset- or renderer-specific choice of sampling scale. Separate insets can require different tile levels in one viewport.                                                         |
| Tile matrix                        | A defined arrangement of tiles at a resolution, with an origin, bounds, tile dimensions, and axis conventions.                                                                       |
| DGGS                               | A discrete global grid system partitioning the globe into indexed cells. Its cell hierarchy and indexing are distinct from a planar projection or unfolding.                         |

## References and further reading[​](#references-and-further-reading "Direct link to References and further reading")

These definitions describe mathematical and geodetic concepts, independently of any one implementation's function names.

* **Charles F. F. Karney / GeographicLib**: [geodesic documentation](https://geographiclib.sourceforge.io/C++/doc/geodesic.html) and [rhumb-line documentation](https://geographiclib.sourceforge.io/C++/doc/rhumb.html), including the direct and inverse problems.
* **PROJ contributors**: [coordinate-operation background](https://proj.org/en/stable/usage/index.html), [axis-order conventions](https://proj.org/en/stable/faq.html), and [projection glossary](https://proj.org/en/stable/glossary.html).
* **NOAA National Geodetic Survey**: [geoid models and height systems](https://geodesy.noaa.gov/GEOID/).
* **John P. Snyder and Philip M. Voxland**: [An Album of Map Projections](https://visgl.github.io/math.gl/next/docs/bibliography.md#snyder1989 "An album of map projections"), for projection constructions, terminology, and distortion properties.
* **NASA GISS**: [G.Projector's projection reference](https://www.giss.nasa.gov/tools/gprojector/help/projections/), for named families and their properties.

<!-- -->

## References

1. John P. Snyder, Philip M. Voxland (1989). An album of map projections. Professional Paper. [doi:10.3133/pp1453](https://doi.org/10.3133/pp1453) [Source](https://pubs.usgs.gov/pp/1453/report.pdf)
