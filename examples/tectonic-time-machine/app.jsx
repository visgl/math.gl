// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef, useState} from 'react';
import {mountScene, VIEWS} from './scene.js';
import {loadModel} from './data.js';
import {DATA_SOURCES, DEFAULT_SOURCE, sourceFor, clampTime} from './sources.js';
import {REGIONS, timeLabel} from './math.js';
import {LANDMASS_CHAPTERS, chapterOpacity, timelineMilestones} from './timeline.js';
import '@deck.gl/widgets/stylesheet.css';
import './styles.css';
export default function TectonicTimeMachine() {
  const canvas = useRef(null),
    stage = useRef(null),
    scene = useRef(null),
    clock = useRef(-930),
    timeline = useRef(null),
    playback = useRef(null);
  const [time, setTime] = useState(-930),
    [playing, setPlaying] = useState(false),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState('Ready to load published history'),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0);
  const [sourceId, setSourceId] = useState(DEFAULT_SOURCE),
    [model, setModel] = useState(null);
  const source = sourceFor(sourceId);
  const [view, setView] = useState('globe'),
    [longitude, setLongitude] = useState(0),
    [scenario, setScenario] = useState('atlantic'),
    [grid, setGrid] = useState(false),
    [regionColors, setRegionColors] = useState(false),
    [speed, setSpeed] = useState(20),
    [counts, setCounts] = useState(null),
    [appearanceStatus, setAppearanceStatus] = useState('Loading terrain imagery…');
  useEffect(() => {
    const renderer = mountScene(
      canvas.current,
      stage.current,
      timeline.current,
      e => setError(e.message),
      value => playback.current.advance(value),
      value => playback.current.play(value),
      setAppearanceStatus
    );
    scene.current = renderer;
    const observer = new ResizeObserver(() => renderer.resize());
    observer.observe(stage.current);
    return () => {
      observer.disconnect();
      renderer.dispose();
      scene.current = null;
    };
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    setReady(false);
    setPlaying(false);
    setError('');
    setModel(null);
    scene.current?.setModel(null);
    clock.current = clampTime(clock.current, source.maxAge);
    setTime(clock.current);
    loadModel({sourceId, time: clock.current, signal: abort.signal, onStatus: setStatus})
      .then(loaded => {
        if (abort.signal.aborted) return;
        setModel(loaded);
        scene.current?.setModel(loaded);
        setCounts(scene.current?.render(clock.current, true));
        setReady(true);
        setStatus(
          `${loaded.pids.length} plate IDs · ${source.citation} · rotations sampled every 10 Ma`
        );
      })
      .catch(e => {
        if (!abort.signal.aborted) {
          setError(e.message);
          setStatus('Historical data could not be loaded');
          setPlaying(false);
        }
      });
    return () => abort.abort();
  }, [attempt, sourceId]);
  useEffect(() => {
    if (!model || model.source.id !== sourceId || model.hasTime(time)) return;
    const abort = new AbortController(),
      resume = playing;
    setReady(false);
    setPlaying(false);
    model
      .ensureTime(time, {signal: abort.signal, onStatus: setStatus})
      .then(() => {
        if (abort.signal.aborted) return;
        setCounts(scene.current?.render(time, true));
        setReady(true);
        setStatus(
          `${model.pids.length} plate IDs · ${source.citation} · rotations sampled every 10 Ma`
        );
        setPlaying(resume);
      })
      .catch(e => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, [time, model, sourceId]);
  useEffect(() => {
    scene.current?.setOptions({view, longitude, scenario, grid, regionColors});
  }, [view, longitude, scenario, grid, regionColors]);
  useEffect(() => {
    if (!playing) {
      clock.current = time;
      const result = scene.current?.render(time, true);
      if (result) setCounts(result);
    }
  }, [time, ready, playing]);
  useEffect(() => {
    scene.current?.setPlayback({time, playing, ready, speed, maxAge: source.maxAge});
  }, [time, playing, ready, speed, sourceId]);
  const seek = value => {
    clock.current = clampTime(Number(value), source.maxAge);
    setPlaying(false);
    setTime(clock.current);
  };
  playback.current = {
    advance(value) {
      clock.current = clampTime(Number(value), source.maxAge);
      setTime(clock.current);
      const result = scene.current?.render(clock.current);
      if (result) setCounts(result);
    },
    play(value) {
      if (value && clock.current >= 300) clock.current = -source.maxAge;
      setTime(clock.current);
      setPlaying(value);
    }
  };
  return (
    <div className="tectonic-example">
      <div className="tectonic-stage" ref={stage}>
        <canvas
          ref={canvas}
          aria-label="Animated tectonic reconstruction, drag to rotate or pan and scroll to zoom"
        />
        <div className="tectonic-heading">
          <span>DEEP TIME / math.gl</span>
          <h2>{timeLabel(time)}</h2>
          <p>
            {time > 0
              ? 'Illustrative future · not a prediction'
              : `${source.id} · rigid-block reconstruction`}
          </p>
          <button
            className="tectonic-primary-play"
            disabled={!ready || Boolean(error)}
            aria-label={playing ? 'Stop playback' : 'Play playback'}
            onClick={() => playback.current.play(!playing)}
          >
            <span aria-hidden="true">{playing ? '■' : '▶'}</span> {playing ? 'Stop' : 'Play'}
          </button>
        </div>
        <div className="tectonic-chapters" aria-hidden="true">
          {LANDMASS_CHAPTERS.map(chapter => (
            <div
              key={chapter.name}
              className={`tectonic-chapter${chapter.name.includes('&') ? ' tectonic-chapter-pair' : ''}`}
              style={{
                opacity:
                  ready && !error && -chapter.time <= source.maxAge
                    ? chapterOpacity(chapter, time, scenario)
                    : 0
              }}
            >
              <strong>{chapter.name}</strong>
              <span>{chapter.detail}</span>
            </div>
          ))}
        </div>
        <div className="tectonic-instructions">
          Drag to {view === 'globe' ? 'rotate' : 'pan'} · scroll to zoom
        </div>
        {(!ready || error) && (
          <div className="tectonic-loading" role="status">
            <p>{error || status}</p>
            {error && <button onClick={() => setAttempt(n => n + 1)}>Retry data load</button>}
          </div>
        )}
      </div>
      <aside className="tectonic-controls">
        <div className="tectonic-controls-title">
          <h3>Continents in motion</h3>
          <span className={time > 0 ? 'tectonic-badge future' : 'tectonic-badge'}>
            {time > 0 ? 'SCENARIO' : 'RECONSTRUCTION'}
          </span>
        </div>
        <label>
          Data source
          <select
            aria-label="Data source"
            value={sourceId}
            onChange={e => setSourceId(e.target.value)}
          >
            {Object.values(DATA_SOURCES).map(item => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <p className="tectonic-source-summary">
          {source.frame} · {source.geometry}
        </p>
        <label>
          View
          <select aria-label="View" value={view} onChange={e => setView(e.target.value)}>
            {Object.entries(VIEWS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {view === 'globe' ? 'Globe starting longitude' : 'Map central meridian'}
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={longitude}
            onChange={e => setLongitude(e.target.value)}
          />
          <output>{longitude}°</output>
        </label>
        <label>
          Future scenario
          <select
            aria-label="Future scenario"
            value={scenario}
            onChange={e => setScenario(e.target.value)}
          >
            <option value="atlantic">Atlantic assembly · illustrative</option>
            <option value="polar">Polar assembly · illustrative</option>
          </select>
        </label>
        <label>
          Playback speed
          <select
            aria-label="Playback speed"
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
          >
            <option value="10">10 million years / second</option>
            <option value="20">20 million years / second</option>
            <option value="40">40 million years / second</option>
          </select>
        </label>
        <label className="tectonic-check">
          <input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)} />{' '}
          Graticule
        </label>
        <label>
          Land appearance
          <select
            aria-label="Land appearance"
            value={regionColors ? 'regions' : 'terrain'}
            onChange={e => setRegionColors(e.target.value === 'regions')}
          >
            <option value="terrain">Natural terrain</option>
            <option value="regions">Region colors</option>
          </select>
        </label>
        {regionColors && (
          <div className="tectonic-legend">
            {Object.entries(REGIONS).map(([name, r]) => (
              <span key={name}>
                <i style={{background: `rgb(${r.color.join(',')})`}} />
                {name}
              </span>
            ))}
          </div>
        )}
        <p className="tectonic-appearance-status">{appearanceStatus}</p>
        <details className="tectonic-info">
          <summary>About this reconstruction</summary>
          <p className="tectonic-note">
            Past: {source.citation} published finite rotations with interpolation. Colored regions
            identify present-day blocks, not ancient continent names. Continental templates do not
            simulate sea level or evolving plate boundaries.
          </p>
          <p className="tectonic-note">
            Future: original illustrative paths assemble continents by +250 Ma and hold the
            arrangement to +300 Ma. They are not geological forecasts.
          </p>
          <p className="tectonic-note">
            Landmass names mark approximate geological chapters, not exact assembly dates or labels
            for individual templates. Gondwana, Laurussia and Pangaea precede the Laurasia
            / Gondwana breakup. Rodinia is included in both sources; Nuna (Columbia) is included in
            Cao et al. (2024). Pannotia’s existence and configuration are debated, so no separate
            assembly is labeled here.
          </p>
          <p className="tectonic-note">
            Older reconstructions carry greater uncertainty, especially in longitude. Terrain is
            modern NASA imagery carried with each rigid block. Ancient mountains, vegetation and ice
            are not reconstructed. Ocean ripples and lighting are visual effects.
          </p>
          <p className="tectonic-credits">
            Terrain:{' '}
            <a
              href="https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/"
              target="_blank"
              rel="noreferrer"
            >
              NASA Blue Marble
            </a>{' '}
            / Reto Stöckli, Robert Simmon; topography: USGS.
          </p>
          <p className="tectonic-status" role="status">
            {status}
            {counts && ready
              ? ` · ${counts.active} visible templates${counts.unresolved ? ` · ${counts.unresolved} unresolved templates omitted` : ''}`
              : ''}
          </p>
          <p className="tectonic-credits">
            History:{' '}
            <a href={source.reference} target="_blank" rel="noreferrer">
              {source.citation}
            </a>
            {' · '}
            <a href={source.dataset} target="_blank" rel="noreferrer">
              Dataset / {source.license}
            </a>
            {sourceId === 'CAO2024' && (
              <>
                {' '}
                · Cao, Collins, Pisarevsky, Flament, Li, Hasterok and Müller. CC-BY-4.0 permits
                reuse with attribution. Continental geometry is simplified for display.
              </>
            )}
            {sourceId === 'MULLER2022' && (
              <>
                {' '}
                · Coastline templates:{' '}
                <a
                  href="https://doi.org/10.1016/j.earscirev.2020.103477"
                  target="_blank"
                  rel="noreferrer"
                >
                  Merdith et al. (2021)
                </a>
                .
              </>
            )}{' '}
            Served by{' '}
            <a href="https://gwsdoc.gplates.org/models/" target="_blank" rel="noreferrer">
              GPlates / EarthByte
            </a>
            . Data loads from their services at runtime.
          </p>
        </details>
      </aside>
      <footer className="tectonic-timeline">
        <div ref={timeline} className="tectonic-widget" aria-label="Geological playback timeline" />
        <div className="tectonic-milestones">
          {timelineMilestones(scenario, source.maxAge).map(({time: value, name: label}) => (
            <button key={value} disabled={!ready || Boolean(error)} onClick={() => seek(value)}>
              {label}
              <small>
                {value < 0 ? `${-value} Ma ago` : value === 0 ? '0 Ma' : `+${value} Ma`}
              </small>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
