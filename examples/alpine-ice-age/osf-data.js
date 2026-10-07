// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  ProjectionTransform,
  lambertAzimuthalEqualArea,
} from "@math.gl/projection";

export const OSF_PROJECT = "https://osf.io/7jen3/";
export const OSF_CHAPTERS = [
  { age: 649.5, name: "Günz · MIS 16", range: "622–677 ka" },
  { age: 453, name: "Mindel · MIS 12", range: "429–477 ka" },
  { age: 161, name: "Riss · MIS 6", range: "132–190 ka" },
];
const ROOT = "https://api.osf.io/v2/nodes/7jen3/files/osfstorage/";
const nativeProjection = "+proj=laea +lat_0=90 +lon_0=0 +datum=WGS84 +units=m";
const transform = new ProjectionTransform({
  from: "+proj=longlat +datum=WGS84",
  to: nativeProjection,
  projections: [lambertAzimuthalEqualArea],
});
async function get(url, signal) {
  const response = await fetch(url, { signal, credentials: "omit" });
  if (!response.ok) throw new Error(`OSF: HTTP ${response.status}`);
  return response;
}
async function files(url, signal) {
  const result = [];
  for (let page = 0; url && page < 10; page++) {
    const json = await (await get(url, signal)).json();
    if (!Array.isArray(json.data)) throw new Error("Invalid OSF file listing");
    result.push(...json.data);
    url = json.links?.next;
  }
  if (url) throw new Error("OSF listing exceeded page limit");
  return result;
}
function downloadUrl(file) {
  return `https://files.osf.io/v1/resources/7jen3/providers/osfstorage/${file.id}`;
}

// Rasterize in the source equal-area frame, then sample our 1° display grid.
// Values represent footprint coverage, never reconstructed ice thickness.
export function rasterizeFootprints(geometries, points, canvas) {
  const size = 2048,
    extent = 9100000;
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Footprint rasterization unavailable");
  context.fillStyle = "#fff";
  let polygons = 0;
  for (const geometry of geometries) {
    if (geometry?.type !== "Polygon") continue;
    polygons++;
    const values = geometry.positions.value,
      stride = geometry.positions.size;
    const rings = geometry.primitivePolygonIndices.value;
    context.beginPath();
    for (let r = 0; r < rings.length - 1; r++) {
      for (let i = rings[r]; i < rings[r + 1]; i++) {
        const x = ((values[i * stride] + extent) / (2 * extent)) * size;
        const y = ((extent - values[i * stride + 1]) / (2 * extent)) * size;
        if (!Number.isFinite(x + y)) throw new Error("Invalid OSF coordinates");
        if (i === rings[r]) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
    }
    context.fill("evenodd");
  }
  if (!polygons) throw new Error("OSF file contains no polygons");
  const pixels = context.getImageData(0, 0, size, size).data;
  const coverage = new Uint16Array(points.length / 2);
  for (let i = 0; i < coverage.length; i++) {
    // This source describes Northern Hemisphere ice sheets only.
    if (Math.floor(i / 360) < 90) continue;
    const x = Math.floor(((points[i * 2] + extent) / (2 * extent)) * size);
    const y = Math.floor(((extent - points[i * 2 + 1]) / (2 * extent)) * size);
    if (x >= 0 && x < size && y >= 0 && y < size)
      coverage[i] = pixels[(y * size + x) * 4 + 3] >= 128 ? 1 : 0;
  }
  if (!coverage.some(Boolean)) throw new Error("Empty OSF reconstruction");
  return coverage;
}
export function nearestOSFChapter(age) {
  return OSF_CHAPTERS.reduce((a, b) =>
    Math.abs(b.age - age) < Math.abs(a.age - age) ? b : a,
  );
}
export async function loadQuaternarySimulation(base, signal) {
  const timeout = AbortSignal.timeout(30000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const root = await files(ROOT, requestSignal);
    const points = new Float64Array(base.count * 2);
    for (let i = 0; i < base.count; i++) {
      // Avoid the LAEA south-pole singularity; those cells are excluded above.
      points[i * 2] = (i % 360) - 180;
      points[i * 2 + 1] = Math.max(0, Math.floor(i / 360) - 90);
    }
    transform.projectFlatSync(points, 2);
    const coverage = [],
      sourceFiles = [];
    for (const stage of ["MIS 16", "MIS 12", "MIS 6"]) {
      const folder = root.find((f) => f.attributes.name === stage);
      if (!folder) throw new Error(`OSF stage missing: ${stage}`);
      const entries = await files(`${ROOT}${folder.id}/`, requestSignal);
      const reconstructions = entries.find(
        (f) => f.attributes.name === "hypothesised ice-sheet reconstructions",
      );
      if (!reconstructions)
        throw new Error("OSF reconstruction folder missing");
      const assets = await files(
        `${ROOT}${reconstructions.id}/`,
        requestSignal,
      );
      const shp = assets.find((f) =>
        /best_estimate\.shp$/i.test(f.attributes.name),
      );
      const prj = assets.find((f) =>
        /best_estimate\.prj$/i.test(f.attributes.name),
      );
      if (!shp || !prj || shp.attributes.size > 12000000)
        throw new Error("Unsupported OSF assets");
      const projection = await (
        await get(downloadUrl(prj), requestSignal)
      ).text();
      if (
        !/Lambert_Azimuthal_Equal_Area/.test(projection) ||
        !/WGS_1984/.test(projection) ||
        !/Latitude_Of_Origin",90/.test(projection)
      )
        throw new Error("Unexpected OSF projection");
      const bytes = await (
        await get(downloadUrl(shp), requestSignal)
      ).arrayBuffer();
      const [{ parse }, { SHPLoader }] = await Promise.all([
        import("@loaders.gl/core"),
        import("@loaders.gl/shapefile"),
      ]);
      const decoded = await parse(bytes, SHPLoader, {
        worker: false,
        shp: { _maxDimensions: 2 },
      });
      if (decoded.error) throw new Error(decoded.error);
      coverage.push(
        rasterizeFootprints(
          decoded.geometries,
          points,
          new OffscreenCanvas(1, 1),
        ),
      );
      sourceFiles.push(shp.links.html);
    }
    const count = base.count,
      ice = new Uint16Array(count * coverage.length),
      bed = new Int16Array(ice.length);
    const currentBed = base.bed.subarray(base.bed.length - count);
    const areaKm2 = [];
    for (let frame = 0; frame < coverage.length; frame++) {
      ice.set(coverage[frame], frame * count);
      bed.set(currentBed, frame * count);
      let area = 0;
      for (let i = 0; i < count; i++) {
        const lat = Math.floor(i / 360) - 90,
          rad = Math.PI / 180;
        const south = Math.max(-90, lat - 0.5) * rad,
          north = Math.min(90, lat + 0.5) * rad;
        area +=
          coverage[frame][i] *
          6371.0088 ** 2 *
          rad *
          (Math.sin(north) - Math.sin(south));
      }
      areaKm2.push(area);
    }
    return {
      count,
      bed,
      ice,
      footprints: true,
      sourceFiles,
      manifest: {
        width: 360,
        height: 181,
        ages: OSF_CHAPTERS.map((c) => c.age),
        areaKm2,
        volumeKm3: [null, null, null],
      },
    };
  } catch {
    // OSF is optional: HTTP, CORS, timeout, decoding and projection failures
    // must never replace or block the existing reconstruction.
    return null;
  }
}
