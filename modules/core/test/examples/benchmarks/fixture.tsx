// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: The Vite fixture uses the classic JSX runtime.
import React from 'react';
import {createRoot} from 'react-dom/client';
import CoreBenchmarks from '../../../../../website/src/components/core-benchmarks';
const root = createRoot(document.getElementById('app')!);
root.render(<CoreBenchmarks />);
Object.assign(window, {unmountBenchmarks: () => root.unmount()});
