// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import useBaseUrl from '@docusaurus/useBaseUrl';
import ExamplePanel from 'website-examples/common/example-panel';
import React, {useEffect, useMemo, useState} from 'react';
import {createExampleEngine, prepareMap, MAPS} from './engines';
import styles from './styles.module.css';

export default function ExternalProjectionEngines() {
  const citiesUrl = useBaseUrl('/data/world-cities.geojson');
  const [mapName, setMapName] = useState('mercator');
  const map = MAPS[mapName];
  const [backend, setBackend] = useState('math.gl');
  const [cities, setCities] = useState(null);
  // Keep the selected source feature independent of asynchronously prepared engines.
  const [selectedCity, setSelectedCity] = useState(null);
  const [dataError, setDataError] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(citiesUrl, {signal: controller.signal})
      .then(response => {
        if (!response.ok) throw new Error(`City data request failed: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!controller.signal.aborted) {
          setCities(data.features);
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) setDataError(String(error));
      });
    return () => controller.abort();
  }, [citiesUrl]);
  const [state, setState] = useState({});
  useEffect(() => {
    let active = true;
    setState({});
    prepareMap(createExampleEngine(backend), mapName).then(
      projection => {
        if (active) setState({projection});
      },
      error => {
        if (active) setState({error: String(error)});
      }
    );
    return () => {
      active = false;
    };
  }, [backend, mapName]);
  const projection = state.projection;
  const {result, error: projectionError} = useMemo(() => {
    if (!projection || !cities) return {};
    try {
      const graticule = [];
      for (let lon = -180; lon <= 180; lon += 30) {
        graticule.push(
          Array.from({length: (80 - map.minLatitude) / 2 + 1}, (_, i) => [
            lon,
            map.minLatitude + i * 2
          ])
        );
      }
      for (let lat = map.minLatitude; lat <= 80; lat += 20) {
        graticule.push(Array.from({length: 181}, (_, i) => [-180 + i * 2, lat]));
      }
      const lines = graticule.map(line => line.map(point => projection.project(point)));
      const projectedCities = cities.map(city => ({
        city,
        xy: projection.project(city.geometry.coordinates)
      }));
      const points = [...lines.flat(), ...projectedCities.map(marker => marker.xy)];
      const minX = Math.min(...points.map(point => point[0]));
      const maxX = Math.max(...points.map(point => point[0]));
      const minY = Math.min(...points.map(point => point[1]));
      const maxY = Math.max(...points.map(point => point[1]));
      // Fit each projection uniformly; the readout retains the engine's metre coordinates.
      const scale = Math.min(760 / (maxX - minX), 420 / (maxY - minY));
      const screen = ([x, y]) => [
        400 + (x - (minX + maxX) / 2) * scale,
        230 - (y - (minY + maxY) / 2) * scale
      ];
      const paths = lines.map(line =>
        line.map((point, i) => `${i ? 'L' : 'M'}${screen(point).join(',')}`).join(' ')
      );
      const markers = projectedCities.map(marker => ({...marker, position: screen(marker.xy)}));
      return {result: {paths, markers}};
    } catch (error) {
      return {error: String(error)};
    }
  }, [projection, cities, map]);
  const selectedMarker = result?.markers.find(marker => marker.city === selectedCity);
  const xy = selectedMarker?.xy;
  const inverse = xy && projection.unproject(xy);
  const error = state.error || dataError || projectionError;
  return (
    <section aria-label="Projection engine comparison" className={styles.example}>
      <ExamplePanel title="Projection engine comparison" className={styles.panel}>
        <label>
          Projection engine
          <select
            aria-label="Projection engine"
            value={backend}
            onChange={event => setBackend(event.target.value)}
          >
            {['math.gl', 'proj4js', 'D3'].map(name => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Projection
          <select
            aria-label="Projection"
            value={mapName}
            onChange={event => setMapName(event.target.value)}
          >
            {Object.entries(MAPS).map(([name, preset]) => (
              <option key={name} value={name}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.description}>
          Click a city to see its projected coordinates. The 1,000 most populous cities from{' '}
          <a href="https://geojson.xyz/">Natural Earth via geojson.xyz</a> are shown.
        </p>
        {error ? (
          <p role="alert" className={styles.description}>
            {error}
          </p>
        ) : !result ? (
          <p role="status" className={styles.description}>
            {!cities ? 'Loading cities…' : 'Preparing engine…'}
          </p>
        ) : null}
        <p className={styles.description}>
          WGS84 longitude/latitude (degrees) → {map.label} (metres). Sphere radius: 6,378,137 m.{' '}
          {map.specs}. Graticule latitude: {map.minLatitude}° to 80°.
        </p>
      </ExamplePanel>
      <div className={styles.view}>
        {result && (
          <>
            <svg
              viewBox="0 0 800 460"
              role="group"
              aria-label={`${map.label}: 1,000 cities projected by ${backend}`}
            >
              {result.paths.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="#557788" strokeWidth="1" />
              ))}
              {result.markers.map(({city, position}, i) => (
                <circle
                  key={i}
                  cx={position[0]}
                  cy={position[1]}
                  r="1.5"
                  className={styles.city}
                  fill="#6ecce8"
                  role="button"
                  tabIndex={0}
                  aria-label={`${city.properties.name}, ${city.properties.adm0name}`}
                  aria-pressed={city === selectedCity}
                  onClick={() => setSelectedCity(city)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedCity(city);
                    }
                  }}
                >
                  <title>
                    {city.properties.name}, {city.properties.adm0name}
                  </title>
                </circle>
              ))}
              {selectedMarker && (
                <g pointerEvents="none">
                  <circle
                    cx={selectedMarker.position[0]}
                    cy={selectedMarker.position[1]}
                    r="6"
                    fill="#ffcc66"
                  />
                </g>
              )}
            </svg>
            {selectedMarker ? (
              <table
                className={styles.results}
                aria-label="Projected and inverse coordinates"
                aria-live="polite"
              >
                <tbody>
                  <tr>
                    <td colSpan={3} className={styles.selectedCity}>
                      {selectedCity.properties.name}, {selectedCity.properties.adm0name}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Forward</th>
                    <td>X {xy[0].toFixed(2)} m</td>
                    <td>Y {xy[1].toFixed(2)} m</td>
                  </tr>
                  <tr>
                    <th scope="row">Inverse</th>
                    <td>lon {inverse[0].toFixed(6)}°</td>
                    <td>lat {inverse[1].toFixed(6)}°</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className={styles.description}>Select a city on the map.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
