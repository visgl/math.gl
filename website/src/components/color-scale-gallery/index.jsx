// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React, {useState} from 'react';
import {compileResolvedScale} from '@math.gl/core/color';
import styles from './styles.module.css';

/** A named color palette from math.gl. */
const palette = name => ({type: 'palette', name});
/** Explicit colors encoded as normalized sRGB. */
const colors = (...values) => ({type: 'colors', values});
const night = [0.19, 0.14, 0.34, 1];
const violet = [0.38, 0.3, 0.66, 1];
const teal = [0.13, 0.68, 0.63, 1];
const gold = [0.98, 0.79, 0.32, 1];
const blue = [0.15, 0.37, 0.72, 1];
const white = [0.95, 0.94, 0.91, 1];
const red = [0.74, 0.16, 0.24, 1];

/** Compiles the scale using the same API as the layer or legend. */
function example(title, description, type, domain, range, {breaks, pivot} = {}) {
  return {
    title, description,
    scale: compileResolvedScale({type, domain: {type: 'fixed', values: domain}, range, pivot}, domain, breaks)
  };
}

/** Two ways to classify the same skewed 20 observations. */
const comparison = [
  example('Equal intervals', 'Equal widths in the value range.', 'quantize', [0, 100],
    colors(night, violet, teal, gold), {breaks: [25, 50, 75]}),
  example('Quantiles', 'Roughly equal counts of observations.', 'quantile', [0, 100],
    colors(night, violet, teal, gold), {breaks: [8, 19, 42]})
];

/** Color scales with examples of ordered, centered, and categorical data. */
const examples = [
  example('Sequential', 'Magnitude from low to high, such as population density.', 'sequential',
    [0, 100], palette('viridis')),
  example('Diverging', 'Two directions from a reference value, such as change from zero.', 'diverging',
    [-4, 12], colors(blue, white, red), {pivot: 0}),
  example('Threshold', 'Classes defined by explicit cutoffs, such as air-quality alerts.', 'threshold',
    [20, 60], colors(teal, gold, red), {breaks: [20, 60]}),
  example('Ordinal', 'One color for each category, such as land cover.', 'ordinal',
    ['Forest', 'Water', 'Urban'], colors(teal, blue, violet))
];

/** The sample behind the displayed quantile cuts. */
const observations = [0, 2, 4, 6, 8, 8, 10, 13, 16, 19, 19, 23, 28, 34, 42, 42, 51, 64, 82, 100];

const format = new Intl.NumberFormat('en-US', {maximumFractionDigits: 2});

/** Converts a normalized scale color to a CSS color. */
function cssColor(color) {
  if (!Array.isArray(color)) return 'transparent';
  const [r, g, b, a] = color;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

/** Positions each color boundary in the raw input domain. */
function ramp(scale, min, max) {
  const {thresholds, pivot} = scale.descriptor;
  if (thresholds) {
    const edges = [min, ...thresholds, max].sort((a, b) => a - b);
    return `linear-gradient(90deg, ${edges.slice(0, -1).map((from, index) => {
      const to = edges[index + 1];
      const color = cssColor(scale.sample((from + to) / 2));
      return `${color} ${(from - min) / (max - min) * 100}% ${(to - min) / (max - min) * 100}%`;
    }).join(', ')} )`;
  }
  const positions = Array.from({length: 65}, (_, index) => index / 64);
  if (pivot !== undefined && pivot > min && pivot < max) positions.push((pivot - min) / (max - min));
  positions.sort((a, b) => a - b);
  return `linear-gradient(90deg, ${positions.map(t =>
    `${cssColor(scale.sample(min + t * (max - min)))} ${100 * t}%`).join(', ')})`;
}

/** An accurately positioned, labeled scale legend. */
function Legend({scale, value, onSample}) {
  const {domain, thresholds, pivot} = scale.descriptor;
  if (scale.descriptor.type === 'ordinal') {
    return <div className={styles.ordinal}>{domain.map(item =>
      <div key={item}><span style={{background: cssColor(scale.sample(item))}}/>{item}</div>)}</div>;
  }
  const min = scale.descriptor.type === 'threshold' ? 0 : domain[0];
  const max = scale.descriptor.type === 'threshold' ? 100 : domain[domain.length - 1];
  const marks = [min, ...(thresholds ?? (pivot === undefined ? [] : [pivot])), max];
  const position = x => `${100 * (x - min) / (max - min)}%`;
  return (
    <div className={styles.legend}>
      <div
        className={styles.ramp}
        style={{background: ramp(scale, min, max)}}
        onPointerMove={onSample && (event => {
          if (event.pointerType !== 'mouse') return;
          const rect = event.currentTarget.getBoundingClientRect();
          const t = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
          onSample(Math.round(min + t * (max - min)));
        })}
      >
        {value !== undefined && <span className={styles.marker} style={{left: position(value)}}/>}
      </div>
      <div className={styles.ticks}>
        {marks.map((mark, index) =>
          <span key={mark} style={{left: position(mark)}} data-edge={
            index === 0 ? 'start' : index === marks.length - 1 ? 'end' : undefined
          }>{format.format(mark)}</span>)}
      </div>
    </div>
  );
}

/** Interactive comparison of continuous, classified, and categorical color encodings. */
export default function ColorScaleGallery() {
  const [value, setValue] = useState(38);
  return (
    <div className={styles.gallery}>
      <section className={styles.lab} aria-labelledby="compare-scales">
        <div className={styles.labHeader}>
          <div>
            <h2 id="compare-scales">Same data, different breaks</h2>
            <p>Move the slider to compare how two scales color the same value.</p>
          </div>
          <label className={styles.control}>
            <span>Sample value <output>{value}</output></span>
            <input type="range" min={0} max={100} value={value}
              onChange={event => setValue(Number(event.currentTarget.value))}/>
          </label>
        </div>
        <div className={styles.distribution} role="img"
          aria-label="20 observations, clustered toward the lower end of the 0 to 100 range">
          {observations.map((point, index) =>
            <span key={index} style={{left: `${point}%`, bottom: point === observations[index - 1] ? '50%' : '10%'}}/>)}
        </div>
        {comparison.map(({title, description, scale}) =>
          <div className={styles.comparison} key={title}>
            <div><h3><i style={{background: cssColor(scale.sample(value))}} aria-hidden="true"/>{title}</h3>
              <p>{description}</p></div>
            <Legend scale={scale} value={value} onSample={setValue}/>
          </div>)}
      </section>
      <div className={styles.cards}>
        {examples.map(({title, description, scale}) =>
          <section key={title} className={styles.card}>
            <h3>{title}</h3><p>{description}</p>
            <Legend scale={scale}/>
          </section>)}
      </div>
    </div>
  );
}
