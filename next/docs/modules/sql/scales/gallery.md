# Color scale gallery

A color scale maps numbers or categories to colors. The domain describes the inputs, and the palette describes the colors. The scale decides what a change in color means.

## Same data, different breaks

Move the slider to compare how two scales color the same value.

Sample value 3838

### **Equal intervals

Equal widths in the value range.

0255075100

### **Quantiles

Roughly equal counts of observations.

081942100

### Sequential

Magnitude from low to high, such as population density.

0100

### Diverging

Two directions from a reference value, such as change from zero.

-4012

### Threshold

Classes defined by explicit cutoffs, such as air-quality alerts.

02060100

### Ordinal

One color for each category, such as land cover.

Forest

Water

Urban

## Choose a scale[​](#choose-a-scale "Direct link to Choose a scale")

Use a **sequential** ramp when color should communicate more or less. Use a **diverging** ramp when the distance and direction from a reference both matter. The neutral color belongs at that reference even when the domain has more room on one side.

Use **equal intervals** when each color should cover the same span of values. Use **quantiles** when you want roughly the same number of observations per class. Quantile boundaries move as the distribution changes. To keep colors comparable across layers or time periods, hold the breaks fixed with a **threshold** scale.

Use **ordinal** colors when the values are categories. Keep the category-to-color assignment stable when filtering the data.

## Use the same scale in your legend[​](#use-the-same-scale-in-your-legend "Direct link to Use the same scale in your legend")

Generate the legend from the resolved scale that produced the colors. Its descriptor includes the actual domain, palette stops, and class breaks. For a data-derived scale, resolve it again when the input changes.

See [the SQL scale guide](https://visgl.github.io/math.gl/next/docs/modules/sql/scales/SQL.md) for expressions and [scale descriptors](https://visgl.github.io/math.gl/next/docs/modules/sql/scales.md) for the portable types and Arrow evaluation.
