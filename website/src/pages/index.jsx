// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './index.module.css';

export default function IndexPage() {
  const baseUrl = useBaseUrl('/');

  return (
    <Layout noFooter title="Home" description="Geospatial and 3D math modules for JavaScript and TypeScript">
      <>
        <header className={styles.hero}>
          <BrowserOnly>
            {() => {
              const HomeMap = require('../components/home-map').default;
              return <HomeMap />;
            }}
          </BrowserOnly>
          <div aria-hidden="true" className={styles.heroBackground} />
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Geospatial &amp; 3D math for the Web</p>
            <h1>
              Math for the shape
              <br />
              of the world.
            </h1>
            <p className={styles.heroLead}>
              Composable tools for coordinates, geometry, and time—built for maps and 3D
              applications.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href={`${baseUrl}docs`}>
                Docs <span aria-hidden="true">→</span>
              </a>
              <a className={styles.secondaryAction} href={`${baseUrl}examples`}>
                Examples
              </a>
            </div>
            <div id="home-map-caption" />
          </div>
        </header>

      </>
    </Layout>
  );
}
