// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from 'react';
import {createRoot} from 'react-dom/client';
import Example from './app';
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Example />
  </React.StrictMode>
);
