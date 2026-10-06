# Projection scorecard

Complete Node / Chromium / Firefox / WebKit evidence.

Comparator: **proj4js 2.22.0**; math.gl 5.0.0-alpha.12. Each environment retains its own hardware, version, date and sampling settings. Results are observed measurements, with no overall SOTA ranking.

This snapshot includes three-sample diagnostic timings. Use the full measurement profile for performance decisions; short runs can show substantial variation.

Source fingerprint: `b701953e7365f8fe9352784b1a44685b30bcc6ef3a7addab55408564008e5bf2`. Workload fingerprint: `431578e2deba15f5c55c55f37ec772a40dd889dbb371b5da72a0821eb52efde5`.

Full measurements and raw samples: [machine-readable snapshot](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/scorecard.json). Collection commit: `2b7b741581f6a3eeddc3d2636089a1239f454bd1`. See [publication provenance](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/README.md) for the generating CI run and raw artifacts.

## Accuracy

The independent pyproj 3.7.2 / PROJ 9.5.1 corpus covers 42 domains / 11160 points. Worst observed errors include scalar and Float64 bulk paths. See [accuracy domains](./accuracy-domains.md) for geographic bounds, allowances and oracle limits.

| Environment | Maximum forward component error (m) | Maximum inverse component error (degrees) |
| --- | --- | --- |
| node | 0.0000209 | 1.42e-8 |
| chromium | 0.0000209 | 1.42e-8 |
| firefox | 0.0000209 | 1.42e-8 |
| webkit | 0.0000209 | 1.42e-8 |

## Prepared throughput

Selected Float64 XYZM forward cases, in **million points/second**. All precisions, XY/XYZ/XYZM, directions and scenarios, raw samples, p10/p90 and iteration counts are retained in the machine-readable scorecard. A dagger marks timer-limited or high-variation rows; their ratios are withheld. No environment is pooled with another.

### node v24.14.0

Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz; linux/x64; 2026-10-04T20:31:35.161Z. 2000 points, 3 samples, minimum aggregate window 4 ms.

| Case | math.gl flat | math.gl scalar | proj4js 2.22.0 |
| --- | --- | --- | --- |
| Web Mercator | 10.7 M (4.87×) | 6.58 M (2.98×) | 2.21 M |
| UTM 31N | 3.30 M (2.25×) | 2.84 M (1.93×) | 1.47 M |
| Lambert conformal conic | 9.15 M (4.39×) | 6.01 M (2.88×) | 2.08 M |
| Seven-parameter datum shift | 2.60 M (1.80×) | 2.30 M (1.59×) | 1.44 M |
| NTv2 horizontal grid | 6.13 M (13.4×) | 4.91 M (10.8×) | 0.457 M |

### chromium 151.0.7922.34

Intel(R) Xeon(R) 6973P-C; linux/x64; 2026-10-04T20:30:56.726Z. 20000 points, 3 samples, minimum aggregate window 4 ms.

| Case | math.gl flat | math.gl scalar | proj4js 2.22.0 |
| --- | --- | --- | --- |
| Web Mercator | 14.6 M (3.54×) | 10.2 M (2.46×) | 4.14 M |
| UTM 31N | 3.57 M (1.79×) | 3.17 M (1.59×) | 2.00 M |
| Lambert conformal conic | 10.7 M (3.18×) | 8.00 M (2.37×) | 3.37 M |
| Seven-parameter datum shift | 2.94 M (1.40×) | 2.78 M (1.32×) | 2.11 M |
| NTv2 horizontal grid | 7.55 M (9.51×) | 6.56 M (8.26×) | 0.794 M |

### firefox 153.0

AMD EPYC 7763 64-Core Processor; linux/x64; 2026-10-04T20:31:36.746Z. 20000 points, 3 samples, minimum aggregate window 4 ms.

| Case | math.gl flat | math.gl scalar | proj4js 2.22.0 |
| --- | --- | --- | --- |
| Web Mercator | 10.0 M (4.25×) | 5.00 M (2.13×) | 2.35 M |
| UTM 31N | 2.86 M (2.00×) | 2.22 M (1.56×) | 1.43 M |
| Lambert conformal conic | 6.67 M (3.00×) | 4.00 M (1.80×) | 2.22 M |
| Seven-parameter datum shift | 2.22 M (1.56×) | 1.82 M (1.27×) | 1.43 M |
| NTv2 horizontal grid † | 5.00 M | 3.33 M | 0.488 M |

### webkit 26.5

