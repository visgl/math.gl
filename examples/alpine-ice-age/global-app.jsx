// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, { useEffect, useRef, useState } from "react";
import { loadGlobalSimulation, sampleAt } from "./data.js";
import { createGlobalScene, GLOBAL_VIEWS } from "./global-scene.js";
import "./style.css";
import AttributionWidget from "../shared/attribution-widget.jsx";
import { GLOBAL_SOURCES } from "./attribution.js";
import { climateAt, loadClimate } from "./climate.js";
import {
  loadQuaternarySimulation,
  nearestOSFChapter,
  OSF_CHAPTERS,
} from "./osf-data.js";
import { useChapterTitle } from "./use-chapter-title.js";
import { OSF_SOURCES } from "./attribution.js";
import { glacialPhase } from "./glacial-phase.js";
const CHAPTERS = [
  { age: 80, name: "Reconstruction begins" },
  { age: 60, name: "Earlier ice sheets" },
  { age: 20, name: "Last glacial maximum" },
  { age: 14, name: "Retreat" },
  { age: 0, name: "Present" },
];
const number = (value) => (value / 1e6).toFixed(1);
export default function GlobalIceAge({ onMode, earlier = false }) {
  const canvas = useRef(null),
    scene = useRef(null);
  const [baseModel, setModel] = useState(null),
    [error, setError] = useState("");
  const [climateModel, setClimateModel] = useState(null);
  const [olderModel, setOlderModel] = useState(null);
  const model = earlier && olderModel ? olderModel : baseModel;
  const maxAge = model?.manifest.ages[0] ?? 80;
  const minAge = model?.manifest.ages.at(-1) ?? 0;
  const [age, setAge] = useState(80),
    [playing, setPlaying] = useState(true),
    [speed, setSpeed] = useState(2),
    [repeat, setRepeat] = useState(true);
  const [showIce, setShowIce] = useState(true),
    [ghost, setGhost] = useState(true),
    [labels, setLabels] = useState(true),
    [iceNames, setIceNames] = useState(true),
    [view, setView] = useState("globe"),
    [cycleViews, setCycleViews] = useState(true);
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
    if (!baseModel) return;
    const controller = new AbortController();
    loadQuaternarySimulation(baseModel, controller.signal).then((value) => {
      if (value && !controller.signal.aborted) {
        setOlderModel(value);
        onMode("quaternary");
      }
    });
    return () => controller.abort();
  }, [baseModel, onMode]);
  useEffect(() => {
    setAge(earlier && olderModel ? olderModel.manifest.ages[0] : 80);
  }, [earlier, olderModel]);
  useEffect(() => {
    const controller = new AbortController();
    loadClimate(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setClimateModel(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setClimateModel(null);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    scene.current = createGlobalScene(canvas.current, (e) =>
      setError(e.message),
    );
    return () => {
      scene.current?.finalize();
      scene.current = null;
    };
  }, []);
  useEffect(() => {
    if (model)
      scene.current?.render(model, { age, view, showIce, ghost, labels });
  }, [model, age, view, showIce, ghost, labels]);
  useEffect(() => {
    if (!cycleViews || !model) return;
    const views = Object.keys(GLOBAL_VIEWS);
    const timer = setTimeout(
      () => setView(views[(views.indexOf(view) + 1) % views.length]),
      8000,
    );
    return () => clearTimeout(timer);
  }, [cycleViews, model, view]);
  useEffect(() => {
    if (!playing || !model) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(),
        step = Math.min(0.15, (now - previous) / 1000) * speed;
      previous = now;
      setAge((value) =>
        repeat && value === minAge ? maxAge : Math.max(minAge, value - step),
      );
    }, 75);
    return () => clearInterval(timer);
  }, [playing, model, speed, repeat, minAge, maxAge]);
  useEffect(() => {
    if (age === minAge && !repeat) setPlaying(false);
  }, [age, repeat, minAge]);
  const climate =
    !model?.footprints && climateModel ? climateAt(age, climateModel) : null;
  const phase = model?.footprints
    ? nearestOSFChapter(age).name
    : glacialPhase(age);
  const titleVisible = useChapterTitle(phase, iceNames, Boolean(model));
  const m = model?.manifest;
  const { index, fraction } = m
    ? sampleAt(m.ages, age)
    : { index: 0, fraction: 0 };
  const statistic = (field) => {
    if (!m) return 0;
    if (model.footprints)
      return m[field][m.ages.indexOf(nearestOSFChapter(age).age)];
    return m[field][index] * (1 - fraction) + m[field][index + 1] * fraction;
  };
  const area = statistic("areaKm2"),
    volume = statistic("volumeKm3");
  const chart = m
    ? m.areaKm2
        .map(
          (value, i) =>
            `${((maxAge - m.ages[i]) / (maxAge - minAge)) * 1000},${60 - (value / Math.max(...m.areaKm2)) * 55}`,
        )
        .join(" ")
    : "";
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
          <h1>{model?.footprints ? "Earlier Ice Ages" : "Global Ice Age"}</h1>
          <p>
            {age < 0.05
              ? "Present day"
              : `${age.toFixed(1)} thousand years ago`}
          </p>
        </div>
        {iceNames && (
          <div
            className={`alpine-phase ${titleVisible ? "" : "alpine-phase-hidden"}`}
            aria-hidden={!titleVisible}
          >
            <strong>
              {model?.footprints
                ? nearestOSFChapter(age).name.split(" · ")[0]
                : age >= 11.7 && age <= 115
                  ? "Würm"
                  : glacialPhase(age)}
            </strong>
            {model?.footprints && (
              <span>
                {nearestOSFChapter(age).name.split(" · ")[1]} ·{" "}
                {nearestOSFChapter(age).range} · approximate Alpine correlation
              </span>
            )}
            {!model?.footprints && age >= 11.7 && age <= 115 && (
              <span>
                {glacialPhase(age)} ·{" "}
                {view === "albersNorthAmerica"
                  ? "Wisconsinan"
                  : view === "albersEurope"
                    ? "Weichselian · Würm"
                    : "Würm · Weichselian · Wisconsinan"}
              </span>
            )}
          </div>
        )}
        {!model && (
          <div className="alpine-loading" role="status">
            {error || "Loading the global ice-sheet reconstruction…"}
          </div>
        )}
        {model && error && (
          <div className="alpine-loading" role="alert">
            {error}
          </div>
        )}
        <div className="alpine-map-note">
          {view === "globe" ? "Drag to rotate" : "Drag to pan"} · scroll to zoom{" "}
          <span>
            {cycleViews ? "Cycling projections · " : ""}
            {model?.footprints
              ? "OSF · best-estimate outlines"
              : "PaleoMIST · 1° grid"}
          </span>
        </div>
      </div>
      <aside className="alpine-controls">
        <label>
          Explore
          <select
            aria-label="Explore"
            value={earlier ? "quaternary" : "global"}
            onChange={(e) => onMode(e.target.value)}
          >
            <option value="global">Global ice sheets</option>
            <option value="alpine">Alpine glaciers</option>
            <option value="quaternary" disabled={!olderModel}>
              Earlier ice ages · OSF
            </option>
          </select>
        </label>

        <span className="alpine-eyebrow">
          {model?.footprints
            ? "NORTHERN HEMISPHERE · QUATERNARY"
            : "THE LAST 80,000 YEARS"}
        </span>
        <h2>
          {model?.footprints ? "Earlier ice extents" : "Ice across the planet"}
        </h2>
        <div className="alpine-stats">
          <div>
            <strong>
              {model ? number(area) : "—"} <small>Mkm²</small>
            </strong>
            <span>
              {model?.footprints
                ? "NH footprint area · sampled"
                : "Global ice area"}
            </span>
          </div>
          <div>
            <strong>
              {model && volume !== null ? number(volume) : "—"}{" "}
              <small>Mkm³</small>
            </strong>
            <span>
              {model?.footprints ? "Volume unavailable" : "Global ice volume"}
            </span>
          </div>
        </div>
        <div className="alpine-stats alpine-climate">
          <div>
            <strong>
              {climate ? climate.temperature.toFixed(1) : "—"} <small>°C</small>
            </strong>
            <span>Global temperature Δ · model</span>
          </div>
          <div>
            <strong>
              {!climate || climate.albedo === null
                ? "—"
                : climate.albedo.toFixed(1)}{" "}
              <small>W/m²</small>
            </strong>
            <span>Ice-albedo forcing · model</span>
          </div>
        </div>
        <label>
          View
          <select
            aria-label="View"
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            {Object.entries(GLOBAL_VIEWS).map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label className="alpine-check">
          <input
            type="checkbox"
            checked={cycleViews}
            onChange={(e) => setCycleViews(e.target.checked)}
          />
          Cycle projections
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
          <input
            type="checkbox"
            checked={showIce}
            onChange={(e) => setShowIce(e.target.checked)}
          />
          {model?.footprints ? "Ice-sheet footprints" : "Grounded ice sheets"}
        </label>
        <label className="alpine-check">
          <input
            type="checkbox"
            checked={ghost}
            onChange={(e) => setGhost(e.target.checked)}
          />
          Reveal terrain beneath ice
        </label>
        <label className="alpine-check">
          <input
            type="checkbox"
            checked={labels}
            onChange={(e) => setLabels(e.target.checked)}
          />
          Latitude / longitude grid
        </label>
        <label className="alpine-check">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
          />
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
          {model?.footprints
            ? "Best-estimate ice-sheet footprint"
            : "Thin ice → thick ice"}
        </div>
        <AttributionWidget
          sources={model?.footprints ? OSF_SOURCES : GLOBAL_SOURCES}
        />
        <details>
          <summary>Scientific limits</summary>
          {model?.footprints && (
            <p>
              Batchelor et al. (2019), Northern Hemisphere best-estimate
              ice-sheet footprints only. The display uses one published
              reconstruction per stage, sampled to a 1° grid over present-day
              PaleoMIST bedrock; no thickness or volume is inferred. Snapshots
              switch at the nearest stage midpoint, without invented
              intermediate extents. Günz/Mindel/Riss are approximate Alpine
              correlations, not globally synchronous stage names. Southern
              Hemisphere ice is outside this dataset. The external files have no
              declared redistribution license and are fetched directly from OSF.
            </p>
          )}
          {!model?.footprints && (
            <>
              <p>
                Gowan et al. (2021), PaleoMIST 1.0. Corrected April 2021 grids,
                minimal North American MIS 3 scenario. 1° grid; 2,500-year
                snapshots.
              </p>
              <p>
                Grounded ice thickness and changing base topography come from
                the reconstruction. Sea ice and small mountain glaciers are not
                shown. Margins and statistics interpolate between snapshots;
                terrain-reveal colors are illustrative. Area counts ice thicker
                than 10 m.
              </p>
              <p>
                The Alpine view uses a separate, finer simulation. Günz, Mindel
                and Riss precede both datasets.
              </p>
              <p>
                Climate: Köhler et al. (2015), CC-BY-3.0. Temperature uses
                variant 1 relative to its 0 ka value; albedo is land-ice
                radiative forcing, not total planetary reflectivity. Independent
                model, linearly interpolated 2,000-year samples. Albedo is
                unavailable below 2 ka; no extrapolation.
              </p>
            </>
          )}
        </details>
      </aside>
      <footer className="alpine-timeline">
        <div className="alpine-timeline-top">
          <button
            disabled={!model}
            onClick={() => {
              if (age === minAge) setAge(maxAge);
              setPlaying(!playing);
            }}
            aria-label={playing ? "Pause playback" : "Play playback"}
          >
            {playing ? "Ⅱ Pause" : "▶ Play"}
          </button>
          <span>{maxAge.toLocaleString()} ka ago</span>
          <span>
            {model?.footprints
              ? "Published stage footprints"
              : "Ice area over time"}
          </span>
          <span>{minAge ? `${minAge} ka ago` : "Present"}</span>
        </div>
        <div className="alpine-chart">
          <svg
            viewBox="0 0 1000 65"
            preserveAspectRatio="none"
            aria-label="Ice area across the selected reconstructions"
          >
            <polyline
              points={chart}
              fill="none"
              stroke="#85bccc"
              strokeWidth="2"
            />
            <line
              x1={((maxAge - age) / (maxAge - minAge)) * 1000}
              x2={((maxAge - age) / (maxAge - minAge)) * 1000}
              y1="0"
              y2="65"
              stroke="#fff"
            />
          </svg>
          <input
            type="range"
            aria-label="Age in thousands of years before present"
            min={minAge}
            max={maxAge}
            step=".05"
            style={{ direction: "rtl" }}
            value={age}
            disabled={!model}
            onChange={(e) => seek(Number(e.target.value))}
          />
        </div>
        <div className="alpine-chapters">
          {(model?.footprints ? OSF_CHAPTERS : CHAPTERS).map((chapter) => (
            <button
              key={chapter.age}
              disabled={!model}
              onClick={() => seek(chapter.age)}
            >
              <strong>{chapter.name}</strong>
              <span>{chapter.age ? `${chapter.age} ka` : "0 ka"}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
