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
