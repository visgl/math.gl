// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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
  private min = Infinity;
  private max = -Infinity;

  constructor(capacity = 256) {
    if (!Number.isSafeInteger(capacity) || capacity < 16 || capacity > 65536) {
      throw new Error('Quantile sketch capacity must be an integer between 16 and 65536');
    }
    this.capacity = capacity;
  }

  get length(): number {
    return this.count;
  }
  get storedSamples(): number {
    return this.samples.length;
  }

  add(value: number): void {
    if (!Number.isFinite(value)) throw new Error('Quantile sketch requires finite values');
    this.samples.push({value, weight: 1});
    this.count++;
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
    if (this.samples.length >= this.capacity * 2) this.reduce();
  }

  merge(other: ScaleQuantileSketch): void {
    if (other === this) throw new Error('Cannot merge a quantile sketch with itself');
    for (const item of other.samples) this.samples.push({...item});
    this.count += other.count;
    this.min = Math.min(this.min, other.min);
    this.max = Math.max(this.max, other.max);
    this.reduce();
  }

  quantile(probability: number): number | null {
    if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
      throw new Error('Quantile probability must be in [0, 1]');
    }
    if (!this.count) return null;
    const sorted = [...this.samples].sort((a, b) => a.value - b.value);
    if (probability === 0) return this.min;
    if (probability === 1) return this.max;
    const index = probability * (this.count - 1);
    const lowerRank = Math.floor(index);
    const upperRank = Math.ceil(index);
    const fraction = index - lowerRank;
    let cumulative = 0;
    let lower: number | undefined;
    for (const sample of sorted) {
      cumulative += sample.weight;
      if (lowerRank < cumulative) {
        lower ??= sample.value;
        if (upperRank < cumulative) return lower * (1 - fraction) + sample.value * fraction;
      }
    }
    return this.max;
  }

  /** Compact comparable weights first so recent rows do not absorb older heavy samples. */
  private reduce(): void {
    while (this.samples.length > this.capacity) {
      const levels = new Map<number, {value: number; weight: number}[]>();
      for (const sample of this.samples) {
        let level = levels.get(sample.weight);
        if (!level) {
          level = [];
          levels.set(sample.weight, level);
        }
        level.push(sample);
      }
      const weights = [...levels.keys()].sort((a, b) => a - b);
      const weight = weights.find(candidate => levels.get(candidate)!.length > 1);
      if (weight === undefined) {
        // Fall back to coalescing the two lightest samples if all weights differ.
        const a = levels.get(weights[0]!)!.pop()!;
        const b = levels.get(weights[1]!)!.pop()!;
        this.samples = this.samples.filter(item => item !== a && item !== b);
        this.samples.push({value: b.value, weight: a.weight + b.weight});
        continue;
      }
      const level = levels.get(weight)!.sort((a, b) => a.value - b.value);
      const offset = this.parity++ % 2;
      const compacted = [];
      for (let i = 0; i + 1 < level.length; i += 2) {
        compacted.push({value: level[i + offset]!.value, weight: weight * 2});
      }
      if (level.length % 2) compacted.push(level[level.length - 1]!);
      this.samples = this.samples.filter(sample => sample.weight !== weight).concat(compacted);
    }
  }
}
