// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright 2016-2019 The Apache Software Foundation
// SPDX-FileComment: BigInt availability/fallback structure adapted from Apache Arrow JS util/compat.ts; compared with apache-arrow-4.0.0. See ../../ARROW-NOTICE.txt and ../../APACHE-2.0-LICENSE.txt. Modified to separate availability flags, share errors and narrow exports.

// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

// BigInt compatibility layer
// Source comparison: https://github.com/apache/arrow/blob/apache-arrow-4.0.0/js/src/util/compat.ts
// Requires tsconfig.json: target=esnext or (lib: esnext.bigint)
// Requires eslint: env: {es2020: true}

const ERR_BIGINT_UNAVAILABLE = 'BigInt is not available in this environment';

function BigIntUnavailable() {
  throw new Error(ERR_BIGINT_UNAVAILABLE);
}
BigIntUnavailable.asIntN = () => {
  throw new Error(ERR_BIGINT_UNAVAILABLE);
};
BigIntUnavailable.asUintN = () => {
  throw new Error(ERR_BIGINT_UNAVAILABLE);
};

class BigInt64ArrayUnavailable {
  static get BYTES_PER_ELEMENT() {
    return 8;
  }
  static of() {
    throw new Error(ERR_BIGINT_UNAVAILABLE);
  }
  static from() {
    throw new Error(ERR_BIGINT_UNAVAILABLE);
  }
  constructor() {
    throw new Error(ERR_BIGINT_UNAVAILABLE);
  }
}

export const BigIntAvailable = typeof BigInt !== 'undefined';
export const BigInt64ArrayAvailable = typeof BigInt64Array !== 'undefined';
export const BigUint64ArrayAvailable = typeof BigUint64Array !== 'undefined';

const BigIntCtor = (() => {
  return BigIntAvailable ? BigInt : BigIntUnavailable;
})();

const BigInt64ArrayCtor = (() => {
  return BigInt64ArrayAvailable ? BigInt64Array : BigInt64ArrayUnavailable;
})();

const BigUint64ArrayCtor = (() => {
  return BigUint64ArrayAvailable ? [BigUint64Array] : [BigInt64ArrayUnavailable];
})();

export {BigIntCtor as BigInt};
export {BigInt64ArrayCtor as BigInt64Array};
export {BigUint64ArrayCtor as BigUint64Array};
