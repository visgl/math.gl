# HingeTree (experimental)

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

Evaluates rigid panels connected by hinges, independently of mesh generation and rendering. A panel can be a polygon, a collection of triangles, or any other rigid object. A forest can contain multiple roots. Loops, collisions, physical forces, and bending are not modeled.

```
import {HingeTree} from '@math.gl/geometry';

import {Matrix4} from '@math.gl/core';



const tree = new HingeTree([

  {parent: -1},

  {

    parent: 0,

    pivot: [0, 0.5, 0],

    axis: [1, 0, 0],

    restTransform: new Matrix4().translate([0, 1, 0])

  }

]);

const matrices = new Float64Array(tree.panelCount * 16);

tree.evaluate([0, Math.PI / 2], matrices);

// The second panel's local-to-world matrix occupies matrices[16..31].
```

## Constructor[​](#constructor "Direct link to Constructor")

`new HingeTree(panels: readonly HingePanel[])`

Panel indices refer to their positions in the supplied array. Parents may appear before or after children. Construction snapshots all supplied vectors and matrices, validates the graph, and prepares an iterative traversal. Empty forests are valid.

| Field           | Meaning                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `parent`        | Parent panel index, or `-1` for a root                                                             |
| `restTransform` | Column-major 4×4 child-local to parent-local transform at angle zero; identity by default          |
| `pivot`         | Point on the hinge in parent-local coordinates; required for nonroots                              |
| `axis`          | Nonzero finite direction in parent-local coordinates; required for nonroots, normalized internally |

Root panels ignore `pivot` and `axis`; their rest transforms place them relative to the common root frame. Rotations follow the right-hand rule. Panel geometry is supplied separately by the application; the utility cannot validate whether two meshes actually share the specified edge. All triangles in one rigid panel should share its transform.

Rest and root transforms must be finite proper rigid affine matrices. Scale, shear, reflection, and perspective are rejected with a numerical tolerance of `1e-6` for rotation/affine checks. Use consistent units for pivots, rest translations, and panel geometry.

## evaluate[​](#evaluate "Direct link to evaluate")

`tree.evaluate(angles, output?, rootTransform?): Float64Array`

* `angles`: one finite angle in **radians per panel**, in input order. Root entries must be zero.
* `output`: optional `Float64Array` of exactly `16 * panelCount` entries. If supplied, it is reused and returned; otherwise a new buffer is allocated.
* `rootTransform`: optional rigid placement of the entire forest; identity by default.

The result contains column-major local-to-world matrices in input order. For column vectors:

```
worldChild = worldParent × T(pivot) × R(axis, angle) × T(-pivot) × restTransform

worldRoot  = rootTransform × restTransform
```

The hinge axis and pivot are expressed in the parent's local rest coordinates, so they move with the parent. A child rest transform may already contain a rotation. Angles are offsets from that rest pose, not absolute dihedral angles. A complete turn is permitted.

Evaluation takes linear time and uses internal scratch storage. Reusing the output avoids per-panel matrix allocation. Angles and root placement are read before output is written, so they may alias the output. Later evaluations do not alter previously returned buffers unless the same buffer is supplied again. Invalid inputs throw before output writes; overflow during composition throws and may leave partial output. Floating-point error accumulates in deep trees.

See the [unfolding polyhedra example](https://github.com/visgl/math.gl/tree/master/examples/unfolding-polyhedron) for all five Platonic solids, subdivided icosahedra, automatic maximum-spanning-tree cut selection, and a simple Canvas renderer. The mesh/layout builder is experimental example code, separate from this API.

Try the [interactive Unfolding Earth example](https://visgl.github.io/math.gl/next/docs/modules/geometry/unfolding-earth.md) inline in the docs.
