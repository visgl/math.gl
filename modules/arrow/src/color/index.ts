// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  DataType,
  Field,
  FixedSizeList,
  Float32,
  Float64,
  List,
  Uint8,
  Utf8,
  Vector,
  makeData,
  makeVector,
  vectorFromArray
} from 'apache-arrow';
import {ColumnReader} from '../expressions/buffers';
import type {ArrowTableFunction} from '../expressions/types';

const number = new Float64();
const text = new Utf8();
const rgba = new FixedSizeList(4, new Field('channel', new Float32(), false));
const rgba8 = new FixedSizeList(4, new Field('channel', new Uint8(), false));
const numbers = new List(new Field('item', number, false));
const strings = new List(new Field('item', text, false));
const clamp = (value: number) => Math.max(0, Math.min(1, value));
/** Normalizes finite ordered bounds without overflowing their span or an out-of-domain difference. */
function normalize(value: number, minimum: number, maximum: number): number {
  if (value <= minimum) return 0;
  if (value >= maximum) return 1;
  const width = maximum - minimum;
  return Number.isFinite(width)
    ? (value - minimum) / width
    : (value / 2 - minimum / 2) / (maximum / 2 - minimum / 2);
}
type Color = readonly [number, number, number, number];
type Reader = (row: number) => unknown;
type Write = (row: number, channels: Float32Array | Uint8Array, offset: number) => boolean;

