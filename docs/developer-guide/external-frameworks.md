# Using with Other Frameworks

math.gl has made some efforts to be "interoperable" with other major JavaScript math frameworks.

## Using with gl-matrix

### API comparison

The math.gl Matrix and Vector class APIs are inspired by the popular `gl-matrix` library, and it is possible to use `gl-matrix` together with math.gl.

Sometimes, in code that is very frequently executed, working with directly with gl-matrix can sometimes provide better performance than math.gl, mainly by avoiding object creation. However in such cases you may also be able to use pre-created "scratch objects" in math.gl to achieve similar performance.

To learn more about gl-matrix, the [gl-matrix docs](http://glmatrix.net/docs/) are a good start.

## Using with THREE.js

math.gl is partially compatible with the THREE.js math API. In fact, math.gl includes a fork of the math test suite from THREE.js, parts of which pass cleanly when run using the math.gl core classes (admittedly with a few disabled cases).

### Method Interoperability

In particular, the basic math.gl math classes have implementations of most of the methods that THREE.js defines.

| math.gl   | THREE.js        | Notable differences                             |
| --------- | --------------- | ----------------------------------------------- |
| `Vector2` | `THREE.Vector2` | `length()` => `len()`                           |
| `Vector3` | `THREE.Vector3` | ditto                                           |
| `Vector4` | `THREE.Vector4` | ditto                                           |
| `Matrix3` | `THREE.Matrix3` | Math.gl stores in column-major order by default |
| `Matrix4` | `THREE.Matrix4` | ditto                                           |


### Colum-Major vs. Row-Major Matrices

By default, math.gl stores matrices in column-major order internally (while exposing a row-major friendly interface), whereas THREE.js stores matrices in row-major order.

### Array.length()

Since math.gl's classes are subclasses of JavaScripts built-in `Array` class, the `length` property has the special meaning defined by `Array`, so it is not possible to implement the `Vector.length()` method defined by THREE.js. Instead a `Vector.len()` method is offered on math.gl `Vector` classes.

### Cross-Library Convenience Methods

A complication with THREE.js is that the framework is not strict about separating the library into independent layers. Thus the THREE math classes have convenience methods that accept other THREE.js objects such `Geometries` and `BufferAttributes`. These methods can not be implemented in math.gl.

