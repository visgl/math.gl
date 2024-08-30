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
        'website-examples': resolve('../examples')
      }
    }
  }
});

module.exports = config;
