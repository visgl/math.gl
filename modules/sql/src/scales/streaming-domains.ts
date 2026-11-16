// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RecordBatch} from 'apache-arrow';
import type {ScaleDomain, ScaleValue} from './scale-types';

import {ScaleQuantileSketch} from './quantile-sketch';

type ColumnState = {
  min: number;
  max: number;
  seen: number;
  categories?: Set<ScaleValue>;
  sketch?: ScaleQuantileSketch;
};

export type StreamingDomainOptions = {
  /** Maximum retained weighted samples per referenced percentile column. */
  quantileCapacity?: number;
  /** Also keep quantile sketches for these columns, e.g. SCALE_QUANTILE inputs. */
  quantileColumns?: readonly string[];
};

/**
 * Incremental domain accumulator. Each Arrow batch is visited once per
 * referenced column, even when multiple visual scales depend on that column.
 */
export function createStreamingDomainAccumulator(
  domains: readonly ScaleDomain[],
  options: StreamingDomainOptions = {}
): {
  update(batch: RecordBatch): void;
  result(): readonly (readonly ScaleValue[])[];
  quantileBreaks(column: string, classes: number): readonly number[];
} {
  const columns = new Map<string, ColumnState>();
  const quantileColumns = new Set(options.quantileColumns ?? []);
  for (const domain of domains) {
    if (domain.type === 'fixed') continue;
    const previous = columns.get(domain.column);
    if (previous) {
      if (
        (domain.type === 'percentile' || quantileColumns.has(domain.column)) &&
        !previous.sketch
      ) {
        previous.sketch = new ScaleQuantileSketch(options.quantileCapacity);
      }
      if (domain.type === 'categories') previous.categories ??= new Set();
      continue;
    }
    columns.set(domain.column, {
      min: Infinity,
      max: -Infinity,
      seen: 0,
      ...(domain.type === 'categories' ? {categories: new Set<ScaleValue>()} : {}),
      ...(domain.type === 'percentile' || quantileColumns.has(domain.column)
        ? {sketch: new ScaleQuantileSketch(options.quantileCapacity)}
        : {})
    });
  }

  for (const name of quantileColumns) {
    if (!columns.has(name))
      columns.set(name, {
        min: Infinity,
        max: -Infinity,
        seen: 0,
        sketch: new ScaleQuantileSketch(options.quantileCapacity)
      });
  }

  return {
    update(batch) {
      for (const [name, state] of columns) {
        const vector = batch.getChild(name);
        if (!vector) throw new Error(`Missing scale column: ${name}`);
        for (let row = 0; row < vector.length; row++) {
          const value = vector.get(row);
          if (value === null || value === undefined) continue;
          if (typeof value === 'string') {
            state.categories?.add(value);
          } else if (typeof value === 'number' && Number.isFinite(value)) {
            state.categories?.add(value);
            state.seen++;
            state.min = Math.min(state.min, value);
            state.max = Math.max(state.max, value);
            state.sketch?.add(value);
          } else {
            throw new Error(`Scale column ${name} has unsupported value at row ${row}`);
          }
        }
      }
    },
    result() {
      return domains.map(domain => {
        if (domain.type === 'fixed') return [...domain.values];
        const state = columns.get(domain.column)!;
        if (domain.type === 'categories') {
          const labels = [...state.categories!];
          return domain.order === 'first-seen'
            ? labels
            : labels.sort((a, b) =>
                typeof a === 'number' && typeof b === 'number' ? a - b : a < b ? -1 : a > b ? 1 : 0
              );
        }
        if (!state.seen) return [];
        if (domain.type === 'percentile') {
          return [state.sketch!.quantile(domain.lower)!, state.sketch!.quantile(domain.upper)!];
        }
        if (domain.type === 'symmetric') {
          const radius = Math.max(
            Math.abs(state.min - domain.pivot),
            Math.abs(state.max - domain.pivot)
          );
          return [domain.pivot - radius, domain.pivot + radius];
        }
        if (domain.includeZero) return [Math.min(state.min, 0), Math.max(state.max, 0)];
        return [state.min, state.max];
      });
    },
    quantileBreaks(column, classes) {
      if (!Number.isSafeInteger(classes) || classes < 2) {
        throw new Error('Scale class count must be at least two');
      }
      const sketch = columns.get(column)?.sketch;
      if (!sketch) throw new Error(`Column ${column} has no quantile sketch`);
      if (!sketch.length) return [];
      return Array.from({length: classes - 1}, (_, i) => sketch.quantile((i + 1) / classes)!);
    }
  };
}
