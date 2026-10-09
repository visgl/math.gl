# Optional acceleration

Large independent buffers can benefit from persistent application workers. Small batches often finish sooner on the calling thread. Keep the ordinary projection engine as the numerical implementation and measure the **complete application operation**, including ownership changes, startup and scheduling. math.gl does not create workers automatically or switch precision/backends.

## Measured worker profile[​](#measured-worker-profile "Direct link to Measured worker profile")

The development runner compares a prepared calling-thread engine with one and two persistent module workers. It uses Mercator and UTM, Float32/Float64, both directions and XYZM, at 1,000, 10,000 and 100,000 points. Seven rotated samples follow three warmups. Each sample includes a fresh input copy, partitioning for two workers, transfers, queueing and processing. Cold imports and worker preparation are recorded separately; add those costs when evaluating one-shot use. Every returned coordinate must exactly match the ordinary engine, including M. Transfer detachment and returned buffers after a failed record are also checked.

Local Apple M2 / macOS arm64 measurements on October 4, 2026, for **100,000 Float64 forward XYZM records**:

| Projection   | Browser                | Calling thread | One worker | Two workers |
| ------------ | ---------------------- | -------------- | ---------- | ----------- |
| Web Mercator | Chromium 151.0.7922.34 | 3.8 ms         | 7.7 ms     | 4.2 ms      |
| UTM 31N      | Chromium 151.0.7922.34 | 28.9 ms        | 39.5 ms    | 19.7 ms     |
| Web Mercator | WebKit 26.5            | 3 ms           | 4 ms       | 5 ms        |
| UTM 31N      | WebKit 26.5            | 27 ms          | 31 ms      | 11 ms       |

Two workers give approximately 1.5–2.5× throughput for the measured UTM case. Results vary by browser, buffer size, precision and direction. Many small cases are below the timer's useful resolution; no speed ratios should be inferred from zeros or submillisecond samples. Worker startup ranged from 10 to 267 ms in these local runs and can outweigh the warm gain. Raw samples, p10/p90, timing-limit/variation flags, source/workload hashes, engine/bootstrap sizes and startup costs are retained in [Chromium](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/worker-evaluation-chromium.json) and [WebKit](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/worker-evaluation-webkit.json) reports. These observations qualify this workload, not universal hardware/browser performance. CI executes correctness and records measurements in Chromium, Firefox and WebKit without a speed threshold.

```
node modules/projection/scripts/benchmark-workers.mjs \

  --browser chromium --points 1000,10000,100000 --samples 7 \

  --output /tmp/projection-workers.json
```

For repeated batches, compare `main import + preparation + N × main median` with `both worker startups + N × two-worker median`. Add application join costs to the worker total. Reporting startup separately makes the amortization decision explicit; a warm speedup alone does not justify moving a single small batch.

## Use a worker in an application[​](#use-a-worker-in-an-application "Direct link to Use a worker in an application")

Keep an engine prepared inside a module worker and preload its dependencies once. The following small worker illustrates ownership and failure handling for one batch at a time. Configure its CRS and plugins for the application, bundle it normally and keep its lifetime under application control.

```
// projection-worker.ts

import {ProjectionTransform} from '@math.gl/projection/core';

import {universalTransverseMercator} from '@math.gl/projection/projections/utm';

const projection = new ProjectionTransform({

  to: 'EPSG:32631', projections: [universalTransverseMercator]

});

self.postMessage({ready: true});

self.onmessage = ({data}) => {

  const {id, coordinates, dimension, inverse} = data;

  try {

    projection[inverse ? 'unprojectFlatSync' : 'projectFlatSync'](coordinates, dimension);

    self.postMessage({id, coordinates}, [coordinates.buffer]);

  } catch (error) {

    // Valid prefix may be committed. Return ownership even on a numerical failure.

    self.postMessage({id, coordinates, error: String(error)}, [coordinates.buffer]);

  }

};
```

After the worker reports readiness, send an owned, full-buffer typed array:

```
const worker = new Worker(new URL('./projection-worker.ts', import.meta.url), {type: 'module'});

// Install ready/result/error handlers before submitting work.

worker.postMessage({id: 1, coordinates, dimension: 4, inverse: false}, [coordinates.buffer]);

// coordinates.buffer is now detached; use the returned coordinates on completion.
```

Use request IDs, a bounded queue and error/termination handling. A fatal worker exit cannot return a transferred buffer; retain source data or provide a recovery policy if needed. Transferring a view transfers its **entire backing buffer**, so copy subviews when unrelated data shares that buffer. Do not transfer epoch or payload arrays that are still in use. Split independent records for parallel work; return results in input order and account for join costs. The evaluation measures partitioned buffers without a final joined-buffer copy. Returning a single merged buffer would add another application cost. Workers also move work off the UI thread; responsiveness and elapsed throughput are separate reasons to use them. See [MDN worker guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) and [transferable ownership](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects).

## Wasm, SIMD and visualization GPU boundaries[​](#wasm-simd-and-visualization-gpu-boundaries "Direct link to Wasm, SIMD and visualization GPU boundaries")

The runner records Wasm SIMD validation and WebGPU availability as **capability probes only**. It does not contain a Wasm/GPU projection algorithm or benchmark those backends. A future implementation needs independent numerical references, precision/domain/failure and payload contracts, cold loading and bundle costs, complete upload/dispatch/readback measurements, and a justified crossover point. Capability availability is not evidence of a speed advantage. GPU visualization coordinates cannot silently replace double-precision geodetic transformations. The package supplies no binary projection backend or additional third-party implementation.
