# Numeric scales and legends

A numeric scale maps data values to measurements such as elevation, point radius, or line width. Use a numeric `RANGE` to specify the values the layer will receive. The resulting Arrow column contains nullable Float64 values.

| Visual channel | Input domain                      | Output range               |
| -------------- | --------------------------------- | -------------------------- |
| Elevation      | Building heights in meters        | Rendered heights in meters |
| Point radius   | Counts of visits                  | Radius in pixels           |
| Line width     | Daily traffic in vehicles per day | Stroke width in pixels     |

## Map Arrow columns to visual properties[​](#map-arrow-columns-to-visual-properties "Direct link to Map Arrow columns to visual properties")

`SCALE_LINEAR` maps equal input increments to equal output increments. `SCALE_SQRT` makes a point's area proportional to the input when the domain and radius range both begin at zero. `SCALE_LOG` emphasizes changes in ratio on a positive domain.

This example uses `compileArrowScales` to evaluate all three mappings. Each description carries the data units and the units the layer expects.

```
import {tableFromArrays} from 'apache-arrow';

import {compileArrowScales, parseSQLScaleExpression} from '@math.gl/sql/scales';



const input = tableFromArrays({

  height: [0, 50, 100],

  visits: [0, 250, 1000],

  traffic: [0, 5000, 10000]

});



function numericScale(sql: string, label: string, inputUnits: string, outputUnits: string) {

  const parsed = parseSQLScaleExpression(sql);

  return {

    ...parsed,

    scale: {...parsed.scale, label, inputUnits, outputUnits, clamp: true}

  };

}



const scales = compileArrowScales(input, {

  elevation: numericScale(

    'SCALE_LINEAR(height, DOMAIN(0, 100), RANGE(0, 200))',

    'Building height', 'm', 'm'

  ),

  radius: numericScale(

    'SCALE_SQRT(visits, DOMAIN(0, 1000), RANGE(0, 20))',

    'Visits', 'visits', 'px'

  ),

  lineWidth: numericScale(

    'SCALE_LINEAR(traffic, DOMAIN(0, 10000), RANGE(1, 9))',

    'Daily traffic', 'vehicles/day', 'px'

  )

});



const elevationColumn = scales.elevation.evaluate(input); // [0, 100, 200]

const radiusColumn = scales.radius.evaluate(input); // [0, 10, 20]

const widthColumn = scales.lineWidth.evaluate(input); // [1, 5, 9]
```

Use fixed domains when the mappings should stay stable across filters or time periods. Use `DOMAIN(column)` to recompute the extent from each input. Numeric scales extrapolate by default. Set `clamp: true` to keep generated sizes within the output range. Missing data produces null.

## Draw the legend from the resolved scale[​](#draw-the-legend-from-the-resolved-scale "Direct link to Draw the legend from the resolved scale")

Use the input domain to choose tick values. Label those values in `descriptor.inputUnits` and call `scale.sample(value)` to size each mark in `descriptor.outputUnits`. This keeps a square-root or logarithmic legend in sync with the layer.

```
const {scale} = scales.radius;

const binding = {

  channel: 'radius',

  descriptor: scale.descriptor,

  marks: [0, 250, 1000].map(value => ({

    value,

    radius: scale.sample(value)

  }))

};
```

A deck.gl integration supplies the channel and configures the layer's units to match the sampled values. For example, set `radiusUnits: 'pixels'` for the radius example or `widthUnits: 'pixels'` for the line widths. The same numeric descriptor can drive different layer properties. The channel determines whether the legend draws circles, strokes, or elevation marks.

Both unit fields are optional, JSON-safe annotations. They affect display labels and leave the numeric mapping intact. The existing `units` field is available for callers that use a single display label.

When you use [`createArrowColumns`](https://visgl.github.io/math.gl/next/docs/modules/sql/arrow-columns.md) with the scale projection operation, numeric calls contribute the same typed scale metadata as color calls. Check `entry.scale.descriptor.range.type === 'numeric'` to identify numeric output. For authored unit annotations, use the typed scale specification shown above.
