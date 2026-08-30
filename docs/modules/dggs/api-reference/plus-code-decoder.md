# PlusCodeDecoder

`PlusCodeDecoder` is a lightweight DGGS-like geometry adapter for Google Plus Codes, exported by `@math.gl/dggs/plus-code`. It decodes a full Open Location Code into its center, rectangular boundary, and bounds.

Short Plus Codes are intentionally unsupported because they require a nearby reference location to recover a full code. Use Google's [`open-location-code`](https://github.com/google/open-location-code) API directly for shortening, recovery, or encoding.
