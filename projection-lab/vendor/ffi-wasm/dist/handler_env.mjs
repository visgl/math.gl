// Copyright (c) 2026 Will Cohen
//
// Part of clj-native, under the Apache License v2.0 with LLVM Exceptions.
// See LICENSE for license information.
// SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
//
// isNode is true on Node, and false in a browser or a Web Worker.

export const isNode = typeof process !== 'undefined' && process.versions?.node != null;
