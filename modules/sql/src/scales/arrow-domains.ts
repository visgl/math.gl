// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import type {ScaleDomain, ScaleValue} from './scale-types';

type DomainStatistics = {
  readonly values: number[];
  readonly categories: Set<ScaleValue>;
  min: number;
  max: number;
};

/** Exact type-7 interpolated quantile; caller supplies sorted finite samples. */
export function quantileSorted(sorted: readonly number[], probability: number): number {
  if (!sorted.length || !Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new Error('Quantile requires nonempty finite samples and a probability in [0, 1]');
  }
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const fraction = index - lower;
  return sorted[lower]! + fraction * (sorted[Math.ceil(index)]! - sorted[lower]!);
}

/**
 * Resolve multiple data-dependent domains in one pass per referenced Arrow column.
 * Extents use O(1) state; exact percentile domains retain samples to sort.
 * Callers needing bounded approximate quantiles should supply a future sketch backend.
 */
export function resolveArrowDomains(
  table: Table,
  domains: readonly ScaleDomain[]
): readonly (readonly ScaleValue[])[] {
  const columns = new Map<string, DomainStatistics>();
  const needsSamples = new Set<string>();
  const needsCategories = new Set<string>();
  for (const domain of domains) {
    if (domain.type === 'percentile') needsSamples.add(domain.column);
    if (domain.type === 'categories') needsCategories.add(domain.column);
    if (domain.type !== 'fixed' && !table.getChild(domain.column)) {
      throw new Error(`Unknown scale domain column: ${domain.column}`);
    }
  }
  for (const domain of domains) {
    if (domain.type === 'fixed' || columns.has(domain.column)) continue;
    const vector = table.getChild(domain.column)!;
    const state: DomainStatistics = {
      values: [],
      categories: new Set(),
      min: Infinity,
      max: -Infinity
    };
    const samples = needsSamples.has(domain.column);
    for (let row = 0; row < vector.length; row++) {
      const value = vector.get(row);
      if (value === null || value === undefined) continue;
      if (typeof value === 'string') {
        if (needsCategories.has(domain.column)) state.categories.add(value);
        continue;
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Unsupported scale domain value in ${domain.column} at row ${row}`);
      }
      if (needsCategories.has(domain.column)) state.categories.add(value);
      if (value < state.min) state.min = value;
      if (value > state.max) state.max = value;
      if (samples) state.values.push(value);
    }
    if (samples) state.values.sort((a, b) => a - b);
    columns.set(domain.column, state);
  }

  return domains.map(domain => {
    if (domain.type === 'fixed') return [...domain.values];
    const data = columns.get(domain.column)!;
    if (domain.type === 'categories') {
      const values = [...data.categories];
      if (domain.order !== 'first-seen')
        values.sort((a, b) =>
          typeof a === 'number' && typeof b === 'number' ? a - b : a < b ? -1 : a > b ? 1 : 0
        );
      if (!values.length) throw new Error(`Empty categorical scale domain: ${domain.column}`);
      return values;
    }
    if (!Number.isFinite(data.min) || !Number.isFinite(data.max)) {
      throw new Error(`Empty numeric scale domain: ${domain.column}`);
    }
    if (domain.type === 'percentile') {
      return [quantileSorted(data.values, domain.lower), quantileSorted(data.values, domain.upper)];
    }
    if (domain.type === 'symmetric') {
      const radius = Math.max(Math.abs(data.min - domain.pivot), Math.abs(data.max - domain.pivot));
      return [domain.pivot - radius, domain.pivot + radius];
    }
    if (domain.includeZero) return [Math.min(0, data.min), Math.max(0, data.max)];
    return [data.min, data.max];
  });
}

/** Exact, deterministic quantile class breaks; duplicate values may produce empty classes. */
export function resolveArrowQuantiles(
  table: Table,
  column: string,
  classes: number
): readonly number[] {
  if (!Number.isSafeInteger(classes) || classes < 2)
    throw new Error('Quantile classes must be >= 2');
  const vector = table.getChild(column);
  if (!vector) throw new Error(`Unknown quantile column: ${column}`);
  const values: number[] = [];
  for (let row = 0; row < vector.length; row++) {
    const value = vector.get(row);
    if (value === null || value === undefined) continue;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`Quantile column ${column} must be finite numeric`);
    }
    values.push(value);
  }
  values.sort((a, b) => a - b);
  return Array.from({length: classes - 1}, (_, i) => quantileSorted(values, (i + 1) / classes));
}
