# EllipsoidTangentPlane

TBA

Function to convert a geospatial region to an oriented bounding box using ellipsoid math. Computes an `OrientedBoundingBox` that bounds a region on the surface of the WGS84 ellipsoid. There are no guarantees about the orientation of the bounding box.

 Parameters:

 - `region: number[]` - The cartographic region (west, south, east, north, minimum height, maximum height) on the surface of the ellipsoid.

 Returns:

 - `OrientedBoundingBox` - The modified result parameter or a new OrientedBoundingBox instance if none was provided.
