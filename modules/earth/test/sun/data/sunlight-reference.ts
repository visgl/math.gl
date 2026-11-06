// SPDX-License-Identifier: BSD-3-Clause
// SPDX-FileCopyrightText: 2012-2013 Lukas Hosek and Alexander Wilkie
// Generated from Hošek-Wilkie 1.4a; do not edit. See scripts/generate-sunlight.mjs.
// Source: https://cgg.mff.cuni.cz/projects/SkylightModelling/
/*
SPDX-License-Identifier: BSD-3-Clause
SPDX-FileCopyrightText: 2012-2013 Lukas Hosek and Alexander Wilkie

This source is published under the following 3-clause BSD license.

Copyright (c) 2012 - 2013, Lukas Hosek and Alexander Wilkie
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * None of the names of the contributors may be used to endorse or promote
      products derived from this software without specific prior written
      permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
// Independent 64x128 sky quadrature (runtime table uses 32x64).
export const SUNLIGHT_REFERENCE = [
  {
    altitude: 0,
    turbidity: 1,
    irradiance: [16.0824534, 2.38665063, 0, 3.84611556, 3.50923619, 2.71924842]
  },
  {
    altitude: 1,
    turbidity: 3,
    irradiance: [11.2605191, 2.33948524, 0, 4.99454503, 4.77211357, 3.96534725]
  },
  {
    altitude: 30,
    turbidity: 3,
    irradiance: [127.510351, 98.8592528, 65.1890699, 13.9900728, 20.4154291, 30.8764498]
  },
  {
    altitude: 90,
    turbidity: 10,
    irradiance: [94.1653028, 75.5256244, 60.1855244, 72.4486465, 70.5728722, 69.2771983]
  },
  {
    altitude: 0.5,
    turbidity: 2.5,
    irradiance: [9.97382651, 1.75481913, 0, 4.30534145, 4.04415875, 3.24840836]
  },
  {
    altitude: 5.5,
    turbidity: 4.5,
    irradiance: [42.334889, 19.3042667, 3.40581268, 10.4104029, 11.3504925, 11.4747801]
  },
  {
    altitude: 25.5,
    turbidity: 6.5,
    irradiance: [100.711928, 74.8406241, 47.2471238, 27.6497028, 30.2794459, 33.62357]
  },
  {
    altitude: 65.5,
    turbidity: 9.5,
    irradiance: [97.5990352, 78.0767518, 61.0036628, 83.5287263, 85.1360025, 84.7800865]
  }
];
