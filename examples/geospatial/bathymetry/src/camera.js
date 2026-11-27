// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {geographicLatitude, mapLatitude, normalizeLongitude} from './refinement.js';

/** Recover geographic focus from the dominant camera endpoint during navigation. */
export function getMorphFocus(viewState, morph, projection) {
  const longitude =
    morph < 0.5 ? -viewState.rotationOrbit / (1 - morph) : viewState.target[0] / morph;
  const latitude =
    morph < 0.5
      ? viewState.rotationX / (1 - morph)
      : geographicLatitude(viewState.target[2] / morph, projection);
  return {
    longitude: normalizeLongitude(longitude),
    latitude: Math.max(-90, Math.min(90, latitude))
  };
}

/** Blend display camera coordinates while preserving an independent geographic focus. */
export function getMorphViewState(focus, morph, projection, viewState) {
  return {
    ...viewState,
    rotationOrbit: -focus.longitude * (1 - morph),
    rotationX: focus.latitude * (1 - morph),
    target: [focus.longitude * morph, -180 * morph, mapLatitude(focus.latitude, projection) * morph]
  };
}
