# Rounded bounds and breaks

Add `NICE()` as the fourth argument to `SCALE_COLOR` with a two-endpoint domain
or to `SCALE_QUANTILE`. The scale rounds the endpoints outward and snaps quantile
breaks to nearby decimal steps. If rounding would merge distinct breaks, it
tries a finer step. The reported bounds and breaks also control the color
mapping. Rounded quantile classes can have different numbers of observations.

```sql
SCALE_COLOR(height, DOMAIN(height), PALETTE('YlOrRd'), NICE())
SCALE_QUANTILE(coverage, 5, PALETTE('viridis'), NICE())
```

The resolved descriptor stores the resulting bounds and breaks. Use those values
directly to reconstruct a sampler or draw a legend.
