// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {
  BASIC_MATH_FUNCTION_LIBRARY,
  GEOSPATIAL_FUNCTION_LIBRARY,
  addBinaryOp,
  compile,
  compileAsync,
  eval as evaluate,
  evalAsync,
  parse,
  parseExpressionString
} from '@math.gl/expressions';

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
