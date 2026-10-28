// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {move} from 'piscina';
export default input => ArrayBuffer.isView(input) ? move(input) : input;
