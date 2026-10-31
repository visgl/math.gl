// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const {getDocusaurusConfig} = require('@vis.gl/docusaurus-website');
const {resolve} = require('path');
const {themes} = require('prism-react-renderer');
const {NormalModuleReplacementPlugin} = require('webpack');
const resolveMathGlDependency = require('./resolve-math-gl-dependency.cjs');
const moduleGroups = require('./module-groups.json');
const docsTableOfContents = structuredClone(require('../docs/table-of-contents.json'));
const apiReference = docsTableOfContents.find(section => section.label === 'API Reference');
const moduleReferences = new Map(apiReference.items.map(item => [item.label.split(' ')[0], item]));
const migratedEntries = {
  "@math.gl/core/types": "@math.gl/core",
  "@math.gl/core/expressions": "@math.gl/core",
  "@math.gl/geometry/curves": "@math.gl/geometry",
  "@math.gl/geometry/spatial-index": "@math.gl/geometry",
  "@math.gl/geometry/utils": "@math.gl/geometry",
  "@math.gl/geospatial/wkb": "@math.gl/geospatial",
  "@math.gl/earth/geoid": "@math.gl/earth",
  "@math.gl/geometry/polygon": "@math.gl/geometry"
};
apiReference.items = moduleGroups.map(group => ({
  type: 'category',
  label: group.label,
  items: group.modules.map(moduleId => {
    const reference = moduleReferences.get('@math.gl/' + moduleId);
    if (!reference) throw new Error('Missing API reference for module: ' + moduleId);
    moduleReferences.delete('@math.gl/' + moduleId);
    const previous = '@math.gl/' + moduleId;
    return migratedEntries[previous]
      ? {...reference, label: migratedEntries[previous] + ' — ' + moduleId.split('/').slice(1).join('/')}
      : reference;
  })
}));
if (moduleReferences.size) {
  throw new Error(
    'Assign modules to website/module-groups.json: ' + [...moduleReferences.keys()].join(', ')
  );
}

const websiteBaseUrl = process.env.WEBSITE_BASE_URL || '/math.gl/';
const isNext = websiteBaseUrl.endsWith('/next/');
const stableSiteUrl = 'https://visgl.github.io/math.gl';

const config = getDocusaurusConfig({
  projectName: 'math.gl',
  tagline: 'A collection of math modules for Geospatial and 3D visualization use cases',
  siteUrl: 'https://visgl.github.io/math.gl',
  repoUrl: 'https://github.com/visgl/math.gl',

  docsTableOfContents,

  examplesDir: './src/examples',
  exampleTableOfContents: require('./src/examples/table-of-contents.json'),

  search: 'local',
  customCss: [resolve(__dirname, 'src/styles.css')],
  themeConfig: {
    colorMode: {defaultMode: 'dark', disableSwitch: false, respectPrefersColorScheme: false},
    prism: {theme: themes.github, darkTheme: themes.dracula},
    navbar: {
      logo: {
        alt: 'vis.gl Logo',
        src: 'images/visgl-logo-dark.png',
        srcDark: 'images/visgl-logo-light.png'
      }
    }
  },

  navbarItems: [
    {
      className: 'navbar-badge',
      type: 'html',
      position: 'right',
      value: '<a class="navbar-npm" href="https://www.npmjs.com/package/@math.gl/core" aria-label="math.gl core on npm" target="_blank" rel="noopener noreferrer"><img class="navbar-npm-downloads" src="https://img.shields.io/npm/dm/@math.gl/core?label=downloads" alt="Monthly npm downloads for @math.gl/core" height="20" /><svg class="navbar-npm-icon" viewBox="0 0 18 7" width="24" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M0 0v6h5v1h4V6h9V0H0zm5 5H4V1h1v4zm4 0H7V1h3v4H9zm8 0h-1V1h1v4zM8 2v2h1V2H8z" /></svg><span>npm</span></a>'
    },
    {
      type: 'html',
      position: 'right',
      value: '<a class="navbar-openjs" href="https://openvisualization.org" aria-label="OpenJS Foundation — Open Visualization" target="_blank" rel="noopener noreferrer"><img class="openjs-logo-light" src="https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color.svg" alt="OpenJS Foundation" width="86" /><img class="openjs-logo-dark" src="https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color-dark_background.svg" alt="OpenJS Foundation" width="86" /></a>'
    }
  ],

  webpackConfig: {
    resolve: {
      alias: {
        'website-examples': resolve('../examples')
      }
    }
  }
});

// Keep the repository link visible while showing the live, cached GitHub star count.
const githubItem = config.themeConfig.navbar.items.find(
  item => item.href === 'https://github.com/visgl/math.gl'
);
Object.assign(githubItem, {
  className: 'navbar-badge',
  position: 'right',
  type: 'html',
  value: '<a class="navbar__link navbar-github-stars" href="https://github.com/visgl/math.gl" target="_blank" rel="noopener noreferrer" aria-label="math.gl on GitHub — view repository and star count"><svg class="navbar-github-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.3-5.467-1.334-5.467-5.931 0-1.31.467-2.381 1.236-3.221-.124-.303-.536-1.524.118-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.042.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.656 1.652.244 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.628-5.479 5.925.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg><span>GitHub</span><img src="https://img.shields.io/github/stars/visgl/math.gl?style=social" alt="GitHub stars" width="90" height="20" /></a>'
});
delete githubItem.href;
delete githubItem.label;
const navbarItems = config.themeConfig.navbar.items;
navbarItems.splice(navbarItems.indexOf(githubItem), 1);
const npmIndex = navbarItems.findIndex(item => item.value?.includes('class="navbar-npm"'));
navbarItems.splice(npmIndex + 1, 0, githubItem);

