# Elastic qualification fixtures

The three `.txt` files are unmodified published datasets from Justin Kunimune's
https://github.com/jkunimune/elastik at revision
`88808a7c0fe92b42d6e5f903549cd7cfcbd26f3b`, in `projection/`.
They are public domain under the Unlicense; see the retained notice at
`src/discontinuous/elastic/UNLICENSE.txt` in this package.

`reference.json` contains 126 independently evaluated coordinate pairs, in kilometers,
produced directly from those text files by `scripts/generate-elastic-reference.py`
using Python's standard library. It does not import math.gl's parser or runtime.
The tests also check that parsing the original files exactly reproduces the optional
bundled datasets. Regenerate those modules with `scripts/generate-elastic-data.mjs`
after building the package.
