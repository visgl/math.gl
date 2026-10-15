// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Unit conversion factors adapted from proj4js 2.22.0.

/*
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * _THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE._
 */

import type {CRSUnit} from './crs-metadata';

/** Linear units keyed by PROJ unit identifier, with names and metre conversion factors. */
export const linearUnits: Readonly<Record<string, CRSUnit>> = {
  m: {name: 'meters', metersPerUnit: 1},
  mm: {name: 'millimeters', metersPerUnit: 0.001},
  cm: {name: 'centimeters', metersPerUnit: 0.01},
  ft: {name: 'feet', metersPerUnit: 0.3048},
  'us-ft': {name: 'us-survey-feet', metersPerUnit: 1200 / 3937},
  fath: {name: 'fathoms', metersPerUnit: 1.8288},
  kmi: {name: 'nautical-miles', metersPerUnit: 1852},
  'us-ch': {name: 'us-survey-chains', metersPerUnit: 20.1168402336805},
  'us-mi': {name: 'us-survey-miles', metersPerUnit: 1609.34721869444},
  km: {name: 'kilometers', metersPerUnit: 1000},
  'ind-ft': {name: 'indian-feet', metersPerUnit: 0.30479841},
  'ind-yd': {name: 'indian-yards', metersPerUnit: 0.91439523},
  mi: {name: 'miles', metersPerUnit: 1609.344},
  yd: {name: 'yards', metersPerUnit: 0.9144},
  ch: {name: 'chains', metersPerUnit: 20.1168},
  link: {name: 'links', metersPerUnit: 0.201168},
  dm: {name: 'decimeters', metersPerUnit: 0.1},
  in: {name: 'inches', metersPerUnit: 0.0254},
  'ind-ch': {name: 'indian-chains', metersPerUnit: 20.11669506},
  'us-in': {name: 'us-survey-inches', metersPerUnit: 0.025400050800101},
  'us-yd': {name: 'us-survey-yards', metersPerUnit: 0.914401828803658}
};
