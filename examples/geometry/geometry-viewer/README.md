# Geometry viewer

A shared luma.gl WebGL 2 mesh renderer with luma.gl `OrbitControls`.

Run `yarn start` or `yarn build` in this directory. The gallery lets you select all nine
`@math.gl/geometry` primitives, inspect counts and constructor parameters, and toggle triangle edges.

`<GeometryExample geometry={mesh} />` accepts a math.gl `Geometry` instance.
Alternatively pass `geometryType="SphereGeometry"` and `geometryProps={{radius: 1}}`.
The website wrapper accepts the same parameters and supports the shared inline fullscreen frame.

The renderer copies positions into a centered unit bounding sphere for camera fitting; source
attributes are unchanged. It preserves indices, draw count, and primitive topology when adapting
the CPU mesh to luma.gl. Depth-tested shading and triangle edges expose the generated tessellation.
Pointer orbit, wheel/pinch zoom, keyboard arrows/+/- and camera reset are available.
Models, GPU buffers, device, controls, and the animation frame are released on unmount or geometry change.
