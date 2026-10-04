# Documentation website

The website uses separate builds for stable and upcoming-release documentation:

| Source branch | Published URL |
| --- | --- |
| `master` | https://visgl.github.io/math.gl/next/ |
| Latest stable `major.minor-release` branch | https://visgl.github.io/math.gl/ |

The website workflow runs on pushes to these branches and can also be run manually
on either branch. It determines the stable release branch from `@math.gl/core`'s
npm `latest` version. Other branches do not deploy.

Both builds publish to `gh-pages`. Preview builds replace only its `next` folder;
stable builds preserve that folder. Deployments are queued separately for each destination.

Before deploying from the stable release branch, backport the website workflow
changes to that branch, especially `clean-exclude: next`. An older stable workflow with unrestricted cleanup can delete the preview.
Backport the website config changes as well to add the Stable/Next menu there.

## Local development

Run these commands from the repository root after installing dependencies:

```sh
yarn workspace project-website start
```

To preview the upcoming-release site:

```sh
WEBSITE_BASE_URL=/math.gl/next/ yarn workspace project-website start
```

To build and serve the same paths used in production:

```sh
WEBSITE_BASE_URL=/math.gl/next/ yarn workspace project-website build
WEBSITE_BASE_URL=/math.gl/next/ yarn workspace project-website serve
```

Without `WEBSITE_BASE_URL`, the site builds at `/math.gl/`. The next build displays
an upcoming-release banner. Both builds include a Stable/Next menu linking to the
published documentation. CI builds both paths.

## Embedded timezone globe

The examples sidebar and timezone overview both render
`src/components/timezone-globe`. As in loaders.gl's `ClientExample` and
`DocLiveExample` patterns, the renderer loads lazily behind `BrowserOnly`, and the
inline documentation frame enables interaction in fullscreen so globe controls do
not capture page scrolling. Unmounting finalizes Deck and cancels data requests.

The renderer and scoped styles are shared with `examples/timezone-globe`.
`modules/timezone/data` is a static directory; `useBaseUrl` supplies geometry URLs
for both `/math.gl/` and `/math.gl/next/`. Low geometry loads initially, and high
geometry is fetched when selected. The static directory also provides the data
license and provenance manifest.

## Website styling

`src/styles.css` adapts loaders.gl's typography, theme colors, and documentation
spacing. Source Sans 3, Space Grotesk, and IBM Plex Mono are self-hosted through
Fontsource; code highlighting uses GitHub in light mode and Dracula in dark mode.
The site defaults to dark mode and keeps the theme switch. Navbar logos are local
assets. The inline globe frame follows loaders.gl's `DocLiveExample` styling.
Example styles are scoped to their own containers so they do not override the
website's typography or navigation.

## Embedded geoid globe

The geoid overview and examples sidebar render `src/components/geoid-globe` using
`src/components/live-globe`, the fullscreen frame shared with the timezone globe.
The renderer and scoped styles are shared with `examples/geoid-globe`.
`modules/geoid/data` supplies the optional EGM96 PGM assets as static files;
`useBaseUrl` preserves deployment prefixes. The 1° preview loads first, and the
original 15′ grid loads when selected. Hover heights use `getHeight` with the
selected interpolation; the colored texture uses the same fixed signed scale.

## Polygon and core playgrounds

`examples/polygon-playground` and `examples/core-transforms` share their React
renderers with the website sidebar and module overviews. Each can run standalone
with its workspace `start` script. Both use the lazy fullscreen documentation
frame. The polygon example uses deck.gl-community editing in Cartesian coordinates
and math.gl triangulation/area/winding; invalid geometries are rejected. The core
example evaluates `Matrix4` transforms and uses luma.gl `OrbitControls` to move a
separate camera. Unmounting disposes controls, Deck, observers, and render loops.
