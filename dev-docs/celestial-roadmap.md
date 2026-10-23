# Celestial roadmap

Celestial is an optional `@math.gl/earth/celestial` subpath, preserving the grouped
package architecture. Numerical primitives should remain usable without catalogs,
propagators, network access or an Arrow dependency.

| Tranche | Scope | Status / qualification gate |
| --- | --- | --- |
| C1: Time coordinates | Split Julian day/seconds, declared TAI/TT/UT1, bigint Unix tick adapters, explicit offsets/rounding | Implemented in the foundation change. No UTC-label/leap-second model. |
| C2: Frame/state algebra | Named epoch snapshots, rotation derivative, velocity correction, composition/inverse | Implemented in the foundation change. Caller owns physical frame models and origin equivalence. |
| C3: Shared mean frames | Extract current sidereal/precession math; preserve starfield API and add explicit offsets | Implemented as an approximation. No precision Earth-orientation claim. |
| C4: Time interoperability | Exact tick instant/fixed duration, Arrow adapters, civil date/time and calendar interval contracts | Design mapping documented; record types and adapters remain proposed. Preserve raw ticks, nulls, zones and independent interval fields. |
| C5: Qualified Earth orientation | UTC/leap data, TT/TAI/UT1 models, EOP provider, modern precession/nutation/polar motion | Future. Independent SOFA/reference vectors, declared accuracy/range, missing-data policy and reproducible data versions required. |
| C6: Satellite boundary | Explicit TEME states, optional propagator adapters, topocentric position/velocity | Future. Reference SGP4 vectors, TEME-to-terrestrial convention and Earth rotation rate qualification required. |
| C7: Precision astrometry | Catalog frame/epoch, proper motion, parallax, radial velocity, apparent position tiers | Future. Share current star APIs where contracts agree; avoid equating mean J2000 with ICRF. |

C4/C5 support different needs: exact columnar interchange and physically meaningful
scale conversion. Neither is replaced by storing a single floating-point Julian number.
See the [Arrow mapping](../docs/modules/earth/celestial/arrow-time-mapping.md) and
[API foundation](../docs/modules/earth/celestial/README.md).
