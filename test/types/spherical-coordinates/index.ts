import {SphericalCoordinates, _SphericalCoordinates, Vector3} from '@math.gl/core';
import {
  SphericalCoordinates as MainSphericalCoordinates,
  _SphericalCoordinates as MainLegacySphericalCoordinates
} from 'math.gl';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
function assertType<T extends true>(): T {
  return true as T;
}

const spherical = new SphericalCoordinates();
const defaultResult = spherical.toVector3();
const undefinedResult = spherical.toVector3(undefined);
const vectorResult = spherical.toVector3(new Vector3());
const tuple: [number, number, number] = [0, 0, 0];
const tupleResult = spherical.toVector3(tuple);
const float32Result = spherical.toVector3(new Float32Array(3));
const float64Result = spherical.toVector3(new Float64Array(3));
assertType<Equal<typeof defaultResult, [number, number, number]>>();
assertType<Equal<typeof undefinedResult, [number, number, number]>>();
assertType<Equal<typeof vectorResult, Vector3>>();
assertType<Equal<typeof tupleResult, typeof tuple>>();
assertType<Equal<typeof float32Result, Float32Array<ArrayBuffer>>>();
assertType<Equal<typeof float64Result, Float64Array<ArrayBuffer>>>();
vectorResult.subtract([1, 2, 3]);

const legacy: _SphericalCoordinates = new _SphericalCoordinates();
const mainLegacy: MainLegacySphericalCoordinates = new MainLegacySphericalCoordinates();
const main: MainSphericalCoordinates = new MainSphericalCoordinates();
assertType<Equal<typeof legacy, SphericalCoordinates>>();
assertType<Equal<typeof mainLegacy, SphericalCoordinates>>();
assertType<Equal<typeof main, SphericalCoordinates>>();
