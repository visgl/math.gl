// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original example rendering adapter. All map transformations use the math.gl engine.
import {Deck, OrthographicView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {PathLayer, ScatterplotLayer, TextLayer} from '@deck.gl/layers';
import {_TimelineWidget as TimelineWidget} from '@deck.gl/widgets';
import {
  ProjectionTransform,
  equalEarth,
  mollweide,
  robinson,
  equidistantCylindrical,
  mercator,
  sinusoidal,
  millerCylindrical
} from '@math.gl/geospatial/projection';
import {cutPolygonByMercatorBounds, cutPolylineByMercatorBounds} from '@math.gl/geometry/polygon';
import {
  historicalRotation,
  futureRotation,
  futureRotations,
  rotateToLonLat,
  REGIONS,
  timeLabel
} from './math.js';
import {snowballCoverage, snowballDynamics, timelinePlaybackSpeed} from './timeline.js';
import {vegetationCoverage, microbialCoverage} from './earth-events.js';
import {createPlaceTracker,easeCamera,cinematicShot} from './journeys.js';
import {createFutureComparison} from './future-comparison.js';
import {createFormationEffects} from './formation-effects.js';
import {SurfaceLayer} from './surface-layer.js';
import {EARTH_FORMATION_MA, isEarlyEarth, earlyEarthBlend, earlyEarthMaterial, planetaryStage} from './planetary-history.js';
import {loadPaleoTerrain, terrainBracket} from './paleodem.js';
import {DEFAULT_TERRAIN_PALETTE, paletteFromImage, textureReveal, terrainImageryWeight} from './terrain-material.js';
import {loadTerrain} from './terrain.js';
import {makeMesh, blendWeights, transformMesh, binaryMesh, worldToGeographic} from './geometry.js';
const RADIUS = 6371008.8,
  DURATION = 1200;
export const VIEWS = {
  globe: 'Globe',
  eqearth: 'Equal Earth',
  moll: 'Mollweide',
  robin: 'Robinson',
  sinu: 'Sinusoidal',
  mill: 'Miller cylindrical',
  eqc: 'Equirectangular',
  merc: 'Mercator'
};
const plugins = {
  eqearth: equalEarth,
  moll: mollweide,
  robin: robinson,
  eqc: equidistantCylindrical,
  merc: mercator,
  sinu: sinusoidal,
  mill: millerCylindrical
};
const engines = Object.fromEntries(
  Object.entries(plugins).map(([key, plugin]) => [
    key,
    new ProjectionTransform({
      from: `+proj=longlat +R=${RADIUS} +no_defs`,
      to: `+proj=${key} +R=${RADIUS} +units=m +no_defs`,
      projections: [plugin]
    })
  ])
);
const earth = [];
for (let lon = -180; lon < 180; lon += 5)
  for (let lat = -90; lat < 90; lat += 5)
    earth.push({
      positions: [lon, lat, lon + 5, lat, lon + 5, lat + 5, lon, lat + 5, lon, lat],
      holeIndices: [],
      color: [23, 54, 71]
    });
const graticule = [];
for (let lat = -60; lat <= 60; lat += 30)
  graticule.push(Array.from({length: 181}, (_, i) => [-180 + i * 2, lat]).flat());
for (let lon = -180; lon < 180; lon += 30)
  graticule.push(Array.from({length: 91}, (_, i) => [lon, -90 + i * 2]).flat());
export function mountScene(
  canvas,
  root,
  timelineContainer,
  onError,
  onTimeChange,
  onPlayingChange,
  onAppearanceStatus,
  workerUrl,
  onJourneyStatus = () => {},
  onManualCamera = () => {}
) {
  let mode = 'globe',
    longitude = 0,
    optionLongitude = 0,
    latitude = 15,
    model = null,
    scenario = 'atlantic',
    grid = false,
    glaciations = true,
    regionColors = false,
    terrainImage = null,
    modernTerrainError = false,
    paleoTerrain = null,
    paleoError = false,
    historicalTerrain = true,
    plateMaxAge = 1000,
    appearanceStatus = null,
    impactGlow = -1;
  let followPlace=null,followCamera=false,guidedCamera=false,compareFutures=false,cameraMoving=false,lastCameraTime=0,journeyMessage='';
  const camera={longitude:0,latitude:15},tracker=createPlaceTracker(),comparison=createFutureComparison();
  const markerMesh={coordinates:new Float64Array(2),projected:new Float64Array(2),positions:new Float64Array(3)};
  const trailMesh={coordinates:new Float64Array(66),projected:new Float64Array(66),positions:new Float64Array(99)};
  const markerData=[markerMesh],trailData=[trailMesh];
  let targets = futureRotations(scenario),
    lastTime = -300,
    lastRender = 0;
  let weights = {globe: 1},
    transition = null,
    animation = 0;
  let land = null,
    paths = [],
    geometryTime = NaN,
    geometryLongitude = NaN,
    geometrySeamLongitude = NaN,
    counts = {active: 0, unresolved: 0};
  const earlyMaterial = {};
  let terrainLoadedAt=Infinity;
  const terrainPalette=new Float32Array(DEFAULT_TERRAIN_PALETTE);
  const displayedPalette=new Float32Array(DEFAULT_TERRAIN_PALETTE);
  const lowColor=displayedPalette.subarray(0,3), midColor=displayedPalette.subarray(3,6), highColor=displayedPalette.subarray(6,9);
  const iceDynamics = {};
  const formationEffects = createFormationEffects();
  const rotations = new Map(),
    future = new Map(),
    ocean = makeMesh(earth),
    paleoMesh = makeMesh(earth);
  const scales = {},
    widget = new TimelineWidget({
      id: 'tectonic-playback',
      _container: timelineContainer,
      timeRange: [-EARTH_FORMATION_MA, 300],
      time: -300,
      playing: false,
      step: 1,
      playInterval: 50,
      formatLabel: timeLabel,
      onTimeChange,
      onPlayingChange
    });
  const deck = new Deck({
    canvas,
    parent: root,
    views: new OrthographicView({
      id: 'tectonics',
      controller: {dragPan: false},
      flipY: false,
      near: -10000,
      far: 10000
    }),
    initialViewState: {target: [0, 0, 0], zoom: 0, minZoom: -2, maxZoom: 10},
    widgets: [widget],
    _animate: true,
    onError,
    getCursor: () => (mode === 'globe' ? 'grab' : 'move')
  });
  function configure() {
    const width = root.clientWidth || 800,
      height = root.clientHeight || 550;
    const radius = Math.min(width, height) * 0.39;
    for (const key of Object.keys(engines)) {
      const spanX =
        key === 'moll'
          ? 4 * Math.SQRT2
          : key === 'robin'
            ? 2 * 0.8487 * Math.PI
            : key === 'eqearth'
              ? 5.42
              : 2 * Math.PI;
      const spanY =
        key === 'merc'
          ? 2 * Math.PI
          : key === 'mill'
            ? 4.607
            : key === 'eqearth'
              ? 2.64
              : key === 'moll'
                ? 2 * Math.SQRT2
                : Math.PI;
      scales[key] = Math.min((width * 0.92) / spanX, (height * 0.8) / spanY) / radius / RADIUS;
    }
    deck.setProps({
      width,
      height,
      views: new OrthographicView({
        id: 'tectonics',
        controller: {dragPan: mode !== 'globe'},
        flipY: false,
        near: -10000,
        far: 10000
      }),
      initialViewState: {
        target: [0, 0, 0],
        zoom: Math.log2(radius),
        minZoom: Math.log2(radius) - 2,
        maxZoom: Math.log2(radius) + 5
      }
    });
  }
  function currentWeights(now) {
    if (!transition) return weights;
    weights = blendWeights(transition.from, transition.to, (now - transition.start) / DURATION);
    if (now - transition.start >= DURATION) {
      weights = {[transition.to]: 1};
      transition = null;
    }
    return weights;
  }
  function rebuild(time) {
    const age = Math.max(0, -time),
      parts = [];
    let unresolved = 0,
      active = 0;
    if (model) {
      for (const pid of model.pids) {
        let entry = rotations.get(pid);
        if (!entry) {
          entry = {q: new Float64Array(4), valid: false};
          rotations.set(pid, entry);
        }
        entry.valid = historicalRotation(model.rotations, pid, age, entry.q, model.source.maxAge);
      }
      for (const [region, target] of Object.entries(targets)) {
        let q = future.get(region);
        if (!q) {
          q = new Float64Array(4);
          future.set(region, q);
        }
        futureRotation(target, time, q);
      }
      for (const f of model.features) {
        if (age > f.beginAge || age < f.endAge) continue;
        const entry = rotations.get(f.pid);
        if (time < 0 && !entry.valid) {
          unresolved++;
          continue;
        }
        const q = time > 0 ? future.get(f.region) : entry.q;
        for (let i = 0, j = 0; i < f.xyz.length; i += 3, j += 2) {
          rotateToLonLat(q, f.xyz, i, f.positions, j);
          f.positions[j] -= longitude;
        }
        for (const part of cutPolygonByMercatorBounds(f.positions, f.holes, {maxLatitude: 90}))
          parts.push({...part, color: REGIONS[f.region].color, rotation: q, longitude});
        active++;
      }
    }
    land = makeMesh(parts);
    geometryTime = time;
    geometryLongitude = longitude;
    geometrySeamLongitude = longitude;
    return {active, unresolved};
  }
  function render(time, force = false) {
    lastTime = time;
    const early = isEarlyEarth(time, plateMaxAge);
    const earlyMix = earlyEarthBlend(time, plateMaxAge);
    const now = performance.now();
    if (!force && now - lastRender < 50) return;
    lastRender = now;
    currentWeights(now);
    const journey=tracker.update(time,scenario);
    const shot=guidedCamera&&mode==='globe'?cinematicShot(time):null;
    camera.longitude=longitude;camera.latitude=latitude;
    cameraMoving=false;
    if(mode==='globe'&&(weights.globe||0)>.999999&&((followCamera&&journey.available)||shot)) {
      const targetLon=followCamera&&journey.available?journey.lon:shot.longitude;
      const targetLat=followCamera&&journey.available?journey.lat-12:shot.latitude;
      cameraMoving=easeCamera(camera,targetLon,targetLat,lastCameraTime?now-lastCameraTime:16);
      longitude=camera.longitude;latitude=camera.latitude;
      if(cameraMoving&&!animation)animation=requestAnimationFrame(animate);
    }
    lastCameraTime=now;
    const message=followPlace?journey.message:shot?`Guided camera · ${shot.name}`:'';
    if(message!==journeyMessage){journeyMessage=message;onJourneyStatus(message);}
    const imageReveal=textureReveal(now,terrainLoadedAt);
    for(let i=0;i<9;i++) displayedPalette[i]=DEFAULT_TERRAIN_PALETTE[i]+(terrainPalette[i]-DEFAULT_TERRAIN_PALETTE[i])*imageReveal;
    const pose = paleoTerrain?.get(time);
    const usePaleo = !early && historicalTerrain && !regionColors && Boolean(pose);
    if (!early && !usePaleo && model && !model.hasTime(time)) return counts;
    if (earlyMix > 0) earlyEarthMaterial(time, earlyMaterial);
    const glow = early ? Math.round(Math.sqrt(earlyMaterial.theia)*100)/100 : 0;
    if (glow !== impactGlow) {
      impactGlow = glow;
      canvas.style.filter = glow > 0 ? `drop-shadow(0 0 ${12+glow*20}px rgba(255,${Math.round(210+45*glow)},${Math.round(50+205*glow)},${glow*.8})) drop-shadow(0 0 ${25+glow*35}px rgba(255,${Math.round(190+65*glow)},${Math.round(25+230*glow)},${glow*.6}))` : '';
    }
    let status;
    if (early) status = `${planetaryStage(-time)?.label} · procedural rock, lava and impacts; no reconstructed geography`;
    else if (earlyMix > 0) status = `Blending illustrative early Earth into ${model?.source.id || 'plate'} reconstruction`;
    else if (regionColors) status = `${model?.source.id || 'Plate model'} · categorical region colors`;
    else if (usePaleo) status = `PALEOMAP PaleoDEM · ${pose.a.age === pose.b.age ? pose.a.age : `${pose.a.age}–${pose.b.age}`} Ma · source elevation with calibrated colors${terrainImage && terrainImageryWeight(time)>0 ? "; blending toward NASA imagery/lighting" : " and 8× hill shading"}`;
    else if (historicalTerrain && !regionColors && terrainBracket(time))
      status = `${paleoError || paleoTerrain?.failed ? 'PaleoDEM unavailable' : 'Loading PaleoDEM'} · showing illustrative plate terrain`;
    else status = `${terrainImage ? 'Modern NASA imagery' : modernTerrainError ? 'Shaded land' : 'Loading NASA imagery'} on ${model?.source.id || 'moving'} plates · illustrative${historicalTerrain && !regionColors ? ' (PaleoDEM covers 0–540 Ma)' : ''}`;
    if (status !== appearanceStatus) {
      appearanceStatus = status;
    }
    onAppearanceStatus?.(status, usePaleo);
    if (!early && !usePaleo) {
      if(time!==geometryTime||!land||!Number.isFinite(geometryLongitude)||((weights.globe||0)<.999999&&geometrySeamLongitude!==longitude)) counts=rebuild(time);
      else if(longitude!==geometryLongitude) {
        const delta=geometryLongitude-longitude;
        for(let i=0;i<land.coordinates.length;i+=2)land.coordinates[i]+=delta;
        geometryLongitude=longitude;
      }
    }
    transformMesh(ocean, weights, engines, scales, latitude, true, longitude);
    if (earlyMix > 0 || usePaleo) {
      transformMesh(paleoMesh, weights, engines, scales, latitude, false, longitude, true);
      if (!early && earlyMix > 0) for (let i=0;i<paleoMesh.positions.length;i+=3) {
        paleoMesh.positions[i]*=1.004;
        paleoMesh.positions[i+1]*=1.004;
        paleoMesh.positions[i+2]=paleoMesh.positions[i+2]*1.004+.01*(1-(weights.globe || 0));
      }
    }
    if (!early && !usePaleo) transformMesh(land, weights, engines, scales, latitude);
    paths = [];
    if (grid)
      for (const line of graticule) {
        const shifted = line.map((n, i) => (i % 2 ? n : n - longitude));
        for (const p of cutPolylineByMercatorBounds(shifted, {maxLatitude: 90})) {
          const mesh = {
            coordinates: new Float64Array(p),
            projected: new Float64Array(p.length),
            positions: new Float64Array((p.length / 2) * 3)
          };
          paths.push(transformMesh(mesh, weights, engines, scales, latitude));
        }
      }
    // External triangle indices were generated in geographic cells, before any projection.
    // They remain identical at all interpolation endpoints, including the globe's back face.
    const common = {
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      _normalize: false,
      filled: true,
      extruded: false,
      pickable: false,
      material: false
    };
    const showJourney=journey.available&&!usePaleo&&!early;
    if(showJourney) {
      markerMesh.coordinates[0]=((journey.lon-longitude+180)%360+360)%360-180;markerMesh.coordinates[1]=journey.lat;
      transformMesh(markerMesh,weights,engines,scales,latitude);
      for(let i=0;i<3;i++)markerMesh.positions[i]*=1.012;
      markerMesh.positions[2]+=.01*(1-(weights.globe||0));
      let valid=0;
      for(let i=0;i<journey.count;i++) {
        const lon=((journey.trail[i*2]-longitude+180)%360+360)%360-180;
        if(i&&Math.abs(lon-trailMesh.coordinates[(i-1)*2])>180)break;
        trailMesh.coordinates[i*2]=lon;trailMesh.coordinates[i*2+1]=journey.trail[i*2+1];valid++;
      }
      for(let i=valid;i<33;i++){trailMesh.coordinates[i*2]=trailMesh.coordinates[(valid-1)*2];trailMesh.coordinates[i*2+1]=trailMesh.coordinates[(valid-1)*2+1];}
      transformMesh(trailMesh,weights,engines,scales,latitude);
      for(let i=0;i<trailMesh.positions.length;i++)trailMesh.positions[i]*=1.01;
      for(let i=2;i<trailMesh.positions.length;i+=3)trailMesh.positions[i]+=.008*(1-(weights.globe||0));
    }
    const alternativePaths=compareFutures?comparison.update(time,scenario,longitude,latitude,weights,engines,scales,now,force):null;
    snowballDynamics(time,iceDynamics);
    deck.setProps({
      layers: [
        !early && new SurfaceLayer({
          ...common,
          id: 'tectonic-ocean',
          iceCoverage: glaciations ? snowballCoverage(time) : 0,
          iceRetreat: glaciations ? iceDynamics.retreat : 0,
          iceVolcanism: glaciations ? iceDynamics.volcanism : 0,
          data: binaryMesh(ocean),
          surfaceType: 'ocean',
          globeWeight: weights.globe || 0
        }),
        !early && new SurfaceLayer({
          ...common,
          id: 'tectonic-land',
          vegetation: vegetationCoverage(time),
          iceCoverage: glaciations ? snowballCoverage(time) : 0,
          iceRetreat: glaciations ? iceDynamics.retreat : 0,
          iceVolcanism: glaciations ? iceDynamics.volcanism : 0,
          data: binaryMesh(usePaleo ? paleoMesh : land),
          image: terrainImage,
          textureWeight: imageReveal,
          imageryBlend: usePaleo ? terrainImageryWeight(time)*imageReveal : 0,
          terrainLowColor: lowColor, terrainMidColor: midColor, terrainHighColor: highColor,
          paleoFrameA: usePaleo ? pose.a : null,
          paleoFrameB: usePaleo ? pose.b : null,
          paleoBlend: usePaleo ? pose.blend : 0,
          regionColors,
          globeWeight: weights.globe || 0
        }),
        earlyMix > 0 && new SurfaceLayer({
          ...common,
          id: 'tectonic-early-earth',
          data: binaryMesh(paleoMesh),
          globeWeight: weights.globe || 0,
          earlyEarth: true,
          earlyOpacity: earlyMix,
          earlyLava: earlyMaterial.lava,
          earlyBombardment: earlyMaterial.bombardment,
          earlyWater: earlyMaterial.water,
          microbialLife: microbialCoverage(time),
          earlySteam: earlyMaterial.steam,
          earlyRain: earlyMaterial.rain,
          earlyImpactTime: earlyMaterial.impactTime,
          earlyTheia: earlyMaterial.theia,
          parameters: {depthWriteEnabled: early}
        }),
        ...formationEffects(time, weights.globe || 0),
        showJourney && new PathLayer({id:'journey-trail',data:trailData,getPath:d=>d.positions,
          coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,getColor:[255,214,120,180],getWidth:2,widthUnits:'pixels',
          parameters:{depthWriteEnabled:false},updateTriggers:{getPath:[time,journey.count,longitude,latitude,mode,weights]}}),
        showJourney && new ScatterplotLayer({id:'journey-place',data:markerData,getPosition:d=>d.positions,
          coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,radiusUnits:'pixels',getRadius:6,
          getFillColor:[255,211,104],stroked:true,getLineColor:[255,255,255],getLineWidth:2,lineWidthUnits:'pixels',
          parameters:{depthWriteEnabled:false},updateTriggers:{getPosition:[time,longitude,latitude,mode,weights]}}),
        showJourney && new TextLayer({id:'journey-label',data:markerData,getPosition:d=>d.positions,
          getText:()=>followPlace.name,coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,
          getSize:12,sizeUnits:'pixels',getColor:[255,235,190],getPixelOffset:[12,-12],getTextAnchor:'start',
          background:true,getBackgroundColor:[5,22,35,200],backgroundPadding:[4,3],
          parameters:{depthWriteEnabled:false},updateTriggers:{getPosition:[time,longitude,latitude,mode,weights],getText:followPlace.name}}),
        alternativePaths && new PathLayer({id:'future-alternative',data:alternativePaths,getPath:d=>d.positions,
          coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,getColor:[197,160,255,150],getWidth:1.5,widthUnits:'pixels',
          parameters:{depthWriteEnabled:false},updateTriggers:{getPath:[(weights.globe||0)>.999999?time:alternativePaths,longitude,latitude,mode,weights]}}),
        new PathLayer({
          id: 'tectonic-grid',
          data: paths,
          getPath: p => p,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          getColor: [120, 160, 181, 90],
          widthUnits: 'pixels',
          getWidth: 0.6,
          widthMinPixels: 0.6,
          pickable: false
        })
      ]
    });
    return counts;
  }
  function animate() {
    render(lastTime, true);
    animation = transition || cameraMoving || (terrainImage && textureReveal(performance.now(),terrainLoadedAt)<1) ? requestAnimationFrame(animate) : 0;
  }
  const tooltip = document.createElement('div');
  tooltip.className = 'tectonic-coordinate-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  root.appendChild(tooltip);
  const coordinateScratch = new Float64Array(2),
    pointerScratch = [0, 0, 0];
  const hideTooltip = () => {
    tooltip.hidden = true;
  };
  function showCoordinates(e) {
    if (transition || e.pointerType === 'touch') return hideTooltip();
    const rect = canvas.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;
    pointerScratch[0] = x;
    pointerScratch[1] = y;
    const world = deck.getViewports()[0]?.unproject(pointerScratch);
    if (
      !world ||
      !worldToGeographic(
        world[0],
        world[1],
        mode,
        engines[mode],
        scales[mode],
        latitude,
        longitude,
        coordinateScratch
      )
    )
      return hideTooltip();
    const [lon, lat] = coordinateScratch;
    tooltip.textContent = `${Math.abs(lon).toFixed(2)}° ${lon < 0 ? 'W' : 'E'} · ${Math.abs(lat).toFixed(2)}° ${lat < 0 ? 'S' : 'N'}`;
    tooltip.style.left = `${Math.max(6, Math.min(rect.width - 180, x + 14))}px`;
    tooltip.style.top = `${Math.max(6, Math.min(rect.height - 35, y + 14))}px`;
    tooltip.hidden = false;
  }
  let dragging = null;
  const down = e => {
    hideTooltip();
    if (mode === 'globe') {
      followCamera=false;guidedCamera=false;cameraMoving=false;onManualCamera();
      dragging = [e.clientX, e.clientY];
      canvas.setPointerCapture(e.pointerId);
    }
  };
  const move = e => {
    if (!dragging) return showCoordinates(e);
    hideTooltip();
    longitude -= (e.clientX - dragging[0]) * 0.3;
    latitude = Math.max(-80, Math.min(80, latitude + (e.clientY - dragging[1]) * 0.3));
    dragging[0] = e.clientX;
    dragging[1] = e.clientY;
    render(lastTime, true);
  };
  const up = () => {
    dragging = null;
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', hideTooltip);
  configure();
  render(lastTime, true);
  const appearanceAbort = new AbortController();
  loadTerrain(appearanceAbort.signal)
    .then(image => {
      if (appearanceAbort.signal.aborted) {
        image.close();
        return;
      }
      terrainImage = image;
      terrainLoadedAt=performance.now();
      if(!animation) animation=requestAnimationFrame(animate);
      try {paletteFromImage(image,terrainPalette);} catch(error) {
        console.warn('Terrain palette calibration unavailable; using default palette',error);
      }
      appearanceStatus = null;
      render(lastTime, true);
    })
    .catch(error => {
      modernTerrainError = true;
      console.warn('Terrain load failed', error);
      if (!appearanceAbort.signal.aborted)
        {appearanceStatus = null; render(lastTime, true);}
    });
  loadPaleoTerrain({signal: appearanceAbort.signal, workerUrl,
    onUpdate(error) {
      if (error) paleoError = true;
      if (!appearanceAbort.signal.aborted) render(lastTime, true);
    }
  }).then(value => {
    if (!appearanceAbort.signal.aborted) {paleoTerrain = value; render(lastTime, true);}
  }).catch(error => {
    if (!appearanceAbort.signal.aborted) {
      paleoError = true;
      console.warn('PaleoDEM load failed', error);
      render(lastTime, true);
    }
  });
  return {
    setModel(value) {
      model = value;
      tracker.setModel(value);comparison.setModel(value);
      rotations.clear();
      geometryTime = NaN;
      render(lastTime, true);
    },
    setPlayback({time, playing, ready, speed}) {
      widget.setProps({time, playing, step: timelinePlaybackSpeed(time, speed, plateMaxAge, glaciations) / 20, timeRange: [-EARTH_FORMATION_MA, 300]});
      timelineContainer.inert = !ready;
      timelineContainer.setAttribute('aria-busy', String(!ready));
    },
    setOptions(options) {
      if (mode !== options.view) {
        hideTooltip();
        const now = performance.now();
        currentWeights(now);
        mode = options.view;
        transition = {from: {...weights}, to: mode, start: now};
        configure();
        if (!animation) animation = requestAnimationFrame(animate);
      }
      if (optionLongitude !== Number(options.longitude)) {
        optionLongitude = Number(options.longitude);
        longitude = optionLongitude;
        geometryLongitude = NaN;
      }
      if (scenario !== options.scenario) {
        hideTooltip();
        scenario = options.scenario;
        targets = futureRotations(scenario);
        geometryTime = NaN;
      }
      if(followPlace!==options.followPlace){followPlace=options.followPlace;tracker.setPlace(followPlace);}
      followCamera=Boolean(options.followCamera);guidedCamera=Boolean(options.guidedCamera);compareFutures=Boolean(options.compareFutures);
      grid = options.grid;
      glaciations = options.glaciations ?? true;
      regionColors = options.regionColors;
      plateMaxAge = options.maxAge ?? plateMaxAge;
      historicalTerrain = options.historicalTerrain ?? true;
      return render(lastTime, true);
    },
    refreshHistory() {if(followPlace)return render(lastTime,true);},
    hasTerrain(time) {return historicalTerrain && !regionColors && Boolean(paleoTerrain?.get(time));},
    render,
    resize() {
      configure();
      render(lastTime, true);
    },
    dispose() {
      cancelAnimationFrame(animation);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('pointerleave', hideTooltip);
      tooltip.remove();
      appearanceAbort.abort();
      deck.finalize();
      terrainImage?.close();
    }
  };
}
