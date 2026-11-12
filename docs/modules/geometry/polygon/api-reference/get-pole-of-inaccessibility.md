# getPoleOfInaccessibility

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

Finds the point inside a polygon that is farthest from its outline. This point is the "pole of inaccessibility". Use it to place a label or an icon on a polygon. The centroid is not a good substitute, because the centroid of a concave polygon or a polygon with a hole can be outside the polygon.

```ts
import {getPoleOfInaccessibility} from '@math.gl/geometry';

getPoleOfInaccessibility(
  [
    [
      [0, 0],
      [10, 0],
      [10, 4],
      [4, 4],
      [4, 10],
      [0, 10],
      [0, 0]
    ]
  ],
  0.001
);
// returns a point near [2.343, 2.343]
```

## Usage

```ts
getPoleOfInaccessibility(polygon, precision, budget?);
```

Arguments:

- `polygon` (`number[][][]`) - the outer ring, then the hole rings, as arrays of `[x, y]` points. The coordinates must be planar.
- `precision` (`number`) - the precision of the result, in the units of the polygon. The function uses a minimum precision of 1e-6 of the longer side of the bounding box.
- `budget` (`PoleSearchBudget`, optional) - the work limit, as `{segmentTests: number}`. Default `{segmentTests: DEFAULT_POLE_SEARCH_SEGMENT_TESTS}` (5e6).

Returns:

- `[x, y]` - the point that the function found. The point is always strictly inside the polygon: not in a hole and not on an edge.
- `null` - if the polygon has no vertices, a coordinate that is not finite, or no area. The function also returns `null` if the budget becomes empty before the function finds a point inside the polygon.

## Remarks

The function uses the best-first grid refinement of Garcia-Castellanos and Lombardo, "Poles of inaccessibility: a calculation algorithm for the remotest places on Earth" (Scottish Geographical Journal 123(3), 2007).

The input can come from an untrusted source, for example a vector tile. Thus the function limits its work:

- To test one point costs one point-to-segment test for each vertex. The function deducts these tests from `budget.segmentTests`. When the budget is empty, the function returns the best point that it found.
- If the precision is coarse, the search continues until it finds a point inside the polygon.
- You can use one budget object for many calls. Thus a set of large polygons cannot block the main thread.
- The first grid has at most 64 squares along the longer side of the bounding box.
- The function uses the even-odd rule. A point in a hole is outside the polygon.
