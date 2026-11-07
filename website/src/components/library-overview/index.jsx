// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function LibraryOverview() {
  return (
    <section className={styles.card} aria-labelledby="library-overview-title">
      <p className={styles.eyebrow}>Library overview</p>
      <h2 id="library-overview-title">Math for the shape of the world.</h2>
      <p className={styles.description}>
        From vectors and matrices to coordinate systems and planetary geometry. Composable
        TypeScript tools for the world you’re building.
      </p>
      <p className={styles.detail}>
        math.gl computes on the CPU with no GPU dependencies. Use its arrays and coordinate
        utilities with WebGL, WebGPU, or your own analysis pipeline.
      </p>
      <nav className={styles.links} aria-label="Explore math.gl">
        <Link to="/docs/developer-guide">Get started <span aria-hidden="true">↗</span></Link>
        <Link to="/docs/modules">Modules <span aria-hidden="true">↗</span></Link>
        <Link to="/docs/upgrade-guide">Upgrading <span aria-hidden="true">↗</span></Link>
      </nav>
    </section>
  );
}
