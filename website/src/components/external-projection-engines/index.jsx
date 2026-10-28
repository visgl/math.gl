// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import ExamplePanel from 'website-examples/common/example-panel';
import React, {useEffect, useState} from 'react';
import {createExampleEngine, prepareMap, RADIUS} from './engines';

const cities = [['London', -0.1276, 51.5072], ['New York', -74.006, 40.7128], ['Tokyo', 139.6917, 35.6895], ['Sydney', 151.2093, -33.8688]];
const graticule = [];
for (let lon = -180; lon <= 180; lon += 30) graticule.push(Array.from({length: 81}, (_, i) => [lon, -80 + i * 2]));
for (let lat = -80; lat <= 80; lat += 20) graticule.push(Array.from({length: 181}, (_, i) => [-180 + i * 2, lat]));
const screen = ([x, y]) => [400 + x / (Math.PI * RADIUS) * 380, 230 - y / (Math.PI * RADIUS) * 230];

export default function ExternalProjectionEngines() {
  const [backend, setBackend] = useState('math.gl');
  const [cityIndex, setCityIndex] = useState(0);
  const [state, setState] = useState({});
  useEffect(() => {
    let active = true;
    setState({});
    prepareMap(createExampleEngine(backend)).then(projection => {
      if (active) setState({projection});
    }, error => { if (active) setState({error: String(error)}); });
    return () => { active = false; };
  }, [backend]);
  const projection = state.projection;
  const city = cities[cityIndex];
  let result;
  let error = state.error;
  try {
    if (projection) {
      const xy = projection.project([city[1], city[2]]);
      const inverse = projection.unproject(xy);
      const paths = graticule.map(line => line.map((point, i) => `${i ? 'L' : 'M'}${screen(projection.project(point)).join(',')}`).join(' '));
      result = {xy, inverse, paths, marker: screen(xy)};
    }
  } catch (caught) { error = String(caught); }
  return <section aria-label="Projection engine comparison" style={{border: '1px solid #778899', borderRadius: 8, padding: 16, margin: '20px 0'}}>
    <ExamplePanel title="Projection engine comparison">
      <label>Projection engine <select aria-label="Projection engine" value={backend} onChange={event => setBackend(event.target.value)}>{['math.gl', 'proj4js', 'D3'].map(name => <option key={name}>{name}</option>)}</select></label>
      <label>Location <select aria-label="Location" value={cityIndex} onChange={event => setCityIndex(Number(event.target.value))}>{cities.map(([name], i) => <option key={name} value={i}>{name}</option>)}</select></label>
    </ExamplePanel>
    <p>The same application projects a graticule and a location through the selected engine.</p>
    {error ? <p role="alert">{error}</p> : !result ? <p role="status">Preparing engine…</p> : <>
      <svg viewBox="0 0 800 460" role="img" aria-label={`Mercator graticule with ${city[0]}, projected by ${backend}`} style={{width: '100%', background: '#102638', borderRadius: 6}}>
        {result.paths.map((d, i) => <path key={i} d={d} fill="none" stroke="#557788" strokeWidth="1" />)}
        <circle cx={result.marker[0]} cy={result.marker[1]} r="6" fill="#ffcc66" />
        <text x={Math.min(700, result.marker[0] + 10)} y={result.marker[1] - 12} fill="white" fontSize="16">{city[0]}</text>
      </svg>
      <output aria-live="polite" style={{display: 'block', fontVariantNumeric: 'tabular-nums'}}>
        {backend}: X {result.xy[0].toFixed(2)} m · Y {result.xy[1].toFixed(2)} m<br />
        Inverse: {result.inverse[0].toFixed(6)}°, {result.inverse[1].toFixed(6)}°
      </output>
    </>}
    <small>XY only · latitude −80° to 80° · spherical Mercator · D3 scale 6,378,137, zero translation, north-positive Y. No datum or height conversion.</small>
  </section>;
}
