// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  BoxPanelContainer,
  CustomPanel,
  PanelManager,
  mountPanel,
  applyPanelTheme
} from '@deck.gl-community/panels';
import './example-panel.css';
import {configureCompactPanel} from './compact-panel.js';

/** Mount themed DOM controls; the invisible variant hides chrome and stays open.
 * @param {HTMLElement | null} host
 * @param {{title?: string, theme?: string, width?: number, variant?: 'default' | 'invisible'}} options
 */
export function mountInfoBox(
  host,
  {title, theme = 'sleek-dark', width = 280, variant = 'default'} = {}
) {
  if (!host) throw new Error('Info box host is required');
  const invisible = variant === 'invisible';
  host.classList.add('example-panel', 'example-info-box');
  host.setAttribute('aria-label', title);
  const content = document.createElement('div');
  content.className = 'example-info-content example-panel-content';
  content.append(...host.childNodes);
  applyPanelTheme(host, {base: theme, variables: {}});
  const panel = new CustomPanel({
    id: 'info-content',
    title,
    theme,
    onRenderHTML: root => root.append(content)
  });
  if (invisible) {
    const mount = mountPanel(panel, host);
    return () => mount.finalize();
  }
  const manager = new PanelManager({parentElement: host});
  const box = new BoxPanelContainer({
    id: 'info-box',
    _container: host,
    title,
    panel,
    widthPx: width,
    defaultOpen: true,
    style: {width: '100%'}
  });
  manager.setProps({components: [box]});
  const cleanupCompact = configureCompactPanel(host, box);
  return () => {
    cleanupCompact();
    manager.finalize();
  };
}
