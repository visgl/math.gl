// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './index.module.css';

export default function IndexPage() {
  const heroImage = useBaseUrl('/images/math-hero.webp');
  return (
    <Layout title="Home" description="Math for maps, globes, and 3D applications." noFooter>
      <main className={styles.home}>
        <section className={styles.hero} style={{backgroundImage: `linear-gradient(90deg, #08111ff2, #08111f99 55%, #08111f26), url(${heroImage})`}}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>math.gl</p>
            <h1>Math for maps,<br />globes, and 3D.</h1>
            <p className={styles.description}>From vectors and matrices to coordinate systems and planetary geometry. Composable TypeScript tools for the world you’re building.</p>
            <div className={styles.actions}>
              <Link className={styles.primary} to="/docs/developer-guide/get-started">Get started</Link>
              <Link className={styles.secondary} to="/examples">Explore examples <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </section>
        <section className={styles.overview} aria-label="About math.gl">
          <h2>A small foundation.<br />A world of possibilities.</h2>
          <p>Build with the math you need: precise transforms, geometry processing, and geospatial calculations. Use it with your renderer, in the browser, or on the server.</p>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>Part of <a href="https://vis.gl">vis.gl</a></span>
        <span>© {new Date().getFullYear()} OpenJS Foundation</span>
        <a href="https://github.com/visgl/math.gl">GitHub</a>
      </footer>
    </Layout>
  );
}
