// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {encodePROJString, parsePROJString, PROJStringSyntaxError} from '@math.gl/crs';

describe('PROJ string codec', () => {
  test('parses definitions, flags, duplicates, and optional plus signs', () => {
    const ast = parsePROJString('proj=utm +zone=32 +ellps=GRS80 +zone=33 +no_defs');
    expect(ast.parameters.map(parameter => parameter.name)).toEqual([
      'proj',
      'zone',
      'ellps',
      'zone',
      'no_defs'
    ]);
    expect(ast.parameters[4].value).toBeUndefined();
    expect(encodePROJString(ast)).toBe('+proj=utm +zone=32 +ellps=GRS80 +zone=33 +no_defs');
  });

  test('preserves pipelines and parameter order', () => {
    const text =
      '+proj=pipeline +ellps=GRS80 +step +proj=cart +step +inv +proj=helmert +x=10 +step +proj=cart';
    const ast = parsePROJString(text);
    expect(ast.parameters.filter(parameter => parameter.name === 'step')).toHaveLength(3);
    expect(encodePROJString(ast)).toBe(text);
  });

  test('preserves quoted raw values while exposing decoded values', () => {
    const text = '+proj=pipeline +title="A local pipeline" +empty="" +step +proj=noop';
    const ast = parsePROJString(text);
    expect(ast.parameters[1]).toMatchObject({
      name: 'title',
      value: 'A local pipeline',
      rawValue: '"A local pipeline"'
    });
    expect(encodePROJString(ast)).toBe(text);
  });

  test('supports multiline canonical output', () => {
    const ast = parsePROJString('+proj=merc +ellps=WGS84');
    expect(encodePROJString(ast, {format: 'multiline'})).toBe('+proj=merc\n+ellps=WGS84');
  });

  test('rejects empty and unterminated input with locations', () => {
    expect(() => parsePROJString('  ')).toThrow(PROJStringSyntaxError);
    let error: PROJStringSyntaxError | undefined;
    try {
      parsePROJString('+proj=pipeline\n+title="unterminated');
    } catch (caughtError) {
      error = caughtError as PROJStringSyntaxError;
    }
    expect(error).toBeInstanceOf(PROJStringSyntaxError);
    expect(error?.line).toBe(2);
    expect(error?.column).toBe(1);
  });

  test('rejects unsafe caller-constructed raw values', () => {
    expect(() =>
      encodePROJString({
        type: 'proj-string',
        parameters: [{type: 'parameter', name: 'title', value: 'safe', rawValue: 'two tokens'}]
      })
    ).toThrow('Invalid PROJ raw parameter value');
  });
});
