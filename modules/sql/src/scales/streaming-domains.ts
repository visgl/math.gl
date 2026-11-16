// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RecordBatch} from 'apache-arrow';
import type {ScaleDomain, ScaleValue} from './scale-types';

/**
 * Deterministic, bounded-memory weighted compactor for approximate quantiles.
 * Compaction preserves total weight and varies the retained parity to avoid
 * persistent low/high bias. This is a practical sketch, not an exact error-bounded GK estimate.
 */
export class ScaleQuantileSketch {
  readonly capacity: number;
  private samples: {value: number; weight: number}[] = [];
  private parity = 0;
  private count = 0;

  constructor(capacity = 256) {
    if (!Number.isSafeInteger(capacity) || capacity < 16 || capacity > 65536) {
      throw new Error('Quantile sketch capacity must be an integer between 16 and 65536');
    }
    this.capacity = capacity;
  }

  get length(): number { return this.count; }
  get storedSamples(): number { return this.samples.length; }

  add(value: number): void {
    if (!Number.isFinite(value)) throw new Error('Quantile sketch requires finite values');
    this.samples.push({value, weight: 1});
    this.count++;
    if (this.samples.length >= this.capacity * 2) this.compact();
  }

  merge(other: ScaleQuantileSketch): void {
    if (other === this) throw new Error('Cannot merge a quantile sketch with itself');
    for (const item of other.samples) this.samples.push({...item});
    this.count += other.count;
    while (this.samples.length > this.capacity) this.compact();
  }

  quantile(probability: number): number | null {
    if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
      throw new Error('Quantile probability must be in [0, 1]');
    }
    if (!this.count) return null;
    const sorted = [...this.samples].sort((a, b) => a.value - b.value);
    if (probability === 0) return sorted[0]!.value;
    if (probability === 1) return sorted[sorted.length - 1]!.value;
    const target = probability * (this.count - 1);
    let rank = 0;
    for (const sample of sorted) {
      if (target < rank + sample.weight) return sample.value;
      rank += sample.weight;
    }
    return sorted[sorted.length - 1]!.value;
  }

  private compact(): void {
    this.samples.sort((a, b) => a.value - b.value);
    const next: {value: number; weight: number}[] = [];
    for (let i = 0; i < this.samples.length; i += 2) {
      const first = this.samples[i]!;
      const second = this.samples[i + 1];
      if (!second) { next.push(first); continue; }
      next.push({
        value: this.parity++ % 2 ? first.value : second.value,
        weight: first.weight + second.weight
      });
    }
    this.samples = next;
  }
}

type ColumnState = {
  min: number;
  max: number;
  seen: number;
  categories: Set<string>;
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
      if ((domain.type === 'percentile' || quantileColumns.has(domain.column)) && !previous.sketch) {
        previous.sketch = new ScaleQuantileSketch(options.quantileCapacity);
      }
      continue;
    }
    columns.set(domain.column, {
      min: Infinity, max: -Infinity, seen: 0,
      categories: new Set(),
      ...(domain.type === 'percentile' || quantileColumns.has(domain.column)
        ? {sketch: new ScaleQuantileSketch(options.quantileCapacity)} : {})
    });
  }

  for (const name of quantileColumns) {
    if (!columns.has(name)) columns.set(name, {
      min: Infinity, max: -Infinity, seen: 0,
      categories: new Set(), sketch: new ScaleQuantileSketch(options.quantileCapacity)
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
            state.categories.add(value);
          } else if (typeof value === 'number' && Number.isFinite(value)) {
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
          const labels = [...state.categories];
          return domain.order === 'first-seen' ? labels : labels.sort();
        }
        if (!state.seen) return [];
        if (domain.type === 'percentile') {
          return [state.sketch!.quantile(domain.lower)!, state.sketch!.quantile(domain.upper)!];
        }
        if (domain.type === 'symmetric') {
          const radius = Math.max(
            Math.abs(state.min - domain.pivot), Math.abs(state.max - domain.pivot)
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
      return Array.from({length: classes - 1}, (_, i) =>
        sketch.quantile((i + 1) / classes)!);
    }
  };
}
