// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
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

test('@math.gl/expressions#eval', t => {
  t.equal(evaluate(parse('x * 2 + 1'), {x: 3}), 7, 'evaluates arithmetic expressions');
  t.equal(evaluate(parse('foo.bar'), {foo: {bar: 5}}), 5, 'resolves member expressions');
  t.equal(evaluate(parse('flag ? a : b'), {flag: false, a: 1, b: 2}), 2, 'evaluates conditionals');
  t.deepEqual(evaluate(parse('[x, y, x + y]'), {x: 2, y: 4}), [2, 4, 6], 'evaluates arrays');
  t.end();
});

test('@math.gl/expressions#compile', t => {
  const accessor = compile('points[1].value + offset');
  t.equal(accessor({points: [{value: 1}, {value: 4}], offset: 3}), 7, 'compiles expressions');
  t.end();
});

test('@math.gl/expressions#compile with function libraries', t => {
  const fn = compile('clamp(sin(angle), 0, 1)', {
    libraries: [BASIC_MATH_FUNCTION_LIBRARY]
  });
  t.equal(fn({angle: Math.PI / 2}), 1, 'uses the bundled basic math function library');
  t.end();
});

test('@math.gl/expressions#function library precedence', t => {
  const firstLibrary = {transform: (value: number) => value + 1};
  const secondLibrary = {transform: (value: number) => value * 2};
  const fn = compile('transform(value)', {
    libraries: [firstLibrary, secondLibrary]
  });

  t.equal(fn({value: 3}), 6, 'later libraries override earlier libraries');
  t.equal(
    fn({value: 3, transform: (value: number) => value - 1}),
    2,
    'context values override function libraries'
  );
  t.end();
});

test('@math.gl/expressions#compileAsync', async t => {
  const fn = compileAsync('loader(value) + 1');
  const result = await fn({
    value: 4,
    async loader(input: number) {
      return await Promise.resolve(input * 2);
    }
  });
  t.equal(result, 9, 'supports async call evaluation');
  t.end();
});

test('@math.gl/expressions#evalAsync', async t => {
  const result = await evalAsync(parse('fetcher(value) * 2'), {
    value: 5,
    async fetcher(input: number) {
      return await Promise.resolve(input + 1);
    }
  });
  t.equal(result, 12, 'evaluates async call expressions');
  t.end();
});

test('@math.gl/expressions#eval with geospatial function library', t => {
  const result = evaluate(
    parse('cartographicToCartesian(position)'),
    {position: [0, 0, 0]},
    {libraries: [GEOSPATIAL_FUNCTION_LIBRARY]}
  );
  t.deepEqual(result, [6378137, 0, 0], 'uses the bundled geospatial function library');
  t.end();
});

test('@math.gl/expressions#parseExpressionString', t => {
  const identity = parseExpressionString('-');
  const property = parseExpressionString('a.b.c');
  const expression = parseExpressionString('value * 3');

  t.deepEqual(identity({value: 1}), {value: 1}, 'supports identity accessors');
  t.equal(property({a: {b: {c: 9}}}), 9, 'supports dot-path accessors');
  t.equal(expression({value: 3}), 9, 'supports expression accessors');
  t.throws(
    () => parseExpressionString('fn(value)'),
    /Function calls not allowed/,
    'rejects function calls in accessors'
  );
  t.end();
});

test('@math.gl/expressions#addBinaryOp', t => {
  addBinaryOp('**', 11, (a: number, b: number) => a ** b);
  t.equal(evaluate(parse('2 ** 3'), {}), 8, 'supports custom operators');
  t.end();
});