AMD EPYC 7763 64-Core Processor; linux/x64; 2026-10-04T20:32:03.863Z. 20000 points, 3 samples, minimum aggregate window 4 ms.

| Case | math.gl flat | math.gl scalar | proj4js 2.22.0 |
| --- | --- | --- | --- |
| Web Mercator | 10.0 M (3.50×) | 5.71 M (2.00×) | 2.86 M |
| UTM 31N | 4.00 M (2.40×) | 2.50 M (1.50×) | 1.67 M |
| Lambert conformal conic | 6.67 M (2.67×) | 4.44 M (1.78×) | 2.50 M |
| Seven-parameter datum shift | 2.22 M (1.33×) | 2.00 M (1.20×) | 1.67 M |
| NTv2 horizontal grid | 3.33 M (5.83×) | 2.50 M (4.38×) | 0.571 M |

## Cold startup

Node uses a fresh process per sample; browser samples use fresh contexts and minified bundles. Module times include their respective import/fetch/parse/evaluate paths. OS disk caches are not flushed. Node math.gl imports core plus Mercator; the browser imports the convenience Projection bundle. Node and browser cold paths are different experiments.

| Environment | math.gl module median (ms) | proj4js module median (ms) |
| --- | --- | --- |
| node | 25.5 | 15.0 |
| chromium | 12.2 | 13.2 |
| firefox | 29.0 | 26.0 |
| webkit | 10.0 | 13.0 |

## Allocation and memory

Node heap sampling includes collected objects and reports estimated bytes per point; its 4 KiB sampling interval cannot prove zero allocation. Isolated Node memory samples force GC twice at each of four checkpoints: before imports, after preparation, after allocating two live Float64 XYZM buffers, and after ten Web Mercator batches. The buffers occupy 128000 bytes in each sample. Retained heap/RSS is distinct from temporary allocation and peak working set.

| Implementation | Web Mercator XYZM sampled bytes/point | Steady heapUsed median (bytes) | Steady RSS median (bytes) |
| --- | --- | --- | --- |
| math.gl flat | 0 | 4.44e+6 | 6.12e+7 |
| math.gl scalar | 83.8 | 4.48e+6 | 6.36e+7 |
| proj4js 2.22.0 | 899 | 5.45e+6 | 6.08e+7 |

Browser JS heap/allocation values are **unavailable**, not zero. Each throughput row records exact input-buffer bytes only; this excludes adaptive copies, output/result objects, libraries and the rest of an application.

## Bundle costs

**math.gl 5.0.0-alpha.12**, from the source-matched snapshot above. For current import choices and split-bundle measurements, see [imports, plugins and loading](./projection-engine.md#tree-shaking-and-bundle-size).

browser ESM, es2020, minified, gzip level 9; Node v24.14.0. Selective modules exclude model data and external TIFF decoders.

| Retained entry | Minified bytes | Gzip bytes |
| --- | --- | --- |
| temporalModel | 9256 | 3646 |
| projectionBulk | 5469 | 1721 |
| projectionAnalysis | 4329 | 1445 |
| core | 52183 | 19018 |
| mercator | 54693 | 19817 |
| utm | 61521 | 22539 |
| mercatorWithWKT | 78606 | 27628 |
| mercatorWithPROJJSON | 65820 | 23611 |
| mercatorWithNTv2 | 57895 | 21137 |
| mercatorWithGeoTIFFAdapter | 57901 | 21068 |
| mercatorWithGTX | 56235 | 20519 |
| mercatorWithVerticalGeoTIFF | 59756 | 21706 |
| deformationModel | 7403 | 3025 |
| deformationWithGeoTIFF | 12512 | 4847 |
| operationCatalog | 6489 | 2297 |
| operationPipeline | 64096 | 23036 |
| typescriptWrapper | 153061 | 52509 |
| allNativeExports | 184292 | 62737 |

## Interpret and reproduce

- No pooled environments or overall SOTA ranking.
- Observed domain samples are not global accuracy guarantees.
- Throughput excludes preparation and buffer resets; startup is separate.
- Timing-limited or unstable rows have no advertised speedup.
- Heap sampling estimates allocations; zero estimates do not prove zero allocation.
- Memory checkpoints are retained state/RSS, not peak memory.
- Browser owned input bytes are a storage lower bound, not JS heap or total working set.

See [measurement commands and provenance](./scorecard-methodology.md), [live browser benchmarks](./benchmarks.md#live-benchmarks) and [worker crossover measurements](./acceleration.md).
