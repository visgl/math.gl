// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from '../../pages/index.module.css';
import moduleGroups from '../../../module-groups.json';

const modules = [
  {
    name: 'Spatial index',
    packageName: '@math.gl/geometry/spatial-index',
    description: 'Static box, point and triangle indexes for range, ray and nearest queries (POC).',
    image: 'examples/spatial-index.png',
    imageAlt: 'Interactive spatial query explorer',
    theme: 'teal'
  },
  {
    name: 'Curves',
    packageName: '@math.gl/geometry/curves',
    description: 'Parametric curves, interpolation, and arc-length sampling in 2D and 3D.',
    image: 'examples/curves.jpg',
    imageAlt: 'Interactive parametric curve example',
    theme: 'violet'
  },
  {
    name: 'Core',
    packageName: '@math.gl/core',
    description: 'Vectors, matrices, shared types, and expression evaluation.',
    image: 'examples/core-transforms.jpg',
    imageAlt: 'Interactive 3D transform example',
    theme: 'violet'
  },
  {
    name: 'Tasks',
    packageName: '@math.gl/core/tasks',
    description:
      'Run small tasks locally and larger jobs in worker pools, with bounded queues and shared state.',
    image: 'tasks.svg',
    imageAlt: 'Main thread connected through a bounded queue to reusable workers',
    theme: 'teal'
  },
  {
    name: 'Projection',
    packageName: '@math.gl/geospatial/projection',
    description: 'Project coordinates, transform reference systems, and work across epochs.',
    image: 'examples/elastic-maps.jpg',
    imageAlt: 'Elastic map projection example with coastlines and graticules',
    theme: 'blue'
  },
  {
    name: 'Geospatial',
    packageName: '@math.gl/geospatial',
    description: 'Ellipsoids, CRS, projections, WKB, and GeoArrow entry points.',
    image: 'examples/albers-usa.jpg',
    imageAlt: 'Albers USA map example with geographic insets',
    theme: 'blue'
  },
  {
    name: 'Polygon',
    packageName: '@math.gl/geometry/polygon',
    description: 'Clip, subdivide, triangulate, and transform polygon and line geometry.',
    image: 'examples/polygon-playground.jpg',
    imageAlt: 'Polygon playground example',
    theme: 'green'
  },
  {
    name: 'Geometry',
    packageName: '@math.gl/geometry',
    description: 'Meshes, curves, polygon processing, culling, and spatial indexes.',
    image: 'examples/geometry-viewer.jpg',
    imageAlt: '3D geometry viewer example',
    theme: 'orange'
  },
  {
    name: 'Culling',
    packageName: '@math.gl/geometry/culling',
    description: 'Bounding volumes, intersection tests, and visibility culling.',
    image: 'examples/culling-playground.jpg',
    imageAlt: 'Frustum culling playground example',
    theme: 'teal'
  },
  {
    name: 'Earth',
    packageName: '@math.gl/earth',
    description: 'Grouped paths for geoid, sun, and timezone utilities.',
    image: 'examples/tectonic-time-machine.jpg',
    imageAlt: 'Tectonic time machine Earth example',
    theme: 'indigo'
  },
  {
    name: 'Timezone',
    packageName: '@math.gl/earth/timezone',
    description: 'Geographic timezone lookup and local calendar calculations.',
    image: 'examples/timezone-globe.jpg',
    imageAlt: 'Interactive timezone globe example',
    theme: 'indigo'
  },
  {
    name: 'Geoid',
    packageName: '@math.gl/earth/geoid',
    description: 'Sample Earth gravity models and convert ellipsoidal and geoid heights.',
    image: 'examples/geoid-globe.jpg',
    imageAlt: 'Interactive geoid globe example',
    theme: 'cyan'
  },
  {
    name: 'Sun',
    packageName: '@math.gl/earth/sun',
    description: 'Calculate sun position, daylight, and atmospheric lighting.',
    image: 'examples/sun-terminator.jpg',
    imageAlt: 'Solar terminator example showing daylight and city lights',
    theme: 'orange'
  },
  {
    name: 'DGGS',
    packageName: '@math.gl/dggs',
    description: 'Decode cell boundaries for H3, S2, GeoHash, A5, and other global grids.',
    image: 'examples/dggs-cell-explorer.jpg',
    imageAlt: 'DGGS cell explorer displaying a geographic cell boundary',
    theme: 'green'
  },
  {
    name: 'Expressions',
    packageName: '@math.gl/core/expressions',
    description: 'Parse and evaluate compact expressions with optional geospatial functions.',
    image: 'examples/expressions.jpg',
    imageAlt: 'Expression playground example',
    theme: 'pink',
    experimental: true
  },
  {
    name: 'GeoArrow',
    packageName: '@math.gl/geospatial/geoarrow',
    description: 'Columnar geospatial layouts and kernels over typed-array buffers.',
    image: 'https://raw.githubusercontent.com/geoarrow/geoarrow/main/logo/geoarrow_logo.svg',
    imageAlt: 'GeoArrow logo',
    theme: 'teal'
  },
  {
    name: 'Geometry Utils',
    packageName: '@math.gl/geometry/utils',
    description: 'Inspect, normalize, and process geometry stored in typed arrays.',
    image: 'examples/geometry-viewer.jpg',
    imageAlt: 'Renderer-independent mesh example',
    theme: 'violet'
  },
  {
    name: 'CRS',
    packageName: '@math.gl/geospatial/crs',
    description: 'Lightweight coordinate reference system definitions and syntax codecs.',
    image: 'examples/external-projection-engines.jpg',
    imageAlt: 'Coordinate reference system transformation example',
    theme: 'blue'
  },
  {
    name: 'Web Mercator',
    packageName: '@math.gl/web-mercator',
    description: 'Map projection and camera utilities for interactive web maps.',
    image: 'examples/raster-projection-lab.jpg',
    imageAlt: 'Raster projection lab map example',
    theme: 'blue'
  },
  {
    name: 'Types',
    packageName: '@math.gl/core/types',
    description: 'Small, reusable TypeScript contracts for math and geospatial data.',
    image: 'modules/types.svg',
    imageAlt: 'Numeric array components and three-dimensional bounds',
    theme: 'indigo'
  },
  {
    name: 'WKB',
    packageName: '@math.gl/geospatial/wkb',
    description: 'Dependency-free WKB, EWKB, and WKT geometry codecs.',
    image: 'examples/wkb-workbench.jpg',
    imageAlt: 'WKT and WKB workbench displaying polygon geometry',
    theme: 'pink'
  }
];

