// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, { useEffect, useRef, useState } from 'react';
import { loadGlobalSimulation, sampleAt } from './data.js';
import { createGlobalScene, GLOBAL_VIEWS } from './global-scene.js';
import './style.css';
const CHAPTERS = [
  { age: 80, name: 'Reconstruction begins' },
  { age: 60, name: 'Earlier ice sheets' },
  { age: 20, name: 'Last glacial maximum' },
  { age: 14, name: 'Retreat' },
  { age: 0, name: 'Present' }
];
const number = (value) => Math.round(value).toLocaleString('en');
export default function GlobalIceAge({ onMode }) {
  const canvas = useRef(null),
    scene = useRef(null);
  const [model, setModel] = useState(null),
    [error, setError] = useState('');
  const [age, setAge] = useState(80),
    [playing, setPlaying] = useState(true),
    [speed, setSpeed] = useState(2),
    [repeat, setRepeat] = useState(true);
  const [showIce, setShowIce] = useState(true),
    [ghost, setGhost] = useState(true),
    [labels, setLabels] = useState(true),
    [iceNames, setIceNames] = useState(true),
    [view, setView] = useState('globe');
  useEffect(() => {
    const controller = new AbortController();
    loadGlobalSimulation(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setModel(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    scene.current = createGlobalScene(canvas.current, (e) => setError(e.message));
    return () => {
      scene.current?.finalize();
      scene.current = null;
    };
  }, []);
  useEffect(() => {
    if (model) scene.current?.render(model, { age, view, showIce, ghost, labels, iceNames });
  }, [model, age, view, showIce, ghost, labels, iceNames]);
  useEffect(() => {
    if (!playing || !model) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(),
        step = Math.min(0.15, (now - previous) / 1000) * speed;
      previous = now;
      setAge((value) => (repeat && value === 0 ? 80 : Math.max(0, value - step)));
    }, 75);
    return () => clearInterval(timer);
  }, [playing, model, speed, repeat]);
  useEffect(() => {
    if (age === 0 && !repeat) setPlaying(false);
  }, [age, repeat]);
  const m = model?.manifest;
  const { index, fraction } = m ? sampleAt(m.ages, age) : { index: 0, fraction: 0 };
  const statistic = (field) =>
    m ? m[field][index] * (1 - fraction) + m[field][index + 1] * fraction : 0;
  const area = statistic('areaKm2'),
    volume = statistic('volumeKm3');
  const chart = m
    ? m.areaKm2
        .map(
          (value, i) =>
            `${(i / (m.ages.length - 1)) * 1000},${60 - (value / Math.max(...m.areaKm2)) * 55}`
        )
        .join(' ')
    : '';
  const seek = (value) => {
    setPlaying(false);
    setAge(value);
  };
  return (
    <div className="alpine-app">
      <div className="alpine-map">
        <canvas
          ref={canvas}
          aria-label="Global grounded ice sheets; drag globe to rotate or map to pan; scroll to zoom"
        />
        <div className="alpine-title">
          <span>GLACIER LAB / math.gl</span>
          <h1>Global Ice Age</h1>
          <p>{age < 0.05 ? 'Present day' : `${age.toFixed(1)} thousand years ago`}</p>
        </div>
        {!model && (
          <div className="alpine-loading" role="status">
            {error || 'Loading the global ice-sheet reconstruction…'}
          </div>
        )}
        {model && error && (
          <div className="alpine-loading" role="alert">
            {error}
          </div>
        )}
        <div className="alpine-map-note">
          {view === 'globe' ? 'Drag to rotate' : 'Drag to pan'} · scroll to zoom{' '}
          <span>PaleoMIST · 1° grid</span>
        </div>
      </div>
      <aside className="alpine-controls">
        <label>
          Explore
          <select aria-label="Explore" value="global" onChange={(e) => onMode(e.target.value)}>
            <option value="global">Global ice sheets</option>
            <option value="alpine">Alpine glaciers</option>
          </select>
        </label>

        <span className="alpine-eyebrow">THE LAST 80,000 YEARS</span>
        <h2>Ice across the planet</h2>
        <p>
          Explore the changing continental ice sheets and shorelines on a globe or a projected map.
        </p>
        <div className="alpine-stats">
          <div>
            <strong>{model ? number(area) : '—'}</strong>
            <span>Model ice area · km²</span>
          </div>
          <div>
            <strong>{model ? number(volume) : '—'}</strong>
            <span>Model ice volume · km³</span>
          </div>
        </div>
        <label>
          View
          <select aria-label="View" value={view} onChange={(e) => setView(e.target.value)}>
            {Object.entries(GLOBAL_VIEWS).map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Playback speed
          <select
            aria-label="Playback speed"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={1}>1,000 years / second</option>
            <option value={2}>2,000 years / second</option>
            <option value={4}>4,000 years / second</option>
          </select>
        </label>
        <label className="alpine-check">
          <input type="checkbox" checked={showIce} onChange={(e) => setShowIce(e.target.checked)} />
          Grounded ice sheets
        </label>
        <label className="alpine-check">
          <input type="checkbox" checked={ghost} onChange={(e) => setGhost(e.target.checked)} />
          Reveal terrain beneath ice
        </label>
        <label className="alpine-check">
          <input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} />
          Latitude / longitude grid
        </label>
        <label className="alpine-check">
          <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
          Repeat animation
        </label>
        <label className="alpine-check">
          <input
            type="checkbox"
            checked={iceNames}
            onChange={(e) => setIceNames(e.target.checked)}
          />
          Ice age names
        </label>
        <div className="alpine-legend">
          <i />
          Thin ice → thick ice
        </div>
        <details>
          <summary>Source and scientific limits</summary>
          <p>
            Gowan et al. (2021), PaleoMIST 1.0. Corrected April 2021 grids, minimal North American
            MIS 3 scenario. 1° grid; 2,500-year snapshots.
          </p>
          <p>
            Grounded ice thickness and changing base topography come from the reconstruction. Sea
            ice and small mountain glaciers are not shown. Margins and statistics interpolate
            between snapshots; terrain-reveal colors are illustrative. Area counts ice thicker than
            10 m.
          </p>
          <p>
            The Alpine view uses a separate, finer simulation. Günz, Mindel and Riss precede both
            datasets.
          </p>
          <a href="https://doi.org/10.1038/s41467-021-21469-w" target="_blank" rel="noreferrer">
            Read the study ↗
          </a>
          <br />
          <a href="https://doi.pangaea.de/10.1594/PANGAEA.905800" target="_blank" rel="noreferrer">
            Dataset · CC-BY-4.0 ↗
          </a>
        </details>
      </aside>
      <footer className="alpine-timeline">
        <div className="alpine-timeline-top">
          <button
            disabled={!model}
            onClick={() => {
              if (age === 0) setAge(80);
              setPlaying(!playing);
            }}
            aria-label={playing ? 'Pause playback' : 'Play playback'}
          >
            {playing ? 'Ⅱ Pause' : '▶ Play'}
          </button>
          <span>80,000 years ago</span>
          <span>Ice area over time</span>
          <span>Present</span>
        </div>
        <div className="alpine-chart">
          <svg
            viewBox="0 0 1000 65"
            preserveAspectRatio="none"
            aria-label="Model ice area over the last glacial cycle"
          >
            <polyline points={chart} fill="none" stroke="#85bccc" strokeWidth="2" />
            <line
              x1={((80 - age) / 80) * 1000}
              x2={((80 - age) / 80) * 1000}
              y1="0"
              y2="65"
              stroke="#fff"
            />
          </svg>
          <input
            type="range"
            aria-label="Age in thousands of years before present"
            min="0"
            max="80"
            step=".05"
            style={{ direction: 'rtl' }}
            value={age}
            disabled={!model}
            onChange={(e) => seek(Number(e.target.value))}
          />
        </div>
        <div className="alpine-chapters">
          {CHAPTERS.map((chapter) => (
            <button key={chapter.age} disabled={!model} onClick={() => seek(chapter.age)}>
              <strong>{chapter.name}</strong>
              <span>{chapter.age ? `${chapter.age} ka` : '0 ka'}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
