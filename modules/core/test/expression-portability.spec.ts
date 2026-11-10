// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  parse,
  compile,
  validateExpressionAST,
  getExpressionColumns,
  columnarPredicateToExpression,
  NUMERIC_FUNCTION_DEFINITIONS,
  ExpressionEvaluationError,
  isExpressionEvaluationError
} from '../src/expressions';
import {parseSQLExpression, parseSQLQuery} from '../src/sql';
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([name]) => !['raw', 'prefix', 'sqlFunction'].includes(name))
        .map(([name, child]) => [name, canonical(child)])
    );
  return value;
}
test.each([
  ['x + y * 2', 'x + y * 2'],
  ['-x / 2', '-x / 2'],
  ['x >= 2 AND NOT y = 0', 'x >= 2 && !(y == 0)'],
  ['CASE WHEN x > 1 THEN y ELSE 0 END', 'x > 1 ? y : 0'],
  ['SIN(x + 1)', 'SIN(x + 1)']
])('SQL and JavaScript overlap shares the same AST structure: %s', (sql, js) => {
  const a = parseSQLExpression(sql),
    b = parse(js);
  validateExpressionAST(a);
  validateExpressionAST(b);
  expect(canonical(a)).toEqual(canonical(b));
});
test('column discovery excludes callee names, preserves exact identifiers and first-reference order', () => {
  const ast = parseSQLExpression('SIN("a.b") + y * "a.b"');
  expect(getExpressionColumns(ast)).toEqual(['a.b', 'y']);
  expect(getExpressionColumns(parseSQLExpression('CASE WHEN x IS NULL THEN z ELSE x END'))).toEqual(
    ['x', 'z']
  );
});
test('external AST validation bounds cycles, depth, width, holes, malformed calls and backend-only syntax', () => {
  const cyclic: any = {type: 'UnaryExpression', operator: '!'};
  cyclic.argument = cyclic;
  expect(() => validateExpressionAST(cyclic)).toThrow('cycle');
  for (const ast of [
    {type: 'ArrayExpression', elements: [null]},
    {type: 'CallExpression', callee: {type: 'MemberExpression'}, arguments: []},
    {type: 'Literal', value: {}},
    {type: 'BinaryExpression', operator: '+', left: null, right: null},
    {type: 'ThisExpression'}
  ])
    expect(() => validateExpressionAST(ast)).toThrow();
  expect(() =>
    validateExpressionAST({
      type: 'ArrayExpression',
      elements: new Array(16385).fill({type: 'Literal', value: 1})
    })
  ).toThrow('limit');
  expect(() => validateExpressionAST(parse('x + 1'), {maxNodes: 2})).toThrow('limit');
  expect(() => validateExpressionAST(parse('x'), {maxDepth: 65})).toThrow('limits');
  const ast = parseSQLExpression('x + 1');
  expect(() => validateExpressionAST(ast)).not.toThrow();
  const shared = {type: 'Identifier', name: 'x'};
  expect(() =>
    validateExpressionAST({type: 'BinaryExpression', operator: '+', left: shared, right: shared})
  ).not.toThrow();
});
test('predicate normalization binds parameters, preserves casts and produces the same basic AST', () => {
  const query = parseSQLQuery('SELECT x WHERE NOT (x = 1 OR x IS NULL)') as any;
  expect(canonical(columnarPredicateToExpression(query.where))).toEqual(
    canonical(parseSQLExpression('NOT (x = 1 OR x IS NULL)'))
  );
  const ast = columnarPredicateToExpression(
    {op: '>=', args: [{property: 'x', casts: ['int64']}, {parameter: 'minimum'}]},
    {parameters: {minimum: 2}}
  );
  expect(getExpressionColumns(ast)).toEqual(['x']);
  expect((ast as any).right.value).toBe(2n);
  expect(() => columnarPredicateToExpression({op: '=', args: [{property: ['x', 'y']}, 1]})).toThrow(
    'top-level'
  );
  expect(() =>
    columnarPredicateToExpression({op: '=', args: [{property: 'x'}, new Date()]})
  ).toThrow('explicit backend');
  const cycle: any = {op: 'not', args: []};
  cycle.args.push(cycle);
  expect(() => columnarPredicateToExpression(cycle)).toThrow('limit');
  expect(() => columnarPredicateToExpression({op: 'in', args: [{property: 'x'}, []]})).toThrow();
});
test('portable numeric declarations expose exact signatures, nulls, precision and semantic rules', () => {
  const definitions = NUMERIC_FUNCTION_DEFINITIONS;
  expect(Object.keys(definitions)).toHaveLength(21);
  expect(definitions.ROUND.rounding).toBe('tiesAwayFromZero');
  expect(definitions.MOD.remainderSign).toBe('dividend');
  expect(definitions.SIN.angleUnit).toBe('radians');
  expect(definitions.SQRT.prototypes.find(p => p.arguments[0] === 'int64')!.result).toBe('float64');
  expect(definitions.ABS.prototypes.find(p => p.arguments[0] === 'int64')!.result).toBe('int64');
  for (const definition of Object.values(definitions)) {
    expect(definition.nullHandling).toBe('propagate');
    expect(definition.nanHandling).toBe('propagate');
    expect(Object.isFrozen(definition.prototypes)).toBe(true);
    expect(definition.prototypes).toHaveLength(11);
  }
});
test('portable error classification rejects accidental or unknown errors', () => {
  expect(isExpressionEvaluationError(new ExpressionEvaluationError('domain', 'bad data'))).toBe(
    true
  );
  expect(isExpressionEvaluationError(new RangeError('bug'))).toBe(false);
  expect(() => new ExpressionEvaluationError('bogus' as any, 'bad')).toThrow(TypeError);
});

test('external logical nodes retain their shared Boolean semantics', () => {
  const expression = {
    type: 'LogicalExpression',
    operator: '&&',
    left: {type: 'Identifier', name: 'a'},
    right: {type: 'Identifier', name: 'b'}
  } as const;
  validateExpressionAST(expression);
  expect(getExpressionColumns(expression)).toEqual(['a', 'b']);
  expect(compile(expression)({a: true, b: false})).toBe(false);
  expect(() => validateExpressionAST({...expression, operator: '??'})).toThrow('logical operator');
});
