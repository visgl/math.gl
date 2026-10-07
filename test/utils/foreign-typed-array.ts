// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

type ArrayName = 'Uint16Array' | 'Int16Array' | 'Float16Array';
type ForeignArray = Uint16Array | Int16Array | Float16Array;

/** Creates actual foreign-realm arrays in both Node and browser test projects. */
export async function createForeignTypedArray(
  name: ArrayName,
  length: number
): Promise<ForeignArray | undefined> {
  if (typeof document === 'undefined') {
    const {runInNewContext} = await import('node:vm');
    return runInNewContext(`typeof ${name} === 'function' ? new ${name}(${length}) : undefined`);
  }
  const frame = document.createElement('iframe');
  document.body.appendChild(frame);
  try {
    const constructors = frame.contentWindow as unknown as Record<
      ArrayName,
      (new (length: number) => ForeignArray) | undefined
    >;
    const Constructor = constructors[name];
    return Constructor ? new Constructor(length) : undefined;
  } finally {
    frame.remove();
  }
}
