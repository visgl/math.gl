# Terrain cutout partition scaling

Run `node scripts/benchmark-terrain-cutouts.mjs --tile-size=4` after building.
Supported tile sizes 8, 4 and 2 produce 32, 128 and 512 residents over the same
64 by 32 sample-cell footprint. Add `--polygons` for the concave/hole/island case.
The default remains size 8. Input source hashes and crops are recorded in JSON.

Each case interleaves incremental updates with monolithic rebuilds, after five
warmups and over twenty measured edits/arrival/eviction updates. Every update
checks exact triangles, directed cut edges, polygon IDs and domain area.

The retained local run is in terrain-cutout-scaling.json. Incremental median
milliseconds for 32/128/512 residents were Pacific 5.06/1.65/1.75 and Sierra
2.76/1.46/1.37 for convex cuts. Complex cuts measured Pacific 16.94/5.25/2.54
and Sierra 11.21/5.19/2.29. Full rebuild medians ranged from 13.70 to 17.87 ms
for convex cuts and 64.89 to 79.10 ms for complex cuts.

Partition size changes the amount of geometry reclipped per edit. These results
therefore do not isolate resident-count overhead. They suggest finer edit
partitions can be valuable, but do not establish an overlap-index bottleneck.
The next sweep should hold per-tile geometry fixed while growing resident
coverage, profile reconciliation separately, and repeat on a quiet host before
choosing a runtime optimization. Local timing samples are sensitive to host load.
