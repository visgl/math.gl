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
  applyPanelTheme,
  PANEL_THEME_SLEEK_DARK
} from '@deck.gl-community/panels';
import './example-panel.css';
import {configureCompactPanel} from './compact-panel.js';

/** Keep React controls live in a themed panel; invisible panels have no chrome. */
export default function ExamplePanel({
  title,
  className,
  children,
  variant = 'default',
  open,
  onOpenChange
}) {
  const host = useRef(null);
  const container = useRef(null);
  const [contentRoot, setContentRoot] = useState(null);
  useLayoutEffect(() => {
    applyPanelTheme(host.current, PANEL_THEME_SLEEK_DARK);
    const manager = new PanelManager({parentElement: host.current});
    const panel = new CustomPanel({
      id: 'example-controls',
      title: 'Controls',
      theme: 'sleek-dark',
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
  }, []);
  useLayoutEffect(() => {
    container.current?.setProps({title});
  }, [title]);
  useLayoutEffect(() => {
    const invisible = variant === 'invisible';
    container.current.setProps({collapsible: !invisible});
    if (invisible) {
      // Keep controls reachable without a header, including after a responsive collapse.
      delete host.current.dataset.compactPanel;
      container.current.setProps({open: true});
      return;
    }
    if (open !== undefined) {
      // Accordions own their open state, including on small screens.
      delete host.current.dataset.compactPanel;
      container.current.setProps({open, onOpenChange});
      return;
    }
    return configureCompactPanel(host.current, container.current);
  }, [variant, open, onOpenChange]);
  return (
    <aside
      ref={host}
      aria-label={title}
      className={`example-panel ${variant === 'invisible' ? 'example-panel-invisible ' : ''}${className || ''}`}
    >
      {contentRoot && createPortal(children, contentRoot)}
    </aside>
  );
}
