# Euler

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From v1.0" />
</p>

```js
class Euler extends MathArray extends Array
```

A class to handle Euler rotation. More information on rotation using a Euler vector can be found [here](https://en.wikipedia.org/wiki/Euler%27s_rotation_theorem). Generally speaking the three components of the Euler object represents the roll, pitch and yaw angles and the rotation is applied according to a specific rotation order.

## Usage

```js
import {Euler} from '@math.gl/core';
```

Rotation order is represented by the `EulerRotationOrder` type. Its valid values are `'xyz'`, `'xzy'`, `'yxz'`, `'yzx'`, `'zxy'`, and `'zyx'`. The default is `'zyx'`.

## Members

### x, y z

x, y, z angle notation (note: only corresponds to axis in XYZ orientation)

### roll, pitch, yaw

roll, pitch, yaw angle notation

### alpha, beta, gamma

alpha, beta, gamma angle notation

### phi, theta, psi

phi, theta, psi angle notation

### order

The axis order used to interpret the three angles. Assigning a new order preserves
the angle values.

## Methods

### constructor

(x = 0, y = 0, z = 0, order = 'zyx')

- Number|Number[], Number, Number, EulerRotationOrder

### fromRollPitchYaw

Common ZYX rotation order

`euler.fromRollPitchYaw(roll, pitch, yaw)`

### fromRotationMatrix

`euler.fromRotationMatrix(m, order = euler.order)`

### fromQuaternion

`euler.fromQuaternion(q, order = euler.order)`

Sets this Euler instance from `q` using the requested rotation order. All six rotation orders are supported.

### copy

`euler.copy(array)`

Copies the first three angles from a numeric array. A supported order index in the
fourth slot sets the rotation order. A three-element array preserves the current order.

### set

Sets the three angles, and optionally sets the rotation order. If order is not specified, preserves currently set order.

`euler.set(x = 0, y = 0, z = 0, order)`

### toArray

Does not copy the orientation element

`euler.toArray(array = [], offset = 0)`

### toArray4

`euler.toArray4(array = [], offset = 0)`

Writes the angles and numeric order index starting at `offset`. The order indices
from 0 through 5 are `'zyx'`, `'yxz'`, `'xzy'`, `'zxy'`, `'yzx'`, and `'xyz'`.
Pass the returned four-element array to `copy()` to restore the angles and order.

### toVector3

`euler.toVector3(optionalResult)`

### fromVector3

`euler.fromVector3(v, order)`

### fromArray

`euler.fromArray(array, offset = 0)`

### getRotationMatrix

`euler.getRotationMatrix(result = number[16])`

Returns `result`, updated with the 4x4 rotation matrix corresponding to these Euler angles. A plain array is created when `result` is omitted.

To create a quaternion from Euler angles, use the destination-owned conversion:

`new Quaternion().fromEuler(euler)`

## Remarks

- Attribution: inspired by THREE.js `THREE.Euler` class