// Resolve CRS entry points from source: website deployments do not build package dist files.
// Keep the root alias exact so it does not shadow the public subpaths.
const webpackPlugin = config.plugins.find(
  plugin =>
    Array.isArray(plugin) && plugin[0] === '@vis.gl/docusaurus-website/plugin-webpack-config'
);
// Respect package-local dependencies before the website plugin's root fallbacks.
// The private Parquet adapter uses loaders.gl v5 while deck.gl remains on v4.
webpackPlugin[1].resolve.modules.unshift('node_modules');
// Preserve the published Parquet worker as a bundled asset, shared with Vite's ?url import.
webpackPlugin[1].module = {rules: [{resourceQuery: /\?url$/, type: 'asset/resource'}]};
const aliases = webpackPlugin[1].resolve.alias;
// Dependencies such as deck.gl 9.4 require math.gl 4.x. Keep their imports on
// their installed dependency versions rather than the website's 5.x source aliases.
webpackPlugin[1].plugins = [
  new NormalModuleReplacementPlugin(/^@math\.gl\//, resource => {
    if (resource.context.includes('node_modules')) {
      resource.request = resolveMathGlDependency(resource.request, resource.context);
    }
  })
];
// Vendored gl-matrix sources use explicit .js imports with TypeScript source files.
config.plugins.push(() => ({
  name: 'math-gl-source-extensions',
  configureWebpack() {
    return {resolve: {extensionAlias: {'.js': ['.js', '.ts', '.tsx']}}};
  }
}));

config.baseUrl = websiteBaseUrl;
const basePathSegments = websiteBaseUrl.split('/').filter(Boolean);
const routePrefix = basePathSegments.length ? `/${basePathSegments.join('/')}` : '';
config.plugins.push([
  '@signalwire/docusaurus-plugin-llms-txt',
  {
    siteTitle: 'math.gl',
    siteDescription: 'Modular JavaScript mathematics for 3D and geospatial applications.',
    depth: Math.min(5, 3 + basePathSegments.length),
    enableDescriptions: true,
    includeOrder: ['/docs/developer-guide/**', '/docs/modules/**'].map(route => routePrefix + route),
    onRouteError: 'throw',
    content: {
      enableMarkdownFiles: true,
      enableLlmsFullTxt: false,
      relativePaths: false,
      includeBlog: false,
      includePages: false,
      includeDocs: true,
      includeVersionedDocs: false,
      includeGeneratedIndex: true,
      excludeRoutes: ['/examples/**'].map(route => routePrefix + route)
    }
  }
]);
config.favicon = 'images/visgl-favicon.png';
// Serve the optional geometry independently of the JavaScript bundle.
config.staticDirectories = [...config.staticDirectories, '../modules/earth/timezone/data'];
config.plugins.push(require('./projection-redirects.cjs'));
config.plugins.push(require('./docs-redirects.cjs'));

if (isNext) {
  config.themeConfig.announcementBar = {
    id: 'next-release-docs',
    content: `You are viewing documentation for the upcoming major release. <a href="${stableSiteUrl}/docs">View the stable documentation</a>.`,
    isCloseable: false
  };
}

// Opt into all currently documented Docusaurus v4 behavior while v4 is in development.
config.future = {
  ...config.future,
  v4: true,
  faster: true
};

// TODO: Remove this compatibility shim after @vis.gl/docusaurus-website
// moves onBrokenMarkdownLinks to markdown.hooks.
config.markdown = {
  ...config.markdown,
  hooks: {
    ...config.markdown?.hooks,
    onBrokenMarkdownLinks: config.onBrokenMarkdownLinks
  }
};
delete config.onBrokenMarkdownLinks;

module.exports = config;

// Exact aliases cover every consolidated public entrypoint, including nested subpaths.
for (const name of ['core', 'geometry', 'geospatial', 'earth', 'dggs', 'web-mercator']) {
  const pkg = require('../modules/' + name + '/package.json');
  delete aliases[pkg.name];
  for (const [subpath, entry] of Object.entries(pkg.exports)) {
    const target = typeof entry === 'string' ? entry : entry.import;
    const source = target.replace('./dist/', 'src/').replace(/\.js$/, '.ts');
    aliases[pkg.name + (subpath === '.' ? '' : subpath.slice(1)) + '$'] =
      resolve(__dirname, '../modules/' + name, source);
  }
}

// Resolve shared BibTeX citations for docs and example MDX, including /next/.
const citations = [require('../scripts/citations/remark-citations.cjs'), {baseUrl: websiteBaseUrl, bibliographyDigest: require('node:crypto').createHash('sha256').update(require('node:fs').readFileSync(resolve(__dirname, '../docs/references.bib'))).digest('hex')}];
for (const preset of config.presets || []) {
  if (Array.isArray(preset) && preset[1]?.docs) {
    preset[1].docs.remarkPlugins = [...(preset[1].docs.remarkPlugins || []), citations];
  }
}
for (const plugin of config.plugins) {
  if (Array.isArray(plugin) && plugin[0] === '@docusaurus/plugin-content-docs') {
    plugin[1].remarkPlugins = [...(plugin[1].remarkPlugins || []), citations];
  }
}
