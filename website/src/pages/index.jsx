// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const modules = [
  {
    name: 'Core',
    packageName: '@math.gl/core',
    description: 'Vectors, matrices, quaternions, and the building blocks of 3D math.',
    image: 'examples/core-transforms.jpg',
    imageAlt: 'Interactive 3D transform example',
    theme: 'violet'
  },
  {
    name: 'Projection',
    packageName: '@math.gl/projection',
    description: 'Project coordinates, transform reference systems, and work across epochs.',
    image: 'examples/tectonic-time-machine.svg',
    imageAlt: 'Tectonic time machine map example',
    theme: 'blue'
  },
  {
    name: 'Geospatial',
    packageName: '@math.gl/geospatial',
    description: 'Ellipsoids, coordinate frames, and geospatial transformations.',
    image: 'icon-basemap.webp',
    imageAlt: 'Map illustration',
    theme: 'blue'
  },
  {
    name: 'Polygon',
    packageName: '@math.gl/polygon',
    description: 'Clip, subdivide, triangulate, and transform polygon and line geometry.',
    image: 'examples/polygon-playground.jpg',
    imageAlt: 'Polygon playground example',
    theme: 'green'
  },
  {
    name: 'Geometry',
    packageName: '@math.gl/geometry',
    description: 'Renderer-independent meshes and primitive geometry generators.',
    image: 'examples/geometry-viewer.jpg',
    imageAlt: '3D geometry viewer example',
    theme: 'orange'
  },
  {
    name: 'Culling',
    packageName: '@math.gl/culling',
    description: 'Bounding volumes, intersection tests, and visibility culling.',
    image: 'examples/culling-playground.jpg',
    imageAlt: 'Frustum culling playground example',
    theme: 'teal'
  },
  {
    name: 'Timezone',
    packageName: '@math.gl/timezone',
    description: 'Geographic timezone lookup and local calendar calculations.',
    image: 'examples/timezone-globe.jpg',
    imageAlt: 'Interactive timezone globe example',
    theme: 'indigo'
  },
  {
    name: 'Geoid',
    packageName: '@math.gl/geoid',
    description: 'Sample Earth gravity models and convert ellipsoidal and geoid heights.',
    image: 'examples/geoid-globe.jpg',
    imageAlt: 'Interactive geoid globe example',
    theme: 'cyan'
  },
  {
    name: 'Sun',
    packageName: '@math.gl/sun',
    description: 'Calculate sun position, daylight, and atmospheric lighting.',
    image: 'math-hero.webp',
    imageAlt: 'Math.gl geospatial visualization',
    theme: 'orange'
  },
  {
    name: 'DGGS',
    packageName: '@math.gl/dggs',
    description: 'Decode cell boundaries for H3, S2, GeoHash, A5, and other global grids.',
    image: 'icon-basemap.webp',
    imageAlt: 'Global map illustration',
    theme: 'green'
  },
  {
    name: 'Expressions',
    packageName: '@math.gl/expressions',
    description: 'Parse and evaluate compact expressions with optional geospatial functions.',
    image: 'examples/expressions.jpg',
    imageAlt: 'Expression playground example',
    theme: 'pink',
    experimental: true
  },
  {
    name: 'GeoArrow',
    packageName: '@math.gl/geoarrow',
    description: 'Columnar geospatial layouts and kernels over typed-array buffers.',
    image: 'icon-layers.svg',
    imageAlt: 'Layered geometry illustration',
    theme: 'teal'
  },
  {
    name: 'Geometry Utils',
    packageName: '@math.gl/geometry-utils',
    description: 'Inspect, normalize, and process geometry stored in typed arrays.',
    image: 'examples/geometry-viewer.jpg',
    imageAlt: 'Renderer-independent mesh example',
    theme: 'violet'
  },
  {
    name: 'CRS',
    packageName: '@math.gl/crs',
    description: 'Lightweight coordinate reference system definitions and syntax codecs.',
    image: 'icon-basemap.webp',
    imageAlt: 'Map illustration',
    theme: 'blue'
  },
  {
    name: 'Web Mercator',
    packageName: '@math.gl/web-mercator',
    description: 'Map projection and camera utilities for interactive web maps.',
    image: 'icon-basemap.webp',
    imageAlt: 'Map illustration',
    theme: 'blue'
  },
  {
    name: 'Types',
    packageName: '@math.gl/types',
    description: 'Small, reusable TypeScript contracts for math and geospatial data.',
    image: 'icon-typescript.svg',
    imageAlt: 'TypeScript logo',
    theme: 'indigo'
  },
  {
    name: 'WKB',
    packageName: '@math.gl/wkb',
    description: 'Dependency-free WKB, EWKB, and WKT geometry codecs.',
    image: 'icon-layers.svg',
    imageAlt: 'Layered geometry illustration',
    theme: 'pink'
  }
];

function ModuleCard({module, baseUrl}) {
  const docsUrl = `${baseUrl}docs/modules/${module.packageName.replace('@math.gl/', '')}`;
  return (
    <a className={`${styles.card} ${styles[module.theme]}`} href={docsUrl}>
      <div className={styles.cardImage}>
        <img src={`${baseUrl}images/${module.image}`} alt={module.imageAlt} loading="lazy" />
        <span className={styles.packageName}>{module.packageName}</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardHeading}>
          <h3>{module.name}</h3>
          {module.experimental && <span className={styles.experimental}>Experimental</span>}
        </div>
        <p>{module.description}</p>
        <span className={styles.cardLink}>Explore module <span aria-hidden="true">→</span></span>
      </div>
    </a>
  );
}

export default function IndexPage() {
  const baseUrl = useBaseUrl('/');

  return (
    <Layout title="Home" description="Geospatial and 3D math modules for JavaScript and TypeScript">
      <>
        <header className={styles.hero}>
          <div
            aria-hidden="true"
            className={styles.heroBackground}
            style={{backgroundImage: `linear-gradient(90deg, rgba(8, 17, 31, 0.98) 0%, rgba(8, 17, 31, 0.88) 38%, rgba(8, 17, 31, 0.48) 72%, rgba(8, 17, 31, 0.28) 100%), url(${baseUrl}images/math-hero.webp)`}}
          />
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Geospatial &amp; 3D math for JavaScript</p>
            <h1>Math for the shape<br />of the world.</h1>
            <p className={styles.heroLead}>
              Composable tools for coordinates, geometry, and time—built for maps and 3D applications.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href={`${baseUrl}docs/developer-guide/get-started`}>Get started <span aria-hidden="true">→</span></a>
              <a className={styles.secondaryAction} href={`${baseUrl}examples`}>Explore examples</a>
            </div>
          </div>
          <span className={styles.heroCaption} aria-hidden="true">Coordinates · Geometry · Time</span>
        </header>
        <main className={styles.catalog}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Modular geospatial &amp; 3D math</p>
            <h2>Small tools. Big spatial ideas.</h2>
            <p className={styles.lede}>
              Pick the building blocks you need—from vectors and meshes to coordinate systems,
              global grids, and time-aware geospatial analysis.
            </p>
          </div>
          <div className={styles.grid}>
            {modules.map(module => <ModuleCard key={module.packageName} module={module} baseUrl={baseUrl} />)}
          </div>
        </main>
      </>
    </Layout>
  );
}
