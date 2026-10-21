// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef, useState} from 'react';
import {mountScene, VIEWS} from './scene.js';
import {loadModel} from './data.js';
import parquetWorkerUrl from 'math.gl-parquet-loader/worker';
import {maintainHistory} from './history-stream.js';
import {DATA_SOURCES, DEFAULT_SOURCE, sourceFor, clampTime} from './sources.js';
import {REGIONS, timeLabel} from './math.js';
import {EARTH_EVENTS, EVENT_CATEGORIES, filterEarthEvents, eventIsReconstructable} from './earth-events.js';
import {planetaryStage} from './planetary-history.js';
import {PALEO_FEATURES, featuresAtAge, searchPaleoFeatures} from './paleo-features.js';
import {TIMELINE_CHAPTERS, chapterOpacity, timelineMilestones, glaciationPlaybackSpeed} from './timeline.js';
import '@deck.gl/widgets/stylesheet.css';
import './styles.css';
import AttributionWidget from '../shared/attribution-widget.jsx';
import {tectonicSources} from './attribution.js';
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
    [historyStatus, setHistoryStatus] = useState(''),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0);
  const planetaryAgeRef = useRef(null);
  const [sourceId, setSourceId] = useState(DEFAULT_SOURCE),
    [model, setModel] = useState(null);
  const source = sourceFor(sourceId);
  const [view, setView] = useState('globe'),
    [cycleViews, setCycleViews] = useState(true),
    [longitude, setLongitude] = useState(0),
    [scenario, setScenario] = useState('atlantic'),
    [grid, setGrid] = useState(false),
    [glaciations, setGlaciations] = useState(true),
    [regionColors, setRegionColors] = useState(false),
    [speed, setSpeed] = useState(20),
    [counts, setCounts] = useState(null),
    [appearanceStatus, setAppearanceStatus] = useState('Loading terrain imagery…'),
    [eventCategory, setEventCategory] = useState('all'),
    [eventQuery, setEventQuery] = useState(''),
    [planetaryAge, setPlanetaryAge] = useState(null),
    [featureQuery, setFeatureQuery] = useState(''),
    [showAllFeatures, setShowAllFeatures] = useState(false);
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
    setHistoryStatus('');
    setModel(null);
    scene.current?.setModel(null);
    clock.current = clampTime(clock.current, source.maxAge);
    setTime(clock.current);
    loadModel({sourceId, time: clock.current, signal: abort.signal, onStatus: setStatus, workerUrl: parquetWorkerUrl})
      .then(loaded => {
        if (abort.signal.aborted) return;
        setModel(loaded);
        scene.current?.setModel(loaded);
        setCounts(scene.current?.render(clock.current, true));
        setReady(true);
        setPlaying(planetaryAgeRef.current === null);
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
      .waitForTime(time, {
        signal: abort.signal, lifetimeSignal: model.signal,
        onStatus: value => {if (!abort.signal.aborted) setStatus(value);}
      })
      .then(() => {
        if (abort.signal.aborted) return;
        setCounts(scene.current?.render(time, true));
        setReady(true);
        setStatus(
          `${model.pids.length} plate IDs · ${source.citation} · rotations sampled every 10 Ma`
        );
        setPlaying(resume && planetaryAgeRef.current === null);
      })
      .catch(e => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, [time, model, sourceId]);
  useEffect(() => {
    if (!model) return;
    const abort = new AbortController();
    const signal = AbortSignal.any([model.signal, abort.signal]);
    maintainHistory(model, () => clock.current, {
      signal, onStatus: value => {if (!signal.aborted) setHistoryStatus(value);}
    }).catch(error => {
      if (!signal.aborted) setHistoryStatus(error.message);
    });
    return () => abort.abort();
  }, [model]);
  useEffect(() => {
    if (!cycleViews || !playing || !ready) return;
    const timer = setTimeout(() => {
      const views = Object.keys(VIEWS);
      setView(views[(views.indexOf(view) + 1) % views.length]);
    }, 8000);
    return () => clearTimeout(timer);
  }, [cycleViews, playing, ready, view]);
  useEffect(() => {
    scene.current?.setOptions({view, longitude, scenario, grid, regionColors, glaciations});
  }, [view, longitude, scenario, grid, regionColors, glaciations]);
  useEffect(() => {
    if (!playing) {
      clock.current = time;
      const result = scene.current?.render(time, true);
      if (result) setCounts(result);
    }
  }, [time, ready, playing]);
  useEffect(() => {
    scene.current?.setPlayback({time, playing: playing && planetaryAge === null, ready: ready && planetaryAge === null, speed, maxAge: source.maxAge});
  }, [time, playing, ready, speed, sourceId, glaciations, planetaryAge]);
  const leavePlanetary = () => {
    planetaryAgeRef.current = null;
    setPlanetaryAge(null);
  };
  const enterPlanetary = age => {
    planetaryAgeRef.current = age;
    setPlanetaryAge(age);
    setPlaying(false);
  };
  const seek = value => {
    leavePlanetary();
    clock.current = clampTime(Number(value), source.maxAge);
    setPlaying(false);
    setTime(clock.current);
  };
  playback.current = {
    advance(value) {
      if (planetaryAgeRef.current !== null) return;
      clock.current = clampTime(Number(value), source.maxAge);
      setTime(clock.current);
      const result = scene.current?.render(clock.current);
      if (result) setCounts(result);
    },
    play(value) {
      if (planetaryAgeRef.current !== null) return;
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
            disabled={!ready || Boolean(error) || planetaryAge !== null}
            aria-label={playing ? 'Stop playback' : 'Play playback'}
            onClick={() => playback.current.play(!playing)}
          >
            <span aria-hidden="true">{playing ? '■' : '▶'}</span> {playing ? 'Stop' : 'Play'}
          </button>
        </div>
        {planetaryAge !== null && (
          <div className="tectonic-planetary-mode" role="region" aria-label="Illustrative early Earth mode">
            <div className="tectonic-planetary-body" aria-hidden="true" />
            <div className="tectonic-planetary-caption">
              <strong>{planetaryAge.toLocaleString()} Ma · {planetaryStage(planetaryAge)?.label}</strong>
              <p>{planetaryStage(planetaryAge)?.description}</p>
              <p>Conceptual planetary appearance, not reconstructed terrain or impact simulation.</p>
              <button onClick={leavePlanetary}>Return to tectonic reconstruction</button>
            </div>
          </div>
        )}
        <div className="tectonic-chapters" aria-hidden="true">
          {TIMELINE_CHAPTERS.map(chapter => (
            <div
              key={chapter.name}
              className={`tectonic-chapter${chapter.name.includes('&') ? ' tectonic-chapter-pair' : ''}`}
              style={{
                opacity:
                  ready && !error && -chapter.time <= source.maxAge && (glaciations || !chapter.name.startsWith('Snowball Earth'))
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
            onChange={e => {leavePlanetary(); setSourceId(e.target.value);}}
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
        {historyStatus && <p className="tectonic-stream-status" role="status">{historyStatus}</p>}
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
        <label className="tectonic-check">
          <input type="checkbox" checked={cycleViews} onChange={e => setCycleViews(e.target.checked)} />{' '}
          Cycle views every 8 seconds
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
        <label className="tectonic-check">
          <input type="checkbox" checked={glaciations} onChange={e => setGlaciations(e.target.checked)} />{' '}
          Glaciations
        </label>
        {glaciations && playing && glaciationPlaybackSpeed(time, speed) < speed && (
          <p className="tectonic-data-note">Slower playback · ice edge transition</p>
        )}
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
        <details className="tectonic-info" open>
          <summary>Earth history · impacts, climate and extinctions</summary>
          <p className="tectonic-note">
            Events extend to 4,567 Ma. Older events are documented chronology,
            not rendered plate reconstructions. Theia and the late bombardment
            are hypotheses with model-dependent details.
          </p>
          <label>
            Event category
            <select
              aria-label="Event category"
              value={eventCategory}
              onChange={e => setEventCategory(e.target.value)}
            >
              {EVENT_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All events' : category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Search events
            <input
              type="search"
              aria-label="Search Earth history events"
              value={eventQuery}
              placeholder="Theia, extinction, impact…"
              onChange={e => setEventQuery(e.target.value)}
            />
          </label>
          <ul className="tectonic-events">
            {filterEarthEvents(EARTH_EVENTS, eventCategory, eventQuery).map(event => (
              <li key={event.id}>
                <strong>{event.name}</strong>
                <small> · {event.ageMa.toLocaleString()} Ma · {event.confidence}</small>
                <p className="tectonic-note">{event.description}</p>
                <a href={event.url} target="_blank" rel="noreferrer">{event.source}</a>
                {eventIsReconstructable(event, source.maxAge) ? (
                  <button
                    disabled={!ready || Boolean(error)}
                    onClick={() => seek(-event.ageMa)}
                  >View at this age</button>
                ) : (
                  <button onClick={() => enterPlanetary(event.ageMa)}>
                    Explore early Earth scenario
                  </button>
                )}
              </li>
            ))}
          </ul>
        </details>
        <details className="tectonic-info">
          <summary>Bombardment and biodiversity data</summary>
          <p className="tectonic-note">
            Numerical impact-flux and fossil-diversity series are not yet bundled.
            The chart will only appear when a licensed, provenance-checked
            source provides measured or modelled values. No synthetic rates
            or extinction percentages are substituted for missing data.
          </p>
          <p className="tectonic-note">
            Planned sources: published impact chronology models and the
            Paleobiology Database. Impact models must retain their scenario
            and uncertainty; biodiversity curves must retain sampling methods.
          </p>
        </details>
        <details className="tectonic-info">
          <summary>Ancient geographic features</summary>
          <p className="tectonic-note">
            Curated names and approximate age ranges only. These are not reconstructed
            locations, outlines, or elevations, and are not plotted on the map.
          </p>
          <label>
            Find a feature
            <input
              type="search"
              aria-label="Find ancient geographic feature"
              placeholder="Ocean, mountain belt, continent…"
              value={featureQuery}
              onChange={e => setFeatureQuery(e.target.value)}
            />
          </label>
          <label className="tectonic-check">
            <input
              type="checkbox"
              checked={showAllFeatures}
              onChange={e => setShowAllFeatures(e.target.checked)}
            />{' '}
            Show features outside selected time
          </label>
          <ul className="tectonic-feature-list">
            {searchPaleoFeatures(
              showAllFeatures ? PALEO_FEATURES : featuresAtAge(time),
              featureQuery
            ).map(feature => (
              <li key={feature.id}>
                <strong>{feature.name}</strong> · {feature.type}
                <small> · approximately {feature.olderMa}–{feature.youngerMa} Ma</small>
                <p className="tectonic-note">{feature.note}</p>
              </li>
            ))}
          </ul>
          {!searchPaleoFeatures(
            showAllFeatures ? PALEO_FEATURES : featuresAtAge(time),
            featureQuery
          ).length && <p className="tectonic-note">No matching features at this time.</p>}
        </details>
        <AttributionWidget sources={tectonicSources(source)} />
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
          <p className="tectonic-status" role="status">
            {status}
            {counts && ready
              ? ` · ${counts.active} visible templates${counts.unresolved ? ` · ${counts.unresolved} unresolved templates omitted` : ''}`
              : ''}
          </p>
        </details>
      </aside>
      <footer className="tectonic-timeline">
        <div ref={timeline} inert={planetaryAge !== null} aria-disabled={planetaryAge !== null} className="tectonic-widget" aria-label="Geological playback timeline" />
        <div className="tectonic-deep-time" aria-label="Earth history event timeline">
          <div className="tectonic-deep-time-header">
            <strong>4.567 billion years of Earth history</strong>
            <span>Event chronology · not a continuous plate reconstruction</span>
          </div>
          <div className="tectonic-deep-time-track">
            {filterEarthEvents(EARTH_EVENTS, eventCategory, eventQuery).map(event => {
              const available = eventIsReconstructable(event, source.maxAge);
              return (
                <button
                  key={event.id}
                  type="button"
                  className={`tectonic-deep-time-marker ${available ? 'available' : 'unavailable'}`}
                  style={{left: `${(1 - event.ageMa / 4567) * 100}%`}}
                  title={`${event.name} · ${event.ageMa} Ma · ${available ? 'Seek to geological age' : 'Explore illustrative early Earth mode'}`}
                  aria-label={`${event.name}, ${event.ageMa} Ma. ${available ? 'Seek to event' : 'Explore illustrative early Earth mode'}`}
                  disabled={available && (!ready || Boolean(error))}
                  onClick={() => available ? seek(-event.ageMa) : enterPlanetary(event.ageMa)}
                />
              );
            })}
          </div>
          <div className="tectonic-deep-time-axis">
            <span>4,567 Ma</span><span>3,000</span><span>1,500</span><span>0 Ma</span>
          </div>
        </div>
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
