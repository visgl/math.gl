# Centered oblique Mercator

Run the Projection domains workspace build and open `dist/centered-omerc.html`, or
use the separate website example. The shared infobox contains center, orientation
and backend controls. Native math.gl and proj4js use one projection-engine agnostic
CRS descriptor contract. No public module gains an external-engine dependency.

The qualified source patch extends 18 degrees east/west and 12 degrees north/south
from a center within 75 degrees latitude. UI centers stay within 60 degrees.
32 linear source-space samples per edge, inverse round trips and a 300 km adjacent
output-step gate reject unresolved branches. This is sampled fixture qualification,
not a global domain certificate or a generic seam-unwrapping algorithm. Longitude
may pass through 180 degrees; do not infer a target X period from geographic 360.

Full operation parameters and backend identity enter `getCRSExecutionKey`.
`prepareCenteredFrame` also includes source and sampling revisions in its reuse key.
Changing center or alpha rebuilds; unchanged input can reuse geometry. Editing the
source, error policy, callbacks or backend version requires changing its identity.
Rendering bounds are only a display envelope; validity domain is left unknown and
physical rendering-scale queries return null. Pixel-width lines do not need it.

Independent reference coordinates are generated with pinned pyproj / PROJ offline:
`python generate-reference.py`. Node tests consume the committed fixture, requiring
no Python or PROJ installation. Browser tests switch both engines, change center and
orientation, and verify rebuild/reuse and navigation/remount behavior.

Responds to [sections 2 and 4 of the detailed feedback](https://github.com/mdsumner/sidebyside/blob/main/article/2026-10-13_custom-projections-deckgl.md)
and [deck.gl#10739](https://github.com/visgl/deck.gl/issues/10739#issuecomment-6136959072).
