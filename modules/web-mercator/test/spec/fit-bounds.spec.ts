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
      latitude: 64.86850056273362,
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
      latitude: 64.87085760222105,
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
