// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {
  BoxPanelContainer,
  CustomPanel,
  PanelManager,
  applyPanelTheme
} from '@deck.gl-community/panels';
import './example-panel.css';
import {configureCompactPanel} from './compact-panel.js';

/** Keep React controls live in a themed panel. */
export default function ExamplePanel({
  title,
  className,
  children,
  theme = 'sleek-dark',
  collapseOnCompact = true,
  open,
  onOpenChange
}) {
  const host = useRef(null);
  const container = useRef(null);
  const [contentRoot, setContentRoot] = useState(null);
  useLayoutEffect(() => {
    applyPanelTheme(host.current, {base: theme, variables: {}});
    const manager = new PanelManager({parentElement: host.current});
    const panel = new CustomPanel({
      id: 'example-controls',
      title: 'Controls',
      theme,
      className: 'example-panel-content',
      onRenderHTML: root => {
        setContentRoot(root);
      }
    });
    container.current = new BoxPanelContainer({
      id: 'example-panel',
      _container: host.current,
      panel,
      widthPx: 250,
      style: {width: '100%'}
    });
    manager.setProps({components: [container.current]});
    return () => {
      manager.finalize();
      container.current = null;
    };
  }, [theme]);
  useLayoutEffect(() => {
    container.current?.setProps({title});
  }, [title, theme]);
  useLayoutEffect(() => {
    if (open !== undefined) {
      // Accordions own their open state, including on small screens.
      delete host.current.dataset.compactPanel;
      container.current.setProps({open, onOpenChange});
      return;
    }
    return configureCompactPanel(host.current, container.current, collapseOnCompact);
  }, [collapseOnCompact, open, onOpenChange, theme]);
  return (
    <aside ref={host} aria-label={title} className={`example-panel ${className || ''}`}>
      {contentRoot && createPortal(children, contentRoot)}
    </aside>
  );
}
