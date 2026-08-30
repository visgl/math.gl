# Euler

```js
class Euler extends MathArray extends Array
```

A class to handle Euler rotation. More information on rotation using a Euler vector can be found [here](https://en.wikipedia.org/wiki/Euler%27s_rotation_theorem). Generally speaking the three components of the Euler object represents the roll, pitch and yaw angles and the rotation is applied according to a specific rotation order.

## Usage

```js
import {Euler} from '@math.gl/core';
```

## Constants

- `Euler.ZYX` = `'zyx'`
- `Euler.YXZ` = `'yxz'`
- `Euler.XZY` = `'xzy'`
- `Euler.ZXY` = `'zxy'`
- `Euler.YZX` = `'yzx'`
- `Euler.XYZ` = `'xyz'`
- `Euler.RollPitchYaw` = `'zyx'`

- `Euler.DefaultOrder` (= `Euler.ZYX`)
- `Euler.RotationOrders` provides the same named string values.

These compatibility constants are deprecated. New code should pass an `EulerRotationOrder` string such as `'zyx'` directly.

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

rotation order in all notations

## Methods

### constructor

(x = 0, y = 0, z = 0, order = 'zyx')

- Number|Number[], Number, Number, EulerRotationOrder

### fromRollPitchYaw

Common ZYX rotation order

`euler.fromRollPitchYaw(roll, pitch, yaw)`

### fromRotationMatrix

`euler.fromRotationMatrix(m, order = 'zyx')`

### fromQuaternion

`euler.fromQuaternion(q, order)`

### copy

If copied array does contain fourth element, preserves currently set order.

`euler.copy(array)`

### set

Sets the three angles, and optionally sets the rotation order. If order is not specified, preserves currently set order.

`euler.set(x = 0, y = 0, z = 0, order)`

### toArray

Does not copy the orientation element

`euler.toArray(array = [], offset = 0)`

### toArray4

Copies the orientation element

`euler.toArray4(array = [], offset = 0)`

### toVector3

`euler.toVector3(optionalResult)`

### fromVector3

`euler.fromVector3(v, order)`

### fromArray

`euler.fromArray(array, offset = 0)`

### getRotationMatrix

`euler.getRotationMatrix(m = new Matrix4())`

Returns `Matrix4` - a rotation matrix corresponding to rotations per the specified euler angles

### getQuaternion

`euler.getQuaternion()`

## Remarks

- Attribution: inspired by THREE.js `THREE.Euler` class
