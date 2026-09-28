// math.gl
// SPDX-License-Identifier: MIT
// Adapted from proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import type {KernelParameters, Point} from '../kernel';
export type State = KernelParameters & {
  cgb: number[];
  cbg: number[];
  utg: number[];
  gtu: number[];
  Qn: number;
  Zb: number;
};
// Heavily based on this etmerc projection implementation
// https://github.com/mbloch/mapshaper-proj/blob/master/src/projections/etmerc.js

import sinh from '../common/sinh';
import hypot from '../common/hypot';
import asinhy from '../common/asinhy';
import gatg from '../common/gatg';
import clens from '../common/clens';
import clens_cmplx from '../common/clens_cmplx';
import adjust_lon from '../common/adjust_lon';

function initialize(state: State): void {
  state.x0 = state.x0 !== undefined ? state.x0 : 0;
  state.y0 = state.y0 !== undefined ? state.y0 : 0;
  state.long0 = state.long0 !== undefined ? state.long0 : 0;
  state.lat0 = state.lat0 !== undefined ? state.lat0 : 0;
  state.k0 = state.k0 !== undefined ? state.k0 : 1;

  state.cgb = [];
  state.cbg = [];
  state.utg = [];
  state.gtu = [];

  var f = state.es / (1 + Math.sqrt(1 - state.es));
  var n = f / (2 - f);
  var np = n;

  state.cgb[0] =
    n * (2 + n * (-2 / 3 + n * (-2 + n * (116 / 45 + n * (26 / 45 + n * (-2854 / 675))))));
  state.cbg[0] =
    n * (-2 + n * (2 / 3 + n * (4 / 3 + n * (-82 / 45 + n * (32 / 45 + n * (4642 / 4725))))));

  np = np * n;
  state.cgb[1] =
    np * (7 / 3 + n * (-8 / 5 + n * (-227 / 45 + n * (2704 / 315 + n * (2323 / 945)))));
  state.cbg[1] =
    np * (5 / 3 + n * (-16 / 15 + n * (-13 / 9 + n * (904 / 315 + n * (-1522 / 945)))));

  np = np * n;
  state.cgb[2] = np * (56 / 15 + n * (-136 / 35 + n * (-1262 / 105 + n * (73814 / 2835))));
  state.cbg[2] = np * (-26 / 15 + n * (34 / 21 + n * (8 / 5 + n * (-12686 / 2835))));

  np = np * n;
  state.cgb[3] = np * (4279 / 630 + n * (-332 / 35 + n * (-399572 / 14175)));
  state.cbg[3] = np * (1237 / 630 + n * (-12 / 5 + n * (-24832 / 14175)));

  np = np * n;
  state.cgb[4] = np * (4174 / 315 + n * (-144838 / 6237));
  state.cbg[4] = np * (-734 / 315 + n * (109598 / 31185));

  np = np * n;
  state.cgb[5] = np * (601676 / 22275);
  state.cbg[5] = np * (444337 / 155925);

  np = Math.pow(n, 2);
  state.Qn = (state.k0 / (1 + n)) * (1 + np * (1 / 4 + np * (1 / 64 + np / 256)));

  state.utg[0] =
    n *
    (-0.5 + n * (2 / 3 + n * (-37 / 96 + n * (1 / 360 + n * (81 / 512 + n * (-96199 / 604800))))));
  state.gtu[0] =
    n *
    (0.5 + n * (-2 / 3 + n * (5 / 16 + n * (41 / 180 + n * (-127 / 288 + n * (7891 / 37800))))));

  state.utg[1] =
    np * (-1 / 48 + n * (-1 / 15 + n * (437 / 1440 + n * (-46 / 105 + n * (1118711 / 3870720)))));
  state.gtu[1] =
    np * (13 / 48 + n * (-3 / 5 + n * (557 / 1440 + n * (281 / 630 + n * (-1983433 / 1935360)))));

  np = np * n;
  state.utg[2] = np * (-17 / 480 + n * (37 / 840 + n * (209 / 4480 + n * (-5569 / 90720))));
  state.gtu[2] = np * (61 / 240 + n * (-103 / 140 + n * (15061 / 26880 + n * (167603 / 181440))));

  np = np * n;
  state.utg[3] = np * (-4397 / 161280 + n * (11 / 504 + n * (830251 / 7257600)));
  state.gtu[3] = np * (49561 / 161280 + n * (-179 / 168 + n * (6601661 / 7257600)));

  np = np * n;
  state.utg[4] = np * (-4583 / 161280 + n * (108847 / 3991680));
  state.gtu[4] = np * (34729 / 80640 + n * (-3418889 / 1995840));

  np = np * n;
  state.utg[5] = np * (-20648693 / 638668800);
  state.gtu[5] = np * (212378941 / 319334400);

  var Z = gatg(state.cbg, state.lat0);
  state.Zb = -state.Qn * (Z + clens(state.gtu, 2 * Z));
}

export function forward(state: State, p: Point): Point | null | undefined | number {
  var Ce = adjust_lon(p.x - state.long0, state.over);
  var Cn = p.y;

  Cn = gatg(state.cbg, Cn);
  var sin_Cn = Math.sin(Cn);
  var cos_Cn = Math.cos(Cn);
  var sin_Ce = Math.sin(Ce);
  var cos_Ce = Math.cos(Ce);

  Cn = Math.atan2(sin_Cn, cos_Ce * cos_Cn);
  Ce = Math.atan2(sin_Ce * cos_Cn, hypot(sin_Cn, cos_Cn * cos_Ce));
  Ce = asinhy(Math.tan(Ce));

  var tmp = clens_cmplx(state.gtu, 2 * Cn, 2 * Ce);

  Cn = Cn + tmp[0];
  Ce = Ce + tmp[1];

  var x;
  var y;

  if (Math.abs(Ce) <= 2.623395162778) {
    x = state.a * (state.Qn * Ce) + state.x0;
    y = state.a * (state.Qn * Cn + state.Zb) + state.y0;
  } else {
    x = Infinity;
    y = Infinity;
  }

  p.x = x;
  p.y = y;

  return p;
}

export function inverse(state: State, p: Point): Point | null | undefined | number {
  var Ce = (p.x - state.x0) * (1 / state.a);
  var Cn = (p.y - state.y0) * (1 / state.a);

  Cn = (Cn - state.Zb) / state.Qn;
  Ce = Ce / state.Qn;

  var lon;
  var lat;

  if (Math.abs(Ce) <= 2.623395162778) {
    var tmp = clens_cmplx(state.utg, 2 * Cn, 2 * Ce);

    Cn = Cn + tmp[0];
    Ce = Ce + tmp[1];
    Ce = Math.atan(sinh(Ce));

    var sin_Cn = Math.sin(Cn);
    var cos_Cn = Math.cos(Cn);
    var sin_Ce = Math.sin(Ce);
    var cos_Ce = Math.cos(Ce);

    Cn = Math.atan2(sin_Cn * cos_Ce, hypot(sin_Ce, cos_Ce * cos_Cn));
    Ce = Math.atan2(sin_Ce, cos_Ce * cos_Cn);

    lon = adjust_lon(Ce + state.long0, state.over);
    lat = gatg(state.cgb, Cn);
  } else {
    lon = Infinity;
    lat = Infinity;
  }

  p.x = lon;
  p.y = lat;

  return p;
}

export function createState(base: KernelParameters): State {
  const state: State = {
    ...base,
    cgb: [],
    cbg: [],
    utg: [],
    gtu: [],
    Qn: 0,
    Zb: 0
  };
  initialize(state);
  return state;
}
