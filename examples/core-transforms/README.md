# Core transforms

Run `yarn workspace math.gl-core-transforms start` from the repository root.
The website and standalone example share the React/SVG renderer.

Controls compose an actual `Matrix4` using translate, rotateXYZ, and scale. The
orthographic view shows the original and transformed cubes and world axes. It
expands to fit extreme transforms. Matrix rows and a transformed sample point
update with every control. Compare T × R × S with S × R × T: column vectors apply
operations from right to left. Reset restores the original control values.
