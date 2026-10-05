// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// NASA Blue Marble imagery has separate source terms; see assets/blue-marble.jpg.license.
import terrainImageUrl from './assets/blue-marble.jpg';
export const TERRAIN_URL = terrainImageUrl;
export async function loadTerrain(signal) {
  const response = await fetch(TERRAIN_URL, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(15000)])
  });
  if (!response.ok) throw new Error('Terrain image unavailable');
  return createImageBitmap(await response.blob());
}
