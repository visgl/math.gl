# Elastic maps

Compare Elastic I, II, III and sinusoidal, with seam-aware coastlines, graticules, an orange
polygon crossing cuts, and coordinate picking. Direct and through-globe transitions use prepared
MapEngine correspondence; reduced-motion settings skip the animation. Justin Kunimune's published data
is public domain (Unlicense); Natural Earth coastlines are public domain.

Run `yarn start` or `yarn build` in this directory. `main.js` owns the controls and
lifecycle, `map.js` prepares MapEngine geometry, and `scene.js` owns transition preparation and animation, reusing the quincuncial
canvas renderer for stationary maps. Preparation yields between features and
rapid selection changes cancel obsolete work. No map data is fetched at runtime.

The static sample polygon uses `MapEngine.prepareFeatures()`. Its packed fill
rings and original-boundary paths are rendered separately, so artificial closing
edges at cuts are not stroked. Animated outlines likewise use the original rings
through `MapTransition.prepareLine()`, separately from polygon fills.
