# Pose

![From v2.0](https://img.shields.io/badge/From-v2.0-blue.svg?style=flat-square)

A 6-degree-freedom pose (3D position and 3D rotation). See [Tait–Bryan angles](https://en.wikipedia.org/wiki/Euler_angles): z-y'-x"

```
class Pose
```

## Usage[​](#usage "Direct link to Usage")

```
import {Pose} from '@math.gl/core';
```

## Members[​](#members "Direct link to Members")

### x, y z[​](#x-y-z "Direct link to x, y z")

Gets or sets position components respectively

### roll, pitch, yaw[​](#roll-pitch-yaw "Direct link to roll, pitch, yaw")

Gets or sets rotation components respectively

## Methods[​](#methods "Direct link to Methods")

### constructor[​](#constructor "Direct link to constructor")

```
new Pose({x, y, z, roll, pitch, yaw});

new Pose({position, orientation});
```

* `x`, `y`, `z` - position
* `roll`, `pitch`, `yaw` - rotation in radians
* `position` - `Vector3` or array of 3 that represents the position
* `orientation` - `Euler` or array of 4 that represents the rotation

### getPosition[​](#getposition "Direct link to getPosition")

`pose.getPosition()`

Returns `Vector3`.

### getOrientation[​](#getorientation "Direct link to getOrientation")

`pose.getOrientation()`

Returns `Euler`.

### equals[​](#equals "Direct link to equals")

`pose.equals(otherPose)`

### exactEquals[​](#exactequals "Direct link to exactEquals")

`pose.exactEquals(otherPose)`

### getTransformationMatrix[​](#gettransformationmatrix "Direct link to getTransformationMatrix")

`pose.getTransformationMatrix()`

Returns a 4x4 matrix that transforms a coordinates (in the same coordinate system as this pose) into the "pose-relative" coordinate system defined by this pose.

The pose relative coordinates with have origin in the position of this pose, and axis will be aligned with the rotation of this pose.

Returns `Matrix4`.

### getTransformationMatrixFromPose[​](#gettransformationmatrixfrompose "Direct link to getTransformationMatrixFromPose")

`pose.getTransformationMatrixFromPose(otherPose)`

Given a second pose that represent the same object in a second coordinate system, this method returns a 4x4 matrix that transforms coordinates in the second coordinate system into the coordinate system of this pose.

Returns `Matrix4`.

### getTransformationMatrixToPose[​](#gettransformationmatrixtopose "Direct link to getTransformationMatrixToPose")

`pose.getTransformationMatrixToPose(otherPose)`

Given a second pose that represent the same object in a second coordinate system, this method returns a 4x4 matrix that transforms coordinates in the coordinate system of this pose into the coordinate system of the second pose.

Returns `Matrix4`.
