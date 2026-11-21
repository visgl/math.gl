# Bivariate color scales

Use a bivariate scale to show two numeric variables in a single color, such as flood depth and population exposure. The palette is a grid. Columns increase along the x variable and rows increase along the y variable. Use the same orientation in the legend.

```
import {compileBivariateColorScale} from '@math.gl/core/color';



const scale = compileBivariateColorScale({

  xDomain: [0, 10],

  yDomain: [0, 1000],

  colors: [

    [[0.89, 0.89, 0.89, 1], [0.42, 0.70, 0.57, 1]],

    [[0.75, 0.57, 0.78, 1], [0.27, 0.35, 0.52, 1]]

  ]

});



scale.sample(8, 800); // high x, high y

scale.descriptor.xBreaks; // [5]

scale.descriptor.yBreaks; // [500]
```

The default gives equal-width classes along each axis. Values equal to a break enter the upper class. Out-of-range values use the nearest edge, and a null or nonfinite input uses the configured null color or returns null. Set `interpolation: 'bilinear'` to interpolate continuously between grid stops in sRGB.

Use `compileArrowBivariateScale(xExpression, yExpression, spec, {inputSchema})` from `@math.gl/sql/scales` to bind two Arrow expressions. The result exposes the same scale for a legend and an `evaluateTable(table)` method that returns nullable RGBA8 values in input order.
