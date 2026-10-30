// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef, useState} from 'react';
import {FOLLOW_PLACES} from './journeys.js';
import {mountScene, VIEWS} from './scene.js';
import {loadModel} from './data.js';
import parquetWorkerUrl from 'math.gl-parquet-loader/worker';
import {maintainHistory} from './history-stream.js';
import {DATA_SOURCES, DEFAULT_SOURCE, sourceFor, clampTime} from './sources.js';
import {REGIONS, timeLabel} from './math.js';
import {EARTH_EVENTS, EVENT_CATEGORIES, filterEarthEvents, eventIsReconstructable} from './earth-events.js';
import {EARTH_FORMATION_MA, clampTimelineTime, isEarlyEarth, planetaryStage} from './planetary-history.js';
import {PALEO_FEATURES, featuresAtAge, searchPaleoFeatures} from './paleo-features.js';
import {activeChapter, playbackFocus, chapterOpacity, timelineMilestones, glaciationPlaybackSpeed} from './timeline.js';
import '@deck.gl/widgets/stylesheet.css';
import './styles.css';
import AttributionWidget from '../../shared/attribution-widget.jsx';
import {tectonicSources} from './attribution.js';
export default function TectonicTimeMachine() {
  const canvas = useRef(null),
    stage = useRef(null),
    scene = useRef(null),
    clock = useRef(-500),
    timeline = useRef(null),
    playback = useRef(null);
  const [time, setTime] = useState(-500),
    [playing, setPlaying] = useState(false),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState('Ready to load published history'),
    [historyStatus, setHistoryStatus] = useState(''),
    [error, setError] = useState(''),
    [renderError, setRenderError] = useState(''),
    [attempt, setAttempt] = useState(0);
  const playIntent = useRef(true);
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
    [appearanceStatus, setAppearanceStatus] = useState('Loading terrain…'),
    [paleoActive, setPaleoActive] = useState(false),
    [historicalTerrain, setHistoricalTerrain] = useState(true),
    [eventCategory, setEventCategory] = useState('all'),
    [eventQuery, setEventQuery] = useState(''),
    [featureQuery, setFeatureQuery] = useState(''),
    [showAllFeatures, setShowAllFeatures] = useState(false);
  const [journeyId,setJourneyId]=useState('none'),[customPlace,setCustomPlace]=useState(null),
    [customLon,setCustomLon]=useState('-104.99'),[customLat,setCustomLat]=useState('39.74'),
    [followCamera,setFollowCamera]=useState(false),[guidedCamera,setGuidedCamera]=useState(false),
    [compareFutures,setCompareFutures]=useState(false),[journeyStatus,setJourneyStatus]=useState('');
  const followPlace=journeyId==='custom'?customPlace:FOLLOW_PLACES.find(place=>place.id===journeyId)||null;
  const customValid=customLon.trim()!==''&&customLat.trim()!==''&&Number.isFinite(Number(customLon))&&Number.isFinite(Number(customLat))&&Math.abs(Number(customLon))<=180&&Math.abs(Number(customLat))<=90;
  const earlyEarth = isEarlyEarth(time, source.maxAge);
  const formingEarth = time <= -4420;
  const focusEvent = playbackFocus(time);
  const terrainReady = historicalTerrain && !regionColors && paleoActive;
  const sceneReady = earlyEarth || terrainReady || ready;
  const sceneError = renderError || (earlyEarth || terrainReady ? '' : error);
  useEffect(() => {
    const renderer = mountScene(
      canvas.current,
      stage.current,
      timeline.current,
      e => setRenderError(e.message),
      value => playback.current.advance(value),
      value => playback.current.play(value),
      (status, active) => {setAppearanceStatus(status); setPaleoActive(active); if (active && playIntent.current) setPlaying(true);},
      parquetWorkerUrl,
      setJourneyStatus,
      () => {setFollowCamera(false);setGuidedCamera(false);}
    );
    scene.current = renderer;
    const observer = new ResizeObserver(() => renderer.resize());
    observer.observe(stage.current);
    return () => {
      observer.disconnect();
      renderer.dispose();
      scene.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    const abort = new AbortController();
    setReady(false);
    setPlaying(isEarlyEarth(clock.current, source.maxAge) && playIntent.current);
    setError('');
    setRenderError('');
    setHistoryStatus('');
    setModel(null);
    scene.current?.setModel(null);
    clock.current = clampTimelineTime(clock.current);
    setTime(clock.current);
    loadModel({sourceId, time: clampTime(clock.current, source.maxAge), signal: abort.signal, onStatus: setStatus, workerUrl: parquetWorkerUrl})
      .then(loaded => {
        if (abort.signal.aborted) return;
        setModel(loaded);
        scene.current?.setModel(loaded);
        setCounts(scene.current?.render(clock.current, true));
        setReady(true);
        setPlaying(playIntent.current);
        setStatus(
          `${loaded.pids.length} plate IDs · ${source.citation} · rotations sampled every 10 Ma`
        );
      })
      .catch(e => {
        if (!abort.signal.aborted) {
          setError(e.message);
          setStatus('Historical data could not be loaded');
          setPlaying(isEarlyEarth(clock.current, source.maxAge) && playIntent.current);
        }
      });
    return () => abort.abort();
  }, [attempt, sourceId]);
  useEffect(() => {
    if (earlyEarth || !model || model.source.id !== sourceId) return;
    if ((historicalTerrain && !regionColors && scene.current?.hasTerrain(time)) || model.hasTime(time)) {setReady(true); return;}
    const abort = new AbortController();
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
        setPlaying(playIntent.current);
      })
      .catch(e => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, [time, model, sourceId, historicalTerrain, regionColors]);
  useEffect(() => {
    if (!model) return;
    const abort = new AbortController();
    const signal = AbortSignal.any([model.signal, abort.signal]);
    maintainHistory(model, () => clampTime(clock.current, model.source.maxAge), {
      signal, onStatus: value => {if (!signal.aborted) {setHistoryStatus(value);scene.current?.refreshHistory();}}
    }).catch(error => {
      if (!signal.aborted) setHistoryStatus(error.message);
    });
    return () => abort.abort();
  }, [model]);
  useEffect(() => {
    if (!cycleViews || !playing || !sceneReady || formingEarth) return;
    const timer = setTimeout(() => {
      const views = Object.keys(VIEWS);
      setView(views[(views.indexOf(view) + 1) % views.length]);
    }, 8000);
    return () => clearTimeout(timer);
  }, [cycleViews, playing, sceneReady, view, formingEarth]);
  useEffect(() => {
    scene.current?.setOptions({view, longitude, scenario, grid, regionColors, glaciations, historicalTerrain, maxAge: source.maxAge, followPlace, followCamera, guidedCamera, compareFutures});
  }, [view, longitude, scenario, grid, regionColors, glaciations, historicalTerrain, sourceId, attempt, followPlace, followCamera, guidedCamera, compareFutures]);
  useEffect(() => {
    if (!playing) {
      clock.current = time;
      const result = scene.current?.render(time, true);
      if (result) setCounts(result);
    }
  }, [time, ready, playing]);
  useEffect(() => {
    scene.current?.setPlayback({time, playing: playing && sceneReady && !sceneError,
      ready: sceneReady && !sceneError, speed, maxAge: EARTH_FORMATION_MA});
  }, [time, playing, sceneReady, sceneError, speed, glaciations]);
  const seek = value => {
    clock.current = clampTimelineTime(Number(value));
    playIntent.current = false;
    if (clock.current <= -4420) setView('globe');
    setPlaying(false);
    setPaleoActive(false);
    scene.current?.render(clock.current, true);
    setTime(clock.current);
  };
  playback.current = {
    advance(value) {
      clock.current = clampTimelineTime(Number(value));
      setTime(clock.current);
      const result = scene.current?.render(clock.current);
      if (result) setCounts(result);
    },
    play(value) {
      playIntent.current = value;
      if (value && clock.current >= 300) clock.current = -EARTH_FORMATION_MA;
      if (value && clock.current <= -4420) setView('globe');
      setTime(clock.current);
      setPlaying(value);
    }
  };
  const caption=activeChapter(time,scenario,source.maxAge,glaciations);
  return (
    <div className="tectonic-example">
      <div className="tectonic-stage" ref={stage}>
        <canvas
          ref={canvas}
          aria-label="Animated Earth history, drag to rotate or pan and scroll to zoom"
        />
        <div className="tectonic-heading">
          <span>DEEP TIME / math.gl</span>
          <h2>{timeLabel(time)}</h2>
          <p>
            {earlyEarth ? `${planetaryStage(-time)?.label} · illustrative surface` : time > 0
              ? 'Illustrative future · not a prediction'
              : paleoActive ? 'PALEOMAP · reconstructed paleotopography' : `${source.id} · rigid-block reconstruction`}
          </p>
          <button
            className="tectonic-primary-play"
            disabled={!sceneReady || Boolean(sceneError)}
            aria-label={playing ? 'Stop playback' : 'Play playback'}
            onClick={() => playback.current.play(!playing)}
          >
            <span aria-hidden="true">{playing ? '■' : '▶'}</span> {playing ? 'Stop' : 'Play'}
          </button>
        </div>
        <div className="tectonic-chapters" aria-hidden="true">
          {caption && (
            <div
              key={caption.name}
              className={`tectonic-chapter${(caption.name.includes('&') || caption.name.includes('(')) ? ' tectonic-chapter-pair' : ''}${caption.illustrative ? ' tectonic-chapter-planetary' : ''}`}
              style={{
                opacity:
                  sceneReady && !sceneError 
                    ? chapterOpacity(caption, time, scenario)
                    : 0
              }}
            >
              <strong>{caption.name}</strong>
              <span>{caption.detail}</span>
            </div>
          )}
        </div>
        <div className="tectonic-instructions">
          Drag to {view === 'globe' ? 'rotate' : 'pan'} · scroll to zoom
        </div>
        {(!sceneReady || sceneError) && (
          <div className="tectonic-loading" role="status">
            <p>{sceneError || status}</p>
            {sceneError && <button onClick={() => setAttempt(n => n + 1)}>Retry loading</button>}
          </div>
        )}
      </div>
      <aside className="tectonic-controls">
        <div className="tectonic-controls-title">
          <h3>Earth through time</h3>
          <span className={time > 0 ? 'tectonic-badge future' : 'tectonic-badge'}>
            {earlyEarth || time > 0 ? 'ILLUSTRATION' : 'RECONSTRUCTION'}
          </span>
        </div>
        <label>
          Plate model
          <select
            aria-label="Plate model"
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
        <div className="tectonic-control-row">
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
        </div>
        <label className="tectonic-check">
          <input type="checkbox" checked={cycleViews} onChange={e => setCycleViews(e.target.checked)} />{' '}
          Cycle views every 8 seconds
        </label>
        <label>
          Land appearance
          <select
            aria-label="Land appearance"
            value={regionColors ? 'regions' : historicalTerrain ? 'paleodem' : 'terrain'}
            onChange={e => {setRegionColors(e.target.value === 'regions'); setHistoricalTerrain(e.target.value === 'paleodem');}}
          >
            <option value="paleodem" disabled={Boolean(followPlace)}>Historical terrain · PaleoDEM (0–540 Ma)</option>
            <option value="terrain">Modern NASA imagery on plates</option>
            <option value="regions">Region colors</option>
          </select>
        </label>
        <details className="tectonic-info tectonic-journey-controls">
          <summary>Journeys &amp; guided camera</summary>
          <label>Follow a present-day place
            <select aria-label="Follow a place" value={journeyId} onChange={e=>{
              setJourneyId(e.target.value);
              if(e.target.value==='none')setFollowCamera(false);
              if(e.target.value!=='none'){setHistoricalTerrain(false);setRegionColors(false);setFollowCamera(true);setGuidedCamera(false);setCycleViews(false);setView('globe');}
            }}>
              <option value="none">None</option>
              {FOLLOW_PLACES.map(place=><option key={place.id} value={place.id}>{place.name}</option>)}
              <option value="custom">Custom coordinates</option>
            </select>
          </label>
          {journeyId==='custom'&&<>
            <div className="tectonic-control-pair">
              <label>Longitude<input aria-label="Place longitude" type="number" min="-180" max="180" step="any" value={customLon} onChange={e=>setCustomLon(e.target.value)}/></label>
              <label>Latitude<input aria-label="Place latitude" type="number" min="-90" max="90" step="any" value={customLat} onChange={e=>setCustomLat(e.target.value)}/></label>
            </div>
            <button disabled={!customValid} onClick={()=>{setCustomPlace({name:'Custom place',lon:Number(customLon),lat:Number(customLat)});setHistoricalTerrain(false);setFollowCamera(true);setGuidedCamera(false);setView('globe');}}>Follow coordinates</button>
          </>}
          <label className="tectonic-check"><input type="checkbox" checked={followCamera} disabled={!followPlace} onChange={e=>{setFollowCamera(e.target.checked);if(e.target.checked){setGuidedCamera(false);setView('globe');}}}/>Follow on globe</label>
          <label className="tectonic-check"><input type="checkbox" checked={guidedCamera} onChange={e=>{setGuidedCamera(e.target.checked);if(e.target.checked){setFollowCamera(false);setCycleViews(false);setView('globe');}}}/>Guided event camera</label>
          <label className="tectonic-check"><input type="checkbox" checked={compareFutures} onChange={e=>setCompareFutures(e.target.checked)}/>Compare future alternatives</label>
        </details>
        <details className="tectonic-info tectonic-display-options">
          <summary>Display &amp; future options</summary>
        <label>
          {view === 'globe' ? 'Globe starting longitude' : 'Map central meridian'}
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={longitude}
            onChange={e => {setLongitude(e.target.value);setFollowCamera(false);setGuidedCamera(false);}}
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
        <label className="tectonic-check">
          <input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)} />{' '}
          Graticule
        </label>
        <label className="tectonic-check">
          <input type="checkbox" checked={glaciations} onChange={e => setGlaciations(e.target.checked)} />{' '}
          Glaciations
        </label>
        </details>
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
        <details className="tectonic-info">
          <summary>Earth history · impacts, climate and extinctions</summary>
          <p className="tectonic-note">
            Events extend to 4,567 Ma. Older surfaces are illustrative,
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
                <button disabled={Boolean(renderError)} onClick={() => seek(-event.ageMa)}>
                  View at this age
                </button>
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
            PaleoDEM elevation grids for 0–540 Ma, in their own reconstructed PALEOMAP frame;
            outside that range, modern NASA imagery carried with rigid blocks. Vegetation and ice
            are not reconstructed. Ocean ripples and lighting are visual effects.
          </p>
          <p className="tectonic-status" role="status">
            {status}
            {counts && ready && !paleoActive && !earlyEarth
              ? ` · ${counts.active} visible templates${counts.unresolved ? ` · ${counts.unresolved} unresolved templates omitted` : ''}`
              : ''}
          </p>
        </details>
        <section className="tectonic-explanations" aria-label="View notes">
        <p className="tectonic-source-summary">
          {source.frame} · {source.geometry}
        </p>
        {historyStatus && <p className="tectonic-stream-status" role="status">{historyStatus}</p>}
        {focusEvent ? <p className="tectonic-data-note">Event focus · {focusEvent.name}</p> : earlyEarth && <p className="tectonic-data-note">Deep time · 5× playback until tectonic data begins</p>}
        {glaciations && playing && glaciationPlaybackSpeed(time, speed) < speed && (
          <p className="tectonic-data-note">Slower playback · ice edge transition</p>
        )}
        <p className="tectonic-note">PaleoDEM uses its own PALEOMAP reconstruction. The plate model applies to region colors and earlier/future terrain.</p>
        <p className="tectonic-appearance-status">{appearanceStatus}</p>
        {journeyStatus&&<p className="tectonic-note">{journeyStatus}</p>}
        {followPlace&&<p className="tectonic-note">Marker and up-to-100 Myr trail use {source.id} rotations in published history and original illustrative paths after the present. Template lifetimes and missing rotations are respected. Tracking uses plate imagery to keep reference frames aligned.</p>}
        {(guidedCamera||followPlace)&&<p className="tectonic-note">Drag the globe to take over the camera. Re-enable following or the guided camera to resume.</p>}
        {compareFutures&&<p className="tectonic-note tectonic-future-legend">{time>0?`Purple major-block outlines: ${scenario==='atlantic'?'polar':'Atlantic'} alternative. Solid land: selected scenario. Both are illustrative.`:'Future outlines appear after the present; playback and age are unchanged.'}</p>}
        </section>
      </aside>
      <footer className="tectonic-timeline">
        <div ref={timeline} className="tectonic-widget" aria-label="Geological playback timeline" />
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
                  className={`tectonic-deep-time-marker ${available ? 'available' : 'illustrative'}`}
                  style={{left: `${(1 - event.ageMa / 4567) * 100}%`}}
                  aria-describedby={`timeline-tip-${event.id}`}
                  aria-label={`${event.name}, ${event.ageMa} Ma. ${available ? 'Seek to event' : 'Seek to illustrative early Earth age'}`}
                  disabled={Boolean(renderError)}
                  onClick={() => seek(-event.ageMa)}
                >
                  <span id={`timeline-tip-${event.id}`} role="tooltip" className={`tectonic-event-tooltip ${event.ageMa > 3800 ? 'align-start' : event.ageMa < 750 ? 'align-end' : ''}`}>
                    <strong>{event.name}</strong>
                    <span>{event.ageMa.toLocaleString()} Ma · {available ? 'Seek to geological age' : 'Illustrative early Earth'}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="tectonic-deep-time-axis">
            <span>4,567 Ma</span><span>3,000</span><span>1,500</span><span>0 Ma</span>
          </div>
        </div>
        <div className="tectonic-milestones">
          {timelineMilestones(scenario, source.maxAge).map(({time: value, name: label}) => (
            <button key={value} disabled={Boolean(renderError) || (!isEarlyEarth(value, source.maxAge) && (!sceneReady || Boolean(sceneError)))} onClick={() => seek(value)}>
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
