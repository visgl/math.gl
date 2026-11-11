// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {applyPanelTheme} from '@deck.gl-community/panels';
import App from './app';
// The standalone page provides the backdrop for the transparent workbench.
applyPanelTheme(document.body, {base: 'sleek-dark', variables: {}});
document.body.style.background = 'var(--menu-background)';
createRoot(document.getElementById('root')).render(<App />);
