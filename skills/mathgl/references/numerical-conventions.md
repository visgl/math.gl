# Numerical conventions

Core classes extend Array. Most arithmetic methods mutate the receiver and return it. Clone a vector or matrix before deriving a second independent value. Explicitly test that a caller-owned input remains unchanged when that is required.

Core rotation APIs generally take radians; geographic longitude/latitude APIs often take degrees. Check the specific method. Label every geographic tuple's axis order and altitude units. Screen coordinates, normalized device coordinates, map world coordinates and Earth-centered coordinates are distinct spaces.

Matrices use column-major storage. Multiplication order determines the frame in which a transform acts; inspect `multiplyLeft` versus `multiplyRight` and test with a known point. Do not transpose merely because another library displays matrices differently.

Geographic coordinates may cross the antimeridian and approach projection limits at the poles. Include those cases when relevant. Web Mercator offsets approximate local distances and have latitude/scale-dependent error; use the documented accuracy guidance rather than treating projected coordinates as globally uniform meters.

JavaScript number calculations use double precision, but Float32Array output loses precision. Large Earth-centered positions may need local origins or higher-precision storage. Check finite outputs, degeneracies and zero-length normalization using the actual API's contract.

For CRS conversion, specify source/target CRS, axis order, height convention, epoch when applicable, and required grids. A round trip alone does not establish absolute accuracy; compare against independent fixtures. See `docs/modules/projection/developer-guide/support.md` and the module's qualification pages for supported domains.
