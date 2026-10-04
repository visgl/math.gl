# Polygon playground

Run `yarn workspace math.gl-polygon-playground start` from the repository root.
The website and standalone example share the React renderer.

`EditableGeoJsonLayer` uses `ModifyMode` and `DrawPolygonMode` in a Cartesian
`OrthographicView`. Drag handles, click an edge to insert a vertex, or click a
handle to remove it. Draw a new polygon by clicking vertices and then its first
vertex to finish. Numeric vertex inputs provide keyboard editing. Toggle a hole,
reverse winding, and inspect math.gl triangulation and area readouts. Crossing or
collapsed edges and holes outside the outline are rejected before accepting edits.
The component finalizes Deck and disconnects its resize observer on unmount.
