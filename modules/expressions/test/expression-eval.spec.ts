// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {
  BASIC_MATH_FUNCTION_LIBRARY,
  GEOSPATIAL_FUNCTION_LIBRARY,
  addBinaryOp,
  addUnaryOp,
  compile,
  compileAsync,
  eval as evaluate,
  evalAsync,
  parse,
  parseExpressionString
} from '@math.gl/expressions';
import {get} from '../src/get';

test('@math.gl/expressions#eval', () => {
  expect(evaluate(parse('x * 2 + 1'), {x: 3}), 'evaluates arithmetic expressions').toBe(7);
  expect(evaluate(parse('foo.bar'), {foo: {bar: 5}}), 'resolves member expressions').toBe(5);
  expect(evaluate(parse('flag ? a : b'), {flag: false, a: 1, b: 2}), 'evaluates conditionals').toBe(
    2
  );
  expect(evaluate(parse('[x, y, x + y]'), {x: 2, y: 4}), 'evaluates arrays').toEqual([2, 4, 6]);
});

test('@math.gl/expressions#compile', () => {
  const accessor = compile('points[1].value + offset');
  expect(accessor({points: [{value: 1}, {value: 4}], offset: 3}), 'compiles expressions').toBe(7);
});

test('@math.gl/expressions#compile with function libraries', () => {
  const fn = compile('clamp(sin(angle), 0, 1)', {
    libraries: [BASIC_MATH_FUNCTION_LIBRARY]
  });
  expect(fn({angle: Math.PI / 2}), 'uses the bundled basic math function library').toBe(1);
});

test('@math.gl/expressions#function library precedence', () => {
  const firstLibrary = {transform: (value: number) => value + 1};
  const secondLibrary = {transform: (value: number) => value * 2};
  const fn = compile('transform(value)', {
    libraries: [firstLibrary, secondLibrary]
  });

  expect(fn({value: 3}), 'later libraries override earlier libraries').toBe(6);
  expect(
    fn({value: 3, transform: (value: number) => value - 1}),
    'context values override function libraries'
  ).toBe(2);
});

test('@math.gl/expressions#compileAsync', async () => {
  const fn = compileAsync('loader(value) + 1');
  const result = await fn({
    value: 4,
    async loader(input: number) {
      return await Promise.resolve(input * 2);
    }
  });
  expect(result, 'supports async call evaluation').toBe(9);
});

test('@math.gl/expressions#evalAsync', async () => {
  const result = await evalAsync(parse('fetcher(value) * 2'), {
    value: 5,
    async fetcher(input: number) {
      return await Promise.resolve(input + 1);
    }
  });
  expect(result, 'evaluates async call expressions').toBe(12);
});

test('@math.gl/expressions#eval with geospatial function library', () => {
  const result = evaluate(
    parse('cartographicToCartesian(position)'),
    {position: [0, 0, 0]},
    {libraries: [GEOSPATIAL_FUNCTION_LIBRARY]}
  );
  expect(result, 'uses the bundled geospatial function library').toEqual([6378137, 0, 0]);
});

test('@math.gl/expressions#parseExpressionString', () => {
  const identity = parseExpressionString('-');
  const property = parseExpressionString('a.b.c');
  const expression = parseExpressionString('value * 3');

  expect(identity({value: 1}), 'supports identity accessors').toEqual({value: 1});
  expect(property({a: {b: {c: 9}}}), 'supports dot-path accessors').toBe(9);
  expect(expression({value: 3}), 'supports expression accessors').toBe(9);
  expect(() => parseExpressionString('fn(value)'), 'rejects function calls in accessors').toThrow(
    /Function calls not allowed/
  );
});

test('@math.gl/expressions#addBinaryOp', () => {
  addBinaryOp('**', 11, (a: number, b: number) => a ** b);
  expect(evaluate(parse('2 ** 3'), {}), 'supports custom operators').toBe(8);
});

test('@math.gl/expressions#get handles cached paths and non-object intermediates', () => {
  const row = {nested: {value: 7}, scalar: 3};
  expect(get(row, 'nested.value')).toBe(7);
  expect(get(row, 'nested.value')).toBe(7);
  expect(get(row, 'scalar.value')).toBeUndefined();
  expect(get(row, 'missing.value')).toBeUndefined();
  expect(get(row, 'null.value')).toBeUndefined();
});

