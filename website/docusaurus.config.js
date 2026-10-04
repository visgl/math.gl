// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const {getDocusaurusConfig} = require('@vis.gl/docusaurus-website');
const {resolve} = require('path');
const {themes} = require('prism-react-renderer');
const {NormalModuleReplacementPlugin} = require('webpack');

const websiteBaseUrl = process.env.WEBSITE_BASE_URL || '/math.gl/';
const isNext = websiteBaseUrl.endsWith('/next/');
const stableSiteUrl = 'https://visgl.github.io/math.gl';

const config = getDocusaurusConfig({
  projectName: 'math.gl',
  tagline: 'A collection of math modules for Geospatial and 3D visualization use cases',
  siteUrl: 'https://visgl.github.io/math.gl',
  repoUrl: 'https://github.com/visgl/math.gl',

  docsTableOfContents: require('../docs/table-of-contents.json'),

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
const aliases = webpackPlugin[1].resolve.alias;
aliases['@math.gl/crs$'] = aliases['@math.gl/crs'];
aliases['@math.gl/crs/wkt$'] = resolve(__dirname, '../modules/crs/src/wkt-crs.ts');
aliases['@math.gl/crs/proj-string$'] = resolve(__dirname, '../modules/crs/src/proj-string.ts');
aliases['@math.gl/crs/spatial-reference$'] = resolve(
  __dirname,
  '../modules/crs/src/spatial-reference.ts'
);
delete aliases['@math.gl/crs'];

// Dependencies such as deck.gl 9.4 require math.gl 4.x. Keep their imports on
// their installed dependency versions rather than the website's 5.x source aliases.
webpackPlugin[1].plugins = [
  new NormalModuleReplacementPlugin(/^@math\.gl\//, resource => {
    if (resource.context.includes('node_modules')) {
      resource.request = require
        .resolve(resource.request, {paths: [resource.context]})
        .replace(/\.cjs$/, '.js');
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
// Serve the optional geometry independently of the JavaScript bundle.
config.staticDirectories = ['static', '../modules/timezone/data', '../modules/geoid/data'];
config.plugins.push(require('./projection-redirects.cjs'));

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
