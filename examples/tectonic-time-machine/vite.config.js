// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {defineConfig} from 'vite';

// Use package exports: global aliases would replace deck.gl/loaders.gl's math.gl
// dependencies with incompatible workspace versions after package consolidation.
export default defineConfig({});
