# Elastic maps

Compare Elastic I, II, III and sinusoidal, with seam-aware coastlines, graticules, an orange
polygon crossing cuts, and coordinate picking. Direct and through-globe transitions use prepared
MapEngine correspondence; reduced-motion settings skip the animation. Justin Kunimune's published data
is public domain (Unlicense); Natural Earth coastlines are public domain.

Run `yarn start` or `yarn build` in this directory. `main.js` owns the controls and
lifecycle, `map.js` prepares MapEngine geometry, and `scene.js` owns transition preparation and animation, reusing the quincuncial
canvas renderer for stationary maps. Preparation yields between features and
rapid selection changes cancel obsolete work. No map data is fetched at runtime.
