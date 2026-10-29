# WKT and WKB workbench

Run `yarn workspace math.gl-wkb-workbench start` from the repository root.

Edit WKT or paste hexadecimal WKB to exercise the codecs from
`@math.gl/geospatial`. The example shows an XY geometry preview, formatted
WKT, raw header bytes, bounds, byte order, dialect, optional EWKB SRID, and
coordinate-visitor byte offsets with distinct Z and M columns.

Local fixtures cover holes, collections, Z, M, ZM, empty points, EWKB SRIDs,
big-endian bytes, and truncation errors. No server or external data is needed.
WKT writing uses a uniform dimension per collection; mixed dimensions are
rejected explicitly. Pasted mixed-dimension WKB can be inspected but is not
advertised as a lossless WKT conversion. SRIDs are metadata, not reprojection.
