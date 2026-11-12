// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {fitBounds} from '@math.gl/web-mercator';
import {WebMercatorViewport, FitBoundsOptions} from '@math.gl/web-mercator';
import {toLowPrecision} from '../utils/test-utils';

expect.addEqualityTesters([
  (first, second) =>
    typeof first === 'number' && typeof second === 'number' && first === 0 && second === 0
      ? true
      : undefined
]);

const FITBOUNDS_TEST_CASES: [
  FitBoundsOptions,
  {longitude: number; latitude: number; zoom: number}
][] = [
  [
    {
      width: 100,
      height: 100,
      // southwest bound first
      bounds: [
        [-73.9876, 40.7661],
        [-72.9876, 41.7661]
      ]
    },
    {
      longitude: -73.48759999999997,
      latitude: 41.26801443944763,
      zoom: 5.723804361273887
    }
  ],
  [
    {
      width: 100,
      height: 100,
      // northeast bound first
      bounds: [
        [-72.9876, 41.7661],
        [-73.9876, 40.7661]
      ]
    },
    {
      longitude: -73.48759999999997,
      latitude: 41.26801443944763,
      zoom: 5.723804361273887
    }
  ],
  [
    {
      width: 100,
      height: 100,
      bounds: [
        [-73, 10],
        [-73, 10]
      ],
      maxZoom: 22
    },
    {
      longitude: -73,
      latitude: 10,
      zoom: 22
    }
  ],
  [
    {
      width: 100,
      height: 100,
      bounds: [
        [-73, 10],
        [-73, 10]
      ],
      minExtent: 0.01
    },
    {
      longitude: -73,
      latitude: 10,
      zoom: 13.28771238
    }
  ],
  [
    {
      width: 600,
      height: 400,
      bounds: [
        [-23.407, 64.863],
        [-23.406, 64.874]
      ],
      padding: 20,
      offset: [0, -40]
    },
    {
      longitude: -23.406499999999973,
      latitude: 64.86692908823261,
      zoom: 12.89199533073045
    }
  ],
  [
    {
      width: 600,
      height: 400,
      bounds: [
        [-23.407, 64.863],
        [-23.406, 64.874]
      ],
      padding: {top: 100, bottom: 10, left: 30, right: 30},
      offset: [0, -40]
    },
    {
      longitude: -23.406499999999998,
      latitude: 64.86876246621804,
      zoom: 12.476957831451607
    }
  ],
  [
    {
      width: 512,
      height: 512,
      // southwest bound first
      bounds: [
        [-180, -90],
        [180, 90]
      ]
    },
    {
      longitude: 0,
      latitude: 0,
      zoom: 0
    }
  ]
];

test('fitBounds', () => {
  for (const [input, expected] of FITBOUNDS_TEST_CASES) {
    const result = fitBounds(input);

    expect(Number.isFinite(result.longitude), 'get valid longitude').toBeTruthy();
    expect(Number.isFinite(result.latitude), 'get valid latitude').toBeTruthy();
    expect(Number.isFinite(result.zoom), 'get valid zoom').toBeTruthy();
    expect(toLowPrecision(result), 'valid viewport returned').toEqual(toLowPrecision(expected));
  }
});

test('WebMercatorViewport.fitBounds', () => {
  for (const [input, expected] of FITBOUNDS_TEST_CASES) {
    const viewport = new WebMercatorViewport({
      longitude: -122,
      latitude: 37.7,
      width: input.width,
      height: input.height,
      zoom: 11
    });
    const result = viewport.fitBounds(input.bounds, input);

    expect(result instanceof WebMercatorViewport, 'get viewport').toBeTruthy();
    expect(toLowPrecision(result.longitude), 'get correct longitude').toBe(
      toLowPrecision(expected.longitude)
    );
    expect(toLowPrecision(result.latitude), 'get correct latitude').toBe(
      toLowPrecision(expected.latitude)
    );
    expect(toLowPrecision(result.zoom) === toLowPrecision(expected.zoom), 'get correct zoom').toBe(
      true
    );
  }
});

test.each<{name: string; options: FitBoundsOptions; center: [number, number]}>([
  {
    name: 'asymmetric horizontal padding',
    options: {
      width: 1000,
      height: 500,
      bounds: [
        [-10, -10],
        [10, 10]
      ],
      padding: {top: 0, bottom: 0, left: 200, right: 0}
    },
    center: [600, 250]
  },
  {
    name: 'asymmetric vertical padding',
    options: {
      width: 500,
      height: 1000,
      bounds: [
        [-10, -1],
        [10, 1]
      ],
      padding: {top: 300, bottom: 0, left: 0, right: 0}
    },
    center: [250, 650]
  },
  {
    name: 'pixel offset',
    options: {
      width: 800,
      height: 600,
      bounds: [
        [-10, -10],
        [10, 10]
      ],
      offset: [100, 0]
    },
    center: [500, 300]
  },
  {
    name: 'padding and offset at capped zoom',
    options: {
      width: 800,
      height: 600,
      bounds: [
        [-10, -10],
        [10, 10]
      ],
      maxZoom: 0,
      padding: {top: 0, bottom: 80, left: 100, right: 0},
      offset: [-20, 30]
    },
    center: [430, 290]
  }
])('fitBounds centers projected bounds with $name', ({options, center}) => {
  const {width, height, bounds} = options;
  const viewport = new WebMercatorViewport({width, height}).fitBounds(bounds, options);
  const [[west, south], [east, north]] = bounds;
  const northwest = viewport.project([west, north]);
  const southeast = viewport.project([east, south]);
  expect((northwest[0] + southeast[0]) / 2).toBeCloseTo(center[0], 8);
  expect((northwest[1] + southeast[1]) / 2).toBeCloseTo(center[1], 8);
});

test('fitBounds#degenerate', () => {
  const OPTIONS = {
    height: 100,
    width: 100,
    bearing: 0,
    pitch: 0,
    zoom: 2
  };

  const viewport = new WebMercatorViewport(OPTIONS);
  expect(
    () =>
      viewport.fitBounds([
        [-70, 10],
        [-70, 10]
      ]),
    'degenerate bounds do not throw by default'
  ).not.toThrow();
  expect(
    () =>
      viewport.fitBounds(
        [
          [-70, 10],
          [-70, 10]
        ],
        {maxZoom: Infinity}
      ),
    'degenerate bounds throw if maxZoom removed'
  ).toThrow();
  expect(
    () =>
      viewport.fitBounds(
        [
          [-70, 10],
          [-70, 10]
        ],
        {minExtent: 0.01, maxZoom: Infinity}
      ),
    'degenerate bounds does not throw if maxZoom removed and minExtents added'
  ).not.toThrow();

  expect(viewport instanceof WebMercatorViewport, 'get viewport').toBeTruthy();
});