/** Parses CSS hexadecimal RGB/RGBA notation; a missing color is distinct from transparent. */
function hex(value: string): Color | null {
  if (!/^#(?:[a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i.test(value)) return null;
  let digits = value.slice(1);
  if (digits.length <= 4) digits = Array.from(digits, x => x + x).join('');
  if (digits.length === 6) digits += 'ff';
  return [0, 2, 4, 6].map(
    offset => parseInt(digits.slice(offset, offset + 2), 16) / 255
  ) as unknown as Color;
}

/** A narrow vector declaration builder; all public functions receive explicit arguments. */
function colorFunction(
  name: string,
  types: readonly DataType[],
  prepare: (read: readonly Reader[], vectors: readonly Vector[]) => Write,
  bytes = false
): ArrowTableFunction {
  const type = bytes ? rgba8 : rgba;
  return Object.freeze({
    name,
    prototypes: [
      {
        arguments: types.map((type, index) => new Field(`arg${index + 1}`, type, true)),
        result: new Field('color', type, true),
        evaluate(vectors, {length, activeRows}) {
          const readers = vectors.map(vector => new ColumnReader(vector));
          const read = readers.map(reader => (row: number) => reader.get(row));
          const write = prepare(read, vectors);
          const channels = bytes ? new Uint8Array(length * 4) : new Float32Array(length * 4);
          const validity = new Uint8Array(Math.ceil(length / 8));
          let nullCount = length;
          for (let row = 0; row < length; row++)
            if (
              activeRows[row] &&
              readers.every(reader => reader.isValid(row)) &&
              write(row, channels, row * 4)
            ) {
              validity[row >> 3] |= 1 << (row & 7);
              nullCount--;
            }
          return makeVector(
            makeData({
              type: type as FixedSizeList,
              length,
              nullBitmap: validity,
              nullCount,
              child: bytes
                ? makeData({type: new Uint8(), data: channels as Uint8Array, length: length * 4})
                : makeData({
                    type: new Float32(),
                    data: channels as Float32Array,
                    length: length * 4
                  })
            })
          );
        }
      }
    ]
  });
}
function numeric(read: readonly Reader[], row: number): number[] | null {
  const values = read.map(value => value(row) as number);
  return values.every(Number.isFinite) ? values : null;
}
function writeColor(output: Float32Array | Uint8Array, offset: number, value: Color): boolean {
  for (let c = 0; c < 4; c++) output[offset + c] = clamp(value[c]!);
  return true;
}
/** Reads tuple components from Arrow buffers, without constructing per-row tuple values. */
function tuple(vector: Vector): (row: number, channel: number) => number {
  if (DataType.isDictionary(vector.type))
    return (row, channel) => {
      const value = vector.get(row) as Vector | null;
      return value === null ? NaN : (value.get(channel) as number);
    };
  const reader = new ColumnReader(vector.getChildAt(0)!);
  return (row, channel) => reader.get(row * 4 + channel) as number;
}
/** Interpolates gamma-encoded sRGB with premultiplied alpha, storing straight alpha. */
function mix(
  a: Color,
  b: Color,
  t: number,
  out: Float32Array | Uint8Array,
  offset: number
): boolean {
  t = clamp(t);
  const alpha = a[3] * (1 - t) + b[3] * t;
  for (let c = 0; c < 3; c++)
    out[offset + c] = alpha ? clamp((a[c]! * a[3] * (1 - t) + b[c]! * b[3] * t) / alpha) : 0;
  out[offset + 3] = alpha;
  return true;
}
function colorAt(read: (row: number, channel: number) => number, row: number): Color | null {
  const value = [read(row, 0), read(row, 1), read(row, 2), read(row, 3)] as const;
  return value.every(Number.isFinite) ? (value.map(clamp) as unknown as Color) : null;
}

/** Normalized sRGB components, clamped to [0,1], with opaque alpha. */
export const COLOR_RGB: ArrowTableFunction = /* @__PURE__ */ colorFunction(
  'COLOR_RGB',
  [number, number, number],
  read => (row, out, offset) => {
    const value = numeric(read, row);
    return value ? writeColor(out, offset, [value[0]!, value[1]!, value[2]!, 1]) : false;
  }
);
/** Normalized straight-alpha sRGB components, clamped to [0,1]. */
export const COLOR_RGBA: ArrowTableFunction = /* @__PURE__ */ colorFunction(
  'COLOR_RGBA',
  [number, number, number, number],
  read => (row, out, offset) => {
    const value = numeric(read, row);
    return value ? writeColor(out, offset, value as unknown as Color) : false;
  }
);
/** CSS #rgb, #rgba, #rrggbb or #rrggbbaa; malformed text yields null. */
export const COLOR_FROM_HEX: ArrowTableFunction = /* @__PURE__ */ colorFunction(
  'COLOR_FROM_HEX',
  [text],
  read => (row, out, offset) => {
    const value = hex(read[0]!(row) as string);
    return value ? writeColor(out, offset, value) : false;
  }
);
/** Mixes two normalized colors; t is clamped and alpha is premultiplied during interpolation. */
export const COLOR_MIX: ArrowTableFunction = /* @__PURE__ */ colorFunction(
  'COLOR_MIX',
  [rgba, rgba, number],
  (read, vectors) => {
    const a = tuple(vectors[0]!),
      b = tuple(vectors[1]!);
    return (row, out, offset) => {
      const x = colorAt(a, row),
        y = colorAt(b, row),
        t = read[2]!(row) as number;
      return x && y && Number.isFinite(t) ? mix(x, y, t, out, offset) : false;
    };
  }
);
/** Replaces alpha with a clamped normalized value. */
export const COLOR_WITH_ALPHA: ArrowTableFunction = /* @__PURE__ */ colorFunction(
  'COLOR_WITH_ALPHA',
  [rgba, number],
  (read, vectors) => {
    const color = tuple(vectors[0]!);
    return (row, out, offset) => {
      const value = colorAt(color, row),
        alpha = read[1]!(row) as number;
      return value && Number.isFinite(alpha)
        ? writeColor(out, offset, [value[0], value[1], value[2], alpha])
        : false;
    };
  }
);
/** Converts normalized RGBA to rounded Uint8 channels for rendering. */
export const COLOR_TO_RGBA8: ArrowTableFunction = /* @__PURE__ */ colorFunction(
  'COLOR_TO_RGBA8',
  [rgba],
  (_read, vectors) => {
    const color = tuple(vectors[0]!);
    return (row, out, offset) => {
      const value = colorAt(color, row);
      if (!value) return false;
      for (let c = 0; c < 4; c++) out[offset + c] = Math.round(value[c]! * 255);
      return true;
    };
  },
  true
);
/** Serializes normalized RGBA as lowercase #rrggbbaa, retaining transparent colors. */
export const COLOR_TO_HEX: ArrowTableFunction = /* @__PURE__ */ Object.freeze({
  name: 'COLOR_TO_HEX',
  prototypes: [
    {
      arguments: [new Field('color', rgba, true)],
      result: new Field('hex', text, true),
      evaluate([vector], {length, activeRows}) {
        const read = tuple(vector!);
        return vectorFromArray(
          Array.from({length}, (_, row) => {
            if (!activeRows[row] || !vector!.isValid(row)) return null;
            const value = colorAt(read, row);
            return value
              ? '#' +
                  value
                    .map(x =>
                      Math.round(x * 255)
                        .toString(16)
                        .padStart(2, '0')
                    )
                    .join('')
              : null;
          }),
          text
        );
      }
    }
  ]
});
/** Maps an explicit domain linearly between two colors. */
export const COLOR_RAMP: ArrowTableFunction = /* @__PURE__ */ colorFunction(
  'COLOR_RAMP',
  [number, number, number, rgba, rgba],
  (read, vectors) => {
    const a = tuple(vectors[3]!),
      b = tuple(vectors[4]!);
    return (row, out, offset) => {
      const value = numeric(read.slice(0, 3), row),
        x = colorAt(a, row),
        y = colorAt(b, row);
      if (!value || !x || !y || value[2]! <= value[1]!) return false;
      return mix(x, y, normalize(value[0]!, value[1]!, value[2]!), out, offset);
    };
  }
);

// Small authored anchor palettes, linearly interpolated in sRGB; not continuous reference colormaps.
const palettes: Readonly<Record<string, readonly string[]>> = Object.freeze({
  viridis: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
  grayscale: ['#000000', '#ffffff'],
  blueRed: ['#2166ac', '#f7f7f7', '#b2182b']
});
function paletteSampler(read: Reader) {
  const cache = new Map<string, readonly Color[] | null>();
  return (row: number) => {
    const name = read(row) as string;
    if (cache.has(name)) return cache.get(name)!;
    const colors = Object.prototype.hasOwnProperty.call(palettes, name)
      ? palettes[name]!.map(value => hex(value)!)
      : null;
    if (cache.size < 256) cache.set(name, colors);
    return colors;
  };
}
function paletteColor(
  colors: readonly Color[],
  t: number,
  out: Float32Array | Uint8Array,
  offset: number
): boolean {
  const position = clamp(t) * (colors.length - 1),
    index = Math.min(colors.length - 2, Math.floor(position));
  return mix(colors[index]!, colors[index + 1]!, position - index, out, offset);
}
/** Continuous palette mapping with explicit global bounds and palette name. */
export const COLOR_SCALE: ArrowTableFunction = /* @__PURE__ */ colorFunction(
  'COLOR_SCALE',
  [number, number, number, text],
  read => {
    const palette = paletteSampler(read[3]!);
    return (row, out, offset) => {
      const value = numeric(read.slice(0, 3), row),
        colors = palette(row);
      return value && colors && value[2]! > value[1]!
        ? paletteColor(colors, normalize(value[0]!, value[1]!, value[2]!), out, offset)
        : false;
    };
  }
);
/** Diverging palette mapping with an explicit midpoint. */
export const COLOR_DIVERGING: ArrowTableFunction = /* @__PURE__ */ colorFunction(
  'COLOR_DIVERGING',
  [number, number, number, number, text],
  read => {
    const palette = paletteSampler(read[4]!);
    return (row, out, offset) => {
      const value = numeric(read.slice(0, 4), row),
        colors = palette(row);
      if (!value || !colors || value[1]! >= value[2]! || value[2]! >= value[3]!) return false;
      const t =
        value[0]! <= value[2]!
          ? 0.5 * normalize(value[0]!, value[1]!, value[2]!)
          : 0.5 + 0.5 * normalize(value[0]!, value[2]!, value[3]!);
      return paletteColor(colors, t, out, offset);
    };
  }
);
/** Resolves List or dictionary-encoded List rows, caching shared constant dictionary values. */
function listReader(vector: Vector) {
  const cache = new Map<unknown, readonly unknown[]>();
  return (row: number): readonly unknown[] => {
    if (DataType.isDictionary(vector.type) && vector.data.length === 1) {
      const data = vector.data[0]!,
        index = data.values[row];
      if (cache.has(index)) return cache.get(index)!;
      const value = Array.from(data.dictionary!.get(Number(index)) as Iterable<unknown>);
      cache.set(index, value);
      return value;
    }
    return Array.from(vector.get(row) as Iterable<unknown>);
  };
}
/** Parses and validates the complete palette once for shared list payloads. */
function colorListReader(vector: Vector) {
  const read = listReader(vector),
    cache = new WeakMap<readonly unknown[], readonly Color[] | null>();
  return (row: number) => {
    const values = read(row);
    if (cache.has(values)) return cache.get(values)!;
    const parsed = values.map(value => (typeof value === 'string' ? hex(value) : null));
    const colors = parsed.every(value => value !== null) ? (parsed as Color[]) : null;
    cache.set(values, colors);
    return colors;
  };
}
/** Threshold bins use [lower, upper): equality belongs to the next bin. Colors = breaks + 1. */
export const COLOR_BINS: ArrowTableFunction = /* @__PURE__ */ colorFunction(
  'COLOR_BINS',
  [number, numbers, strings],
  (read, vectors) => {
    const breaks = listReader(vectors[1]!),
      colors = colorListReader(vectors[2]!);
    return (row, out, offset) => {
      const value = read[0]!(row) as number,
        bins = breaks(row) as readonly number[],
        palette = colors(row);
      if (
        !Number.isFinite(value) ||
        !palette ||
        palette.length !== bins.length + 1 ||
        bins.some((x, i) => !Number.isFinite(x) || (i > 0 && x <= bins[i - 1]!))
      )
        return false;
      let index = 0;
      while (index < bins.length && value >= bins[index]!) index++;
      const color = palette[index]!;
      return color ? writeColor(out, offset, color) : false;
    };
  }
);
/** Exact case-sensitive UTF-8 category matching; unknown or duplicate categories yield null. */
export const COLOR_CATEGORY: ArrowTableFunction = /* @__PURE__ */ colorFunction(
  'COLOR_CATEGORY',
  [text, strings, strings],
  (read, vectors) => {
    const categories = listReader(vectors[1]!),
      colors = colorListReader(vectors[2]!);
    const cache = new WeakMap<
      readonly string[],
      WeakMap<readonly Color[], ReadonlyMap<string, Color> | null>
    >();
    return (row, out, offset) => {
      const keys = categories(row) as readonly string[],
        palette = colors(row);
      if (!palette || keys.length !== palette.length) return false;
      let palettes = cache.get(keys);
      if (!palettes) {
        palettes = new WeakMap();
        cache.set(keys, palettes);
      }
      let mapping = palettes.get(palette);
      if (mapping === undefined) {
        const entries = new Map<string, Color>();
        for (let i = 0; i < keys.length; i++) entries.set(keys[i]!, palette[i]!);
        mapping = entries.size === keys.length ? entries : null;
        palettes.set(palette, mapping);
      }
      const color = mapping?.get(read[0]!(row) as string);
      return color ? writeColor(out, offset, color) : false;
    };
  }
);
