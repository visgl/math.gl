// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './app';
createRoot(document.getElementById('root')).render(<App />);
