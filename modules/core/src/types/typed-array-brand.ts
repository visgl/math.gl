// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Use the intrinsic getter so constructor and Symbol.toStringTag overrides cannot
// disguise a typed array's element type. It also works for arrays from other realms.
const typedArrayTagGetter = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint8Array.prototype),
  Symbol.toStringTag
)!.get!;

export function getTypedArrayName(value: unknown): string | undefined {
  return ArrayBuffer.isView(value) ? typedArrayTagGetter.call(value) : undefined;
}
