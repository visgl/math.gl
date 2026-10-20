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
apiReference.items = moduleGroups.map(group => ({
  type: 'category',
  label: group.label,
  items: group.modules.map(moduleId => {
    const reference = moduleReferences.get('@math.gl/' + moduleId);
    if (!reference) throw new Error('Missing API reference for module: ' + moduleId);
    moduleReferences.delete('@math.gl/' + moduleId);
    return reference;
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
      label: isNext ? 'Next' : 'Stable',
      position: 'right',
      items: [
        {label: 'Stable', href: `${stableSiteUrl}/docs`, target: '_self'},
        {label: 'Next', href: `${stableSiteUrl}/next/docs`, target: '_self'}
      ]
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
aliases['@math.gl/geometry/spatial-index$'] = resolve(__dirname, '../modules/geometry/src/spatial-index/index.ts');
aliases['@math.gl/geometry/culling/queries$'] = resolve(__dirname, '../modules/geometry/src/culling/queries.ts');
aliases['@math.gl/geometry/curves$'] = resolve(__dirname, '../modules/geometry/src/curves/index.ts');
aliases['@math.gl/geospatial/crs$'] = aliases['@math.gl/geospatial/crs'];
aliases['@math.gl/geospatial/crs/metadata$'] = resolve(__dirname, '../modules/geospatial/src/crs/crs-metadata.ts');
aliases['@math.gl/geospatial/crs/wkt$'] = resolve(__dirname, '../modules/geospatial/src/crs/wkt-crs.ts');
aliases['@math.gl/geospatial/crs/proj-string$'] = resolve(__dirname, '../modules/geospatial/src/crs/proj-string.ts');
aliases['@math.gl/geospatial/crs/spatial-reference$'] = resolve(
  __dirname,
  '../modules/geospatial/src/crs/spatial-reference.ts'
);
delete aliases['@math.gl/geospatial/crs'];

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

aliases['@math.gl/geometry/parametric$'] = resolve(__dirname, '../modules/geometry/src/parametric.ts');
aliases['@math.gl/geometry$'] = resolve(__dirname, '../modules/geometry/src/index.ts');
delete aliases['@math.gl/geometry'];

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
