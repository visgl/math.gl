# Natural breaks

Use `getJenksBreaks(values, classCount)` from `@math.gl/core/color` to compute
Fisher–Jenks thresholds for numeric observations. The optimizer minimizes
within-class squared error and keeps equal observations together. Supply the
result as the explicit break list for `SCALE_THRESHOLD`. Each threshold is the
first value of the upper class.
