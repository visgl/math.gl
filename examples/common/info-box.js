// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {BoxPanelContainer, CustomPanel, PanelManager, applyPanelTheme} from '@deck.gl-community/panels';
import './example-panel.css';

/** Mount existing DOM controls in the shared collapsible panel without replacing their state. */
export function mountInfoBox(host, {title, theme = 'sleek-dark', width = 280} = {}) {
  host.classList.add('example-panel', 'example-info-box');
  host.setAttribute('aria-label', title);
  const content = document.createElement('div');
  content.className = 'example-info-content';
  content.append(...host.childNodes);
  applyPanelTheme(host, {base: theme, variables: {}});
  const manager = new PanelManager({parentElement: host});
  const panel = new CustomPanel({id: 'info-content', title, theme, onRenderHTML: root => root.append(content)});
  const box = new BoxPanelContainer({
    id: 'info-box', _container: host, title, panel, widthPx: width,
    collapsible: true, defaultOpen: true, style: {width: '100%'}
  });
  manager.setProps({components: [box]});
  return () => manager.finalize();
}
