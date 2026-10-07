// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {mountGeoidGlobe} from './app';
import {lowUrl, hiUrl} from './sources';
import './styles.css';

mountGeoidGlobe(document.querySelector('.geoid-globe'), {lowUrl, hiUrl});
