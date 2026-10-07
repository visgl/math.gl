// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, { useEffect, useRef, useState } from 'react';
import { loadSimulation, sampleAt } from './data.js';
import { createScene } from './scene.js';
import './style.css';
import { glacialPhase } from './glacial-phase.js';
import GlobalIceAge from './global-app.jsx';
const CHAPTERS = [
  { age: 119, name: 'Cycle begins' },
  { age: 70, name: 'Early advances' },
  { age: 24, name: 'Last glacial maximum' },
  { age: 14, name: 'Retreat' },
  { age: 0, name: 'Present' }
];
const number = (value) => Math.round(value).toLocaleString('en');
function AlpineView({ onMode }) {
  const canvas = useRef(null),
    scene = useRef(null);
  const [model, setModel] = useState(null),
    [error, setError] = useState('');
  const [age, setAge] = useState(119),
    [playing, setPlaying] = useState(true),
    [speed, setSpeed] = useState(2),
    [repeat, setRepeat] = useState(true);
  const [exaggeration, setExaggeration] = useState(6),
    [showIce, setShowIce] = useState(true),
    [ghost, setGhost] = useState(true),
    [labels, setLabels] = useState(true),
    [iceNames, setIceNames] = useState(true),
    [map, setMap] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    loadSimulation(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setModel(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    scene.current = createScene(canvas.current, (e) => setError(e.message));
    return () => {
      scene.current?.finalize();
      scene.current = null;
    };
  }, []);
  useEffect(() => {
    if (model)
      scene.current?.render(model, { age, exaggeration, showIce, ghost, labels, iceNames });
  }, [model, age, exaggeration, showIce, ghost, labels, iceNames]);
  useEffect(() => {
    scene.current?.view(map);
  }, [map]);
  useEffect(() => {
    if (!playing || !model) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(),
        step = Math.min(0.15, (now - previous) / 1000) * speed;
      previous = now;
      setAge((value) => (repeat && value === 0 ? 119 : Math.max(0, value - step)));
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
          aria-label="Alpine terrain and reconstructed glacier thickness; drag to rotate and scroll to zoom"
        />
        <div className="alpine-title">
          <span>GLACIER LAB / math.gl</span>
          <h1>Alpine Ice Age</h1>
          <p>{age < 0.05 ? 'Present day' : `${age.toFixed(1)} thousand years ago`}</p>
          <div className="alpine-phase" aria-live="polite">
            {glacialPhase(age)}
          </div>
        </div>
        {!model && (
          <div className="alpine-loading" role="status">
            {error || 'Loading the Alpine glacier simulation…'}
          </div>
        )}
        {model && error && (
          <div className="alpine-loading" role="alert">
            {error}
          </div>
        )}
        <div className="alpine-map-note">
          {map ? 'Drag to pan' : 'Drag to rotate'} · scroll to zoom{' '}
          <span>Relief ×{exaggeration}</span>
        </div>
      </div>
      <aside className="alpine-controls">
        <label>
          Explore
          <select aria-label="Explore" value="alpine" onChange={(e) => onMode(e.target.value)}>
            <option value="global">Global ice sheets</option>
            <option value="alpine">Alpine glaciers</option>
          </select>
        </label>

        <span className="alpine-eyebrow">THE WÜRM CYCLE</span>
        <h2>Ice through the valleys</h2>
        <p>
          Follow glaciers as they merge into an Alpine ice field and retreat into the mountains.
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
          <select
            aria-label="View"
            value={map ? 'map' : 'relief'}
            onChange={(e) => setMap(e.target.value === 'map')}
          >
            <option value="relief">Oblique terrain</option>
            <option value="map">Map from above</option>
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
        <label>
          Vertical exaggeration <b>×{exaggeration}</b>
          <input
            aria-label="Vertical exaggeration"
            type="range"
            min="1"
            max="15"
            value={exaggeration}
            onChange={(e) => setExaggeration(Number(e.target.value))}
          />
        </label>
        <label className="alpine-check">
          <input type="checkbox" checked={showIce} onChange={(e) => setShowIce(e.target.checked)} />
          Glacier ice
        </label>
        <label className="alpine-check">
          <input type="checkbox" checked={ghost} onChange={(e) => setGhost(e.target.checked)} />
          Reveal terrain beneath ice
        </label>
        <label className="alpine-check">
          <input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} />
          Place labels
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
            Seguinot et al. (2018), PISM simulation with EPICA climate forcing and reduced
            palaeo-precipitation. 2 km source grid, 4 km display grid; one snapshot per 1,000 years.
          </p>
          <p>
            Motion between snapshots is interpolated. Present-day model bedrock is held fixed.
            Relief is exaggerated; the terrain-reveal color blend is illustrative. Area uses a 10 m
            ice threshold; statistics interpolate model-grid totals.
          </p>
          <p>Günz, Mindel and Riss precede this dataset and are not represented.</p>
          <a
            href="https://tc.copernicus.org/articles/12/3265/2018/"
            target="_blank"
            rel="noreferrer"
          >
            Read the study ↗
          </a>
          <br />
          <a href="https://zenodo.org/records/7802275" target="_blank" rel="noreferrer">
            Dataset · CC-BY-4.0 ↗
          </a>
        </details>
      </aside>
      <footer className="alpine-timeline">
        <div className="alpine-timeline-top">
          <button
            disabled={!model}
            onClick={() => {
              if (age === 0) setAge(119);
              setPlaying(!playing);
            }}
            aria-label={playing ? 'Pause playback' : 'Play playback'}
          >
            {playing ? 'Ⅱ Pause' : '▶ Play'}
          </button>
          <span>119,000 years ago</span>
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
              x1={((119 - age) / 119) * 1000}
              x2={((119 - age) / 119) * 1000}
              y1="0"
              y2="65"
              stroke="#fff"
            />
          </svg>
          <input
            type="range"
            aria-label="Age in thousands of years before present"
            min="0"
            max="119"
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

export default function IceAge() {
  const [mode, setMode] = useState('global');
  return mode === 'global' ? <GlobalIceAge onMode={setMode} /> : <AlpineView onMode={setMode} />;
}
