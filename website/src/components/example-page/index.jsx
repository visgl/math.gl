// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

/** Let descriptions scroll with the page while demos keep their own height. */
export default function ExamplePage({content: Content, route}) {
  const indexPath = useBaseUrl('/examples');
  return (
    <div className={route.path === indexPath ? undefined : styles.page}>
      <Content />
    </div>
  );
}
