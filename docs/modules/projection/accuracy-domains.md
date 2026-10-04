# Projection accuracy domains

Every named algorithm has independent forward and inverse references. This scorecard expands seeded scalar and Float64 XYZM qualification to **42 configurations, 11,160 points and 36 horizontal algorithms**. Geocentric conversion is covered separately by the three-dimensional PROJ corpus and the [nearest-normal qualification](./ellipsoid-qualification.md).

Each rectangle below belongs to the exact parameter configuration in the [machine-readable report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/accuracy-domains.json). It is a tested region, not an inferred global validity domain. Regional formulae, approximate transverse Mercator, map seams, antipodes, projection knots and perspective visibility boundaries need their own qualified regions. The report retains the worst observed coordinate as well as every test ceiling. No rejected samples are silently removed.

Forward maxima and ceilings are metres; inverse values are degrees. The identity geographic profile uses degrees in both directions. Ceilings are regression gates over these samples, not mathematical bounds at unsampled coordinates. Both directions start from independent PROJ values; roundtrip agreement is an additional check. The oracle remains pinned to pyproj 3.7.2 / PROJ 9.5.1 with networking disabled. The latest proj4js npm reference was rechecked on October 4, 2026: 2.22.0.

| Configuration | Longitude / latitude rectangle (degrees) | Points | Forward observed / ceiling | Inverse observed / ceiling |
| --- | --- | --- | --- | --- |
| merc-ellipsoid | -179.99…179.99 / -85…85 | 267 | 3.73e-9 / 1.00e-5 | 2.84e-14 / 1.00e-8 |
| merc-sphere | -179.99…179.99 / -85…85 | 267 | 3.73e-9 / 1.00e-5 | 2.84e-14 / 1.00e-8 |
| tmerc-ellipsoid | -15…33 / -80…84 | 267 | 1.86e-9 / 1.00e-5 | 6.04e-14 / 1.00e-8 |
| utm-north | 0…6 / 0…84 | 267 | 2.79e-9 / 1.00e-5 | 5.88e-14 / 1.00e-8 |
| utm-south | 150…156 / -80…0 | 267 | 1.86e-9 / 1.00e-5 | 2.84e-14 / 1.00e-8 |
| lcc-north | -125…-65 / 15…65 | 265 | 4.07e-9 / 1.00e-5 | 1.76e-11 / 1.00e-8 |
| lcc-south | 105…165 / -65…-10 | 265 | 5.59e-9 / 1.00e-5 | 1.76e-11 / 1.00e-8 |
| aea-north | -125…-65 / 15…65 | 265 | 1.02e-8 / 1.00e-5 | 1.28e-13 / 1.00e-8 |
| eqdc-north | -60…60 / 0…85 | 267 | 4.51e-6 / 1.00e-5 | 1.20e-10 / 1.00e-8 |
| eqdc-south | -60…60 / -85…0 | 267 | 4.54e-6 / 1.00e-5 | 1.20e-10 / 1.00e-8 |
| cea-ellipsoid | -169.99…179.99 / -89.99…89.99 | 273 | 7.45e-9 / 1.00e-5 | 1.42e-8 / 2.00e-8 |
| cass-dense-domain | 0…20 / -75…75 | 267 | 5.26e-6 / 1.00e-5 | 9.15e-11 / 1.00e-8 |
| robin-ellipsoid | -169.99…179.99 / -89.99…89.99 | 267 | 3.73e-9 / 1.00e-5 | 1.42e-13 / 1.00e-8 |
| eqearth-ellipsoid | -169.99…179.99 / -85…85 | 267 | 2.79e-8 / 1.00e-5 | 6.22e-9 / 1.00e-8 |
| moll-sphere | -169.99…179.99 / -89…89 | 267 | 1.79e-5 / 2.00e-5 | 3.03e-10 / 1.00e-8 |
| domain-etmerc-ellipsoid | -69.5…-68.5 / -35.5…-34.5 | 265 | 1.40e-9 / 1.00e-5 | 1.42e-14 / 1.00e-8 |
| domain-laea-0-ellipsoid | 14.5…15.5 / -0.5…0.5 | 265 | 4.29e-9 / 1.00e-5 | 3.24e-10 / 1.00e-8 |
| domain-stere-0-ellipsoid | 14.5…15.5 / -0.5…0.5 | 265 | 2.84e-9 / 1.00e-5 | 2.54e-14 / 1.00e-8 |
| domain-aeqd-0-ellipsoid | 14.5…15.5 / -0.5…0.5 | 265 | 6.38e-6 / 1.00e-5 | 4.80e-11 / 1.00e-8 |
| domain-sterea-ellipsoid | 4.5…5.5 / 51.5…52.5 | 265 | 3.73e-9 / 1.00e-5 | 2.84e-14 / 1.00e-8 |
| domain-eck6-ellipsoid | -110…130 / -60…60 | 265 | 3.73e-9 / 1.00e-5 | 4.26e-14 / 1.00e-8 |
| domain-equi-ellipsoid | -110…130 / -60…60 | 265 | 0.00e+0 / 1.00e-5 | 2.84e-14 / 1.00e-8 |
| domain-mill-ellipsoid | -110…130 / -60…60 | 265 | 7.45e-9 / 1.00e-5 | 3.55e-14 / 1.00e-8 |
| domain-sinu-ellipsoid | -110…130 / -60…60 | 265 | 3.30e-6 / 1.00e-5 | 1.07e-10 / 1.00e-8 |
| domain-vandg-ellipsoid | -110…130 / -60…60 | 265 | 2.09e-5 / 3.00e-5 | 1.58e-12 / 1.00e-8 |
| domain-poly-ellipsoid | 9.5…10.5 / 39.5…40.5 | 265 | 9.47e-6 / 1.00e-5 | 8.53e-11 / 1.00e-8 |
| domain-gstmerc-ellipsoid | 9.5…10.5 / 39.5…40.5 | 265 | 5.14e-9 / 1.00e-5 | 2.20e-13 / 1.00e-8 |
| domain-gnom-ellipsoid | 9.5…10.5 / 39.5…40.5 | 265 | 1.36e-9 / 1.00e-5 | 1.42e-14 / 1.00e-8 |
| domain-ortho-ellipsoid | 9.5…10.5 / 39.5…40.5 | 265 | 8.51e-10 / 1.00e-5 | 1.42e-14 / 1.00e-8 |
| domain-bonne-ellipsoid | 9.5…10.5 / 39.5…40.5 | 265 | 4.32e-7 / 1.00e-5 | 3.90e-12 / 1.00e-8 |
| domain-krovak | 14.5…15.5 / 49.5…50.5 | 265 | 1.58e-8 / 1.00e-5 | 2.56e-12 / 1.00e-8 |
| domain-nzmg-1 | 172.5…173.5 / -41.5…-40.5 | 265 | 9.31e-10 / 1.00e-5 | 7.11e-15 / 1.00e-8 |
| domain-omerc-alpha | 114.5…115.5 / 4.5…5.5 | 265 | 4.25e-9 / 1.00e-5 | 4.76e-13 / 1.00e-8 |
| domain-somerc | 6.94…7.94 / 46.45…47.45 | 265 | 5.58e-9 / 1.00e-5 | 1.41e-9 / 1.00e-8 |
| domain-geos-x-false | 19.5…20.5 / 19.5…20.5 | 265 | 1.40e-9 / 1.00e-5 | 6.75e-14 / 1.00e-8 |
| domain-tpers-0 | 9.5…10.5 / 39.5…40.5 | 265 | 6.40e-10 / 1.00e-5 | 1.42e-14 / 1.00e-8 |
| domain-qsc-0 | -0.5…0.5 / -0.5…0.5 | 265 | 3.26e-8 / 1.00e-5 | 2.84e-12 / 1.00e-8 |
| domain-eqc | -110…130 / -60…60 | 265 | 1.86e-9 / 1.00e-5 | 2.84e-14 / 1.00e-8 |
| domain-longlat | -110…130 / -60…60 | 265 | 1.42e-14 / 1.00e-5 | 1.42e-14 / 1.00e-8 |
| domain-ob-tran-moll | 9.5…10.5 / 39.5…40.5 | 265 | 8.05e-7 / 1.00e-5 | 1.03e-11 / 1.00e-8 |
| aeqd-polar--1 | -179…179 / -89…89 | 265 | 7.45e-9 / 1.00e-5 | 7.11e-14 / 1.00e-8 |
| aeqd-polar-1 | -179…179 / -89…89 | 265 | 1.12e-8 / 1.00e-5 | 7.11e-14 / 1.00e-8 |

The polar ellipsoidal azimuthal-equidistant path now integrates the meridional radius with bounded Gauss-Legendre quadrature and inverts the same integral with safeguarded Newton updates. It replaces the old truncated series; the two polar profiles enforce a 10 micrometre PROJ comparison ceiling across the tested domain. This does not certify arbitrary eccentricities.

Van der Grinten uses rationalized expressions to avoid subtracting nearly equal terms. At the retained near-equator regression, an original 80-digit Decimal evaluation matches math.gl within 10 nanometres, while the pinned PROJ oracle differs by 20.864 micrometres. Its 30 micrometre comparison ceiling records that oracle limitation. The independent Decimal check is a separate strict regression.

To enforce an application-qualified rectangle in both directions, use the optional [ProjectionAnalysis](./projection-analysis.md) interface. Its domain is explicit; it does not automatically certify an algorithm or select a datum operation.

Regenerate with the pinned oracle environment, then run:

```sh
python modules/projection/scripts/generate-accuracy-reference.py
node modules/projection/scripts/check-accuracy-reference.mjs
node modules/projection/scripts/generate-accuracy-atlas.mjs
```
