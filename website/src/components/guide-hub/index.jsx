// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function GuideHub({sections}) {
  return <div className={styles.hub}>
    {sections.map((section, index) => <section className={styles.section} key={section.title}>
      <div className={styles.intro}>
        <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
        <h2>{section.title}</h2>
        <p>{section.description}</p>
      </div>
      <div className={styles.links}>
        {section.items.map(item => <Link className={styles.link} key={item.to} to={item.to}>
          <div><h3>{item.title}</h3><p>{item.description}</p></div>
          <span className={styles.arrow} aria-hidden="true">↗</span>
        </Link>)}
      </div>
    </section>)}
  </div>;
}