const modulesById = new Map(
  modules.map(module => [module.packageName.replace('@math.gl/', ''), module])
);

function ModuleCard({module, baseUrl}) {
  const docsUrl = `${baseUrl}docs/modules/${module.packageName.replace('@math.gl/', '')}`;
  return (
    <a className={`${styles.card} ${styles[module.theme]}`} href={docsUrl}>
      <div className={`${styles.cardImage} ${module.name === 'GeoArrow' ? styles.logoImage : ''}`}>
        <img src={module.image.startsWith('https://') ? module.image : `${baseUrl}images/${module.image}`} alt={module.imageAlt} loading="lazy" />
        <span className={styles.packageName}>
          {module.packageName}
        </span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardHeading}>
          <h3>{module.name}</h3>
          {module.experimental && <span className={styles.experimental}>Experimental</span>}
        </div>
        <p>{module.description}</p>
        <span className={styles.cardLink}>
          Explore module <span aria-hidden="true">→</span>
        </span>
      </div>
    </a>
  );
}

export default function ModuleCatalog() {
  const baseUrl = useBaseUrl('/');
  return (
        <div className={styles.docCatalog}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Modular geospatial &amp; 3D math</p>
            <h2>Small tools. Big spatial ideas.</h2>
            <p className={styles.lede}>
              Pick the building blocks you need—from vectors and meshes to coordinate systems,
              global grids, and time-aware geospatial analysis.
            </p>
          </div>
          <nav className={styles.categoryLinks} aria-label="Module categories">
            {moduleGroups.map(group => (
              <a key={group.id} href={`#${group.id}`}>
                {group.label}
              </a>
            ))}
          </nav>
          {moduleGroups.map(group => (
            <section className={styles.moduleGroup} key={group.id} aria-labelledby={group.id}>
              <div className={styles.groupHeading}>
                <h2 id={group.id}>{group.label}</h2>
                <p>{group.description}</p>
              </div>
              <div className={styles.grid}>
                {group.modules.map(moduleId => (
                  <ModuleCard key={moduleId} module={modulesById.get(moduleId)} baseUrl={baseUrl} />
                ))}
              </div>
            </section>
          ))}
        </div>
  );
}
