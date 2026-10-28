# Core transforms

Run `yarn workspace math.gl-core-transforms start` from the repository root.
The website and standalone example share the React renderer.

Controls compose an actual `Matrix4` using translate, rotateXYZ, and scale. The
canvas shows original and transformed cubes plus world axes. luma.gl
`OrbitControls` provides pointer orbit and wheel/pinch zoom. Focus the canvas and
use arrow keys to orbit or +/− to zoom. Reset camera restores the view without
changing the model. Matrix rows and the transformed sample point update with every
model control. Compare T × R × S with S × R × T: operations apply right to left.

The wireframe uses Canvas 2D with math.gl view/projection matrices. Cleanup stops
the render loop, destroys OrbitControls, and disconnects the resize observer.
