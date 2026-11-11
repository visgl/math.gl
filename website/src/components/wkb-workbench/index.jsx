// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import {useColorMode} from '@docusaurus/theme-common';
import LiveExample from '../live-globe';
const Example = lazy(() => import('website-examples/arrow/wkb-workbench/src/app.jsx'));
export default function Component(props) {
  const {colorMode} = useColorMode();
  // Let the document own vertical scrolling for the full workbench and its readouts.
  return (
    <LiveExample
      {...props}
      Globe={Example}
      label="WKB workbench"
      height="auto"
      style={{background: 'transparent'}}
      exampleProps={{
        theme: colorMode,
        style: {
          height: 'auto',
          overflow: 'visible',
          '--wkb-error-color': 'var(--ifm-color-danger)',
          '--wkb-output-max-height': 'none',
          '--wkb-table-max-height': 'none'
        }
      }}
    />
  );
}