test('@math.gl/expressions exposes the complete WGS84 function library', () => {
  const library = GEOSPATIAL_FUNCTION_LIBRARY;
  const cartesian = [6378137, 0, 0];
  expect(library.cartesianToCartographic(cartesian)).toHaveLength(3);
  expect(library.cartographicToCartesian([0, 0, 0])).toHaveLength(3);
  expect(library.eastNorthUpToFixedFrame(cartesian)).toHaveLength(16);
  expect(library.geodeticSurfaceNormal(cartesian)).toHaveLength(3);
  expect(library.geodeticSurfaceNormalCartographic([0, 0])).toHaveLength(3);
  expect(library.isWGS84(cartesian)).toBe(true);
  expect(library.scaleToGeocentricSurface([1, 0, 0])).toHaveLength(3);
  expect(library.scaleToGeodeticSurface(cartesian)).toHaveLength(3);
  expect(library.transformPositionFromScaledSpace([1, 0, 0])).toHaveLength(3);
  expect(library.transformPositionToScaledSpace(cartesian)).toHaveLength(3);
  expect(library.toDegrees(0)).toBe(0);
  expect(library.toRadians(0)).toBe(0);
});

test('@math.gl/expressions evaluates every built-in operator family', () => {
  const cases: Array<[string, unknown]> = [
    ['0 || 7', 7],
    ['3 && 7', 7],
    ['5 | 2', 7],
    ['5 ^ 2', 7],
    ['5 & 3', 1],
    ['2 == 2', true],
    ['2 != 3', true],
    ['2 === 2', true],
    ['2 !== 3', true],
    ['2 < 3', true],
    ['3 > 2', true],
    ['2 <= 2', true],
    ['2 >= 2', true],
    ['1 << 2', 4],
    ['8 >> 2', 2],
    ['8 >>> 2', 2],
    ['2 + 3', 5],
    ['7 - 3', 4],
    ['2 * 3', 6],
    ['7 / 2', 3.5],
    ['7 % 2', 1]
  ];
  for (const [source, expected] of cases)
    expect(evaluate(parse(source), {}), source).toBe(expected);

  expect(evaluate(parse('0 && missing'), {})).toBe(0);
  expect(evaluate(parse('1 || missing'), {})).toBe(1);
  expect(evaluate(parse('+value'), {value: '4'})).toBe(4);
  expect(evaluate(parse('-value'), {value: 4})).toBe(-4);
  expect(evaluate(parse('~value'), {value: 4})).toBe(-5);
  expect(evaluate(parse('!value'), {value: 0})).toBe(true);
});

test('@math.gl/expressions resolves computed members and preserves method receivers', () => {
  const context = {
    key: 'value',
    object: {
      value: 5,
      scale(factor: number) {
        return this.value * factor;
      }
    }
  };
  expect(evaluate(parse('object[key]'), context)).toBe(5);
  expect(evaluate(parse('object.scale(3)'), context)).toBe(15);
  expect(evaluate(parse('missingFunction(value)'), {value: 2})).toBeUndefined();
  expect(evaluate(parse('this'), context)).toBe(context);
  expect(() => evaluate(parse('object.constructor'), context)).toThrow(/disallowed/);
});

test('@math.gl/expressions supports custom unary and default-precedence binary operators', () => {
  addUnaryOp('%%', (value: number) => value * 10);
  addBinaryOp('@@', (left: number, right: number) => left - right);
  expect(evaluate(parse('%%2'), {})).toBe(20);
  expect(evaluate(parse('10 @@ 3'), {})).toBe(7);
});

test('@math.gl/expressions#evalAsync covers nested arrays, members and branches', async () => {
  const context = {
    value: 3,
    key: 'value',
    object: {
      value: 4,
      async add(amount: number) {
        return this.value + amount;
      }
    },
    async double(value: number) {
      return value * 2;
    }
  };
  expect(await evalAsync(parse('[double(value), object[key], object.add(2)]'), context)).toEqual([
    6, 4, 6
  ]);
  expect(await evalAsync(parse('false && double(value)'), context)).toBe(false);
  expect(await evalAsync(parse('true || double(value)'), context)).toBe(true);
  expect(await evalAsync(parse('value > 0 ? -value : +value'), context)).toBe(-3);
  expect(await evalAsync(parse('this'), context)).toBe(context);
  expect(await evalAsync(parse('missingFunction(value)'), context)).toBeUndefined();
  await expect(evalAsync(parse('object.constructor'), context)).rejects.toThrow(/disallowed/);
});
