# Elastic data provenance

Elastic I, II and III are Justin Kunimune's published coordinate tables from
https://github.com/jkunimune/elastik, pinned at
`88808a7c0fe92b42d6e5f903549cd7cfcbd26f3b`.

The upstream repository dedicates its contents to the public domain under the
Unlicense; the complete notice is retained in `UNLICENSE.txt`. Generated dataset
modules retain the published decimal precision, convert latitude/longitude to
longitude/latitude, replace NaN with JSON-safe null, and record boundary complements.
The original text files are preserved in the test fixtures. The numerical runtime
is an independent implementation of the documented bilinear interpolation format.

The tables use kilometers. The value 6371 is an explicit normalization convention:
MapEngine multiplies table coordinates by `MapDescription.radius / data.radius`.
It is not a claim that the optimization used a sphere of exactly that radius.
The datasets' original optimization and distortion properties are described by
Kunimune; this implementation does not run the optimizer or promise exact equal area.

Background: https://kunimune.blog/2023/12/29/introducing-the-elastic-projections/
