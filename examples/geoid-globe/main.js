// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {mountGeoidGlobe} from './app';
import lowUrl from '@math.gl/geoid/geoid-egm96-low.pgm?url';
import hiUrl from '@math.gl/geoid/geoid-egm96-hi.pgm?url';
import './styles.css';

mountGeoidGlobe(document.querySelector('.geoid-globe'), {lowUrl, hiUrl});
