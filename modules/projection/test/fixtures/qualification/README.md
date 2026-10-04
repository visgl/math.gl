# Published projection scorecard baseline

`scorecard.json` contains the first complete S9 scorecard generated from
[CI run 37232215403](https://github.com/visgl/math.gl/actions/runs/37232215403)
on 2026-10-04, for PR #205. The observation source is the test merge commit
`2b7b741581f6a3eeddc3d2636089a1239f454bd1`; its source and workload fingerprints
are embedded in the report.

These are original math.gl benchmark observations against installed proj4js 2.22.0,
not authoritative model data or upstream implementation source. The independent
accuracy corpus is the existing reviewed PROJ profile; its reference hash and
42 geographic domains/allowances are retained. Each of Node, Chromium, Firefox and
WebKit retains its hardware, version, date and sampling settings. Different CI jobs
used different processors. Results must not be pooled across environments.

This is the bounded **three-sample / 4 ms PR diagnostic profile**: Node uses 2,000
points and browsers use 20,000. It is a dated baseline, not a high-confidence
performance ranking or an assertion that later revisions preserve these timings.
The full seven-sample / 12 ms profile is documented in the
[scorecard methodology](../../../../../docs/modules/projection/scorecard-methodology.md).

Raw input reports are retained in that run's `projection-scorecard-node` and three
`projection-browser-qualification-*` artifacts. Their exact content hashes accompany
the normalized snapshot; coordinate-layout rows, raw aggregate samples, normalized
medians/p10/p90, flags, independent errors, cold samples, Node allocation estimates
and memory checkpoints remain intact. Array records are compacted onto individual
lines for review; JSON values are unchanged. Browser heap/allocation measurements
are explicitly unavailable, and input byte counts are not working-set estimates.
GitHub artifact availability is subject to repository retention policy.

The snapshot was consolidated locally with the final scorecard generator from
these unmodified CI inputs. Its generator SHA-256 is included in `provenance`.
The generated [documentation page](../../../../../docs/modules/projection/scorecard.md)
can be regenerated directly from this snapshot using the methodology's command.
Replace the JSON and page together after reviewing a new complete, source-matched
run. Keep the date, collection commit, hashes and limitations explicit.
