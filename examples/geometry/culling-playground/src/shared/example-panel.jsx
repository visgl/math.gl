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

/** Keep React controls live inside the standalone community panel shell. */
export default function ExamplePanel({title, className, children}) {
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
  return (
    <aside ref={host} className={`example-panel ${className || ''}`}>
      {contentRoot && createPortal(children, contentRoot)}
    </aside>
  );
}
