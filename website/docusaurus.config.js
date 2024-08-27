const {getDocusaurusConfig} = require('@vis.gl/docusaurus-website');
const {resolve} = require('path');

const config = getDocusaurusConfig({
  projectName: 'math.gl',
  tagline: 'A collection of math modules for Geospatial and 3D visualization use cases',
  siteUrl: 'https://visgl.github.io/math.gl',
  repoUrl: 'https://github.com/visgl/math.gl',

  docsTableOfContents: require('../docs/table-of-contents.json'),

  // examplesDir: './src/examples',
  // exampleTableOfContents: require('./src/examples/table-of-contents.json'),

  search: 'local',

  webpackConfig: {
    resolve: {
      alias: {
        'website-examples': resolve('../examples'),

        '@math.gl/types': resolve('../modules/types/src'),
        '@math.gl/core': resolve('../modules/core/src'),
        '@math.gl/culling': resolve('../modules/culling/src'),
        '@math.gl/geospatial': resolve('../modules/geospatial/src'),
        '@math.gl/geoid': resolve('../modules/geoid/src'),
        '@math.gl/polygon': resolve('../modules/polygon/src'),
        '@math.gl/proj4': resolve('../modules/proj4/src'),
        '@math.gl/web-mercator': resolve('../modules/web-mercator/src'),
        '@math.gl/sun': resolve('../modules/sun/src'),
        '@math.gl/ddgs-geohash': resolve('../modules/ddgs-geohash/src'),
        '@math.gl/dggs-quadkey': resolve('../modules/dggs-quadkey/src'),
        '@math.gl/dggs-s2': resolve('../modules/dggs-s2/src'),

        '@probe.gl/bench': resolve('../node_modules/@probe.gl/bench')
      }
    }
  }
});

module.exports = config;
