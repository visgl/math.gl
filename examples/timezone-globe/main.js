// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {mountTimezoneGlobe} from './app';
import lowUrl from '@math.gl/timezone/timezone-geometry-low.json?url';
import hiUrl from '@math.gl/timezone/timezone-geometry-hi.json?url';
import './styles.css';

mountTimezoneGlobe(document.querySelector('.timezone-globe'), {lowUrl, hiUrl});
